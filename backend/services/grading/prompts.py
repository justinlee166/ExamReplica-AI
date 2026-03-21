from __future__ import annotations

import json

from backend.services.grading.models import LLMGradingResult


def build_grading_prompt(
    *,
    question_text: str,
    student_answer: str,
    answer_key: str,
    question_type: str,
    points_possible: float,
) -> str:
    schema_json = json.dumps(
        LLMGradingResult.model_json_schema(), indent=2, sort_keys=True
    )
    return _GRADING_PROMPT_TEMPLATE.format(
        question_text=question_text,
        student_answer=student_answer,
        answer_key=answer_key,
        question_type=question_type,
        points_possible=points_possible,
        schema_json=schema_json,
    )


_GRADING_PROMPT_TEMPLATE = """You are a rigorous but fair STEM grader. Your job is to evaluate a \
student's answer against the official answer key / rubric and produce a structured grading result.

QUESTION ({question_type}, {points_possible} pts):
{question_text}

OFFICIAL ANSWER KEY / RUBRIC:
{answer_key}

STUDENT ANSWER:
{student_answer}

GRADING RULES:
1. Assign a correctness_label of EXACTLY one of: "correct", "partial", or "incorrect".
   - "correct": The answer is fully right — all steps, final result, and reasoning are sound.
   - "partial": The answer demonstrates some correct understanding but contains errors, is \
incomplete, or reaches a wrong final result despite valid intermediate work. You MUST use \
"partial" when the answer is neither fully correct nor entirely wrong. Binary correct/incorrect \
is NOT acceptable for answers that show partial understanding.
   - "incorrect": The answer is fundamentally wrong with no redeeming correct reasoning.
2. Assign score_value as a number between 0 and {points_possible}, proportional to the quality \
of the answer. Partial answers MUST receive a score strictly between 0 and {points_possible}.
3. Write a concise diagnostic_explanation (2-4 sentences) identifying what the student did right, \
what they did wrong, and why.
4. Assign a concept_label: a short tag (1-5 words) naming the concept being tested.
5. If the answer has errors, populate error_classifications with one or more entries. Each entry \
must have:
   - error_type: exactly one of "wrong_method", "formula_misuse", "computation_error", \
"interpretation_error", "incomplete_reasoning".
   - description: a one-sentence explanation of the specific mistake.
   If the answer is fully correct, error_classifications MUST be an empty list.

Return ONLY a valid JSON object matching this schema exactly. No markdown fences, no commentary.
{schema_json}
"""
