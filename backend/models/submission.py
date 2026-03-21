from __future__ import annotations

import datetime as dt
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

SubmissionStatus = Literal["submitted", "grading", "graded", "failed"]
ErrorSeverity = Literal["minor", "moderate", "major"]


# --- Request models ---


class AnswerItem(BaseModel):
    generated_question_id: UUID
    student_answer: str


class SubmissionCreate(BaseModel):
    answers: list[AnswerItem] = Field(min_length=1)


# --- Response models ---


class SubmissionCreatedResponse(BaseModel):
    id: UUID
    status: SubmissionStatus
    created_at: dt.datetime


class ErrorClassificationRead(BaseModel):
    id: UUID
    error_type: str
    description: str | None = None
    severity: ErrorSeverity


class GradingResultRead(BaseModel):
    id: UUID
    generated_question_id: UUID
    score: float
    max_score: float
    is_correct: bool
    feedback: str | None = None
    error_classifications: list[ErrorClassificationRead] = Field(default_factory=list)


class SubmissionAnswerRead(BaseModel):
    id: UUID
    generated_question_id: UUID
    student_answer: str
    grading_result: GradingResultRead | None = None


class SubmissionRead(BaseModel):
    id: UUID
    workspace_id: UUID
    generated_exam_id: UUID
    status: SubmissionStatus
    total_score: float | None = None
    max_score: float | None = None
    created_at: dt.datetime
    answers: list[SubmissionAnswerRead] = Field(default_factory=list)
