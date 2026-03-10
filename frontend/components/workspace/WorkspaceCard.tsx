"use client";

import Link from "next/link";

import type { Workspace } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";

export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Link href={`/dashboard/workspaces/${workspace.id}`}>
      <Card className="p-4 hover:border-primary/30 transition-colors">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{workspace.title}</p>
          <p className="text-sm text-muted-foreground">
            {workspace.course_code ?? "No course code"}
          </p>
          {workspace.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{workspace.description}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}

