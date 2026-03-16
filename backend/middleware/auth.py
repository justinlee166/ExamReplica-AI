from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Any
from uuid import UUID

import httpx
import jwt
from fastapi import Depends, HTTPException, Request, status

from backend.config.settings import Settings, get_settings
from backend.models.errors import ConfigError, UnauthorizedError

logger = logging.getLogger(__name__)

_JWKS_CACHE_TTL_SECONDS = 600.0
_UPSTREAM_AUTH_ERROR_DETAIL = "Authentication service unavailable"
_VALID_JWT_ALGORITHMS = {"ES256", "RS256"}


@dataclass(frozen=True)
class _CachedJwks:
    keys_by_kid: dict[str, dict[str, Any]]
    expires_at: float


_jwks_cache: dict[str, _CachedJwks] = {}
_jwks_locks: dict[str, asyncio.Lock] = {}


@dataclass(frozen=True)
class AuthenticatedUser:
    id: UUID
    email: str | None


def get_bearer_token(request: Request) -> str:
    raw = request.headers.get("authorization")
    if not raw:
        raise UnauthorizedError("Missing Authorization header")
    parts = raw.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise UnauthorizedError("Invalid Authorization header")
    return parts[1].strip()


def _auth_issuer(settings: Settings) -> str:
    if not settings.supabase_url:
        raise ConfigError("SUPABASE_URL is required")
    return f"{settings.supabase_url.rstrip('/')}/auth/v1"


def _jwks_url(settings: Settings) -> str:
    return f"{_auth_issuer(settings)}/certs"


def _get_jwks_lock(jwks_url: str) -> asyncio.Lock:
    lock = _jwks_locks.get(jwks_url)
    if lock is None:
        lock = asyncio.Lock()
        _jwks_locks[jwks_url] = lock
    return lock


def _parse_cache_ttl(headers: httpx.Headers) -> float:
    cache_control = headers.get("cache-control", "")
    for directive in cache_control.split(","):
        directive = directive.strip()
        if directive.startswith("max-age="):
            try:
                return max(float(directive.split("=", 1)[1]), 0.0)
            except ValueError:
                break
    return _JWKS_CACHE_TTL_SECONDS


def _normalize_jwks(payload: Any) -> dict[str, dict[str, Any]]:
    if not isinstance(payload, dict):
        raise ValueError("JWKS payload is not an object")

    keys = payload.get("keys")
    if not isinstance(keys, list):
        raise ValueError("JWKS payload is missing keys")

    normalized: dict[str, dict[str, Any]] = {}
    for key in keys:
        if not isinstance(key, dict):
            continue
        kid = key.get("kid")
        if isinstance(kid, str) and kid:
            normalized[kid] = key

    if not normalized:
        raise ValueError("JWKS payload does not contain any signing keys")

    return normalized


async def _fetch_jwks(settings: Settings) -> _CachedJwks:
    jwks_url = _jwks_url(settings)
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=2.0)) as client:
            response = await client.get(
                jwks_url,
                headers={"Accept": "application/json"},
            )
        response.raise_for_status()
        keys_by_kid = _normalize_jwks(response.json())
    except httpx.TimeoutException as exc:
        logger.warning("Timed out fetching Supabase JWKS from %s", jwks_url, exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_UPSTREAM_AUTH_ERROR_DETAIL,
        ) from exc
    except httpx.RequestError as exc:
        logger.warning("Failed to fetch Supabase JWKS from %s", jwks_url, exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_UPSTREAM_AUTH_ERROR_DETAIL,
        ) from exc
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "Supabase JWKS endpoint returned %s for %s",
            exc.response.status_code,
            jwks_url,
            exc_info=exc,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=_UPSTREAM_AUTH_ERROR_DETAIL,
        ) from exc
    except ValueError as exc:
        logger.error("Supabase JWKS payload was invalid for %s", jwks_url, exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=_UPSTREAM_AUTH_ERROR_DETAIL,
        ) from exc

    ttl_seconds = _parse_cache_ttl(response.headers)
    return _CachedJwks(
        keys_by_kid=keys_by_kid,
        expires_at=time.monotonic() + ttl_seconds,
    )


async def _get_signing_jwk(settings: Settings, kid: str) -> dict[str, Any]:
    jwks_url = _jwks_url(settings)
    cached = _jwks_cache.get(jwks_url)
    now = time.monotonic()
    if cached and cached.expires_at > now and kid in cached.keys_by_kid:
        return cached.keys_by_kid[kid]

    async with _get_jwks_lock(jwks_url):
        cached = _jwks_cache.get(jwks_url)
        now = time.monotonic()
        if cached and cached.expires_at > now and kid in cached.keys_by_kid:
            return cached.keys_by_kid[kid]

        stale_jwk = cached.keys_by_kid.get(kid) if cached else None
        try:
            refreshed = await _fetch_jwks(settings)
        except HTTPException:
            if stale_jwk is not None:
                logger.warning("Using stale JWKS for kid=%s after refresh failure", kid)
                return stale_jwk
            raise

        _jwks_cache[jwks_url] = refreshed
        jwk = refreshed.keys_by_kid.get(kid)
        if jwk is None:
            raise UnauthorizedError("Invalid or expired token")
        return jwk


async def get_current_user(
    token: str = Depends(get_bearer_token),
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUser:
    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError as exc:
        logger.info("JWT header parsing failed: %s", exc.__class__.__name__)
        raise UnauthorizedError("Invalid or expired token") from exc

    alg = header.get("alg")
    kid = header.get("kid")
    if not isinstance(alg, str) or alg not in _VALID_JWT_ALGORITHMS:
        raise UnauthorizedError("Invalid or expired token")
    if not isinstance(kid, str) or not kid:
        raise UnauthorizedError("Invalid or expired token")

    jwk = await _get_signing_jwk(settings, kid)

    try:
        signing_key = jwt.PyJWK.from_dict(jwk, algorithm=alg).key
        payload = jwt.decode(
            token,
            key=signing_key,
            algorithms=[alg],
            issuer=_auth_issuer(settings),
            audience=settings.supabase_jwt_audience,
            options={
                "require": ["exp", "sub", "iss"],
                "verify_aud": bool(settings.supabase_jwt_audience),
            },
        )
    except HTTPException:
        raise
    except jwt.PyJWTError as exc:
        logger.info("JWT verification failed: %s", exc.__class__.__name__)
        raise UnauthorizedError("Invalid or expired token") from exc

    subject = payload.get("sub")
    if not isinstance(subject, str):
        raise UnauthorizedError("Invalid token subject")

    try:
        user_id = UUID(subject)
    except ValueError as exc:
        raise UnauthorizedError("Invalid token subject") from exc

    email = payload.get("email")
    return AuthenticatedUser(id=user_id, email=email if isinstance(email, str) else None)
