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

## Future Phases

Tasks for Phases 2–7 will be added as earlier phases are completed. Refer to `IMPLEMENTATION_PHASES.md` for phase definitions and deliverables.
