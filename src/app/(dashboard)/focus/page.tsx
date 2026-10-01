"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Coffee,
  Brain,
  CheckCircle2,
  BookOpen,
  Calendar,
  Sparkles,
  Flame,
  Clock,
  Trash2,
} from "lucide-react";
import { playCompletionChime, startAmbientNoise, stopAmbientNoise } from "@/lib/audio";

const PRESETS = {
  focus: { label: "Deep Focus", minutes: 25 },
  deepFocus: { label: "Ultra Deep Work", minutes: 50 },
  shortBreak: { label: "Short Break", minutes: 5 },
  longBreak: { label: "Long Break", minutes: 15 },
};

export default function FocusPage() {
  const subjects = useQuery(api.subjects.getSubjects);
  const stats = useQuery(api.focus.getFocusStats);
  const recentSessions = useQuery(api.focus.getRecentSessions);

  const logFocusSession = useMutation(api.focus.logFocusSession);
  const deleteSession = useMutation(api.focus.deleteSession);

  // Timer configuration
  const [mode, setMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");

  // Sound state
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

  // Reflection modal on completion
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [reflectionText, setReflectionText] = useState("");

  // Interval timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync mode changes to duration
  const switchMode = (newMode: "focus" | "shortBreak" | "longBreak", mins?: number) => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);

    setMode(newMode);
    const m = mins || (newMode === "focus" ? 25 : newMode === "shortBreak" ? 5 : 15);
    setDurationMinutes(m);
    setTimeLeft(m * 60);
  };

  // Timer tick
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsActive(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, durationMinutes, mode, selectedSubject]);

  // Handle countdown hitting 00:00
  const handleTimerComplete = async () => {
    playCompletionChime();
    if (isAmbientPlaying) {
      stopAmbientNoise();
      setIsAmbientPlaying(false);
    }

    if (mode === "focus") {
      setIsReflectionOpen(true);
    } else {
      // Auto-log break completion
      await logFocusSession({
        durationMinutes,
        sessionType: mode === "shortBreak" ? "short_break" : "long_break",
        completed: true,
      });
      switchMode("focus", 25);
    }
  };

  // Save reflection and session
  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logFocusSession({
        subjectName: selectedSubject || undefined,
        durationMinutes,
        sessionType: "focus",
        completed: true,
        reflection: reflectionText.trim() || undefined,
      });

      setReflectionText("");
      setIsReflectionOpen(false);
      // Auto transition to short break!
      switchMode("shortBreak", 5);
    } catch (err: any) {
      alert("Failed to save session: " + err.message);
    }
  };

  // Toggle ambient focus sound
  const handleToggleAmbient = () => {
    if (isAmbientPlaying) {
      stopAmbientNoise();
      setIsAmbientPlaying(false);
    } else {
      startAmbientNoise("brown", 0.08);
      setIsAmbientPlaying(true);
    }
  };

  // Cleanup ambient noise on unmount
  useEffect(() => {
    return () => {
      stopAmbientNoise();
    };
  }, []);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalSeconds = durationMinutes * 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Pomodoro Study Timer</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Deep work intervals, built-in ambient focus noise, and study hour tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Ambient Sound Toggle Button */}
        <button
          onClick={handleToggleAmbient}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 border shadow-sm ${
            isAmbientPlaying
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
          }`}
          title="Toggle synthesized brown noise for concentration"
        >
          {isAmbientPlaying ? (
            <>
              <Volume2 className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Ambient Sound: Playing</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
              <span>Ambient Sound: Off</span>
            </>
          )}
        </button>
      </div>

      {/* Main Clock Card & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pomodoro Clock Box (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => switchMode("focus", 25)}
              className={`px-4 py-2 rounded-xl transition ${
                mode === "focus" && durationMinutes === 25
                  ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              🎯 Focus (25m)
            </button>
            <button
              onClick={() => switchMode("focus", 50)}
              className={`px-4 py-2 rounded-xl transition ${
                mode === "focus" && durationMinutes === 50
                  ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              🧠 Deep Work (50m)
            </button>
            <button
              onClick={() => switchMode("shortBreak", 5)}
              className={`px-4 py-2 rounded-xl transition ${
                mode === "shortBreak"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              ☕ Short Break (5m)
            </button>
            <button
              onClick={() => switchMode("longBreak", 15)}
              className={`px-4 py-2 rounded-xl transition ${
                mode === "longBreak"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              🌴 Long Break (15m)
            </button>
          </div>

          {/* Circular SVG Ring & Time Display */}
          <div className="relative w-72 h-72 flex items-center justify-center my-2">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background circle track */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="6"
                fill="none"
              />
              {/* Animated Progress ring */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`${
                  mode === "focus"
                    ? "stroke-rose-500"
                    : mode === "shortBreak"
                    ? "stroke-emerald-500"
                    : "stroke-blue-500"
                } transition-all duration-1000 ease-linear`}
                strokeWidth="6"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Inner Clock Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 mt-2">
                {mode === "focus" ? "Deep Focus Block" : "Rest & Recharge"}
              </span>
            </div>
          </div>

          {/* Subject Attachment Dropdown */}
          <div className="w-full max-w-xs">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isActive}
              className="w-full px-3.5 py-2 text-xs text-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Tag Subject (e.g. Operating Systems)</option>
              {subjects?.map((s) => (
                <option key={s._id} value={s.name}>
                  📚 {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timer Controls Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsActive(false);
                setTimeLeft(durationMinutes * 60);
              }}
              className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsActive((prev) => !prev)}
              className={`px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center gap-2 ${
                mode === "focus"
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                  : mode === "shortBreak"
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (confirm("Skip this interval?")) {
                  switchMode(mode === "focus" ? "shortBreak" : "focus");
                }
              }}
              className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition"
              title="Skip Interval"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Focus Metrics & Subject Hour Distribution (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Today&apos;s Focus
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                  {stats?.todayMinutes ?? 0}
                </span>
                <span className="text-xs text-slate-400">min</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Total Hours
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {stats?.totalHours ?? 0}
                </span>
                <span className="text-xs text-slate-400">hrs</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Blocks Completed
              </span>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {stats?.completedCount ?? 0}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Study Streak
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-3xl font-black text-amber-500">
                  {stats?.activeDaysCount ?? 0}
                </span>
                <Flame className="w-5 h-5 text-amber-500 fill-current" />
              </div>
            </div>
          </div>

          {/* Focused Hours by Subject */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Study Hours by Subject
            </h3>

            {(!stats?.subjectBreakdown || stats.subjectBreakdown.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Tag your study blocks with subjects to track hours per topic.
              </p>
            ) : (
              <div className="space-y-2.5">
                {stats.subjectBreakdown.map((subj, i) => {
                  const maxMins = Math.max(...stats.subjectBreakdown.map((s) => s.minutes), 1);
                  const pct = Math.round((subj.minutes / maxMins) * 100);

                  return (
                    <div key={i} className="text-xs space-y-1">
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span className="font-medium truncate">{subj.name}</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {subj.hours} hrs ({subj.minutes}m)
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions Log */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-3">Recent Focus Sessions</h2>

        {(!recentSessions || recentSessions.length === 0) ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No focus blocks completed yet. Hit &ldquo;Start Focus&rdquo; above to begin your first session!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentSessions.map((session) => (
              <div key={session._id} className="py-3.5 flex items-center justify-between text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {session.durationMinutes} min {session.sessionType === "focus" ? "Focus Block" : "Break"}
                      </span>
                      {session.subjectName && (
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[11px] font-medium">
                          {session.subjectName}
                        </span>
                      )}
                    </div>
                    {session.reflection && (
                      <p className="text-slate-600 dark:text-slate-400 mt-1 italic">
                        &ldquo;{session.reflection}&rdquo;
                      </p>
                    )}
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {new Date(session.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteSession({ id: session._id })}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                  title="Delete log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SESSION REFLECTION MODAL (Triggered when 25 min timer finishes) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isReflectionOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg">Focus Block Complete! 🎯</h3>
              <p className="text-xs text-slate-500">
                You logged {durationMinutes} minutes of focused study
                {selectedSubject ? ` on ${selectedSubject}` : ""}.
              </p>
            </div>

            <form onSubmit={handleSaveReflection} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  What did you accomplish in this session? (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Read 15 pages on TCP flow control and drafted lecture notes..."
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReflectionOpen(false);
                    switchMode("shortBreak", 5);
                  }}
                  className="flex-1 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Skip Reflection
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-sm"
                >
                  Log & Take Break
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
