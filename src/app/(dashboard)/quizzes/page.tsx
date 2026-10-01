"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import {
  HelpCircle,
  Sparkles,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ChevronRight,
  RotateCcw,
  Trash2,
  FileText,
  BookOpen,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Loader2,
} from "lucide-react";

export default function QuizzesPage() {
  const quizzes = useQuery(api.quizzes.getQuizzes);
  const subjects = useQuery(api.subjects.getSubjects);
  const documents = useQuery(api.documents.getDocuments);

  const deleteQuiz = useMutation(api.quizzes.deleteQuiz);
  const submitQuiz = useMutation(api.quizzes.submitQuiz);

  // Generator modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  // Active quiz taking state
  const [activeQuizId, setActiveQuizId] = useState<Id<"quizzes"> | null>(null);
  const activeQuizData = useQuery(
    api.quizzes.getQuizWithQuestions,
    activeQuizId ? { quizId: activeQuizId } : "skip"
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; total: number; percentage: number } | null>(null);

  // Initialize active quiz state when opened
  useEffect(() => {
    if (activeQuizData) {
      setCurrentQuestionIndex(0);
      setQuizStartTime(Date.now());
      if (activeQuizData.completed) {
        setQuizCompleted(true);
        // Load previous answers
        const prevAnswers: Record<string, number> = {};
        for (const q of activeQuizData.questions) {
          if (q.userAnswer !== undefined) {
            prevAnswers[q._id] = q.userAnswer;
          }
        }
        setSelectedAnswers(prevAnswers);
      } else {
        setQuizCompleted(false);
        setSelectedAnswers({});
        setQuizResult(null);
      }
    }
  }, [activeQuizId, activeQuizData?.completed]);

  // Handle quiz generation
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isGenerating) return;

    try {
      setIsGenerating(true);
      setGenerationError("");

      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          subjectName: selectedSubject || undefined,
          documentId: selectedDocId || undefined,
          difficulty,
          questionCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate quiz.");
      }

      setIsGeneratorOpen(false);
      setTopic("");
      setSelectedSubject("");
      setSelectedDocId("");
      // Launch newly generated quiz immediately!
      setActiveQuizId(data.quizId);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Failed to generate quiz.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle answer selection
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (quizCompleted) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Submit active quiz
  const handleSubmitQuiz = async () => {
    if (!activeQuizId || !activeQuizData || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const answersPayload = activeQuizData.questions.map((q) => ({
        questionId: q._id,
        userAnswer: selectedAnswers[q._id] !== undefined ? selectedAnswers[q._id] : -1,
      }));

      const elapsedSeconds = quizStartTime ? Math.round((Date.now() - quizStartTime) / 1000) : 0;

      const result = await submitQuiz({
        quizId: activeQuizId,
        answers: answersPayload,
        timeSpentSeconds: elapsedSeconds,
      });

      setQuizResult(result);
      setQuizCompleted(true);
    } catch (err: any) {
      alert("Failed to submit quiz: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute stats
  const completedQuizzes = quizzes?.filter((q) => q.completed) ?? [];
  const totalScorePercent = completedQuizzes.length > 0
    ? Math.round(
        (completedQuizzes.reduce((acc, q) => acc + (q.score ?? 0) / q.totalQuestions, 0) /
          completedQuizzes.length) *
          100
      )
    : 0;

  const currentQuestion = activeQuizData?.questions[currentQuestionIndex];
  const allAnswered = activeQuizData?.questions.every((q) => selectedAnswers[q._id] !== undefined) ?? false;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Quizzes & Assessments</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Generate practice exams from your subjects, notes, or uploaded textbook PDFs.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsGeneratorOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-sm flex items-center gap-2 text-sm"
        >
          <Sparkles className="w-4 h-4" />
          Generate New Quiz
        </button>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400">Total Created</span>
          </div>
          <h3 className="text-2xl font-bold">{quizzes?.length ?? 0}</h3>
          <p className="text-xs text-slate-500 mt-1">Generated assessments</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400">Completed</span>
          </div>
          <h3 className="text-2xl font-bold">{completedQuizzes.length}</h3>
          <p className="text-xs text-slate-500 mt-1">Tests finished & graded</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400">Avg. Mastery</span>
          </div>
          <h3 className="text-2xl font-bold">{totalScorePercent}%</h3>
          <p className="text-xs text-slate-500 mt-1">Overall test accuracy</p>
        </div>
      </div>

      {/* Quiz History Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-4">Your Assessments</h2>

        {quizzes === undefined ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <HelpCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No quizzes generated yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
              Create an AI practice exam on any topic or ground it with your uploaded study materials.
            </p>
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Your First Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => {
              const pct = quiz.completed && quiz.score !== undefined
                ? Math.round((quiz.score / quiz.totalQuestions) * 100)
                : null;

              return (
                <div
                  key={quiz._id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-indigo-500/40 bg-slate-50/50 dark:bg-white/[0.02] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {quiz.difficulty} • {quiz.totalQuestions} Questions
                      </span>
                      {quiz.completed ? (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            (pct ?? 0) >= 80
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : (pct ?? 0) >= 60
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {pct}% Score
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                          Uncompleted
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-sm line-clamp-1 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
                      Topic: {quiz.topic}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      {quiz.subjectName && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                          {quiz.subjectName}
                        </span>
                      )}
                      {quiz.documentId && (
                        <span className="flex items-center gap-1 text-indigo-500">
                          <FileText className="w-3 h-3" />
                          PDF Grounded
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                    <button
                      onClick={() => setActiveQuizId(quiz._id)}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {quiz.completed ? "Review Answers" : "Start Test"}
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete "${quiz.title}"?`)) {
                          deleteQuiz({ quizId: quiz._id });
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="Delete quiz"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: QUIZ GENERATOR WIZARD */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Generate AI Assessment</h3>
                  <p className="text-xs text-slate-500">Gemini will design an exam with realistic distractors</p>
                </div>
              </div>
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Topic or Concept to Test *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ACID Properties in DBMS, React Hooks, TCP Handshake..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  disabled={isGenerating}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subject (Optional)
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    <option value="">General / None</option>
                    {subjects?.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ground with PDF (RAG)
                  </label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    <option value="">No PDF Grounding</option>
                    {documents
                      ?.filter((d) => d.status === "ready")
                      .map((d) => (
                        <option key={d._id} value={d._id}>
                          📄 {d.fileName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    <option value="easy">Easy (Definitions & Basics)</option>
                    <option value="medium">Medium (Trade-offs & Applications)</option>
                    <option value="hard">Hard (Edge Cases & Problem Solving)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Questions Count
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    <option value={3}>3 Questions (Quick check)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={10}>10 Questions (Deep Assessment)</option>
                  </select>
                </div>
              </div>

              {generationError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                  {generationError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGeneratorOpen(false)}
                  disabled={isGenerating}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !topic.trim()}
                  className="px-5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Designing Assessment...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Create Quiz
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: LIVE TEST TAKING & REVIEW EXPERIENCE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeQuizId && activeQuizData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {activeQuizData.topic} • {activeQuizData.difficulty}
                  </span>
                  {quizCompleted && (
                    <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[11px] px-2 py-0.5 rounded-full font-bold">
                      Score: {activeQuizData.score ?? quizResult?.score ?? 0} / {activeQuizData.totalQuestions}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-base truncate mt-0.5">{activeQuizData.title}</h3>
              </div>
              <button
                onClick={() => setActiveQuizId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="px-5 pt-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>
                  Question {currentQuestionIndex + 1} of {activeQuizData.questions.length}
                </span>
                <span>
                  {Object.keys(selectedAnswers).length} answered
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                {activeQuizData.questions.map((q, idx) => (
                  <div
                    key={q._id}
                    className={`h-full flex-1 transition-all border-r border-white/20 ${
                      idx === currentQuestionIndex
                        ? "bg-indigo-600"
                        : selectedAnswers[q._id] !== undefined
                        ? "bg-indigo-400 dark:bg-indigo-500/70"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question Body */}
            {currentQuestion && (
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <div className="space-y-2">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {currentQuestionIndex + 1}. {currentQuestion.question}
                  </h4>
                </div>

                {/* 4 Options */}
                <div className="space-y-2.5">
                  {currentQuestion.options.map((optionText, optIdx) => {
                    const isSelected = selectedAnswers[currentQuestion._id] === optIdx;
                    const isCorrect = currentQuestion.correctAnswer === optIdx;
                    const showFeedback = quizCompleted;

                    let optionStyle = "border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/40";

                    if (showFeedback) {
                      if (isCorrect) {
                        optionStyle = "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-medium";
                      } else if (isSelected && !isCorrect) {
                        optionStyle = "border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200";
                      } else {
                        optionStyle = "border-slate-200 dark:border-slate-800 opacity-60";
                      }
                    } else if (isSelected) {
                      optionStyle = "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium ring-1 ring-indigo-600";
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQuestion._id, optIdx)}
                        disabled={quizCompleted}
                        className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3.5 ${optionStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            showFeedback && isCorrect
                              ? "bg-emerald-600 text-white"
                              : showFeedback && isSelected && !isCorrect
                              ? "bg-rose-600 text-white"
                              : isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {["A", "B", "C", "D"][optIdx]}
                        </span>
                        <span className="flex-1 leading-relaxed">{optionText}</span>

                        {showFeedback && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        {showFeedback && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box (Visible after submission) */}
                {quizCompleted && (
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                    <span className="font-semibold text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Pedagogical Explanation:
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-3.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 transition"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentQuestionIndex < activeQuizData.questions.length - 1 ? (
                  <button
                    onClick={() =>
                      setCurrentQuestionIndex((prev) =>
                        Math.min(activeQuizData.questions.length - 1, prev + 1)
                      )
                    }
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : !quizCompleted ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting || !allAnswered}
                    className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                    Submit & Grade Exam
                  </button>
                ) : (
                  <Link
                    href={`/ai-tutor`}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Deep Dive in AI Tutor
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
