"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Library, 
  Plus, 
  ArrowRight,
  Calendar,
  Check
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const tasks = useQuery(api.tasks.getTasks);
  const notes = useQuery(api.notes.getNotes);
  const subjects = useQuery(api.subjects.getSubjects);
  const toggleTaskStatus = useMutation(api.tasks.toggleTaskStatus);

  const pendingTasks = tasks?.filter((t) => t.status === "pending") ?? [];
  const completedTasks = tasks?.filter((t) => t.status === "completed") ?? [];

  const handleToggle = async (id: Id<"tasks">, currentStatus: string) => {
    await toggleTaskStatus({
      id,
      status: currentStatus === "completed" ? "pending" : "completed",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName ?? "Scholar"}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here is your live study progress and upcoming tasks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/tasks"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Task
          </Link>
          <Link
            href="/notes"
            className="bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <BookOpen className="w-4 h-4" />
            New Note
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Library className="w-5 h-5" />
            </div>
            <Link href="/subjects" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <h3 className="text-3xl font-bold mb-1">
            {subjects === undefined ? "..." : subjects.length}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Enrolled Subjects</p>
          <p className="text-xs text-slate-400 mt-1">Organized study categories</p>
        </div>

        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <Link href="/notes" className="text-xs text-purple-500 hover:underline flex items-center gap-1">
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <h3 className="text-3xl font-bold mb-1">
            {notes === undefined ? "..." : notes.length}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Notes Saved</p>
          <p className="text-xs text-slate-400 mt-1">Class notes & summaries</p>
        </div>

        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
            <Link href="/tasks" className="text-xs text-amber-500 hover:underline flex items-center gap-1">
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <h3 className="text-3xl font-bold mb-1">
            {tasks === undefined ? "..." : pendingTasks.length}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Pending Tasks</p>
          <p className="text-xs text-slate-400 mt-1">Due for completion</p>
        </div>

        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <Link href="/tasks" className="text-xs text-green-500 hover:underline flex items-center gap-1">
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <h3 className="text-3xl font-bold mb-1">
            {tasks === undefined ? "..." : completedTasks.length}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Tasks Completed</p>
          <p className="text-xs text-slate-400 mt-1">Accomplished study goals</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column (Recent Notes) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Notes</h2>
              <Link href="/notes" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                View all
              </Link>
            </div>

            {notes === undefined ? (
              <p className="text-sm text-slate-400 py-8 text-center">Loading notes...</p>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-center p-6">
                <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500">No notes written yet.</p>
                <Link href="/notes" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2">
                  + Create your first note
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.slice(0, 4).map((note) => (
                  <Link
                    key={note._id}
                    href="/notes"
                    className="p-4 rounded-xl border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-start gap-4 block group"
                  >
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {note.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {note.content || "Empty note"}
                      </p>
                      {note.subjectName && (
                        <span className="inline-block mt-2 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                          {note.subjectName}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column (Upcoming Tasks) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upcoming Tasks</h2>
              <Link href="/tasks" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                View all
              </Link>
            </div>

            {tasks === undefined ? (
              <p className="text-sm text-slate-400 py-8 text-center">Loading tasks...</p>
            ) : pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-center p-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="text-sm text-slate-500">All caught up! No pending tasks.</p>
                <Link href="/tasks" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2">
                  + Add a new task
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div
                    key={task._id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5 group"
                  >
                    <button
                      onClick={() => handleToggle(task._id, task.status)}
                      className="mt-0.5 w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 text-transparent group-hover:text-indigo-400 transition-colors" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.dueDate && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {task.dueDate}
                          </span>
                        )}
                        {task.subject && (
                          <span className="text-[11px] text-indigo-500 font-medium truncate">
                            • {task.subject}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
