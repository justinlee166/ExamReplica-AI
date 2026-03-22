from __future__ import annotations

import datetime as dt
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class RegenerationRequestCreate(BaseModel):
    target_concepts: list[str] = Field(min_length=1, max_length=10)
    question_count: int = Field(ge=3, le=20, default=5)
    format_type: Literal["mcq", "frq", "mixed"] = "mixed"


class RegenerationRequestResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    status: str
    target_concepts: list[str]
    generated_exam_id: UUID | None = None
    created_at: dt.datetime
