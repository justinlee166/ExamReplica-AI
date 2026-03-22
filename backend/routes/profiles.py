from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from supabase import Client

from backend.config.settings import Settings, get_settings
from backend.config.supabase_client import get_user_client
from backend.middleware.auth import AuthenticatedUser, get_current_user
from backend.middleware.rate_limit import check_rate_limit
from backend.models.professor_profile import ProfessorProfileResponse
from backend.services.professor_profile.profile_service import (
    ProfessorProfileService,
    build_professor_profile_service,
)

router = APIRouter(prefix="/workspaces/{workspace_id}/profile", tags=["professor-profile"])


def _service(settings: Settings, supabase: Client) -> ProfessorProfileService:
    return build_professor_profile_service(settings=settings, supabase=supabase)


@router.post("/generate", response_model=ProfessorProfileResponse)
async def generate_professor_profile(
    workspace_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    supabase: Client = Depends(get_user_client),
) -> ProfessorProfileResponse:
    check_rate_limit(user_id=user.id, endpoint="profile_generate", max_calls=3)
    return _service(settings, supabase).generate(user_id=user.id, workspace_id=workspace_id)


@router.get("", response_model=ProfessorProfileResponse)
async def get_professor_profile(
    workspace_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    supabase: Client = Depends(get_user_client),
) -> ProfessorProfileResponse:
    return ProfessorProfileService(supabase).get_latest(user_id=user.id, workspace_id=workspace_id)
