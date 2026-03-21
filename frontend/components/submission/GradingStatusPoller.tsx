"use client";

import { useEffect, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";

import { apiClient, ApiError, type SubmissionRead } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type GradingStatusPollerProps = {
  workspaceId: string;
  submissionId: string;
  onGraded: (submission: SubmissionRead) => void;
};

const POLL_INTERVAL_MS = 3000;

export function GradingStatusPoller({
  workspaceId,
  submissionId,
  onGraded,
}: GradingStatusPollerProps) {
  const [status, setStatus] = useState<string>("submitted");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      try {
        const result = await apiClient.getSubmission(workspaceId, submissionId);
        if (!active) return;
        setStatus(result.status);

        if (result.status === "graded") {
          if (timer) clearInterval(timer);
          onGraded(result);
          return;
        }

        if (result.status === "failed") {
          if (timer) clearInterval(timer);
          setError("Grading failed. Please try submitting again.");
          return;
        }
      } catch (err) {
        if (!active) return;
        const msg =
          err instanceof ApiError && typeof err.detail === "string"
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Failed to check grading status.";
        setError(msg);
        if (timer) clearInterval(timer);
      }
    }

    void poll();
    timer = setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, submissionId]);

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <TriangleAlert className="h-10 w-10 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">
            Grading Failed
          </h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {status === "grading"
            ? "Grading in Progress..."
            : "Submission Received"}
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {status === "grading"
            ? "Your answers are being evaluated. This usually takes a few seconds."
            : "Your submission has been received and will begin grading shortly."}
        </p>
      </CardContent>
    </Card>
  );
}
