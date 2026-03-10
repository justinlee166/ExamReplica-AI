"use client";

import { professorProfile, courses } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  UserCircle,
  Target,
  BookOpen,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Info,
  ChevronRight,
  Sparkles,
  FileQuestion,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const course = courses[0];

export default function ProfessorProfilePage() {
  const topicData = professorProfile.topicWeights.map((t) => ({
    name: t.topic,
    weight: t.weight,
    trend: t.trend,
  }));

  const formatData = [
    { name: "MCQ", value: professorProfile.questionFormats.mcq },
    { name: "Short Answer", value: professorProfile.questionFormats.shortAnswer },
    { name: "Long Form", value: professorProfile.questionFormats.longForm },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Professor Profile</h1>
          <p className="text-muted-foreground">
            AI-inferred testing patterns and exam tendencies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select className="h-10 rounded-lg border border-input bg-secondary px-4 text-sm">
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.title}
              </option>
            ))}
          </select>
          <Button asChild>
            <Link href="/dashboard/practice">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Practice
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20">
            <UserCircle className="h-10 w-10 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-foreground">
                {professorProfile.name}
              </h2>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1">
                <Target className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-500">
                  {professorProfile.confidence}% Confidence
                </span>
              </div>
            </div>
            <p className="mt-1 text-muted-foreground">{professorProfile.course}</p>
            <p className="mt-4 text-foreground leading-relaxed">
              {professorProfile.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Topic Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Topic Emphasis */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Topic Emphasis</h3>
                <p className="text-sm text-muted-foreground">
                  Weighted importance based on course materials
                </p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" domain={[0, 30]} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Weight"]}
                  />
                  <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                    {topicData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {topicData.map((topic) => (
                <div
                  key={topic.name}
                  className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5"
                >
                  <span className="text-sm text-foreground">{topic.name}</span>
                  {topic.trend === "up" && (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                  {topic.trend === "down" && (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                  {topic.trend === "stable" && (
                    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Exam Structure */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Inferred Exam Structure
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileQuestion className="h-4 w-4" />
                  Questions
                </div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  {professorProfile.examStructure.totalQuestions}
                </div>
              </div>
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ClipboardList className="h-4 w-4" />
                  MCQ Count
                </div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  {professorProfile.examStructure.mcqCount}
                </div>
              </div>
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  FRQ Count
                </div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  {professorProfile.examStructure.frqCount}
                </div>
              </div>
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  Difficulty
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {professorProfile.examStructure.difficultyRamp}
                </div>
              </div>
            </div>
          </div>

          {/* Common Patterns */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Common Question Stems & Patterns
            </h3>
            <div className="space-y-3">
              {professorProfile.commonPatterns.map((pattern, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg bg-secondary/30 p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-sm font-medium text-primary">{index + 1}</span>
                  </div>
                  <span className="text-foreground">&ldquo;{pattern}&rdquo;</span>
                </div>
              ))}
            </div>
          </div>

          {/* What This Means */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                What This Means for Generation
              </h3>
            </div>
            <div className="space-y-4 text-sm">
              <p className="text-foreground leading-relaxed">
                Based on this profile, ExamProfile AI will generate practice problems that:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-muted-foreground">
                    Emphasize derivations and proofs, particularly for MLE and hypothesis testing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-muted-foreground">
                    Include multi-step problems requiring integration of multiple concepts
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-muted-foreground">
                    Match the FRQ-heavy format with 40% long-form questions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-muted-foreground">
                    Use similar wording cues and question structures as prior exams
                  </span>
                </li>
              </ul>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/practice">
                  Generate Aligned Practice
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - Supporting Info */}
        <div className="space-y-6">
          {/* Question Format Distribution */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Question Formats</h3>
            <div className="flex items-center justify-center h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formatData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {formatData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2">
              {formatData.map((format, index) => (
                <div key={format.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                    />
                    <span className="text-sm text-muted-foreground">{format.name}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{format.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Sources */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Evidence Sources</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Materials used to build this profile
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-foreground">Prior Exams</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {professorProfile.evidenceSources.priorExams}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">Lecture Slides</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {professorProfile.evidenceSources.lectureSlides}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-chart-4" />
                  <span className="text-sm text-foreground">Homework Sets</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {professorProfile.evidenceSources.homework}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Practice Tests</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {professorProfile.evidenceSources.practiceTests}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Total Sources</span>
                <span className="text-lg font-semibold text-primary">
                  {Object.values(professorProfile.evidenceSources).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/uploads">
                  Add More Materials
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/practice">
                  Generate Practice Set
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/exams">
                  Create Simulated Exam
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
