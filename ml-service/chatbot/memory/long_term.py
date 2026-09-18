from __future__ import annotations

"""
AgriSense ML Service — Long-Term Memory (Layer 2)
===================================================

Purpose:
    Stores PERSISTENT user facts that survive across conversations.
    Examples: "User grows wheat", "Farm size is 5 acres", "Located in Punjab".

    These facts are embedded as vectors for semantic retrieval — when a user
    asks about fertilizer, the system can retrieve the fact "grows wheat"
    even if the user hasn't mentioned it in the current conversation.

Why it exists:
    Conversation memory resets per session. Long-term memory allows the AI
    to personalize advice across sessions — a key differentiator for
    production agriculture chatbots.

Interactions:
    - Uses: MongoDB collection (settings.MEMORY_COLLECTION)
    - Uses: Google Embeddings for semantic search
    - Called by: chatbot/services/chat_service.py (store + retrieve)
    - Called by: chatbot/retrievers/memory.py (Phase 5)

Storage format per document:
    {
        "user_id": "user123",
        "fact": "I grow wheat on 5 acres in Punjab",
        "embedding": [0.12, -0.45, ...],   # 768-dim vector
        "created_at": ISODate("2026-06-22T...")
    }
"""

import asyncio
from datetime import datetime, timezone

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pymongo import MongoClient

from chatbot.config.settings import get_settings
from chatbot.utils.logger import get_logger

logger = get_logger(__name__)


class LongTermMemory:
    """
    Manages persistent user facts stored as embedded documents in MongoDB.
    """

    def __init__(self, mongo_client: MongoClient):
        settings = get_settings()
        self._db = mongo_client[settings.DATABASE_NAME]
        self._collection = self._db[settings.MEMORY_COLLECTION]
        self._embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
            output_dimensionality=settings.EMBEDDING_DIMENSIONS,
        )
        logger.info(
            "LongTermMemory initialized | collection=%s",
            settings.MEMORY_COLLECTION,
        )

    async def store_memory(self, user_id: str, fact: str) -> None:
        """
        Embeds and stores a user fact in MongoDB.

        Args:
            user_id: The user this fact belongs to.
            fact:    The fact text (e.g., "I grow wheat on 5 acres in Punjab").
        """
        logger.info("Storing memory for user=%s: %s", user_id, fact[:60])

        # Generate embedding for the fact
        embedding = await asyncio.to_thread(self._embeddings.embed_query, fact)

        document = {
            "user_id": user_id,
            "fact": fact,
            "embedding": embedding,
            "created_at": datetime.now(timezone.utc),
        }

        await asyncio.to_thread(self._collection.insert_one, document)
        logger.info("Memory stored successfully for user=%s", user_id)

    def get_all_memories(self, user_id: str) -> list[dict]:
        """
        Retrieves all stored facts for a user (non-semantic, full list).

        Returns:
            List of {"fact": "...", "created_at": datetime} dicts.
        """
        cursor = self._collection.find(
            {"user_id": user_id},
            {"_id": 0, "fact": 1, "created_at": 1},
        ).sort("created_at", -1)

        memories = list(cursor)
        logger.debug("Retrieved %d memories for user=%s", len(memories), user_id)
        return memories

    async def retrieve_relevant_memories(
        self,
        user_id: str,
        query: str,
        k: int = 5,
    ) -> list[str]:
        """
        Semantically searches for user facts relevant to the given query.
        Uses cosine similarity on the stored embeddings.

        This is a basic implementation using application-side similarity.
        Phase 5 will upgrade this to use MongoDB Atlas Vector Search index
        for server-side vector search (much more efficient).

        Args:
            user_id: Filter memories to this user only.
            query:   The current user question to find relevant facts for.
            k:       Maximum number of facts to return.

        Returns:
            List of fact strings, ranked by relevance.
        """
        logger.info("Retrieving relevant memories for user=%s | query=%s", user_id, query[:60])

        # Get query embedding
        query_embedding = await asyncio.to_thread(self._embeddings.embed_query, query)

        # For now, use MongoDB aggregation with $vectorSearch if index exists,
        # otherwise fall back to fetching all and computing similarity in Python.
        # Phase 5 will use Atlas Vector Search exclusively.
        try:
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": get_settings().MEMORY_INDEX_NAME,
                        "path": "embedding",
                        "queryVector": query_embedding,
                        "numCandidates": k * 10,
                        "limit": k,
                        "filter": {"user_id": user_id},
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "fact": 1,
                        "score": {"$meta": "vectorSearchScore"},
                    }
                },
            ]
            results = await asyncio.to_thread(lambda: list(self._collection.aggregate(pipeline)))
            facts = [r["fact"] for r in results]
        except Exception as e:
            logger.warning(
                "Vector search failed (index may not exist yet), "
                "falling back to returning all user memories: %s",
                str(e),
            )
            # Fallback: return all memories for this user (unranked)
            all_memories = self.get_all_memories(user_id)
            facts = [m["fact"] for m in all_memories[:k]]

        logger.info("Found %d relevant memories for user=%s", len(facts), user_id)
        return facts
