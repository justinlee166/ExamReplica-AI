from __future__ import annotations

import os
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

from backend.models.errors import ConfigError


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        extra="ignore",
    )

    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_key: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_jwt_audience: str | None = None

    cors_allow_origins: list[str] = ["http://localhost:3000"]

    storage_backend: Literal["local", "supabase"] = "local"
    local_storage_root: str = "./storage"
    supabase_storage_bucket: str = "documents"

    embedding_provider: Literal["local_hash", "openai"] = "local_hash"
    local_embedding_dimensions: int = 256
    openai_api_key: str | None = None
    openai_embedding_model: str = "text-embedding-3-small"

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-1.5-flash"
    gemini_api_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    gemini_timeout_seconds: float = 120.0

    chroma_persist_directory: str = "./storage/chromadb"
    chroma_collection_name: str = "document_chunks"

    def validate_required_secrets(self) -> None:
        missing: list[str] = []
        required_values = {
            "SUPABASE_URL": self.supabase_url,
            "SUPABASE_SERVICE_KEY": self.supabase_service_key,
            "SUPABASE_JWT_SECRET": self.supabase_jwt_secret,
            "GEMINI_API_KEY": self.gemini_api_key,
        }

        for name, value in required_values.items():
            if value is None or not value.strip():
                missing.append(name)

        if missing:
            raise ConfigError(
                f"Missing required environment variables: {', '.join(sorted(missing))}"
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
