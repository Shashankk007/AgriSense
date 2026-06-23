from __future__ import annotations

"""
AgriSense ML Service — FastAPI Application Entry Point
========================================================

Purpose:
    The single entry point for the entire ML service. Defines all HTTP
    endpoints, middleware, and the application lifecycle (startup/shutdown).

Why it exists:
    This is the ONLY file that deals with HTTP concerns (requests, responses,
    status codes, CORS). All business logic is delegated to the services layer.

Interactions:
    - Delegates to: chatbot/services/chat_service.py (chat logic)
    - Delegates to: chatbot/services/knowledge_service.py (knowledge upload)
    - Delegates to: chatbot/memory/long_term.py (memory storage)
    - Uses:         chatbot/models/schemas.py (request/response validation)
    - Uses:         chatbot/config/settings.py (configuration)
    - Uses:         chatbot/utils/logger.py (logging)

Run with:
    cd ml-service
    .\\venv\\Scripts\\activate
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload
"""

import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient

from chatbot.config.settings import get_settings
from chatbot.memory.conversation import ConversationMemory
from chatbot.memory.long_term import LongTermMemory
from chatbot.models.schemas import (
    ChatRequest,
    ChatResponse,
    HealthResponse,
    KnowledgeUploadRequest,
    KnowledgeUploadResponse,
    MemoryItem,
    MemoryStoreRequest,
    MemoryStoreResponse,
    MemoryResponse,
)
from chatbot.retrievers.knowledge import KnowledgeRetriever
from chatbot.retrievers.memory import MemoryRetriever
from chatbot.services.chat_service import ChatService
from chatbot.services.knowledge_service import KnowledgeService
from chatbot.vectorstore.mongo_vector import MongoVectorStore
from chatbot.utils.logger import get_logger

logger = get_logger(__name__)

# ===================================================================
# Global service instances — initialized at startup, used by endpoints
# ===================================================================
mongo_client: Optional[MongoClient] = None
chat_service: Optional[ChatService] = None
knowledge_service: Optional[KnowledgeService] = None
long_term_memory: Optional[LongTermMemory] = None


# ===================================================================
# Application Lifecycle (startup / shutdown)
# ===================================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application lifecycle:
    - Startup: connect to MongoDB, initialize all services.
    - Shutdown: close MongoDB connection.
    """
    global mongo_client, chat_service, knowledge_service, long_term_memory
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

    # 2. Initialize memory modules
    conversation_memory = ConversationMemory(mongo_client)
    long_term_memory = LongTermMemory(mongo_client)

    # 3. Initialize vector store
    vector_store = MongoVectorStore(mongo_client)

    # 4. Initialize retrievers
    knowledge_retriever = KnowledgeRetriever(vector_store)
    memory_retriever = MemoryRetriever(long_term_memory)

    # 5. Initialize services (dependency injection)
    chat_service = ChatService(
        conversation_memory=conversation_memory,
        long_term_memory=long_term_memory,
        knowledge_retriever=knowledge_retriever,
        memory_retriever=memory_retriever,
    )
    knowledge_service = KnowledgeService(vector_store)

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
    title="AgriSense AI Service",
    description="Production-ready Agriculture AI Chatbot with RAG, Memory, and Knowledge Base",
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
async def health_check():
    """
    Health check endpoint.
    Returns service status, name, and version.
    """
    return HealthResponse()


# ---- Chat ----

@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Main chat endpoint.
    Accepts a user message and returns an AI-generated agriculture response.
    Supports conversation continuity via conversation_id.
    Uses RAG (knowledge retrieval + memory) for context-aware responses.
    """
    if chat_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        return await chat_service.handle_chat(request)
    except Exception as e:
        logger.error("Chat endpoint error: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your message: {str(e)}",
        )


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


@app.get("/memory/{user_id}", response_model=MemoryResponse, tags=["Memory"])
async def get_memories(user_id: str):
    """
    Retrieve all stored memories for a user.
    Returns a list of all facts stored for the given user.
    """
    if long_term_memory is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        memories = long_term_memory.get_all_memories(user_id)
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
