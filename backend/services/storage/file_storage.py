from __future__ import annotations

import os
import pathlib
import re
from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

from supabase import Client

from backend.models.errors import BadRequestError

_FILENAME_SAFE = re.compile(r"[^a-zA-Z0-9._-]+")


def _sanitize_filename(name: str) -> str:
    name = name.strip()
    if not name:
        raise BadRequestError("Filename is required")
    sanitized = _FILENAME_SAFE.sub("_", name)
    return sanitized[:200]


class FileStorage(Protocol):
    def save_bytes(
        self,
        *,
        workspace_id: UUID,
        document_id: UUID,
        filename: str,
        content: bytes,
        content_type: str | None,
    ) -> str: ...

    def delete(self, *, file_path: str) -> None: ...


@dataclass(frozen=True)
class LocalFileStorage:
    root: str

    def save_bytes(
        self,
        *,
        workspace_id: UUID,
        document_id: UUID,
        filename: str,
        content: bytes,
        content_type: str | None,
    ) -> str:
        safe = _sanitize_filename(filename)
        rel = pathlib.Path("workspaces") / str(workspace_id) / "documents" / str(document_id) / safe
        full = pathlib.Path(self.root) / rel
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_bytes(content)
        return str(rel)

    def delete(self, *, file_path: str) -> None:
        import logging

        full = pathlib.Path(self.root) / file_path
        try:
            full.unlink(missing_ok=True)
        except Exception as exc:
            # Non-fatal: log and continue — a missing or locked file should not crash the app.
            logging.getLogger(__name__).warning(
                "LocalFileStorage.delete: failed to remove %s: %s", full, exc
            )


@dataclass(frozen=True)
class SupabaseStorage:
    client: Client
    bucket: str

    def save_bytes(
        self,
        *,
        workspace_id: UUID,
        document_id: UUID,
        filename: str,
        content: bytes,
        content_type: str | None,
    ) -> str:
        safe = _sanitize_filename(filename)
        path = f"{workspace_id}/{document_id}/{safe}"
        options = {"content-type": content_type or "application/octet-stream", "upsert": True}
        self.client.storage.from_(self.bucket).upload(path, content, file_options=options)
        return path

    def delete(self, *, file_path: str) -> None:
        self.client.storage.from_(self.bucket).remove([file_path])


def build_file_storage(*, backend: str, local_root: str, bucket: str, supabase: Client) -> FileStorage:
    if backend == "local":
        os.makedirs(local_root, exist_ok=True)
        return LocalFileStorage(root=local_root)
    if backend == "supabase":
        return SupabaseStorage(client=supabase, bucket=bucket)
    raise BadRequestError("Invalid STORAGE_BACKEND")
