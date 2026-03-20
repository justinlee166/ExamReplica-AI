"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  BookOpen,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter
} from "lucide-react"
import { courses, conceptMastery } from "@/lib/mock-data"

const timeRanges = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" }
]

const overallStats = {
  totalQuestions: 847,
  correctAnswers: 678,
  averageScore: 80,
  studyHours: 127,
  examsTaken: 23,
  conceptsMastered: 45,
  weeklyTrend: 8,
  strongestSubject: "Calculus II",
  weakestSubject: "Organic Chemistry"
}

const weeklyProgress = [
  { day: "Mon", questions: 45, correct: 38 },
  { day: "Tue", questions: 62, correct: 51 },
  { day: "Wed", questions: 38, correct: 32 },
  { day: "Thu", questions: 71, correct: 62 },
  { day: "Fri", questions: 54, correct: 45 },
  { day: "Sat", questions: 28, correct: 24 },
  { day: "Sun", questions: 35, correct: 30 }
]

const conceptBreakdown = [
  { name: "Integration Techniques", mastery: 92, questions: 156, trend: "up" },
  { name: "Differential Equations", mastery: 78, questions: 89, trend: "up" },
  { name: "Series Convergence", mastery: 65, questions: 67, trend: "stable" },
  { name: "Vector Calculus", mastery: 45, questions: 42, trend: "down" },
  { name: "Organic Reactions", mastery: 58, questions: 134, trend: "up" },
  { name: "Spectroscopy", mastery: 72, questions: 78, trend: "stable" },
  { name: "Thermodynamics", mastery: 85, questions: 112, trend: "up" },
  { name: "Kinematics", mastery: 88, questions: 95, trend: "stable" }
]

const performanceByQuestionType = [
  { type: "Multiple Choice", accuracy: 85, count: 412 },
  { type: "Short Answer", accuracy: 72, count: 198 },
  { type: "Problem Solving", accuracy: 68, count: 156 },
  { type: "Derivation/Proof", accuracy: 61, count: 81 }
]

const studyRecommendations = [
  {
    priority: "high",
    concept: "Vector Calculus",
    reason: "Mastery declining - down 12% this week",
    action: "Review gradient, divergence, and curl concepts",
    estimatedTime: "2-3 hours"
  },
  {
    priority: "medium",
    concept: "Series Convergence",
    reason: "Plateau detected - no improvement in 2 weeks",
    action: "Practice ratio and root test problems",
    estimatedTime: "1-2 hours"
  },
  {
    priority: "medium",
    concept: "Derivation/Proof Questions",
    reason: "Lowest accuracy by question type (61%)",
    action: "Focus on proof structure and logical flow",
    estimatedTime: "2 hours"
  },
  {
    priority: "low",
    concept: "Organic Reactions",
    reason: "Good progress but room for improvement",
    action: "Review reaction mechanisms for edge cases",
    estimatedTime: "1 hour"
  }
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedCourse, setSelectedCourse] = useState("all")

  const maxQuestions = Math.max(...weeklyProgress.map(d => d.questions))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and identify areas for improvement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map(range => (
                <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Accuracy
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.averageScore}%</div>
            <div className="flex items-center gap-1 mt-1">
              {overallStats.weeklyTrend > 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">+{overallStats.weeklyTrend}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500">{overallStats.weeklyTrend}%</span>
                </>
              )}
              <span className="text-sm text-muted-foreground ml-1">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Questions Practiced
            </CardTitle>
            <BookOpen className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.totalQuestions.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {overallStats.correctAnswers.toLocaleString()} correct answers
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Study Time
            </CardTitle>
            <Clock className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.studyHours}h</div>
            <p className="text-sm text-muted-foreground mt-1">
              ~{Math.round(overallStats.studyHours / 4)} hours per week
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concepts Mastered
            </CardTitle>
            <Brain className="h-4 w-4 text-chart-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallStats.conceptsMastered}</div>
            <p className="text-sm text-muted-foreground mt-1">
              of {conceptMastery.length} total concepts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="progress" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="progress" className="gap-2">
            <LineChart className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="concepts" className="gap-2">
            <PieChart className="h-4 w-4" />
            Concepts
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <Zap className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly Activity */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Weekly Activity
                </CardTitle>
                <CardDescription>Questions attempted and correct answers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyProgress.map((day) => (
                    <div key={day.day} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium w-10">{day.day}</span>
                        <span className="text-muted-foreground">
                          {day.correct}/{day.questions} correct ({Math.round((day.correct / day.questions) * 100)}%)
                        </span>
                      </div>
                      <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-primary/30 rounded-full"
                          style={{ width: `${(day.questions / maxQuestions) * 100}%` }}
                        />
                        <div 
                          className="absolute inset-y-0 left-0 bg-primary rounded-full"
                          style={{ width: `${(day.correct / maxQuestions) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance by Question Type */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-accent" />
                  Performance by Question Type
                </CardTitle>
                <CardDescription>Accuracy breakdown by question format</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {performanceByQuestionType.map((item) => (
                    <div key={item.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.type}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{item.count} questions</span>
                          <Badge 
                            variant={item.accuracy >= 80 ? "default" : item.accuracy >= 65 ? "secondary" : "outline"}
                            className={item.accuracy >= 80 ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                          >
                            {item.accuracy}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={item.accuracy} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strengths and Weaknesses */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <TrendingUp className="h-5 w-5" />
                  Strongest Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conceptBreakdown
                    .filter(c => c.mastery >= 80)
                    .sort((a, b) => b.mastery - a.mastery)
                    .slice(0, 4)
                    .map((concept) => (
                      <div key={concept.name} className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="font-medium">{concept.name}</span>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {concept.mastery}%
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-amber-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-400">
                  <TrendingDown className="h-5 w-5" />
                  Needs Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conceptBreakdown
                    .filter(c => c.mastery < 70)
                    .sort((a, b) => a.mastery - b.mastery)
                    .slice(0, 4)
                    .map((concept) => (
                      <div key={concept.name} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          <span className="font-medium">{concept.name}</span>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          {concept.mastery}%
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Concepts Tab */}
        <TabsContent value="concepts" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Concept Mastery Overview</CardTitle>
              <CardDescription>
                Detailed breakdown of your understanding across all concepts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conceptBreakdown
                  .sort((a, b) => b.mastery - a.mastery)
                  .map((concept) => (
                    <div key={concept.name} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            concept.mastery >= 80 ? "bg-green-500" :
                            concept.mastery >= 60 ? "bg-yellow-500" : "bg-red-500"
                          }`} />
                          <span className="font-medium">{concept.name}</span>
                          {concept.trend === "up" && (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          {concept.trend === "down" && (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {concept.questions} questions practiced
                          </span>
                          <Badge variant={
                            concept.mastery >= 80 ? "default" :
                            concept.mastery >= 60 ? "secondary" : "outline"
                          }>
                            {concept.mastery}% mastery
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={concept.mastery} 
                        className="h-2"
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                AI-Powered Study Recommendations
              </CardTitle>
              <CardDescription>
                Personalized suggestions based on your performance patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studyRecommendations.map((rec, index) => (
                  <div 
                    key={index}
                    className={`p-5 rounded-lg border ${
                      rec.priority === "high" 
                        ? "bg-red-500/5 border-red-500/20" 
                        : rec.priority === "medium"
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-secondary/30 border-border/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            rec.priority === "high" ? "destructive" :
                            rec.priority === "medium" ? "secondary" : "outline"
                          }>
                            {rec.priority} priority
                          </Badge>
                          <h4 className="font-semibold">{rec.concept}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.reason}</p>
                        <div className="flex items-center gap-4 pt-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Target className="h-4 w-4 text-primary" />
                            <span>{rec.action}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{rec.estimatedTime}</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" className="shrink-0">
                        Start Practice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Weakness Drill</h4>
                    <p className="text-sm text-muted-foreground">Practice your weakest concepts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:border-accent/50 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <Target className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Mixed Review</h4>
                    <p className="text-sm text-muted-foreground">Balanced practice across topics</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:border-chart-4/50 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-chart-4/10 group-hover:bg-chart-4/20 transition-colors">
                    <Clock className="h-6 w-6 text-chart-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Quick 10</h4>
                    <p className="text-sm text-muted-foreground">10-minute rapid fire session</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
