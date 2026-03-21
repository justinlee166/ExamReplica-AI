"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { apiClient } from "@/lib/apiClient";
import type { GeneratedExamDetail } from "@/lib/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExamQuestionCard } from "@/components/generation/ExamQuestionCard";

type ExamViewerProps = {
  exam: GeneratedExamDetail;
  workspaceId: string;
};

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function ExamViewer({ exam, workspaceId }: ExamViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownloadPdf() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const blob = await apiClient.exportExamPdf(workspaceId, exam.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${exam.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "PDF download failed.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Exam header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{exam.title}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full">
              {toTitleCase(exam.exam_mode)}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {exam.format_type.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {exam.questions.length} questions
            </span>
            <span className="text-sm text-muted-foreground">
              {formatTimestamp(exam.created_at)}
            </span>
          </div>
        </div>

        <Button
          id="exam-download-pdf-button"
          variant="outline"
          disabled={downloading}
          onClick={() => void handleDownloadPdf()}
        >
          {downloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {downloadError && (
        <p id="exam-download-error" className="text-sm text-destructive">{downloadError}</p>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {exam.questions.map((question) => (
          <ExamQuestionCard key={question.id} question={question} />
        ))}
      </div>
    </div>
  );
}
