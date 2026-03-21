"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { ExamQuestion } from "@/lib/apiClient";

type ExamQuestionCardProps = {
  question: ExamQuestion;
};

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function difficultyClasses(difficulty: string): string {
  switch (difficulty) {
    case "easy":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "medium":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "hard":
      return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
    default:
      return "border-border bg-secondary text-secondary-foreground";
  }
}

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function ExamQuestionCard({ question }: ExamQuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const isMcq = question.question_type === "mcq" && question.options && question.options.length > 0;

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-4 px-6 py-5">
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">
            Q{question.question_order}
          </span>
          <Badge variant="outline" className="rounded-full">
            {question.question_type.toUpperCase()}
          </Badge>
          <Badge variant="outline" className={`rounded-full ${difficultyClasses(question.difficulty_label)}`}>
            {toTitleCase(question.difficulty_label)}
          </Badge>
          <Badge variant="secondary" className="rounded-full">
            {toTitleCase(question.topic_label)}
          </Badge>
        </div>

        {/* Question text */}
        <p className="text-sm leading-7 text-foreground whitespace-pre-wrap">
          {question.question_text}
        </p>

        {/* MCQ options (read-only) */}
        {isMcq && (
          <RadioGroup
            id={`question-${question.id}-options`}
            disabled
            className="space-y-2 pl-1"
          >
            {question.options!.map((option, idx) => {
              const label = OPTION_LABELS[idx] ?? String(idx + 1);
              const optionId = `question-${question.id}-option-${label}`;
              return (
                <div key={optionId} className="flex items-start gap-2">
                  <RadioGroupItem value={label} id={optionId} className="mt-0.5" />
                  <Label htmlFor={optionId} className="font-normal text-sm leading-6 text-foreground">
                    {label}) {option}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        )}

        {/* FRQ answer area label */}
        {!isMcq && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground italic">
              Free-response answer area
            </p>
          </div>
        )}

        {/* Show Answer toggle */}
        <Button
          id={`question-${question.id}-toggle-answer`}
          variant="ghost"
          size="sm"
          className="px-0 hover:bg-transparent"
          onClick={() => setShowAnswer((prev) => !prev)}
        >
          {showAnswer ? (
            <>
              <ChevronUp className="mr-1 h-4 w-4" />
              Hide Answer &amp; Explanation
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-4 w-4" />
              Show Answer &amp; Explanation
            </>
          )}
        </Button>

        {showAnswer && (
          <div className="space-y-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
            {question.answer_key && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Answer
                </p>
                <p className="mt-1 text-sm leading-6 text-foreground whitespace-pre-wrap">
                  {question.answer_key}
                </p>
              </div>
            )}
            {question.explanation && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Explanation
                </p>
                <p className="mt-1 text-sm leading-6 text-foreground whitespace-pre-wrap">
                  {question.explanation}
                </p>
              </div>
            )}
            {!question.answer_key && !question.explanation && (
              <p className="text-sm text-muted-foreground italic">
                No answer or explanation available for this question.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
