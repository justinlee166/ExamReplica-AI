from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile
from supabase import Client

from backend.config.settings import Settings, get_settings
from backend.config.supabase_client import get_user_client
from backend.middleware.auth import AuthenticatedUser, get_current_user
from backend.models.document import DocumentResponse, SourceType
from backend.services.documents.document_service import DocumentService
from backend.services.storage.file_storage import FileStorage, build_file_storage

router = APIRouter(prefix="/workspaces/{workspace_id}/documents", tags=["documents"])


def _storage(settings: Settings, supabase: Client) -> FileStorage:
    return build_file_storage(
        backend=settings.storage_backend,
        local_root=settings.local_storage_root,
        bucket=settings.supabase_storage_bucket,
        supabase=supabase,
    )


def _service(supabase: Client) -> DocumentService:
    return DocumentService(supabase)


@router.post("", status_code=201, response_model=DocumentResponse)
async def upload_document(
    workspace_id: UUID,
    file: UploadFile = File(...),
    source_type: SourceType = Form(...),
    upload_label: str | None = Form(default=None),
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    supabase: Client = Depends(get_user_client),
) -> DocumentResponse:
    storage = _storage(settings, supabase)
    return await _service(supabase).create(
        user_id=user.id,
        workspace_id=workspace_id,
        source_type=source_type,
        upload_label=upload_label,
        upload=file,
        storage=storage,
    )


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    workspace_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    supabase: Client = Depends(get_user_client),
) -> list[DocumentResponse]:
    return _service(supabase).list(user_id=user.id, workspace_id=workspace_id)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    workspace_id: UUID,
    document_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    supabase: Client = Depends(get_user_client),
) -> DocumentResponse:
    return _service(supabase).get(
        user_id=user.id, workspace_id=workspace_id, document_id=document_id
    )


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    workspace_id: UUID,
    document_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    supabase: Client = Depends(get_user_client),
) -> None:
    storage = _storage(settings, supabase)
    _service(supabase).delete(
        user_id=user.id, workspace_id=workspace_id, document_id=document_id, storage=storage
    )
