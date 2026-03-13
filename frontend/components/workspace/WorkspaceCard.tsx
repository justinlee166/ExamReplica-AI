"use client";
import { useState } from "react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Workspace } from "@/lib/apiClient";
import { apiClient } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";

export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(): Promise<void> {
    setDeleting(true);
    try {
      await apiClient.deleteWorkspace(workspace.id);
      setOpen(false);
      window.location.reload();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="p-4 transition-colors hover:border-primary/30">
      <Link href={`/dashboard/workspaces/${workspace.id}`} className="block space-y-1">
        <div>
          <p className="font-medium text-foreground">{workspace.title}</p>
          <p className="text-sm text-muted-foreground">
            {workspace.course_code ?? "No course code"}
          </p>
          {workspace.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{workspace.description}</p>
          )}
        </div>
      </Link>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button className="mt-4" variant="outline" size="sm">Delete</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this workspace and all its documents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={deleting}>Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={(event) => {
                  event.preventDefault();
                  void handleDelete();
                }}
              >
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
