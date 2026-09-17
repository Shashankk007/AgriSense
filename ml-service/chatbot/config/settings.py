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
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    All configuration is loaded from environment variables (or .env file).
    Pydantic validates types and raises clear errors on missing values.
    Every field from the .env file is explicitly declared here so that
    Pydantic validation remains strict — no unknown variables are silently ignored.
    """

    # ---- Google Gemini ----
    GOOGLE_API_KEY: str

    # ---- MongoDB Atlas ----
    MONGODB_URI: str
    DATABASE_NAME: str = "agrisense_ai"

    # ---- Collection Names ----
    KNOWLEDGE_COLLECTION: str = "knowledge_base"
    MEMORY_COLLECTION: str = "user_memories"
    CONVERSATION_COLLECTION: str = "conversations"
    MONGO_FARM_COLLECTION: str = "farms"

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

    # ---- Google Earth Engine (optional — only needed for NDVI features) ----
    GEE_INIT_MODE: Optional[str] = None
    GEE_SERVICE_ACCOUNT: Optional[str] = None
    GEE_PRIVATE_KEY_FILE: Optional[str] = None

    # ---- Groq (optional — only needed if Groq LLM is enabled) ----
    GROQ_API_KEY: Optional[str] = None

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
