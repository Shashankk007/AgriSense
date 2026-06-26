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
        "mobile_number": "9876543210",
        "fact": "I grow wheat on 5 acres in Punjab",
        "embedding": [0.12, -0.45, ...],   # 768-dim vector
        "created_at": ISODate("2026-06-22T...")
    }
"""

from datetime import datetime, timezone

from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
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
        self._embeddings = FastEmbedEmbeddings(
            model_name="BAAI/bge-small-en-v1.5",
        )
        logger.info(
            "LongTermMemory initialized | collection=%s",
            settings.MEMORY_COLLECTION,
        )

    async def store_memory(self, mobile_number: str, fact: str) -> None:
        """
        Embeds and stores a user fact in MongoDB.

        Args:
            mobile_number: The user this fact belongs to.
            fact:    The fact text (e.g., "I grow wheat on 5 acres in Punjab").
        """
        logger.info("Storing memory for user=%s: %s", mobile_number, fact[:60])

        # Check if this exact fact already exists for the user to prevent duplicates
        existing_fact = self._collection.find_one({
            "mobile_number": mobile_number,
            "fact": fact
        })
        if existing_fact:
            logger.info("Fact already exists for user=%s, skipping duplicate: %s", mobile_number, fact[:60])
            return

        # Generate embedding for the new fact
        embedding = self._embeddings.embed_query(fact)

        document = {
            "mobile_number": mobile_number,
            "fact": fact,
            "embedding": embedding,
            "created_at": datetime.now(timezone.utc),
        }

        self._collection.insert_one(document)
        logger.info("Memory stored successfully for user=%s", mobile_number)

    def get_all_memories(self, mobile_number: str) -> list[dict]:
        """
        Retrieves all stored facts for a user (non-semantic, full list).

        Returns:
            List of {"fact": "...", "created_at": datetime} dicts.
        """
        cursor = self._collection.find(
            {"mobile_number": mobile_number},
            {"_id": 0, "fact": 1, "created_at": 1},
        ).sort("created_at", -1)

        memories = list(cursor)
        logger.debug("Retrieved %d memories for user=%s", len(memories), mobile_number)
        return memories

    async def retrieve_relevant_memories(
        self,
        mobile_number: str,
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
            mobile_number: Filter memories to this user only.
            query:   The current user question to find relevant facts for.
            k:       Maximum number of facts to return.

        Returns:
            List of fact strings, ranked by relevance.
        """
        logger.info("Retrieving relevant memories for user=%s | query=%s", mobile_number, query[:60])

        # Get query embedding
        query_embedding = self._embeddings.embed_query(query)

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
                        "filter": {"mobile_number": mobile_number},
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
            results = list(self._collection.aggregate(pipeline))
            facts = [r["fact"] for r in results]
        except Exception as e:
            logger.warning(
                "Vector search failed (index may not exist yet), "
                "falling back to returning all user memories: %s",
                str(e),
            )
            # Fallback: return all memories for this user (unranked)
            all_memories = self.get_all_memories(mobile_number)
            facts = [m["fact"] for m in all_memories[:k]]

        logger.info("Found %d relevant memories for user=%s", len(facts), mobile_number)
        return facts
