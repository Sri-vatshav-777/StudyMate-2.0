"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Settings,
  User,
  Download,
  FileText,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Activity,
  Sliders,
  Volume2,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();

  const subjects = useQuery(api.subjects.getSubjects);
  const notes = useQuery(api.notes.getNotes);
  const documents = useQuery(api.documents.getDocuments);
  const tasks = useQuery(api.tasks.getTasks);
  const decks = useQuery(api.flashcards.getDecks);
  const quizzes = useQuery(api.quizzes.getQuizzes);
  const analytics = useQuery(api.analytics.getComprehensiveAnalytics);
  const focusStats = useQuery(api.focus.getFocusStats);

  // Preference states (stored in local storage)
  const [timerChimeDefault, setTimerChimeDefault] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("studymate_timer_chime") !== "false";
    }
    return true;
  });

  const [exportingNotes, setExportingNotes] = useState(false);
  const [exportingDecks, setExportingDecks] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Export Notes as Markdown document
  const handleExportNotesMarkdown = () => {
    if (!notes || notes.length === 0) {
      alert("No notes available to export.");
      return;
    }

    setExportingNotes(true);
    try {
      let md = `# StudyMate Notes Export\n`;
      md += `*Generated on: ${new Date().toLocaleDateString()} for ${user?.fullName || "Scholar"}*\n\n---\n\n`;

      notes.forEach((note, index) => {
        md += `## ${index + 1}. ${note.title}\n`;
        if (note.subjectName) md += `**Subject:** ${note.subjectName}\n\n`;
        md += `${note.content || "_No content_"}\n\n---\n\n`;
      });

      const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `studymate_notes_${Date.now()}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess("Notes exported successfully as Markdown (.md)!");
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err: any) {
      alert("Failed to export notes: " + err.message);
    } finally {
      setExportingNotes(false);
    }
  };

  // Export Flashcards as CSV (Anki compatible)
  const handleExportFlashcardsCSV = () => {
    if (!decks || decks.length === 0) {
      alert("No flashcard decks found to export.");
      return;
    }

    setExportingDecks(true);
    try {
      let csvContent = "Deck Name,Card Count,Mastered Count,Created At\n";

      decks.forEach((deck) => {
        const cleanTitle = `"${deck.title.replace(/"/g, '""')}"`;
        const createdAt = new Date(deck.createdAt).toISOString();
        csvContent += `${cleanTitle},${deck.cardCount},${deck.masteredCount},${createdAt}\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `studymate_flashcards_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess("Flashcard decks metadata exported as CSV!");
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err: any) {
      alert("Failed to export flashcards: " + err.message);
    } finally {
      setExportingDecks(false);
    }
  };

  const handleToggleTimerChime = (enabled: boolean) => {
    setTimerChimeDefault(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem("studymate_timer_chime", enabled ? "true" : "false");
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Platform Settings & Data</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage your profile, study preferences, data exports, and platform storage.
            </p>
          </div>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Profile & Preferences */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Profile Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Student Profile
            </h2>

            <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                {user?.firstName?.[0] || "S"}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                  {user?.fullName || "Scholar"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Authenticated with Clerk
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ID: {user?.id?.slice(0, 14)}...
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                <span className="text-[11px] text-slate-400 font-medium">Cognitive Health</span>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {analytics?.academicHealthScore ?? 0}/100
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                <span className="text-[11px] text-slate-400 font-medium">Focus Completed</span>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {focusStats?.totalMinutes ?? 0}m
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                <span className="text-[11px] text-slate-400 font-medium">Flashcards Mastered</span>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {analytics?.flashcards.mastered ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                <span className="text-[11px] text-slate-400 font-medium">Quizzes Completed</span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {quizzes?.length ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Data Export & Portability */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-500" />
              Data Export & Portability
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Download your study data anytime. Maintain ownership of all your generated notes and revision material.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm">Export Notes to Markdown</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                    Download all your structured class notes, summaries, and Markdown documents into a `.md` file.
                  </p>
                </div>
                <button
                  onClick={handleExportNotesMarkdown}
                  disabled={exportingNotes || !notes?.length}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  {exportingNotes ? "Exporting..." : `Download Notes (${notes?.length ?? 0})`}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm">Export Flashcard Decks</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                    Download study decks metadata and mastery progress formatted for spreadsheet analysis or backup.
                  </p>
                </div>
                <button
                  onClick={handleExportFlashcardsCSV}
                  disabled={exportingDecks || !decks?.length}
                  className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  {exportingDecks ? "Exporting..." : `Download Decks (${decks?.length ?? 0})`}
                </button>
              </div>
            </div>
          </div>

          {/* Study Audio Preferences */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-500" />
              Focus & Audio Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Customize synthesizer chime alerts and auditory focus environments.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Session Completion Chime</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Play high-resonance Web Audio API chime when Pomodoro interval completes.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleTimerChime(!timerChimeDefault)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    timerChimeDefault ? "bg-rose-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      timerChimeDefault ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Diagnostics & Architecture Overview */}
        <div className="space-y-6">
          {/* Storage & Counts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-500" />
              Platform Database Ledger
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500">Enrolled Subjects</span>
                <span className="font-bold text-slate-900 dark:text-white">{subjects?.length ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500">Vectorized Documents</span>
                <span className="font-bold text-slate-900 dark:text-white">{documents?.length ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500">Saved Notes</span>
                <span className="font-bold text-slate-900 dark:text-white">{notes?.length ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500">Active Tasks</span>
                <span className="font-bold text-slate-900 dark:text-white">{tasks?.length ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500">Flashcard Decks</span>
                <span className="font-bold text-slate-900 dark:text-white">{decks?.length ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500">Quiz Assessments</span>
                <span className="font-bold text-slate-900 dark:text-white">{quizzes?.length ?? 0}</span>
              </div>
            </div>
          </div>

          {/* System Health Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Engine Architecture
            </h2>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">AI Core Model</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Gemini 3.6 Flash</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Vector Embeddings</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">text-embedding-004</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">RAG Chunking</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">800 chars / 150 overlap</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Spaced Repetition</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Leitner 5-Box</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Realtime Cloud DB</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Convex Realtime Sync
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Authentication</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Clerk JWT Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
