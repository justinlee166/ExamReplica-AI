from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str | None = None
    supabase_service_key: str | None = None
    supabase_jwt_secret: str | None = None

    cors_allow_origins: list[str] = ["http://localhost:3000"]

    storage_backend: Literal["local", "supabase"] = "local"
    local_storage_root: str = "./storage"
    supabase_storage_bucket: str = "documents"


@lru_cache
def get_settings() -> Settings:
    return Settings()
