from datetime import datetime, timezone
from pymongo import MongoClient
import logging

from chatbot.config.settings import get_settings

logger = logging.getLogger(__name__)

class HistoryDB:
    """
    Manages chat history metadata mapping user_id to conversation_ids.
    """
    def __init__(self, mongo_client: MongoClient):
        settings = get_settings()
        self._db = mongo_client[settings.DATABASE_NAME]
        self._collection = self._db[settings.CHAT_META_COLLECTION]
        
    def upsert_conversation(self, conversation_id: str, user_id: str, title: str):
        """
        Upserts a conversation metadata record. If it doesn't exist, sets the title and created_at.
        Always updates updated_at.
        """
        now = datetime.now(timezone.utc)
        
        # Use $setOnInsert to only set the title/created_at if the document is new.
        update_doc = {
            "$set": {
                "updated_at": now
            },
            "$setOnInsert": {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "title": title[:30],
                "created_at": now
            }
        }
        
        self._collection.update_one(
            {"conversation_id": conversation_id},
            update_doc,
            upsert=True
        )
        logger.debug("Upserted metadata for conversation %s", conversation_id)
        
    def get_user_conversations(self, user_id: str) -> list[dict]:
        """
        Returns all conversations for a user, sorted by updated_at descending.
        """
        cursor = self._collection.find({"user_id": user_id}).sort("updated_at", -1)
        results = []
        for doc in cursor:
            results.append({
                "conversation_id": doc["conversation_id"],
                "title": doc["title"],
                "updated_at": doc["updated_at"].isoformat()
            })
        return results

    def get_owner(self, conversation_id: str) -> str | None:
        """Returns the user_id that owns a conversation, or None if it does not exist yet."""
        doc = self._collection.find_one({"conversation_id": conversation_id}, {"user_id": 1})
        return doc["user_id"] if doc else None
