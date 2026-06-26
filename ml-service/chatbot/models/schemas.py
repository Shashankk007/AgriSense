"""
AgriSense ML Service — Pydantic Request/Response Models
========================================================

Purpose:
    Defines ALL request and response shapes for the FastAPI endpoints.
    FastAPI uses these for automatic validation, serialization, and OpenAPI docs.

Why it exists:
    Separating data models from routes keeps route handlers thin and focused.
    Any shape change happens here — not scattered across route files.

Interactions:
    - Imported by app.py for endpoint type annotations.
    - Imported by services for internal data passing.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ===================================================
# Chat Endpoint Models
# ===================================================

class ChatRequest(BaseModel):
    """Incoming chat message from the user."""
    mobile_number: str = Field(..., description="Unique mobile number identifier for the user")
    message: str = Field(..., min_length=1, description="The user's message")
    conversation_id: Optional[str] = Field(
        None,
        description="Optional conversation ID to continue an existing conversation. "
                    "If not provided, a new conversation is started.",
    )


class SourceDocument(BaseModel):
    """A source document referenced in the response."""
    content: str = Field(..., description="Relevant text chunk")
    source: Optional[str] = Field(None, description="Origin of the document")
    score: Optional[float] = Field(None, description="Similarity score")


class ChatResponse(BaseModel):
    """Response returned from the chat endpoint."""
    response: str = Field(..., description="The AI-generated answer")
    conversation_id: str = Field(..., description="Conversation ID for continuity")
    sources: list[SourceDocument] = Field(
        default_factory=list,
        description="Knowledge base sources used to generate the response",
    )


# ===================================================
# Knowledge Upload Models
# ===================================================

class KnowledgeUploadRequest(BaseModel):
    """Request to upload a knowledge document."""
    content: str = Field(..., min_length=10, description="The document text to ingest")
    source: str = Field(..., description="Source name (e.g., 'WHO Crop Guide 2024')")
    category: Optional[str] = Field(
        None,
        description="Category for metadata filtering (e.g., 'fertilizer', 'pest', 'disease')",
    )


class KnowledgeUploadResponse(BaseModel):
    """Response after successful knowledge upload."""
    message: str
    chunks_stored: int
    source: str


# ===================================================
# Memory Models
# ===================================================

class MemoryStoreRequest(BaseModel):
    """Request to store a long-term user fact."""
    mobile_number: str = Field(..., description="User whose memory this belongs to")
    fact: str = Field(..., min_length=3, description="The fact to remember (e.g., 'I grow wheat on 5 acres')")


class MemoryItem(BaseModel):
    """A single stored memory item."""
    fact: str
    created_at: Optional[datetime] = None


class MemoryResponse(BaseModel):
    """Response containing a user's stored memories."""
    mobile_number: str
    memories: list[MemoryItem]
    total: int


class MemoryStoreResponse(BaseModel):
    """Response after successfully storing a memory."""
    message: str
    mobile_number: str


# ===================================================
# Health Check
# ===================================================

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    service: str = "agrisense-ml-service"
    version: str = "1.0.0"
