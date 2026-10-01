"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Target,
  ArrowRight,
  Clock,
  Layers,
  HelpCircle,
  BookOpen,
  FileText,
  Loader2,
  RefreshCw,
  Award,
} from "lucide-react";

export default function AnalyticsPage() {
  const analytics = useQuery(api.analytics.getComprehensiveAnalytics);
  const latestInsight = useQuery(api.analytics.getLatestInsight);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  const handleGenerateAdvisorInsights = async () => {
    try {
      setIsGenerating(true);
      setGenerationError("");

      const res = await fetch("/api/analytics/insights", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate study advisor report.");
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const score = analytics?.academicHealthScore ?? 0;
  const scoreCategory =
    score >= 85
      ? { label: "Exceptional Momentum", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" }
      : score >= 70
      ? { label: "On Track & Steady", color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/30" }
      : { label: "Needs Alignment", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Study Analytics & AI Advisor</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cross-module performance intelligence, retention curves, and cognitive diagnostics.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerateAdvisorInsights}
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-sm flex items-center gap-2 text-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Diagnosing Metrics...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Run AI Advisor
            </>
          )}
        </button>
      </div>

      {generationError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-600 dark:text-rose-400">
          {generationError}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: ACADEMIC HEALTH SCOREBOARD */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Health Index Card (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Academic Health Index
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${scoreCategory.bg} ${scoreCategory.color} ${scoreCategory.border}`}>
                {scoreCategory.label}
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-4">
              <span className="text-6xl font-black tracking-tight">{score}</span>
              <span className="text-xl text-slate-400 font-semibold">/ 100</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Weighted composite evaluating your quiz accuracy (35%), task velocity (30%), flashcard retention (25%), and study materials volume (10%).
            </p>
          </div>

          {/* Sub-Metric Bars */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 dark:text-slate-400">Quiz Accuracy</span>
                <span className="font-semibold">{analytics?.quizzes.avgScore ?? 0}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${analytics?.quizzes.avgScore ?? 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 dark:text-slate-400">Task Velocity</span>
                <span className="font-semibold">{analytics?.tasks.completionRate ?? 0}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${analytics?.tasks.completionRate ?? 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 dark:text-slate-400">Flashcard Mastery</span>
                <span className="font-semibold">{analytics?.flashcards.masteryRate ?? 0}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${analytics?.flashcards.masteryRate ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Study Advisor Card (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-500" />
                AI Academic Advisor Report
              </h2>
              {latestInsight && (
                <span className="text-[11px] text-slate-400">
                  Updated {new Date(latestInsight.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {!latestInsight ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl my-4">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold">No diagnostic report yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                  Click &ldquo;Run AI Advisor&rdquo; to analyze your task velocity, quiz scores, and spaced repetition curves.
                </p>
                <button
                  onClick={handleGenerateAdvisorInsights}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition"
                >
                  {isGenerating ? "Analyzing..." : "Generate Insights"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 my-2">
                {/* Executive Summary */}
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {latestInsight.summary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Strengths */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Observed Strengths
                    </span>
                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                      {latestInsight.strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Vulnerabilities */}
                  <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30">
                    <span className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Knowledge Vulnerabilities
                    </span>
                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                      {latestInsight.weaknesses.map((wk, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-500 mt-0.5">•</span>
                          <span>{wk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/30 text-xs">
                  <span className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 mb-2">
                    <Target className="w-3.5 h-3.5" />
                    Prescriptive Next Steps for Today
                  </span>
                  <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                    {latestInsight.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{i + 1}.</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: RETENTION & LEITNER MEMORY DISTRIBUTION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              Spaced Repetition Memory Distribution (Leitner 5-Box Curve)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks how knowledge moves from vulnerable working memory (Box 1) to permanent retention (Box 5).
            </p>
          </div>
          <Link
            href="/flashcards"
            className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            Review Flashcards
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Box distribution columns */}
        <div className="grid grid-cols-5 gap-3 pt-2">
          {[
            { box: 1, label: "Box 1: Novice", sub: "10 min interval", color: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
            { box: 2, label: "Box 2: Developing", sub: "1 day interval", color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
            { box: 3, label: "Box 3: Familiar", sub: "3 days interval", color: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
            { box: 4, label: "Box 4: Mastered", sub: "7 days interval", color: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400" },
            { box: 5, label: "Box 5: Permanent", sub: "16 days interval", color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
          ].map((item) => {
            const count = (analytics?.flashcards.boxDistribution as any)?.[item.box] ?? 0;
            const total = analytics?.flashcards.total || 1;
            const pct = Math.round((count / total) * 100);

            return (
              <div
                key={item.box}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col justify-between text-center"
              >
                <div>
                  <span className={`text-[11px] font-bold block ${item.text}`}>{item.label}</span>
                  <span className="text-[10px] text-slate-400 block mb-3">{item.sub}</span>
                </div>

                <div>
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{pct}% of cards</span>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                    <div className={`${item.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 3: SUBJECT MASTERY MATRIX */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Subject Performance Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Task completion rate and quiz accuracy broken down by study subject.
            </p>
          </div>
          <Link
            href="/subjects"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Manage Subjects
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {analytics?.subjects.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No subjects enrolled yet. Add subjects to see category-level diagnostics.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics?.subjects.map((s) => (
              <div
                key={s._id}
                className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: s.color || "#6366f1" }}
                    />
                    <h3 className="font-semibold text-sm truncate">{s.name}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Task Rate</span>
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      {s.taskCompletionRate}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {s.tasksCount} total tasks
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Quiz Accuracy</span>
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      {s.quizAccuracy !== null ? `${s.quizAccuracy}%` : "No tests"}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {s.notesCount} notes, {s.docsCount} PDFs
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 4: ASSESSMENT HISTORY & RECENT EXAM SCORES */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              Recent Assessment Scores
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              History of completed quizzes and performance scores.
            </p>
          </div>
          <Link
            href="/quizzes"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            All Quizzes
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {analytics?.quizzes.history.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No completed assessments yet. Take a practice quiz in Quizzes to track your score history!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {analytics?.quizzes.history.map((quiz, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm truncate">{quiz.title}</h4>
                    <span className="text-[11px] text-slate-400">
                      {new Date(quiz.createdAt).toLocaleDateString()} • {quiz.score} / {quiz.total} correct
                    </span>
                  </div>
                </div>

                <span
                  className={`font-bold px-2.5 py-1 rounded-full ${
                    quiz.percentage >= 80
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : quiz.percentage >= 60
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {quiz.percentage}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
