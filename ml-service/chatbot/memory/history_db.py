from datetime import datetime, timezone
from pymongo import MongoClient
import logging

from chatbot.config.settings import get_settings

logger = logging.getLogger(__name__)

class HistoryDB:
    """
    Manages chat history metadata mapping mobile_number to conversation_ids.
    """
    def __init__(self, mongo_client: MongoClient):
        settings = get_settings()
        self._db = mongo_client[settings.DATABASE_NAME]
        self._collection = self._db[settings.CHAT_META_COLLECTION]
        
    def upsert_conversation(self, conversation_id: str, mobile_number: str, title: str):
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
                "mobile_number": mobile_number,
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
        
    def get_user_conversations(self, mobile_number: str) -> list[dict]:
        """
        Returns all conversations for a user, sorted by updated_at descending.
        """
        cursor = self._collection.find({"mobile_number": mobile_number}).sort("updated_at", -1)
        results = []
        for doc in cursor:
            results.append({
                "conversation_id": doc["conversation_id"],
                "title": doc["title"],
                "updated_at": doc["updated_at"].isoformat()
            })
        return results
