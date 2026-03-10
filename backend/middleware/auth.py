from __future__ import annotations

import base64
from dataclasses import dataclass
from typing import Any
from uuid import UUID

import httpx
import jwt
from fastapi import Depends, Request

from backend.config.settings import Settings, get_settings
from backend.models.errors import UnauthorizedError


@dataclass(frozen=True)
class AuthenticatedUser:
    id: UUID
    email: str | None


def _get_bearer_token(request: Request) -> str:
    raw = request.headers.get("authorization")
    if not raw:
        raise UnauthorizedError("Missing Authorization header")
    parts = raw.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise UnauthorizedError("Invalid Authorization header")
    return parts[1].strip()


def _decode_supabase_secret_from_jwks(jwks: dict[str, Any]) -> str | None:
    keys = jwks.get("keys")
    if not isinstance(keys, list):
        return None
    for key in keys:
        if isinstance(key, dict) and key.get("kty") == "oct" and isinstance(key.get("k"), str):
            return base64.urlsafe_b64decode(key["k"] + "==").decode("utf-8")
    return None


async def _fetch_supabase_jwks(settings: Settings) -> dict[str, Any]:
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/certs"
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json()


async def _get_jwt_secret(settings: Settings) -> str:
    if settings.supabase_jwt_secret:
        return settings.supabase_jwt_secret
    try:
        jwks = await _fetch_supabase_jwks(settings)
    except Exception as exc:
        raise UnauthorizedError("Unable to validate token (JWKS fetch failed)") from exc

    secret = _decode_supabase_secret_from_jwks(jwks)
    if not secret:
        raise UnauthorizedError("Unable to validate token (no shared secret found)")
    return secret


async def get_current_user(
    request: Request, settings: Settings = Depends(get_settings)
) -> AuthenticatedUser:
    token = _get_bearer_token(request)
    secret = await _get_jwt_secret(settings)

    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
    except jwt.PyJWTError as exc:
        raise UnauthorizedError("Invalid or expired token") from exc

    sub = payload.get("sub")
    if not isinstance(sub, str):
        raise UnauthorizedError("Invalid token subject")
    try:
        user_id = UUID(sub)
    except ValueError as exc:
        raise UnauthorizedError("Invalid token subject") from exc

    email = payload.get("email")
    return AuthenticatedUser(id=user_id, email=email if isinstance(email, str) else None)
