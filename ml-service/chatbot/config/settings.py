"""
AgriSense ML Service — Centralized Configuration
=================================================

Purpose:
    Single source of truth for ALL environment variables and settings.
    Uses pydantic-settings to validate env vars at startup so misconfigurations
    fail fast with clear error messages instead of crashing deep inside business logic.

Why it exists:
    Prevents scattered `os.getenv()` calls across the codebase.
    Every module imports `get_settings()` — never reads env vars directly.

Interactions:
    - Loaded once at app startup via `get_settings()` (cached with lru_cache).
    - Consumed by: app.py, chat_service.py, mongo_vector.py, conversation.py,
      long_term.py, knowledge_service.py, chat_chain.py.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    All configuration is loaded from environment variables (or .env file).
    Pydantic validates types and raises clear errors on missing values.
    """

    # ---- Google Gemini ----
    GOOGLE_API_KEY: str

    # ---- Groq ----
    GROQ_API_KEY: str | None = None

    # ---- MongoDB Atlas ----
    MONGODB_URI: str
    DATABASE_NAME: str = "agrisense_ai"
    MONGO_DB_NAME: str = "agrisense_ai"
    MONGO_FARM_COLLECTION: str = "farms"

    # ---- Collection Names ----
    KNOWLEDGE_COLLECTION: str = "knowledge_base"
    MEMORY_COLLECTION: str = "user_memories"
    CONVERSATION_COLLECTION: str = "conversations"
    CHAT_META_COLLECTION: str = "chat_metadata"

    # ---- Vector Search Index Names ----
    KNOWLEDGE_INDEX_NAME: str = "knowledge_vector_index"
    MEMORY_INDEX_NAME: str = "memory_vector_index"

    # ---- LLM Configuration ----
    LLM_MODEL: str = "gemini-2.0-flash"
    EMBEDDING_MODEL: str = "models/embedding-001"
    LLM_TEMPERATURE: float = 0.3

    # ---- Server ----
    ML_SERVICE_PORT: int = 8000
    CORS_ORIGIN: str = "http://localhost:5176"
    ML_DEVICE: str = "cpu"

    # ---- Google Earth Engine ----
    GEE_INIT_MODE: str = "local"
    GEE_SERVICE_ACCOUNT: str | None = None
    GEE_PRIVATE_KEY_FILE: str | None = None
    GEE_PRIVATE_KEY_JSON: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Returns the cached Settings singleton.
    Called once at startup; subsequent calls return the same instance.
    """
    return Settings()
