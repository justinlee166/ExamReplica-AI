from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends
from supabase import Client

from backend.config.supabase_client import get_admin_client, get_user_client
from backend.middleware.auth import AuthenticatedUser, get_current_user
from backend.models.analytics import (
    AnalyticsResponse,
    ConceptMasteryRead,
    PerformanceTrendRead,
    RecommendationRead,
)
from backend.services.analytics.service import build_analytics_service
from backend.services.analytics.snapshot import persist_analytics_snapshot
from backend.services.workspaces.workspace_service import WorkspaceService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["analytics"])


def _workspace_service(supabase: Client) -> WorkspaceService:
    return WorkspaceService(supabase)


def _to_response(result: object) -> AnalyticsResponse:
    """Map AnalyticsResult (internal) to AnalyticsResponse (API)."""
    from backend.services.analytics.models import AnalyticsResult

    assert isinstance(result, AnalyticsResult)
    return AnalyticsResponse(
        concept_mastery={
            k: ConceptMasteryRead(score=v.score, level=v.level)
            for k, v in result.concept_mastery.items()
        },
        error_distribution=result.error_distribution,
        performance_trend=[
            PerformanceTrendRead(session=e.session_index, score=e.score)
            for e in result.performance_trend
        ],
        recommendations=[
            RecommendationRead(concept=r.concept, reason=r.reason)
            for r in result.recommendations
        ],
    )


@router.get(
    "/workspaces/{workspace_id}/analytics",
    response_model=AnalyticsResponse,
)
async def get_analytics(
    workspace_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    supabase: Client = Depends(get_user_client),
    admin_supabase: Client = Depends(get_admin_client),
) -> AnalyticsResponse:
    """Aggregate grading results into concept mastery, error distribution, and trend.

    Returns an empty analytics object (not 404) when no graded submissions exist.
    Persists an analytics_snapshots row on every fetch (fire-and-forget).
    """
    _workspace_service(supabase).get(user_id=user.id, workspace_id=workspace_id)

    service = build_analytics_service(admin_supabase)
    result = service.compute_analytics(str(workspace_id), str(user.id))

    # Persist snapshot — non-fatal if it fails
    try:
        persist_analytics_snapshot(admin_supabase, str(workspace_id), str(user.id), result)
    except Exception:
        logger.exception("Failed to persist analytics snapshot for workspace %s", workspace_id)

    return _to_response(result)
