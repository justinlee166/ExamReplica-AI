from __future__ import annotations

import logging
from uuid import UUID

from supabase import Client

from backend.models.errors import NotFoundError
from backend.services.grading.models import (
    GradedAnswer,
    GradingPipelineResult,
    LLMErrorClassification,
)

logger = logging.getLogger(__name__)


class GradingService:
    """Grades a submission by evaluating each answer against the answer key.

    Returns structured results — does NOT write to the database.
    The calling layer (route background job) is responsible for persisting results.
    """

    def __init__(self, supabase: Client) -> None:
        self._supabase = supabase

    def grade_submission(self, submission_id: UUID) -> GradingPipelineResult:
        answers_resp = (
            self._supabase.table("submission_answers")
            .select("*")
            .eq("submission_id", str(submission_id))
            .execute()
        )
        answers = answers_resp.data or []
        if not answers:
            raise NotFoundError(f"No answers found for submission {submission_id}")

        question_ids = [a["generated_question_id"] for a in answers]
        questions_resp = (
            self._supabase.table("generated_questions")
            .select("id, answer_key, question_type")
            .in_("id", question_ids)
            .execute()
        )
        answer_keys: dict[str, dict[str, str]] = {
            q["id"]: q for q in (questions_resp.data or [])
        }

        graded: list[GradedAnswer] = []
        total_score = 0.0
        max_score = 0.0

        for answer in answers:
            q_id = answer["generated_question_id"]
            question = answer_keys.get(q_id, {})
            expected = (question.get("answer_key") or "").strip().lower()
            actual = (answer.get("answer_content") or "").strip().lower()
            question_type = question.get("question_type", "frq")
            points_possible = 1.0

            if actual == expected:
                correctness_label = "correct"
                score = points_possible
                errors: list[LLMErrorClassification] = []
                feedback = "Correct!"
            else:
                correctness_label = "incorrect"
                score = 0.0
                errors = [
                    LLMErrorClassification(
                        error_type="wrong_method",
                        description=(
                            f"Student answered '{answer.get('answer_content', '')}' "
                            f"but expected '{question.get('answer_key', '')}'"
                        ),
                    )
                ]
                feedback = f"Expected: {question.get('answer_key', '')}"

            graded.append(
                GradedAnswer(
                    submission_answer_id=UUID(answer["id"]),
                    question_id=UUID(q_id),
                    correctness_label=correctness_label,
                    points_awarded=score,
                    points_possible=points_possible,
                    feedback=feedback,
                    concept_label=question_type,
                    error_classifications=errors,
                )
            )
            total_score += score
            max_score += points_possible

        return GradingPipelineResult(
            submission_id=submission_id,
            graded_answers=graded,
            total_score=total_score,
            max_score=max_score,
        )
