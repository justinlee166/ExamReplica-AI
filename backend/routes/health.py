from __future__ import annotations

import datetime as dt

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "timestamp": dt.datetime.now(dt.UTC).isoformat()}
