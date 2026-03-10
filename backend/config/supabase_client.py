from __future__ import annotations

from functools import lru_cache

from fastapi import Depends
from supabase import Client, create_client

from backend.config.settings import Settings, get_settings
from backend.models.errors import ConfigError


@lru_cache
def _create_client(url: str, key: str) -> Client:
    return create_client(url, key)


def get_supabase_client(settings: Settings = Depends(get_settings)) -> Client:
    if not settings.supabase_url or not settings.supabase_service_key:
        raise ConfigError("SUPABASE_URL and SUPABASE_SERVICE_KEY are required")
    return _create_client(settings.supabase_url, settings.supabase_service_key)
