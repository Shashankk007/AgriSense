from __future__ import annotations

"""
AgriSense ML Service — Knowledge Retriever
============================================

Purpose:
    Retrieves relevant knowledge base documents for a given user query.
    Acts as the bridge between the chat chain and the vector store.

Why it exists:
    Separates retrieval strategy from storage implementation (mongo_vector.py)
    and from chain orchestration (chat_chain.py). Different retrieval
    strategies (e.g., reranking, hybrid search) can be swapped here
    without touching other modules.

Interactions:
    - Uses: chatbot/vectorstore/mongo_vector.py (similarity search)
    - Called by: chatbot/services/chat_service.py
"""

from chatbot.vectorstore.mongo_vector import MongoVectorStore
from chatbot.utils.logger import get_logger

logger = get_logger(__name__)


class KnowledgeRetriever:
    """
    Retrieves relevant knowledge base documents for RAG context injection.
    """

    def __init__(self, vector_store: MongoVectorStore):
        self._vector_store = vector_store
        logger.info("KnowledgeRetriever initialized")

    def retrieve(
        self,
        query: str,
        k: int = 4,
        category: str | None = None,
    ) -> tuple[str, list[dict]]:
        """
        Retrieves relevant knowledge and formats it for prompt injection.

        Args:
            query:    The user's question.
            k:        Number of documents to retrieve.
            category: Optional category filter (e.g., "pest", "fertilizer").

        Returns:
            Tuple of:
              - formatted_context: String ready for prompt injection
              - raw_results: List of result dicts with content, metadata, score
        """
        logger.info("Retrieving knowledge | query=%s | k=%d", query[:60], k)

        # Build pre-filter if category specified
        pre_filter = None
        if category:
            pre_filter = {"category": category}

        # Search the vector store
        results = self._vector_store.similarity_search(
            query=query,
            k=k,
            pre_filter=pre_filter,
        )

        if not results:
            logger.info("No knowledge results found")
            return "", []

        # Format results for prompt injection
        context_parts = []
        for i, result in enumerate(results, 1):
            source = result.get("metadata", {}).get("source", "Unknown")
            content = result["content"]
            context_parts.append(
                f"[Document {i}] (Source: {source})\n{content}"
            )

        formatted_context = "\n\n---\n\n".join(context_parts)
        logger.info("Retrieved %d knowledge documents", len(results))
        return formatted_context, results
