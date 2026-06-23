from __future__ import annotations

"""
AgriSense ML Service — Memory Retriever
=========================================

Purpose:
    Retrieves relevant long-term user facts for a given query.
    Formats them for injection into the system prompt's memory context.

Why it exists:
    Separates memory retrieval logic from the memory storage module
    (long_term.py) and from the chain. This allows swapping retrieval
    strategies (e.g., adding reranking) without touching other modules.

Interactions:
    - Uses: chatbot/memory/long_term.py (semantic search)
    - Called by: chatbot/services/chat_service.py
"""

from chatbot.memory.long_term import LongTermMemory
from chatbot.utils.logger import get_logger

logger = get_logger(__name__)


class MemoryRetriever:
    """
    Retrieves relevant user facts from long-term memory for RAG context.
    """

    def __init__(self, long_term_memory: LongTermMemory):
        self._memory = long_term_memory
        logger.info("MemoryRetriever initialized")

    async def retrieve(self, user_id: str, query: str, k: int = 5) -> str:
        """
        Retrieves relevant user facts and formats them for prompt injection.

        Args:
            user_id: The user whose facts to search.
            query:   The current question to find relevant facts for.
            k:       Maximum number of facts to return.

        Returns:
            Formatted string of user facts ready for prompt injection.
        """
        logger.info("Retrieving memories | user=%s | query=%s", user_id, query[:60])

        facts = await self._memory.retrieve_relevant_memories(
            user_id=user_id,
            query=query,
            k=k,
        )

        if not facts:
            logger.info("No relevant memories found for user=%s", user_id)
            return ""

        # Format facts for prompt injection
        formatted_parts = [f"• {fact}" for fact in facts]
        formatted_context = "Known information about this user:\n" + "\n".join(formatted_parts)

        logger.info("Retrieved %d relevant memories for user=%s", len(facts), user_id)
        return formatted_context
