from __future__ import annotations

"""
AgriSense ML Service — Knowledge Service
==========================================

Purpose:
    Business logic for knowledge base operations (upload, manage).
    Orchestrates the flow: validate → load → chunk → embed → store.

Why it exists:
    Separates knowledge management logic from HTTP routes (app.py)
    and from vector store internals (mongo_vector.py).

Interactions:
    - Called by: app.py (knowledge upload endpoint)
    - Uses: chatbot/loaders/document_loader.py (chunking)
    - Uses: chatbot/vectorstore/mongo_vector.py (embedding + storage)
"""

from chatbot.loaders.document_loader import DocumentLoader
from chatbot.models.schemas import KnowledgeUploadRequest, KnowledgeUploadResponse
from chatbot.vectorstore.mongo_vector import MongoVectorStore
from chatbot.utils.logger import get_logger

logger = get_logger(__name__)


class KnowledgeService:
    """
    Manages knowledge base upload and ingestion.
    """

    def __init__(self, vector_store: MongoVectorStore):
        self._vector_store = vector_store
        self._loader = DocumentLoader()
        logger.info("KnowledgeService initialized")

    def upload_knowledge(self, request: KnowledgeUploadRequest) -> KnowledgeUploadResponse:
        """
        Processes a knowledge upload request end-to-end:
        1. Split content into chunks.
        2. Embed and store in vector database.
        3. Return success response with stats.
        """
        logger.info(
            "Uploading knowledge | source=%s | category=%s",
            request.source,
            request.category,
        )

        # Step 1: Load and chunk the document
        documents = self._loader.load_text(
            content=request.content,
            source=request.source,
            category=request.category,
        )

        if not documents:
            logger.warning("No chunks generated from the uploaded content")
            return KnowledgeUploadResponse(
                message="No content chunks could be generated from the input.",
                chunks_stored=0,
                source=request.source,
            )

        # Step 2: Embed and store in vector database
        self._vector_store.add_documents(documents)

        logger.info(
            "Knowledge upload complete | source=%s | chunks=%d",
            request.source,
            len(documents),
        )

        return KnowledgeUploadResponse(
            message=f"Successfully uploaded and indexed {len(documents)} chunks.",
            chunks_stored=len(documents),
            source=request.source,
        )
