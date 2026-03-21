from __future__ import annotations

import logging
from uuid import UUID, uuid4

from supabase import Client

logger = logging.getLogger(__name__)


class GradingService:
    """Grades a submission by evaluating each answer against the answer key.

    This is a placeholder that performs simple exact-match grading.
    A future iteration will call an LLM for nuanced evaluation.
    """

    def __init__(self, supabase: Client) -> None:
        self._supabase = supabase

    def grade_submission(self, submission_id: UUID) -> None:
        answers_resp = (
            self._supabase.table("submission_answers")
            .select("*")
            .eq("submission_id", str(submission_id))
            .execute()
        )
        answers = answers_resp.data or []

        question_ids = [a["generated_question_id"] for a in answers]
        questions_resp = (
            self._supabase.table("generated_questions")
            .select("id, answer_key")
            .in_("id", question_ids)
            .execute()
        )
        answer_keys = {q["id"]: q.get("answer_key", "") for q in (questions_resp.data or [])}

        total_score = 0.0
        max_score = 0.0

        for answer in answers:
            q_id = answer["generated_question_id"]
            expected = (answer_keys.get(q_id) or "").strip().lower()
            actual = (answer.get("student_answer") or "").strip().lower()
            is_correct = actual == expected
            score = 1.0 if is_correct else 0.0
            max_score += 1.0
            total_score += score

            gr_id = uuid4()
            grading_payload = {
                "id": str(gr_id),
                "submission_id": str(submission_id),
                "submission_answer_id": answer["id"],
                "generated_question_id": q_id,
                "score": score,
                "max_score": 1.0,
                "is_correct": is_correct,
                "feedback": "Correct!" if is_correct else f"Expected: {answer_keys.get(q_id, '')}",
            }
            self._supabase.table("grading_results").insert(grading_payload).execute()

            if not is_correct:
                self._supabase.table("error_classifications").insert({
                    "grading_result_id": str(gr_id),
                    "error_type": "incorrect_answer",
                    "description": f"Student answered '{answer.get('student_answer', '')}' but expected '{answer_keys.get(q_id, '')}'",
                    "severity": "moderate",
                }).execute()

        self._supabase.table("submissions").update({
            "total_score": total_score,
            "max_score": max_score,
        }).eq("id", str(submission_id)).execute()
