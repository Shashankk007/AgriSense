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
    # Database holding the farms written by the Node backend. Defaults to the database named in MONGODB_URI.
    MONGO_DB_NAME: Optional[str] = None

    # ---- Collection Names ----
    KNOWLEDGE_COLLECTION: str = "knowledge_base"
    MEMORY_COLLECTION: str = "user_memories"
    CONVERSATION_COLLECTION: str = "conversations"
    CHAT_META_COLLECTION: str = "chat_metadata"
    MONGO_FARM_COLLECTION: str = "farms"

    # ---- Vector Search Index Names ----
    KNOWLEDGE_INDEX_NAME: str = "knowledge_vector_index"
    MEMORY_INDEX_NAME: str = "memory_vector_index"

    # ---- LLM Configuration ----
    # NOTE: models can be listed by the API yet 404 when called (e.g. gemini-2.5-*); verify with a real call.
    LLM_MODEL: str = "gemini-3.6-flash"
    # Embeddings run locally (no API key). Atlas vector indexes must use numDimensions = 384 for this model.
    FASTEMBED_MODEL: str = "BAAI/bge-small-en-v1.5"
    GROQ_MODEL: str = "openai/gpt-oss-20b"            # memory extraction (small/fast)
    GROQ_CHAT_MODEL: str = "openai/gpt-oss-120b"      # main chat answers when GROQ_API_KEY is set
    # Used automatically when the primary model is overloaded (503) or otherwise fails. Empty disables it.
    LLM_FALLBACK_MODEL: Optional[str] = "gemini-3.5-flash-lite"
    LLM_TEMPERATURE: float = 0.3

    # ---- Server ----
    ML_SERVICE_PORT: int = 8000
    CORS_ORIGIN: str = "http://localhost:5176"
    ML_DEVICE: str = "cpu"
    # Shared secret for admin-only endpoints (knowledge upload, memory read/write). Endpoints are disabled if unset.
    ML_ADMIN_KEY: Optional[str] = None
    # Hosts the prediction endpoints may download images from (comma-separated)
    ALLOWED_IMAGE_HOSTS: str = "res.cloudinary.com"

    # ---- Google Earth Engine (optional — only needed for NDVI features) ----
    GEE_INIT_MODE: Optional[str] = None
    GEE_SERVICE_ACCOUNT: Optional[str] = None
    GEE_PRIVATE_KEY_FILE: Optional[str] = None
    GEE_PRIVATE_KEY_JSON: Optional[str] = None

    # ---- Groq (optional — only needed if Groq LLM is enabled) ----
    GROQ_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # the shared .env also holds keys read via os.getenv (e.g. MONGO_URI)
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Returns the cached Settings singleton.
    Called once at startup; subsequent calls return the same instance.
    """
    return Settings()
