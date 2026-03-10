"use client";

import { useState } from "react";

import { apiClient, type DocumentSourceType } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const sourceTypes: { value: DocumentSourceType; label: string }[] = [
  { value: "prior_exam", label: "Prior exam" },
  { value: "homework", label: "Homework" },
  { value: "lecture_slides", label: "Lecture slides" },
  { value: "practice_test", label: "Practice test" },
  { value: "notes", label: "Notes" },
];

export function DocumentUploadForm({
  workspaceId,
  onUploaded,
}: {
  workspaceId: string;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<DocumentSourceType>("lecture_slides");
  const [uploadLabel, setUploadLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.uploadDocument({
        workspaceId,
        file,
        source_type: sourceType,
        upload_label: uploadLabel || undefined,
      });
      setFile(null);
      setUploadLabel("");
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-4">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="file">File</Label>
        <Input
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceType">Source type</Label>
        <select
          id="sourceType"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as DocumentSourceType)}
        >
          {sourceTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Upload label</Label>
        <Input
          id="label"
          value={uploadLabel}
          onChange={(e) => setUploadLabel(e.target.value)}
          placeholder="Optional (e.g. Midterm 1)"
        />
      </div>

      <div className="md:col-span-4 flex items-center justify-between gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting || !file} className="ml-auto">
          {submitting ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </form>
  );
}

