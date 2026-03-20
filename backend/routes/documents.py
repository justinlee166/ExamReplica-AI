from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile
from supabase import Client

from backend.config.settings import Settings, get_settings
from backend.config.supabase_client import get_admin_client, get_user_client
from backend.middleware.auth import AuthenticatedUser, get_current_user
from backend.models.document import DocumentResponse, SourceType
from backend.services.document_processing.embedding_service import build_embedding_service
from backend.services.document_processing.parser_service import DocumentProcessingService
from backend.services.documents.document_service import DocumentService
from backend.services.retrieval.vector_store import ChromaVectorStore
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


def _vector_store(settings: Settings) -> ChromaVectorStore:
    return ChromaVectorStore(
        persist_directory=settings.chroma_persist_directory,
        collection_name=settings.chroma_collection_name,
    )


def _processing_service(settings: Settings, supabase: Client) -> DocumentProcessingService:
    return DocumentProcessingService(
        supabase,
        _storage(settings, supabase),
        embedding_service=build_embedding_service(settings),
        vector_store=_vector_store(settings),
    )


@router.post("", status_code=201, response_model=DocumentResponse)
async def upload_document(
    workspace_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    source_type: SourceType = Form(...),
    upload_label: str | None = Form(default=None),
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    supabase: Client = Depends(get_user_client),
    admin_supabase: Client = Depends(get_admin_client),
) -> DocumentResponse:
    storage = _storage(settings, supabase)
    document = await _service(supabase).create(
        user_id=user.id,
        workspace_id=workspace_id,
        source_type=source_type,
        upload_label=upload_label,
        upload=file,
        storage=storage,
    )
    processing_service = _processing_service(settings, admin_supabase)
    job_id = processing_service.enqueue_document(document_id=document.id)
    background_tasks.add_task(processing_service.process_job, job_id=job_id)
    return document


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
    DocumentService(supabase, vector_store=_vector_store(settings)).delete(
        user_id=user.id, workspace_id=workspace_id, document_id=document_id, storage=storage
    )
