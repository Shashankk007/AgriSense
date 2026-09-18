from __future__ import annotations

"""
AgriSense ML Service — MongoDB Atlas Vector Store
===================================================

Purpose:
    Wrapper around MongoDB Atlas Vector Search for the knowledge base.
    Handles document embedding, storage, and similarity search.

Why it exists:
    Isolates all vector database logic in one module. Route handlers and
    services never touch vector operations directly — they call this module.

Interactions:
    - Uses: MongoDB collection (settings.KNOWLEDGE_COLLECTION)
    - Uses: Google Embeddings (settings.EMBEDDING_MODEL)
    - Called by: chatbot/services/knowledge_service.py (add documents)
    - Called by: chatbot/retrievers/knowledge.py (similarity search)
"""

from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient
from pymongo.collection import Collection

from chatbot.config.settings import get_settings
from chatbot.utils.logger import get_logger

logger = get_logger(__name__)


class MongoVectorStore:
    """
    Manages the knowledge base vector store backed by MongoDB Atlas.
    """

    def __init__(self, mongo_client: MongoClient):
        settings = get_settings()
        self._db = mongo_client[settings.DATABASE_NAME]
        self._collection: Collection = self._db[settings.KNOWLEDGE_COLLECTION]
        self._index_name = settings.KNOWLEDGE_INDEX_NAME

        self._embeddings = FastEmbedEmbeddings(model_name=settings.FASTEMBED_MODEL)

        self._vector_store = MongoDBAtlasVectorSearch(
            collection=self._collection,
            embedding=self._embeddings,
            index_name=self._index_name,
            relevance_score_fn="cosine",
        )

        logger.info(
            "MongoVectorStore initialized | collection=%s | index=%s",
            settings.KNOWLEDGE_COLLECTION,
            self._index_name,
        )

    def add_documents(self, documents: list) -> list[str]:
        """
        Adds LangChain Document objects to the vector store.
        Each document is embedded and stored in MongoDB.

        Args:
            documents: List of LangChain Document objects (with page_content and metadata).

        Returns:
            List of inserted document IDs.
        """
        logger.info("Adding %d documents to vector store", len(documents))
        ids = self._vector_store.add_documents(documents)
        logger.info("Successfully stored %d documents", len(ids))
        return ids

    def similarity_search(
        self,
        query: str,
        k: int = 4,
        pre_filter: dict | None = None,
    ) -> list[dict]:
        """
        Performs similarity search against the knowledge base.

        Args:
            query:      The search query text.
            k:          Number of results to return.
            pre_filter: Optional MongoDB filter (e.g., {"category": "pest"}).

        Returns:
            List of {"content": str, "metadata": dict, "score": float} dicts.
        """
        logger.info("Similarity search | query=%s | k=%d", query[:60], k)

        try:
            if pre_filter:
                results = self._vector_store.similarity_search_with_score(
                    query=query,
                    k=k,
                    pre_filter=pre_filter,
                )
            else:
                results = self._vector_store.similarity_search_with_score(
                    query=query,
                    k=k,
                )

            formatted = []
            for doc, score in results:
                formatted.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": float(score),
                })

            logger.info("Found %d results", len(formatted))
            return formatted

        except Exception as e:
            logger.error("Similarity search failed: %s", str(e))
            return []

    @property
    def collection(self) -> Collection:
        """Direct access to the MongoDB collection (for admin operations)."""
        return self._collection

    @property
    def vector_store(self) -> MongoDBAtlasVectorSearch:
        """Direct access to the LangChain vector store instance."""
        return self._vector_store
