# Database Schema

## Storage Split

| Store | Technology | What Goes There |
|---|---|---|
| **Relational** | Supabase / PostgreSQL | All structured application data (tables below) |
| **Vector** | ChromaDB (dev) / pgvector / Pinecone | Chunk embedding vectors |
| **File** | Supabase Storage / local filesystem (dev) | Uploaded documents, generated PDF artifacts |

---

## User and Workspace Entities

### `users`

Primary user accounts.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `email` | VARCHAR | Unique |
| `display_name` | VARCHAR | Optional |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### `workspaces`

Logical study contexts (one per course/exam prep environment).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users) | |
| `title` | VARCHAR | |
| `course_code` | VARCHAR | Optional |
| `description` | TEXT | Optional |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

## Document and Parsing Entities

### `documents`

Uploaded source materials.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `workspace_id` | UUID (FK → workspaces) | |
| `source_type` | VARCHAR | lecture_slides, homework, prior_exam, practice_test, notes |
| `file_name` | VARCHAR | Original filename |
| `upload_label` | VARCHAR | User-provided label (e.g., "Midterm 1") |
| `file_path` | VARCHAR | Object storage reference |
| `processing_status` | VARCHAR | uploaded, parsing, indexed, ready, failed |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### `document_processing_jobs`

Tracks parser invocation and status.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `document_id` | UUID (FK → documents) | |
| `parser_used` | VARCHAR | docling, marker |
| `status` | VARCHAR | queued, running, completed, failed |
| `confidence_score` | FLOAT | Optional parsing confidence |
| `error_message` | TEXT | Nullable |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### `parsed_documents`

Normalized structured representations.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `document_id` | UUID (FK → documents) | |
| `normalized_content` | TEXT | Structured Markdown |
| `structural_metadata` | JSONB | Section and layout metadata |
| `created_at` | TIMESTAMP | |

---

## Retrieval and Chunk Entities

### `chunks`

Semantic instructional units extracted from parsed documents.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `parsed_document_id` | UUID (FK → parsed_documents) | |
| `chunk_text` | TEXT | |
| `chunk_type` | VARCHAR | example, definition, problem, solution, theorem |
| `topic_label` | VARCHAR | Optional inferred topic |
| `position_index` | INTEGER | Position within document |
| `metadata` | JSONB | Serialized retrieval metadata |
| `created_at` | TIMESTAMP | |

### `chunk_embeddings`

References to vectorized representations.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `chunk_id` | UUID (FK → chunks) | |
| `vector_store_id` | VARCHAR | External vector store reference |
| `embedding_model` | VARCHAR | Model identifier |
| `created_at` | TIMESTAMP | |

> **Note:** The actual embedding vectors live in ChroamaDB / pgvector, not in rows here. This table provides the relational link.

---

## Professor Profile Entities

### `professor_profiles`

One active profile per workspace.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `workspace_id` | UUID (FK → workspaces) | |
| `active_version_id` | UUID (FK → professor_profile_versions) | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### `professor_profile_versions`

Versioned snapshots of inferred tendencies. New version created when materials change.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `professor_profile_id` | UUID (FK → professor_profiles) | |
| `topic_distribution` | JSONB | Soft topic weighting |
| `question_type_distribution` | JSONB | Question-type tendencies |
| `difficulty_profile` | JSONB | Difficulty tendencies |
| `exam_structure_profile` | JSONB | Inferred exam structure |
| `evidence_summary` | JSONB | Summary of evidence sources |
| `created_at` | TIMESTAMP | |

---

## Generation and Exam Entities

### `generation_requests`

User-issued generation requests.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `workspace_id` | UUID (FK → workspaces) | |
| `request_type` | VARCHAR | practice_set, simulated_exam, targeted_regeneration |
| `scope_constraints` | JSONB | Scope filter settings |
| `generation_config` | JSONB | Format, difficulty, question count, etc. |
| `status` | VARCHAR | queued, running, completed, failed |
| `created_at` | TIMESTAMP | |

### `generated_exams`

Generated practice sets and simulated exams.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `generation_request_id` | UUID (FK → generation_requests) | |
| `workspace_id` | UUID (FK → workspaces) | |
| `title` | VARCHAR | |
| `exam_mode` | VARCHAR | practice, exam, targeted_practice |
| `format_type` | VARCHAR | mcq, frq, mixed |
| `rendered_artifact_path` | VARCHAR | Optional PDF path |
| `created_at` | TIMESTAMP | |

### `generated_questions`

Individual questions within a generated exam.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `generated_exam_id` | UUID (FK → generated_exams) | |
| `question_order` | INTEGER | |
| `question_text` | TEXT | |
| `question_type` | VARCHAR | mcq, frq, calculation, proof |
| `difficulty_label` | VARCHAR | |
| `topic_label` | VARCHAR | |
| `answer_key` | TEXT | Expected answer or rubric |
| `explanation` | TEXT | Optional |
| `created_at` | TIMESTAMP | |

---

## Submission and Grading Entities

### `submissions`

A user's submitted answers for a generated exam.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `generated_exam_id` | UUID (FK → generated_exams) | |
| `user_id` | UUID (FK → users) | |
| `submitted_at` | TIMESTAMP | |
| `raw_response_payload` | JSONB | Full answer payload |
| `status` | VARCHAR | submitted, grading, graded |

### `submission_answers`

Per-question submitted responses.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `submission_id` | UUID (FK → submissions) | |
| `generated_question_id` | UUID (FK → generated_questions) | |
| `answer_content` | TEXT | |
| `created_at` | TIMESTAMP | |

### `grading_results`

Structured evaluation for each answer.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `submission_answer_id` | UUID (FK → submission_answers) | |
| `correctness_label` | VARCHAR | correct, partial, incorrect |
| `score_value` | FLOAT | Numeric or fractional |
| `diagnostic_explanation` | TEXT | |
| `concept_label` | VARCHAR | Mapped concept |
| `created_at` | TIMESTAMP | |

### `error_classifications`

Normalized error-type labels.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `grading_result_id` | UUID (FK → grading_results) | |
| `error_type` | VARCHAR | wrong_method, formula_misuse, computation_error, interpretation_error, incomplete_reasoning |
| `severity` | VARCHAR | Optional |
| `created_at` | TIMESTAMP | |

---

## Analytics and Regeneration Entities

### `analytics_snapshots`

Periodic mastery and error-state summaries.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `workspace_id` | UUID (FK → workspaces) | |
| `user_id` | UUID (FK → users) | |
| `concept_mastery_state` | JSONB | Serialized mastery summary |
| `error_distribution` | JSONB | Error aggregation summary |
| `performance_trend_summary` | JSONB | Trend metrics |
| `created_at` | TIMESTAMP | |

### `regeneration_requests`

Targeted follow-up generation triggered by analytics.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `workspace_id` | UUID (FK → workspaces) | |
| `user_id` | UUID (FK → users) | |
| `source_analytics_snapshot_id` | UUID (FK → analytics_snapshots) | |
| `target_concepts` | JSONB | Concept targets |
| `request_status` | VARCHAR | queued, running, completed, failed |
| `created_at` | TIMESTAMP | |

---

## Design Principles

- **Separation of source and derived data:** Uploaded documents, parsed outputs, generated artifacts, and analytics are stored in separate tables.
- **Versioning:** Professor Profiles support versioned snapshots as evidence changes.
- **Traceability:** All generated content, grading results, and analytics state are linked back to their source workspace, materials, and submissions.
- **Extensibility:** JSONB fields for serialized data allow schema evolution without migrations for internal structures.
