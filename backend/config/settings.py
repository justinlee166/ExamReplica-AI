from __future__ import annotations

import os
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


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

    chroma_persist_directory: str = "./storage/chromadb"
    chroma_collection_name: str = "document_chunks"


@lru_cache
def get_settings() -> Settings:
    return Settings()
