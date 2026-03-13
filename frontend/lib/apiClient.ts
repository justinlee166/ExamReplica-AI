"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";

export type HealthResponse = { status: "ok"; timestamp: string };

export type Workspace = {
  id: string;
  user_id: string;
  title: string;
  course_code: string | null;
  description: string | null;
  document_count?: number;
  profile_status?: string;
  created_at: string;
  updated_at: string;
};

export type DocumentProcessingStatus =
  | "uploaded"
  | "parsing"
  | "indexed"
  | "ready"
  | "failed";

export type DocumentSourceType =
  | "prior_exam"
  | "homework"
  | "lecture_slides"
  | "practice_test"
  | "notes";

export type Document = {
  id: string;
  workspace_id: string;
  source_type: DocumentSourceType;
  file_name: string;
  upload_label: string | null;
  file_path: string;
  processing_status: DocumentProcessingStatus;
  created_at: string;
  updated_at: string;
};

export class ApiError extends Error {
  status: number;
  detail?: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
}

async function getAccessToken(): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new ApiError("Unable to read auth session", 401, error);
  const token = data.session?.access_token;
  if (!token) throw new ApiError("Not authenticated", 401);
  return token;
}

async function request<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const auth = init?.auth ?? true;
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");

  if (auth) {
    const token = await getAccessToken();
    headers.set("authorization", `Bearer ${token}`);
  }

  const resp = await fetch(url, { ...init, headers });
  const contentType = resp.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await resp.json().catch(() => null) : await resp.text().catch(() => "");

  if (!resp.ok) {
    const detail =
      typeof body === "object" && body !== null && "detail" in body
        ? (body as { detail: unknown }).detail
        : body;
    throw new ApiError(`Request failed: ${resp.status}`, resp.status, detail);
  }

  return body as T;
}

export const apiClient = {
  getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>("/api/health", { auth: false });
  },

  createWorkspace(input: {
    title: string;
    course_code?: string | null;
    description?: string | null;
  }): Promise<Workspace> {
    return request<Workspace>("/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  listWorkspaces(): Promise<Workspace[]> {
    return request<Workspace[]>("/api/workspaces");
  },

  getWorkspace(id: string): Promise<Workspace> {
    return request<Workspace>(`/api/workspaces/${encodeURIComponent(id)}`);
  },

  updateWorkspace(
    id: string,
    input: { title?: string; course_code?: string | null; description?: string | null },
  ): Promise<Workspace> {
    return request<Workspace>(`/api/workspaces/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  deleteWorkspace(id: string): Promise<void> {
    return request<void>(`/api/workspaces/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  uploadDocument(input: {
    workspaceId: string;
    file: File;
    source_type: DocumentSourceType;
    upload_label?: string;
  }): Promise<Document> {
    const form = new FormData();
    form.append("file", input.file);
    form.append("source_type", input.source_type);
    if (input.upload_label) form.append("upload_label", input.upload_label);

    return request<Document>(`/api/workspaces/${encodeURIComponent(input.workspaceId)}/documents`, {
      method: "POST",
      body: form,
    });
  },

  listDocuments(workspaceId: string): Promise<Document[]> {
    return request<Document[]>(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/documents`,
    );
  },

  getDocument(workspaceId: string, documentId: string): Promise<Document> {
    return request<Document>(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/documents/${encodeURIComponent(documentId)}`,
    );
  },

  deleteDocument(workspaceId: string, documentId: string): Promise<void> {
    return request<void>(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/documents/${encodeURIComponent(documentId)}`,
      { method: "DELETE" },
    );
  },
};
