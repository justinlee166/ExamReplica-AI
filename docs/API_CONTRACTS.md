# API Contracts

All endpoints require authentication via Supabase Auth JWT unless noted otherwise.

Base path: `/api`

---

## Health

### `GET /api/health`

**Purpose:** Health check (no auth required)

**Response:**
```json
{ "status": "ok", "timestamp": "..." }
```

---

## Workspaces

### `POST /api/workspaces`

**Purpose:** Create a new workspace

**Request:**
```json
{
  "title": "AMS 310 Midterm Prep",
  "course_code": "AMS 310",
  "description": "Midterm 1 preparation workspace"
}
```

**Response:** `201` — created workspace object with `id`

### `GET /api/workspaces`

**Purpose:** List all workspaces for the authenticated user

**Response:** `200` — array of workspace summaries

### `GET /api/workspaces/{workspace_id}`

**Purpose:** Get workspace details

**Response:** `200` — workspace object with document count and profile status

### `PUT /api/workspaces/{workspace_id}`

**Purpose:** Update workspace metadata

### `DELETE /api/workspaces/{workspace_id}`

**Purpose:** Delete workspace and all associated data

---

## Documents

### `POST /api/workspaces/{workspace_id}/documents`

**Purpose:** Upload a document to a workspace

**Request:** Multipart form data
```
file: <binary>
source_type: "prior_exam" | "homework" | "lecture_slides" | "practice_test" | "notes"
upload_label: "Midterm 1"  (optional)
```

**Response:** `201` — document record with `processing_status: "uploaded"`

### `GET /api/workspaces/{workspace_id}/documents`

**Purpose:** List all documents in a workspace with processing status

**Response:** `200` — array of document objects

### `GET /api/workspaces/{workspace_id}/documents/{document_id}`

**Purpose:** Get document details and processing status

**Response:** `200` — document object with processing job info

### `DELETE /api/workspaces/{workspace_id}/documents/{document_id}`

**Purpose:** Delete a document and its derived data (chunks, embeddings)

---

## Professor Profile

### `GET /api/workspaces/{workspace_id}/profile`

**Purpose:** Get the current Professor Profile for a workspace

**Response:** `200`
```json
{
  "id": "...",
  "workspace_id": "...",
  "version": 3,
  "topic_distribution": { "hypothesis_testing": 0.3, "confidence_intervals": 0.25, ... },
  "question_type_distribution": { "mcq": 0.4, "frq": 0.35, "calculation": 0.25 },
  "difficulty_profile": { "estimated_level": "moderate-hard", ... },
  "exam_structure_profile": { "typical_question_count": 8, ... },
  "evidence_summary": { "total_documents": 12, "exams_used": 3, ... },
  "created_at": "..."
}
```

### `POST /api/workspaces/{workspace_id}/profile/rebuild`

**Purpose:** Trigger a profile rebuild (e.g., after new materials are uploaded)

**Response:** `202` — accepted, rebuild in progress

---

## Generation

### `POST /api/workspaces/{workspace_id}/generation-requests`

**Purpose:** Request practice set or simulated exam generation

**Request:**
```json
{
  "request_type": "practice_set" | "simulated_exam" | "targeted_regeneration",
  "generation_config": {
    "question_count": 10,
    "format_type": "mixed",
    "difficulty": "medium",
    "question_types": ["mcq", "frq"]
  },
  "scope_constraints": {
    "topics": ["hypothesis_testing", "confidence_intervals"],
    "document_ids": ["...", "..."],
    "custom_prompt": "Focus on two-sample tests"
  }
}
```

**Response:** `202` — generation request accepted with `id` and `status: "queued"`

### `GET /api/workspaces/{workspace_id}/generation-requests/{request_id}`

**Purpose:** Check generation request status

**Response:** `200` — request object with `status`

### `GET /api/workspaces/{workspace_id}/exams`

**Purpose:** List all generated exams in a workspace

**Response:** `200` — array of generated exam summaries

### `GET /api/workspaces/{workspace_id}/exams/{exam_id}`

**Purpose:** Get full generated exam with questions

**Response:** `200`
```json
{
  "id": "...",
  "title": "Practice Set — Hypothesis Testing",
  "exam_mode": "practice",
  "format_type": "mixed",
  "questions": [
    {
      "id": "...",
      "question_order": 1,
      "question_text": "...",
      "question_type": "mcq",
      "difficulty_label": "medium",
      "topic_label": "hypothesis_testing",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."]
    }
  ],
  "created_at": "..."
}
```

### `GET /api/workspaces/{workspace_id}/exams/{exam_id}/export`

**Purpose:** Download generated exam as PDF

**Response:** `200` — PDF file

---

## Submissions

### `POST /api/workspaces/{workspace_id}/exams/{exam_id}/submissions`

**Purpose:** Submit answers for a generated exam

**Request:**
```json
{
  "answers": [
    { "question_id": "...", "answer_content": "B" },
    { "question_id": "...", "answer_content": "The null hypothesis is rejected because p < 0.05..." }
  ]
}
```

**Response:** `201` — submission record with `status: "submitted"`

### `GET /api/workspaces/{workspace_id}/submissions/{submission_id}`

**Purpose:** Get submission status and grading results

**Response:** `200`
```json
{
  "id": "...",
  "status": "graded",
  "submitted_at": "...",
  "results": [
    {
      "question_id": "...",
      "correctness_label": "partial",
      "score_value": 0.5,
      "diagnostic_explanation": "Correct test selection but incorrect p-value interpretation.",
      "concept_label": "hypothesis_testing",
      "error_classifications": [
        { "error_type": "interpretation_error", "severity": "moderate" }
      ]
    }
  ],
  "overall_score": 7.5,
  "total_possible": 10
}
```

---

## Analytics

### `GET /api/workspaces/{workspace_id}/analytics`

**Purpose:** Get current analytics summary for a workspace

**Response:** `200`
```json
{
  "concept_mastery": {
    "hypothesis_testing": { "score": 0.45, "level": "developing" },
    "confidence_intervals": { "score": 0.82, "level": "strong" }
  },
  "error_distribution": {
    "wrong_method": 3,
    "formula_misuse": 5,
    "computation_error": 2,
    "interpretation_error": 8,
    "incomplete_reasoning": 1
  },
  "performance_trend": [
    { "session": 1, "score": 0.6 },
    { "session": 2, "score": 0.55 },
    { "session": 3, "score": 0.72 }
  ],
  "recommendations": [
    { "concept": "hypothesis_testing", "reason": "Repeated interpretation errors" },
    { "concept": "bayesian_reasoning", "reason": "Not practiced recently" }
  ]
}
```

---

## Regeneration

### `POST /api/workspaces/{workspace_id}/regeneration-requests`

**Purpose:** Request targeted practice regeneration based on weakness signals

**Request:**
```json
{
  "target_concepts": ["hypothesis_testing", "p_value_interpretation"],
  "question_count": 5,
  "format_type": "frq"
}
```

**Response:** `202` — regeneration request accepted, linked to latest analytics snapshot

### `GET /api/workspaces/{workspace_id}/regeneration-requests/{request_id}`

**Purpose:** Check regeneration request status

**Response:** `200` — request object with `status` and optional `generated_exam_id` when complete
