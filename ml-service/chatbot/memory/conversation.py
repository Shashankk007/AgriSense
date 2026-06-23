from __future__ import annotations

"""
AgriSense ML Service — Conversation Memory (Layer 1)
=====================================================

Purpose:
    Manages SHORT-TERM conversation history for the current chat session.
    Stores each human/AI message exchange in MongoDB so that the chatbot
    can understand context within a conversation (e.g., pronouns like "it"
    referring to a previously mentioned crop).

Why it exists:
    Without conversation memory, each message is treated in isolation.
    This module provides the "working memory" that makes multi-turn
    conversations coherent.

Interactions:
    - Uses: MongoDB collection (configured via settings.CONVERSATION_COLLECTION)
    - Called by: chatbot/services/chat_service.py
    - Storage format: Each message is a document with session_id, role, content, timestamp.

Design:
    Uses LangChain's MongoDBChatMessageHistory for standardized message storage.
    A thin wrapper adds our logging and configuration on top.
"""

from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from pymongo import MongoClient

from chatbot.config.settings import get_settings
from chatbot.utils.logger import get_logger

logger = get_logger(__name__)

# Maximum number of recent messages to include in context
MAX_HISTORY_MESSAGES = 20


class ConversationMemory:
    """
    Manages per-conversation message history stored in MongoDB.

    Each conversation is identified by a unique `conversation_id`.
    Messages are stored as LangChain HumanMessage / AIMessage objects.
    """

    def __init__(self, mongo_client: MongoClient):
        settings = get_settings()
        self._database_name = settings.DATABASE_NAME
        self._collection_name = settings.CONVERSATION_COLLECTION
        self._client = mongo_client
        logger.info(
            "ConversationMemory initialized | db=%s | collection=%s",
            self._database_name,
            self._collection_name,
        )

    def get_history(self, conversation_id: str) -> MongoDBChatMessageHistory:
        """
        Returns a MongoDBChatMessageHistory instance for the given conversation.
        This is a lightweight object — it queries MongoDB on demand.
        """
        return MongoDBChatMessageHistory(
            connection_string=None,
            session_id=conversation_id,
            database_name=self._database_name,
            collection_name=self._collection_name,
            session_id_key="conversation_id",
            history_size=MAX_HISTORY_MESSAGES,
            client=self._client,
        )

    def get_recent_messages(self, conversation_id: str) -> list[dict]:
        """
        Retrieves recent messages for a conversation as a list of dicts.

        Returns:
            List of {"role": "human" | "ai", "content": "..."} dicts,
            capped at MAX_HISTORY_MESSAGES.
        """
        history = self.get_history(conversation_id)
        messages = history.messages

        result = []
        for msg in messages[-MAX_HISTORY_MESSAGES:]:
            role = "human" if msg.type == "human" else "ai"
            result.append({"role": role, "content": msg.content})

        logger.debug(
            "Retrieved %d messages for conversation %s",
            len(result),
            conversation_id,
        )
        return result

    def add_messages(
        self,
        conversation_id: str,
        user_message: str,
        ai_response: str,
    ) -> None:
        """
        Stores a user message and AI response pair in the conversation history.
        """
        history = self.get_history(conversation_id)
        history.add_user_message(user_message)
        history.add_ai_message(ai_response)
        logger.debug("Stored message pair for conversation %s", conversation_id)
