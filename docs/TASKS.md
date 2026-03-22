# Tasks

## Phase 0: Repository and Application Scaffolding

### T-001: Initialize monorepo structure
- **Phase:** 0
- **Status:** Complete
- **Goal:** Create `/frontend` and `/backend` directories with proper `.gitignore` entries
- **Acceptance Criteria:**
  - Repo has `frontend/` and `backend/` directories
  - `.gitignore` covers `node_modules/`, `__pycache__/`, `.env`, `venv/`, `dist/`
  - All context `.md` files are at repo root

### T-002: Scaffold React frontend
- **Phase:** 0
- **Status:** Complete
- **Goal:** Initialize React + TypeScript frontend with Tailwind CSS and Shadcn/ui
- **Acceptance Criteria:**
  - `frontend/` contains a working Next.js + React + TypeScript project (App Router)
  - Tailwind CSS is configured and working
  - Shadcn/ui is installed and a test component renders
  - `npm run dev` starts the dev server
  - TypeScript strict mode is enabled in `tsconfig.json`
  - ESLint and Prettier are configured

### T-003: Scaffold FastAPI backend
- **Phase:** 0
- **Status:** Complete
- **Goal:** Initialize FastAPI project with proper structure, dependencies, and virtual environment
- **Acceptance Criteria:**
  - `backend/` contains a FastAPI project with `main.py`
  - Python virtual environment set up with `requirements.txt` or `pyproject.toml`
  - Ruff and/or Black configured for formatting
  - Type hints used on all function signatures
  - Project structure has `services/`, `models/`, `routes/`, `config/` directories

### T-004: Health check endpoint
- **Phase:** 0
- **Status:** Complete
- **Goal:** Backend serves a health check endpoint; frontend can call it
- **Acceptance Criteria:**
  - `GET /api/health` returns `{ "status": "ok" }`
  - Frontend has an API client module that calls the health endpoint
  - CORS is configured to allow frontend dev server origin

### T-005: Environment and Supabase setup
- **Phase:** 0
- **Status:** Complete
- **Goal:** Set up environment variable management and Supabase project
- **Acceptance Criteria:**
  - `.env.example` files exist for both frontend and backend
  - Supabase project is created (or local PG dev config documented)
  - Backend can connect to the database
  - Supabase client is initialized in backend config

---

## Phase 1: Workspace and Upload Flow

### T-101: User authentication
- **Phase:** 1
- **Status:** Complete
- **Goal:** Implement user auth via Supabase Auth
- **Acceptance Criteria:**
  - Users can sign up and log in with email/password
  - JWT tokens are sent with API requests
  - Backend validates Supabase JWT on protected routes
  - `users` table is populated on sign-up

### T-102: Workspace CRUD API
- **Phase:** 1
- **Status:** Complete
- **Goal:** Full workspace CRUD endpoints
- **Acceptance Criteria:**
  - `POST /api/workspaces` creates a workspace
  - `GET /api/workspaces` lists user's workspaces
  - `GET /api/workspaces/{id}` returns workspace details
  - `PUT /api/workspaces/{id}` updates workspace
  - `DELETE /api/workspaces/{id}` deletes workspace
  - `workspaces` table created and migrated
  - Workspaces are scoped to the authenticated user

### T-103: Workspace UI
- **Phase:** 1
- **Status:** Complete
- **Goal:** Frontend workspace list and detail views
- **Acceptance Criteria:**
  - Workspace list page shows all workspaces
  - Create workspace form works
  - Clicking a workspace navigates to detail view
  - Delete and edit workspace actions work

### T-104: Document upload API
- **Phase:** 1
- **Status:** Complete
- **Goal:** Upload documents to a workspace with labeling
- **Acceptance Criteria:**
  - `POST /api/workspaces/{id}/documents` accepts file upload
  - File is stored in file storage (Supabase Storage or local)
  - `documents` table record created with `processing_status: "uploaded"`
  - Upload accepts `source_type` and `upload_label` fields
  - `GET /api/workspaces/{id}/documents` lists documents with status

### T-105: Document upload UI
- **Phase:** 1
- **Status:** Complete
- **Goal:** Frontend upload interface with status indicators
- **Acceptance Criteria:**
  - Drag-and-drop or file picker upload
  - User can set source type and upload label
  - Document list shows processing status (uploaded, parsing, indexed, ready, failed)
  - Status updates are visible without page refresh (polling or WebSocket)

---

## Phase 2: Document Ingestion and Parsing Pipeline

### T-201: Document parsing service and background jobs
- **Phase:** 2
- **Status:** Complete
- **Goal:** Parse uploaded documents asynchronously into Markdown and persist the result
- **Acceptance Criteria:**
  - `document_processing_jobs` and `parsed_documents` tables exist with migrations
  - `POST /api/workspaces/{id}/documents` queues parsing immediately after upload
  - Document status transitions through `uploaded` → `parsing` → `parsed` / `failed`
  - Parsed Markdown is stored in `parsed_documents.normalized_content`
  - Backend logs job progress with Python `logging`
  - A backend test or script exists to exercise the parsing flow on a local document

### T-202: Semantic Markdown chunking
- **Phase:** 2
- **Status:** Complete
- **Goal:** Split parsed Markdown into semantic instructional units and persist them for later retrieval
- **Acceptance Criteria:**
  - `chunks` table exists with `chunk_id`, `document_id`, `content`, `position`, `chunk_type_label`, and `topic_label`
  - The background document processing job calls chunking immediately after parsed Markdown is saved
  - Chunk boundaries prefer Markdown headers and semantic instructional markers over naive fixed-size splitting
  - A pytest file verifies chunk splitting behavior on mock Markdown content

### T-203: Embedding generation and ChromaDB indexing
- **Phase:** 2
- **Status:** Complete
- **Goal:** Generate embeddings for persisted chunks, index them in local ChromaDB, and expose final `indexed` status in the document workflow
- **Acceptance Criteria:**
  - `chunk_embeddings` table exists with vector-store tracking metadata
  - The background document processing job runs parse → chunk → embed → index without blocking the request lifecycle
  - Chunk vectors are stored in a persistent local ChromaDB collection with document and position metadata
  - Document status transitions through `uploaded` → `parsing` → `indexed` on success
  - A backend script can query ChromaDB and return the matching chunk for a test keyword

---

## Phase 3: Retrieval and Professor Profile

### T-301: Database Schema Updates for Professor Profiles
- **Phase:** 3
- **Status:** Complete
- **Goal:** Create the database tables to store the structured JSON data about a professor.
- **Acceptance Criteria:**
  - `professor_profiles` and `professor_profile_versions` tables created via Supabase migration
  - Tables store structured JSON data about a professor's tendencies, topic distribution, etc.
  - Pydantic models correspond to the schema changes

### T-302: Retrieval Service and LlamaIndex Integration
- **Phase:** 3
- **Status:** Complete
- **Goal:** Build the backend RetrievalService using LlamaIndex to query ChromaDB for context-aware chunks.
- **Acceptance Criteria:**
  - Semantic search over chunks with metadata filtering
  - LlamaIndex integrated to coordinate RAG operations
  - Supports task-conditioned retrieval (e.g., grab syllabi and exams for profile generation)

### T-303: Professor Profile Service (LLM Orchestrator)
- **Phase:** 3
- **Status:** Complete
- **Goal:** Python service that takes retrieved chunks, feeds Gemini 1.5 Flash, and outputs a strict JSON profile.
- **Acceptance Criteria:**
  - Retrieves all relevant chunks for a specific workspace
  - Instructs Gemini 1.5 Flash to act as an educational analyst
  - Outputs a structured JSON object detailing trends and topic distribution

### T-304: Frontend Profile Insights UI
- **Phase:** 3
- **Status:** Complete
- **Goal:** Build a dashboard page in the React frontend that displays the JSON profile from the backend.
- **Acceptance Criteria:**
  - Fetches the professor profile from the backend API
  - Displays tendencies, difficulty levels, and topic distributions visually
  - Recharts or simple progress bars used for visual insights

---

## Phase 4: Practice and Exam Generation

### T-404: Frontend Generation UI
- **Phase:** 4
- **Status:** Complete
- **Goal:** Build the complete generation UI as a vertical slice within the existing Next.js frontend
- **Acceptance Criteria:**
  - Generation form page with request type, format type, question count (3–30), difficulty, question types, optional topics, and custom prompt
  - Status polling page that polls every 3 seconds and redirects to exam viewer on completion
  - Exam viewer page rendering all questions with MCQ options as A/B/C/D and Show Answer toggle
  - Exam list page with empty state and card-per-exam navigation
  - PDF Download button triggers browser file save via Blob URL
  - All API calls go through the API client module
  - Sidebar navigation includes Generate and Exams links for active workspace
  - TypeScript strict mode, Shadcn/ui components, Tailwind CSS throughout
### T-401: Database schema for generation entities
- **Phase:** 4
- **Status:** Complete
- **Goal:** Create migration and Pydantic models for generation_requests, generated_exams, and generated_questions tables
- **Acceptance Criteria:**
  - `migrations/008_generation_tables.sql` creates all three tables with correct columns, types, FK references, CHECK constraints, and RLS policies
  - `backend/models/generation.py` defines GenerationConfig, ScopeConstraints, GenerationRequestCreate, GenerationRequestRead, GeneratedExamSummary, GeneratedQuestionRead, GeneratedExamDetail
  - All Literal-constrained status/type fields raise ValidationError on invalid values

### T-402: GenerationService — Multi-Stage Pipeline
- **Phase:** 4
- **Status:** Complete
- **Goal:** Implement the 6-stage generation pipeline as a Python service module
- **Acceptance Criteria:**
  - `GenerationService.run_pipeline()` is the single public entry point returning `FinalExamAssembly`
  - All 6 stages (draft → validate → novelty → difficulty → MCQ distribution → assemble) are called sequentially
  - Service does not write to the database
  - All Gemini prompt strings live in `prompts.py`
  - `GenerationError` is a subclass of `AppError`
  - All 6 pytest tests pass

### T-403: Generation API Routes + Background Job
- **Phase:** 4
- **Status:** Complete
- **Goal:** Create all 5 generation endpoints, wire GenerationService into BackgroundTasks, PDF export
- **Acceptance Criteria:**
  - POST /generation-requests returns 202 and dispatches background job
  - GET /generation-requests/{id} returns current status
  - GET /exams returns summaries (no nested questions)
  - GET /exams/{id} returns full exam with ordered questions
  - GET /exams/{id}/export returns PDF via Pandoc (503 if missing)
  - All workspace ownership validated before DB access
  - Router registered in main.py
  - All 7 pytest tests pass

---

## Phase 5: Submission and Grading

### T-501: Database schema for submission and grading entities
- **Phase:** 5
- **Status:** Complete
- **Goal:** Create migration for submissions, submission_answers, grading_results, and error_classifications tables
- **Acceptance Criteria:**
  - `migrations/009_submission_grading_tables.sql` creates all four tables with correct columns, FK references, CHECK constraints, and RLS policies
  - `submissions` has status CHECK (submitted, grading, graded, failed), workspace_id, user_id, overall_score, total_possible
  - `submission_answers` uses `answer_content` (not `student_answer`) and `generated_question_id`
  - `grading_results` uses `correctness_label` (not `is_correct`), `score_value`, `diagnostic_explanation`, `concept_label`, `points_possible`
  - `error_classifications` has CHECK constraint on `error_type` (5 allowed values) and optional `severity` (minor, moderate, major)
  - RLS policies scope through workspace ownership chain
  - Indexes exist on all FK columns

### T-502: Pydantic models for submission and grading
- **Phase:** 5
- **Status:** Complete
- **Goal:** Define type-safe request/response models for submission and grading flows
- **Acceptance Criteria:**
  - `backend/models/submission.py` defines API-facing models: SubmissionCreate, SubmissionCreatedResponse, SubmissionRead, SubmissionAnswerRead, GradingResultRead, ErrorClassificationRead
  - `backend/models/grading.py` defines internal models: GradingResultCreate, ErrorClassificationCreate with Literal-constrained CorrectnessLabel and ErrorType
  - All field names match DB column names (score_value, diagnostic_explanation, concept_label, answer_content)
  - CorrectnessLabel is Literal['correct', 'partial', 'incorrect'] — never a boolean
  - ErrorType is Literal with exactly 5 allowed values
  - All models use Python type hints, no Any

### T-503: Grading service and AI pipeline
- **Phase:** 5
- **Status:** Complete
- **Goal:** Implement grading service that evaluates answers and returns structured results
- **Acceptance Criteria:**
  - `backend/services/grading/service.py` returns `GradingPipelineResult` — does NOT write to DB directly
  - `backend/services/grading/grader.py` implements LLM-based grading with Gemini
  - LLM prompt requires correctness_label (correct/partial/incorrect), score_value, diagnostic_explanation, concept_label, and error_classifications
  - Score values are clamped to [0, points_possible]
  - Invalid JSON or schema validation failures raise `GradingError` (subclass of AppError)
  - Error types are restricted to the 5 canonical values
  - pytest tests mock LLM calls and verify all grading paths including formula_misuse

### T-504: Submission API routes and frontend UI
- **Phase:** 5
- **Status:** Complete
- **Goal:** Create submission/grading endpoints and frontend submission + results UI
- **Acceptance Criteria:**
  - `POST /api/workspaces/{workspace_id}/exams/{exam_id}/submissions` creates submission + answers, dispatches background grading, returns 201
  - `GET /api/workspaces/{workspace_id}/submissions/{submission_id}` returns nested response with correctness_label, score_value, diagnostic_explanation, concept_label, error_classifications
  - Background job sets status = grading → graded (or failed), persists grading_results and error_classifications to DB
  - Both endpoints validate workspace ownership
  - Router registered in main.py under /api prefix
  - Frontend ExamViewer manages answer state and transitions: taking → grading → results
  - GradingStatusPoller polls every 3 seconds, stops on graded/failed
  - GradingResultsViewer shows overall score, per-question cards with colored correctness badges, student answer vs correct answer, diagnostic_explanation, error classification badges
  - All TypeScript types match backend API response shape

---

## Future Phases

Tasks for Phases 6–7 will be added as earlier phases are completed. Refer to `IMPLEMENTATION_PHASES.md` for phase definitions and deliverables.
