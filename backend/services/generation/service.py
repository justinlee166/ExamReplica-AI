from __future__ import annotations

import json
import logging
import math
from typing import Any
from uuid import UUID

import httpx

from backend.config.settings import Settings
from backend.models.errors import ConfigError, ServiceUnavailableError, UpstreamServiceError
from backend.models.generation import ExamMode, GenerationConfig, ScopeConstraints
from backend.models.professor_profile import ProfessorProfileBase
from backend.models.retrieval import QuestionGenerationRetrievalRequest, RetrievedChunk
from backend.services.generation.models import FinalExamAssembly
from backend.services.generation.pipeline import (
    EmbeddingComputer,
    GeminiCaller,
    stage_1_draft,
    stage_2_validate,
    stage_3_novelty,
    stage_4_difficulty,
    stage_5_mcq_distribution,
    stage_6_assemble,
)
from backend.services.retrieval.retrieval_service import RetrievalService, build_retrieval_service

logger = logging.getLogger(__name__)


class GenerationService:
    def __init__(
        self,
        *,
        retrieval_service: RetrievalService,
        gemini_caller: GeminiCaller,
        embedding_computer: EmbeddingComputer,
        service_logger: logging.Logger | None = None,
    ) -> None:
        self._retrieval = retrieval_service
        self._gemini = gemini_caller
        self._embedding = embedding_computer
        self._logger = service_logger or logger

    def run_pipeline(
        self,
        *,
        generation_config: GenerationConfig,
        scope_constraints: ScopeConstraints,
        workspace_id: UUID,
        professor_profile: ProfessorProfileBase,
        exam_mode: ExamMode = "practice",
    ) -> FinalExamAssembly:
        self._logger.info("Starting generation pipeline for workspace %s", workspace_id)

        chunks = self._retrieve_chunks(
            workspace_id=workspace_id,
            scope_constraints=scope_constraints,
        )

        drafts, prompt = stage_1_draft(
            gemini=self._gemini,
            chunks=chunks,
            professor_profile=professor_profile,
            generation_config=generation_config,
            scope_constraints=scope_constraints,
        )
        self._logger.info("Stage 1 complete: %d draft questions generated", len(drafts))

        validated = stage_2_validate(
            gemini=self._gemini,
            drafts=drafts,
            original_prompt=prompt,
            generation_config=generation_config,
        )
        self._logger.info("Stage 2 complete: structure validated")

        novel = stage_3_novelty(
            gemini=self._gemini,
            embedding=self._embedding,
            drafts=validated,
            chunks=chunks,
        )
        self._logger.info("Stage 3 complete: novelty checked")

        calibrated = stage_4_difficulty(
            gemini=self._gemini,
            drafts=novel,
            requested_difficulty=generation_config.difficulty,
        )
        self._logger.info("Stage 4 complete: difficulty calibrated")

        balanced = stage_5_mcq_distribution(
            drafts=calibrated,
            format_type=generation_config.format_type,
        )
        self._logger.info("Stage 5 complete: MCQ distribution corrected")

        assembly = stage_6_assemble(
            drafts=balanced,
            exam_mode=exam_mode,
            format_type=generation_config.format_type,
            scope_constraints=scope_constraints,
            professor_profile=professor_profile,
        )
        self._logger.info("Stage 6 complete: final assembly with %d questions", len(assembly.questions))

        return assembly

    def _retrieve_chunks(
        self,
        *,
        workspace_id: UUID,
        scope_constraints: ScopeConstraints,
    ) -> list[RetrievedChunk]:
        topic = scope_constraints.topics[0] if scope_constraints.topics else "general exam content"
        request = QuestionGenerationRetrievalRequest(
            workspace_id=workspace_id,
            topic_label=topic,
            scope=_build_retrieval_scope(scope_constraints),
        )
        response = self._retrieval.retrieve_for_question_generation(request)
        return response.results


class GeminiGenerationCaller:
    def __init__(
        self,
        *,
        api_key: str | None,
        model_name: str,
        api_base_url: str,
        timeout_seconds: float,
        http_client: httpx.Client | None = None,
    ) -> None:
        if api_key is None or not api_key.strip():
            raise ConfigError("GEMINI_API_KEY is required for generation")

        self._api_key = api_key.strip()
        self._model_name = model_name.strip()
        self._api_base_url = api_base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds
        self._http_client = http_client

    def call_gemini(self, *, prompt: str) -> str:
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.4,
                "response_mime_type": "application/json",
            },
        }
        response_payload = self._post_generate_content(payload=payload)
        return self._extract_text(response_payload)

    def _post_generate_content(self, *, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"{self._api_base_url}/models/{self._model_name}:generateContent"
        params = {"key": self._api_key}

        try:
            if self._http_client is not None:
                response = self._http_client.post(
                    url, params=params, json=payload, timeout=self._timeout_seconds,
                )
            else:
                with httpx.Client(timeout=self._timeout_seconds) as client:
                    response = client.post(url, params=params, json=payload)
            response.raise_for_status()
            data = response.json()
        except httpx.TimeoutException as exc:
            raise ServiceUnavailableError("Gemini request timed out") from exc
        except httpx.RequestError as exc:
            raise ServiceUnavailableError("Gemini request failed") from exc
        except httpx.HTTPStatusError as exc:
            raise UpstreamServiceError("Gemini rejected the generation request") from exc
        except ValueError as exc:
            raise UpstreamServiceError("Gemini returned a non-JSON response") from exc

        if not isinstance(data, dict):
            raise UpstreamServiceError("Gemini returned an unexpected response payload")
        return data

    def _extract_text(self, payload: dict[str, Any]) -> str:
        candidates = payload.get("candidates")
        if not isinstance(candidates, list) or not candidates:
            raise UpstreamServiceError("Gemini returned no candidates")

        content = candidates[0].get("content", {})
        parts = content.get("parts", [])

        text_parts = [p["text"] for p in parts if isinstance(p, dict) and isinstance(p.get("text"), str)]
        if not text_parts:
            raise UpstreamServiceError("Gemini returned no text")

        return "".join(text_parts)


class LocalEmbeddingComputer:
    def compute_similarity(self, *, text_a: str, text_b: str) -> float:
        words_a = set(text_a.lower().split())
        words_b = set(text_b.lower().split())
        if not words_a or not words_b:
            return 0.0
        intersection = words_a & words_b
        return len(intersection) / math.sqrt(len(words_a) * len(words_b))


def _build_retrieval_scope(scope_constraints: ScopeConstraints) -> Any:
    from backend.models.retrieval import RetrievalScope

    return RetrievalScope(
        document_ids=scope_constraints.document_ids,
    )


def build_generation_service(
    *,
    settings: Settings,
) -> GenerationService:
    retrieval_service = build_retrieval_service(settings)
    gemini_caller = GeminiGenerationCaller(
        api_key=settings.gemini_api_key,
        model_name=settings.gemini_model,
        api_base_url=settings.gemini_api_base_url,
        timeout_seconds=settings.gemini_timeout_seconds,
    )
    embedding_computer = LocalEmbeddingComputer()

    return GenerationService(
        retrieval_service=retrieval_service,
        gemini_caller=gemini_caller,
        embedding_computer=embedding_computer,
    )
