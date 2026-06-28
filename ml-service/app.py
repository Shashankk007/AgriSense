import os
import time
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient

# --- NDVI Service Imports ---
from gee.gee_init import initialize_gee
from services.ndvi_service import NDVIService
from services.prediction_service import PredictionService

# --- Chatbot Service Imports ---
from chatbot.config.settings import get_settings
from chatbot.memory.conversation import ConversationMemory
from chatbot.memory.long_term import LongTermMemory
from chatbot.memory.history_db import HistoryDB
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

# NDVI globals
ndvi_service: Optional[NDVIService] = None
gee_ready = False
gee_error = ""

# Prediction globals
prediction_service: Optional[PredictionService] = None

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
    global mongo_client, chat_service, knowledge_service, long_term_memory, history_db
    global ndvi_service, gee_ready, gee_error, prediction_service
    
    settings = get_settings()

    # --- Startup ---
    logger.info("🚀 Starting AgriSense ML Service...")
    logger.info("   LLM Model:  %s", settings.LLM_MODEL)
    logger.info("   Database:   %s", settings.DATABASE_NAME)

    # 1. Connect to MongoDB
    try:
        mongo_client = MongoClient(settings.MONGODB_URI)
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
        mongo_db = mongo_client[settings.MONGO_DB_NAME]
        ndvi_service = NDVIService(mongo_db, settings.MONGO_FARM_COLLECTION)
        
        init_mode = initialize_gee()
        gee_ready = True
        gee_error = ""
        logger.info(f"✅ Google Earth Engine initialized ({init_mode})")
    except Exception as exc:
        gee_ready = False
        gee_error = str(exc)
        logger.error(f"❌ Google Earth Engine initialization deferred: {gee_error}")

    # 4. Initialize Prediction Service
    try:
        prediction_service = PredictionService()
        logger.info("✅ Prediction Service initialized!")
    except Exception as e:
        logger.error(f"❌ Prediction Service failed to initialize: {e}")

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
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5176",
        "http://localhost:3000",
        get_settings().CORS_ORIGIN,
    ],
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

@app.get("/ndvi/{farm_id}", tags=["NDVI"])
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
from pydantic import BaseModel

class PredictionRequest(BaseModel):
    image_url: str

@app.post("/predict/disease", tags=["Prediction"])
def predict_disease(request: PredictionRequest):
    if prediction_service is None:
        raise HTTPException(status_code=503, detail="Prediction service not initialized")
    try:
        result = prediction_service.predict_disease(request.image_url)
        return {"success": True, "prediction": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/pest", tags=["Prediction"])
def predict_pest(request: PredictionRequest):
    if prediction_service is None:
        raise HTTPException(status_code=503, detail="Prediction service not initialized")
    try:
        result = prediction_service.predict_pest(request.image_url)
        return {"success": True, "prediction": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---- Chat ----

@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Handle a user chat message.
    """
    if chat_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        response = await chat_service.handle_chat(request)
        return response
    except Exception as e:
        logger.error("Chat error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat: {str(e)}",
        )

@app.get("/chat/history/{mobile_number}", tags=["Chat"])
async def get_chat_history(mobile_number: str):
    """
    Get all conversations for a user.
    """
    if history_db is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        return history_db.get_user_conversations(mobile_number)
    except Exception as e:
        logger.error("Error fetching history: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch history")

@app.get("/chat/conversation/{conversation_id}", tags=["Chat"])
async def get_conversation_messages(conversation_id: str):
    """
    Get full message log for a specific conversation.
    """
    if chat_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
        
    try:
        # Access the conversation memory directly to get messages
        history = chat_service._conversation_memory.get_recent_messages(conversation_id)
        return {"messages": history}
    except Exception as e:
        logger.error("Error fetching messages: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

# ---- Knowledge ----

@app.post("/knowledge/upload", response_model=KnowledgeUploadResponse, tags=["Knowledge"])
async def upload_knowledge(request: KnowledgeUploadRequest):
    """
    Upload a knowledge document to the vector store.
    The document is chunked, embedded, and stored for RAG retrieval.
    """
    if knowledge_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        return knowledge_service.upload_knowledge(request)
    except Exception as e:
        logger.error("Knowledge upload error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload knowledge: {str(e)}",
        )

# ---- Memory ----

@app.post("/memory/store", response_model=MemoryStoreResponse, tags=["Memory"])
async def store_memory(request: MemoryStoreRequest):
    """
    Store a long-term fact about a user.
    The fact is embedded and stored for semantic retrieval in future conversations.
    """
    if long_term_memory is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        await long_term_memory.store_memory(
            mobile_number=request.mobile_number,
            fact=request.fact,
        )
        return MemoryStoreResponse(
            message="Memory stored successfully.",
            mobile_number=request.mobile_number,
        )
    except Exception as e:
        logger.error("Memory store error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store memory: {str(e)}",
        )

@app.get("/memory/{mobile_number}", response_model=MemoryResponse, tags=["Memory"])
async def get_memories(mobile_number: str):
    """
    Retrieve all stored memories for a user.
    Returns a list of all facts stored for the given user.
    """
    if long_term_memory is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        memories = long_term_memory.get_all_memories(mobile_number)
        items = [
            MemoryItem(
                fact=m["fact"],
                created_at=m.get("created_at"),
            )
            for m in memories
        ]
        return MemoryResponse(
            mobile_number=mobile_number,
            memories=items,
            total=len(items),
        )
    except Exception as e:
        logger.error("Memory retrieval error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve memories: {str(e)}",
        )
