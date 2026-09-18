import asyncio
import os
import secrets
import time
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient

# --- NDVI Service Imports ---
from gee.gee_init import initialize_gee
from services.ndvi_service import NDVIService
from services.prediction_service import NoDetectionError, PredictionService

# --- Chatbot Service Imports ---
from chatbot.config.settings import get_settings
from chatbot.memory.conversation import ConversationMemory
from chatbot.memory.history_db import HistoryDB
from chatbot.memory.long_term import LongTermMemory
from chatbot.models.schemas import (
    ChatRequest, ChatResponse, HealthResponse, KnowledgeUploadRequest,
    KnowledgeUploadResponse, MemoryItem, MemoryStoreRequest,
    MemoryStoreResponse, MemoryResponse,
)
from chatbot.retrievers.knowledge import KnowledgeRetriever
from chatbot.retrievers.memory import MemoryRetriever
from chatbot.services.chat_service import ChatService
from chatbot.services.knowledge_service import KnowledgeService
from chatbot.vectorstore.mongo_vector import MongoVectorStore
from chatbot.utils.logger import get_logger

load_dotenv()
logger = get_logger(__name__)

# ===================================================================
# Global service instances — initialized at startup, used by endpoints
# ===================================================================
# Chatbot globals
mongo_client: Optional[MongoClient] = None
chat_service: Optional[ChatService] = None
knowledge_service: Optional[KnowledgeService] = None
long_term_memory: Optional[LongTermMemory] = None
history_db: Optional[HistoryDB] = None
prediction_service: Optional[PredictionService] = None

# NDVI globals
ndvi_service: Optional[NDVIService] = None
gee_ready = False
gee_error = ""

# ===================================================================
# Application Lifecycle (startup / shutdown)
# ===================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application lifecycle:
    - Startup: connect to MongoDB, initialize all services (Chatbot + NDVI).
    - Shutdown: close MongoDB connection.
    """
    global mongo_client, chat_service, knowledge_service, long_term_memory, history_db, prediction_service
    global ndvi_service, gee_ready, gee_error
    
    settings = get_settings()

    # --- Startup ---
    logger.info("🚀 Starting AgriSense ML Service...")
    logger.info("   LLM Model:  %s", settings.LLM_MODEL)
    logger.info("   Database:   %s", settings.DATABASE_NAME)

    # 1. Connect to MongoDB
    try:
        # Use settings for URI or fallback to env for NDVI compatibility
        uri = settings.MONGODB_URI or os.getenv("MONGO_URI", "mongodb://localhost:27017/agrisense")
        mongo_client = MongoClient(uri)
        mongo_client.admin.command("ping")
        logger.info("✅ MongoDB connected successfully!")
    except Exception as e:
        logger.error("❌ MongoDB connection failed: %s", str(e))
        raise

    # 2. Initialize Chatbot modules
    conversation_memory = ConversationMemory(mongo_client)
    long_term_memory = LongTermMemory(mongo_client)
    history_db = HistoryDB(mongo_client)
    vector_store = MongoVectorStore(mongo_client)
    knowledge_retriever = KnowledgeRetriever(vector_store)
    memory_retriever = MemoryRetriever(long_term_memory)
    
    chat_service = ChatService(
        conversation_memory=conversation_memory,
        long_term_memory=long_term_memory,
        history_db=history_db,
        knowledge_retriever=knowledge_retriever,
        memory_retriever=memory_retriever,
    )
    knowledge_service = KnowledgeService(vector_store)
    logger.info("✅ Chatbot services initialized!")

    # 3. Initialize NDVI Modules
    try:
        farm_collection = settings.MONGO_FARM_COLLECTION
        if settings.MONGO_DB_NAME:
            mongo_db = mongo_client[settings.MONGO_DB_NAME]
        else:
            try:
                mongo_db = mongo_client.get_default_database()  # database named in MONGODB_URI (same one the Node backend uses)
            except Exception:
                mongo_db = mongo_client["test"]  # MongoDB's default when the URI names no database (what the Node backend uses)
        logger.info("   Farms DB:   %s.%s", mongo_db.name, farm_collection)
        ndvi_service = NDVIService(mongo_db, farm_collection)
        
        init_mode = initialize_gee()
        gee_ready = True
        gee_error = ""
        logger.info(f"✅ Google Earth Engine initialized ({init_mode})")
    except Exception as exc:
        gee_ready = False
        gee_error = str(exc)
        logger.error(f"❌ Google Earth Engine initialization deferred: {gee_error}")

    # 4. Initialize disease/pest prediction models (optional; endpoints return 503 if unavailable)
    try:
        prediction_service = PredictionService()
        logger.info("✅ Prediction Service initialized!")
    except Exception as e:
        logger.error("❌ Prediction Service failed to initialize: %s", e)

    logger.info("✅ All services initialized!")

    yield  # ---- Application is running ----

    # --- Shutdown ---
    logger.info("Shutting down AgriSense ML Service...")
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB connection closed.")

# ===================================================================
# FastAPI App Instance
# ===================================================================

app = FastAPI(
    title="AgriSense AI & NDVI Service",
    description="Production-ready Agriculture AI Chatbot with RAG, Memory, Knowledge Base and NDVI processing.",
    version="1.0.0",
    lifespan=lifespan,
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=list({
        "http://localhost:5173",
        "http://localhost:5176",
        "http://localhost:3000",
        os.getenv("CORS_ORIGIN", "http://localhost:5176"),
    }),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================================================================
# Request Logging Middleware
# ===================================================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Logs every incoming request with method, path, and response time."""
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    logger.info(
        "%s %s → %d (%.2fs)",
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )
    return response

# ===================================================================
# Admin authentication (for endpoints that must not be public)
# ===================================================================

def require_admin(x_admin_key: Optional[str] = Header(default=None)):
    """Guards admin-only endpoints with the shared ML_ADMIN_KEY secret."""
    expected = get_settings().ML_ADMIN_KEY
    if not expected:
        raise HTTPException(status_code=403, detail="Admin endpoints are disabled: set ML_ADMIN_KEY.")
    if not x_admin_key or not secrets.compare_digest(x_admin_key, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing X-Admin-Key header.")

# ===================================================================
# Endpoints
# ===================================================================

# ---- Health Check ----

@app.get("/", response_model=HealthResponse, tags=["Health"])
async def root_health_check():
    """
    Health check endpoint (Chatbot).
    Returns service status, name, and version.
    """
    return HealthResponse()

@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint (NDVI Service).
    """
    return {"status": "ok"}

# ---- NDVI ----

@app.get("/ndvi/{farm_id}", tags=["NDVI"], dependencies=[Depends(require_admin)])
def get_ndvi(farm_id: str):
    if not gee_ready:
        raise HTTPException(
            status_code=503,
            detail=(
                "Google Earth Engine is not initialized. "
                f"{gee_error}"
            ),
        )
    return ndvi_service.compute_ndvi(farm_id)

# ---- Prediction ----

class PredictionRequest(BaseModel):
    image_url: str


@app.post("/predict/disease", tags=["Prediction"], dependencies=[Depends(require_admin)])
def predict_disease(request: PredictionRequest):
    if prediction_service is None:
        raise HTTPException(status_code=503, detail="Prediction service not initialized")
    try:
        return {"success": True, "prediction": prediction_service.predict_disease(request.image_url)}
    except ValueError as e:  # rejected image URL
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Disease prediction error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/pest", tags=["Prediction"], dependencies=[Depends(require_admin)])
def predict_pest(request: PredictionRequest):
    if prediction_service is None:
        raise HTTPException(status_code=503, detail="Prediction service not initialized")
    try:
        return {"success": True, "prediction": prediction_service.predict_pest(request.image_url)}
    except NoDetectionError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Pest prediction error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ---- Chat ----

@app.post("/chat", response_model=ChatResponse, tags=["Chat"], dependencies=[Depends(require_admin)])
async def chat(request: ChatRequest):
    """
    Main chat endpoint.
    Accepts a user message and returns an AI-generated agriculture response.
    Supports conversation continuity via conversation_id.
    Uses RAG (knowledge retrieval + memory) for context-aware responses.
    Server-to-server only: the Express backend authenticates the user and supplies user_id.
    """
    if chat_service is None or history_db is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        if request.conversation_id:
            owner = await asyncio.to_thread(history_db.get_owner, request.conversation_id)
            if owner is not None and owner != request.user_id:
                raise HTTPException(status_code=404, detail="Conversation not found")
        return await chat_service.handle_chat(request)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Chat endpoint error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your message: {str(e)}",
        )

@app.get("/chat/history/{user_id}", tags=["Chat"], dependencies=[Depends(require_admin)])
async def get_chat_history(user_id: str):
    """Lists a user's conversations (id, title, updated_at), newest first."""
    if history_db is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    try:
        return await asyncio.to_thread(history_db.get_user_conversations, user_id)
    except Exception as e:
        logger.error("Error fetching history: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch history")


@app.get("/chat/conversation/{conversation_id}", tags=["Chat"], dependencies=[Depends(require_admin)])
async def get_conversation_messages(conversation_id: str, user_id: str):
    """Returns the recent messages of one conversation, only if it belongs to user_id."""
    if chat_service is None or history_db is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    try:
        owner = await asyncio.to_thread(history_db.get_owner, conversation_id)
        if owner != user_id:
            raise HTTPException(status_code=404, detail="Conversation not found")
        messages = await asyncio.to_thread(
            chat_service._conversation_memory.get_recent_messages, conversation_id
        )
        return {"messages": messages}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error fetching messages: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

# ---- Knowledge ----

@app.post("/knowledge/upload", response_model=KnowledgeUploadResponse, tags=["Knowledge"], dependencies=[Depends(require_admin)])
async def upload_knowledge(request: KnowledgeUploadRequest):
    """
    Upload a knowledge document to the vector store.
    The document is chunked, embedded, and stored for RAG retrieval.
    """
    if knowledge_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        return await asyncio.to_thread(knowledge_service.upload_knowledge, request)
    except Exception as e:
        logger.error("Knowledge upload error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload knowledge: {str(e)}",
        )

# ---- Memory ----

@app.post("/memory/store", response_model=MemoryStoreResponse, tags=["Memory"], dependencies=[Depends(require_admin)])
async def store_memory(request: MemoryStoreRequest):
    """
    Store a long-term fact about a user.
    The fact is embedded and stored for semantic retrieval in future conversations.
    """
    if long_term_memory is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        await long_term_memory.store_memory(
            user_id=request.user_id,
            fact=request.fact,
        )
        return MemoryStoreResponse(
            message="Memory stored successfully.",
            user_id=request.user_id,
        )
    except Exception as e:
        logger.error("Memory store error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store memory: {str(e)}",
        )

@app.get("/memory/{user_id}", response_model=MemoryResponse, tags=["Memory"], dependencies=[Depends(require_admin)])
async def get_memories(user_id: str):
    """
    Retrieve all stored memories for a user.
    Returns a list of all facts stored for the given user.
    """
    if long_term_memory is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        memories = await asyncio.to_thread(long_term_memory.get_all_memories, user_id)
        items = [
            MemoryItem(
                fact=m["fact"],
                created_at=m.get("created_at"),
            )
            for m in memories
        ]
        return MemoryResponse(
            user_id=user_id,
            memories=items,
            total=len(items),
        )
    except Exception as e:
        logger.error("Memory retrieval error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve memories: {str(e)}",
        )
