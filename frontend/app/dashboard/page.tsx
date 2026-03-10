"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiClient, type Workspace } from "@/lib/apiClient";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.listWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Workspaces</h1>
          <p className="text-muted-foreground">
            Create a workspace per course or exam-prep context.
          </p>
        </div>
        <CreateWorkspaceDialog onCreated={refresh} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : workspaces.length === 0 ? (
        <p className="text-sm text-muted-foreground">No workspaces yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((w) => (
            <WorkspaceCard key={w.id} workspace={w} />
          ))}
        </div>
      )}
    </div>
  );
}

