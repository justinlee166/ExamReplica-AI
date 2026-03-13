"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { apiClient, type Document, type Workspace } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const workspaceId = useMemo(() => params.id, [params.id]);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const [w, docs] = await Promise.all([
        apiClient.getWorkspace(workspaceId),
        apiClient.listDocuments(workspaceId),
      ]);
      setWorkspace(w);
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    setDeletingId(documentId);
    setDeleteError(null);
    try {
      await apiClient.deleteDocument(workspaceId, documentId);
      await refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      apiClient.listDocuments(workspaceId).then(setDocuments).catch(() => {});
    }, 5000);
    return () => window.clearInterval(id);
  }, [workspaceId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-sm text-destructive">{error}</div>;
  if (!workspace) return <div className="p-6 text-sm">Workspace not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{workspace.title}</h1>
          <p className="text-sm text-muted-foreground">
            {workspace.course_code ?? "No course code"}
            {workspace.description ? ` · ${workspace.description}` : ""}
          </p>
        </div>
      </div>

      <Card className="p-4">
        <DocumentUploadForm workspaceId={workspaceId} onUploaded={refresh} />
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Documents</h2>
        {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((d) => (
              <Card key={d.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.upload_label ?? d.file_name}</p>
                  <p className="text-sm text-muted-foreground truncate">{d.file_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <DocumentStatusBadge status={d.processing_status} />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deletingId === d.id}
                    onClick={() => void handleDeleteDocument(d.id)}
                  >
                    {deletingId === d.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
