"use client";

import { StatCard } from "@/components/stat-card";
import {
  courses,
  conceptMastery,
  performanceHistory,
  errorBreakdown,
  recentActivity,
} from "@/lib/mock-data";
import {
  BookOpen,
  FileText,
  Target,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Clock,
  CheckCircle2,
  Upload,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const currentCourse = courses[0];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, John. Here&apos;s your study overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/uploads">
              <Upload className="mr-2 h-4 w-4" />
              Upload Materials
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/practice">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Practice
            </Link>
          </Button>
        </div>
      </div>

      {/* Current Course Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Focus</p>
              <h2 className="text-xl font-semibold text-foreground">
                {currentCourse.name} - {currentCourse.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentCourse.professor} · {currentCourse.semester}
              </p>
            </div>
          </div>
          <Button variant="ghost" asChild>
            <Link href={`/dashboard/courses/${currentCourse.id}`}>
              View Course
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Materials Uploaded"
          value={currentCourse.materialsCount}
          subtitle="Slides, homework, exams"
          icon={<FileText className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Professor Profile"
          value={`${currentCourse.profileConfidence}%`}
          subtitle="Confidence score"
          trend="up"
          trendValue="+5%"
          icon={<Target className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Topics Extracted"
          value={currentCourse.topicsExtracted}
          subtitle="Unique concepts"
          icon={<BookOpen className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Last Exam Score"
          value={`${currentCourse.lastExamScore}%`}
          subtitle="Midterm Simulation #1"
          trend="up"
          trendValue="+8%"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Performance Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Performance Trend</h3>
              <p className="text-sm text-muted-foreground">Your scores over time</p>
            </div>
            <select className="rounded-lg border border-input bg-secondary px-3 py-1.5 text-sm">
              <option>Last 8 weeks</option>
              <option>Last 4 weeks</option>
              <option>All time</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[50, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  name="Your Score"
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Class Average"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weakest Concepts */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Needs Attention</h3>
            <Link
              href="/dashboard/analytics"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {conceptMastery
              .filter((c) => c.mastery < 60)
              .slice(0, 4)
              .map((concept) => (
                <div key={concept.concept} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {concept.concept}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {concept.mastery}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-destructive/70"
                      style={{ width: `${concept.mastery}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link href="/dashboard/practice">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Practice Weak Areas
            </Link>
          </Button>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Topic Emphasis */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Topic Emphasis</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Based on professor profile analysis
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={conceptMastery.slice(0, 5)}
                layout="vertical"
                margin={{ left: 0, right: 20 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="concept"
                  width={100}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="mastery" radius={[0, 4, 4, 0]}>
                  {conceptMastery.slice(0, 5).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.mastery >= 70
                          ? "hsl(var(--chart-2))"
                          : entry.mastery >= 50
                          ? "hsl(var(--chart-4))"
                          : "hsl(var(--destructive))"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Error Types</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Common mistake categories
          </p>
          <div className="flex items-center justify-center h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={errorBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="percentage"
                  nameKey="type"
                >
                  {errorBreakdown.map((_, index) => (
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
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {errorBreakdown.slice(0, 3).map((error, index) => (
              <div key={error.type} className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                />
                <span className="text-xs text-muted-foreground">{error.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  {activity.action.includes("Completed") && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  {activity.action.includes("Uploaded") && (
                    <Upload className="h-4 w-4 text-primary" />
                  )}
                  {activity.action.includes("Generated") && (
                    <Sparkles className="h-4 w-4 text-chart-4" />
                  )}
                  {activity.action.includes("Reviewed") && (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  {activity.action.includes("Updated") && (
                    <Target className="h-4 w-4 text-accent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                </div>
                <div className="flex items-center gap-2">
                  {activity.score && (
                    <span className="text-sm font-medium text-emerald-500">
                      {activity.score}%
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Action */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Recommended Next Step
              </h3>
              <p className="text-sm text-muted-foreground">
                Based on your weakness analytics, practice{" "}
                <span className="font-medium text-foreground">Bayesian Estimation</span> to
                improve your exam readiness by 15%.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/dashboard/practice">
              Start Practice
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
