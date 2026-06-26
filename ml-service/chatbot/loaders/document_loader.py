from __future__ import annotations

"""
AgriSense ML Service — Document Loader
========================================

Purpose:
    Ingestion pipeline for knowledge documents. Takes raw text, splits it
    into manageable chunks, attaches metadata, and prepares LangChain
    Document objects for embedding and storage.

Why it exists:
    LLMs have context windows. Entire documents can't be fed at once.
    This module handles the critical step of breaking documents into
    semantically meaningful chunks with overlap for context preservation.

Interactions:
    - Uses: LangChain RecursiveCharacterTextSplitter
    - Called by: chatbot/services/knowledge_service.py
    - Output is passed to: chatbot/vectorstore/mongo_vector.py
"""

from datetime import datetime, timezone

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from chatbot.utils.logger import get_logger

logger = get_logger(__name__)

# Chunk configuration — tuned for agriculture documents
CHUNK_SIZE = 1000        # Characters per chunk
CHUNK_OVERLAP = 200      # Overlap between chunks for context continuity
SEPARATORS = ["\n\n", "\n", ". ", " ", ""]  # Split priority


class DocumentLoader:
    """
    Handles document ingestion: text → chunks → LangChain Documents.
    """

    def __init__(self):
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            separators=SEPARATORS,
            length_function=len,
        )
        logger.info(
            "DocumentLoader initialized | chunk_size=%d | overlap=%d",
            CHUNK_SIZE,
            CHUNK_OVERLAP,
        )

    def load_text(
        self,
        content: str,
        source: str,
        category: str | None = None,
    ) -> list[Document]:
        """
        Splits raw text into chunked LangChain Document objects.

        Args:
            content:  The full document text.
            source:   Source name for metadata (e.g., "Wheat Growing Guide").
            category: Optional category (e.g., "fertilizer", "pest").

        Returns:
            List of LangChain Document objects with page_content and metadata.
        """
        logger.info(
            "Loading document | source=%s | category=%s | length=%d chars",
            source,
            category or "uncategorized",
            len(content),
        )

        # Create base metadata
        metadata = {
            "source": source,
            "category": category or "general",
            "ingested_at": datetime.now(timezone.utc).isoformat(),
        }

        # Split text into chunks
        chunks = self._splitter.split_text(content)
        logger.info("Split into %d chunks", len(chunks))

        # Create Document objects with metadata
        documents = []
        for i, chunk in enumerate(chunks):
            doc_metadata = {
                **metadata,
                "chunk_index": i,
                "total_chunks": len(chunks),
            }
            documents.append(
                Document(page_content=chunk, metadata=doc_metadata)
            )

        return documents
