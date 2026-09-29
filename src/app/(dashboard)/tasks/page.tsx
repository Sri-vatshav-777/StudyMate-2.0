"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Modal } from "@/components/Modal";
import { Plus, Check, Clock, Calendar, Trash2, Loader2 } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

const PRIORITIES = ["low", "medium", "high"] as const;

const priorityColor: Record<string, string> = {
  high:   "text-red-500 bg-red-500/10 border-red-500/20",
  medium: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  low:    "text-blue-500 bg-blue-500/10 border-blue-500/20",
};

export default function TasksPage() {
  const tasks = useQuery(api.tasks.getTasks);
  const subjects = useQuery(api.subjects.getSubjects);
  const createTask = useMutation(api.tasks.createTask);
  const toggleStatus = useMutation(api.tasks.toggleTaskStatus);
  const deleteTask = useMutation(api.tasks.deleteTask);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<Id<"tasks"> | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await createTask({ title: title.trim(), subject, dueDate, priority, status: "pending" });
      setTitle(""); setSubject(""); setDueDate(""); setPriority("medium");
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"tasks">) => {
    setDeletingId(id);
    try { await deleteTask({ id }); } finally { setDeletingId(null); }
  };

  const pending = tasks?.filter((t) => t.status === "pending") ?? [];
  const completed = tasks?.filter((t) => t.status === "completed") ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {tasks === undefined ? "Loading..." : `${pending.length} pending · ${completed.length} completed`}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {tasks === undefined && (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading tasks...
        </div>
      )}

      {tasks !== undefined && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center">
          <Check className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">No tasks yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-4">Add your first task to stay on track</p>
          <button onClick={() => setIsModalOpen(true)} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            + Add Task
          </button>
        </div>
      )}

      {tasks && tasks.length > 0 && (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 p-4 border-b border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-500 bg-slate-50 dark:bg-white/5">
            <div className="w-6" />
            <div>Task</div>
            <div className="hidden md:block w-40">Due Date</div>
            <div className="w-20 text-right">Priority</div>
            <div className="w-6" />
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {tasks.map((task) => (
              <div
                key={task._id}
                className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 p-4 items-center transition-colors hover:bg-slate-50 dark:hover:bg-white/5 group ${task.status === "completed" ? "opacity-50" : ""}`}
              >
                <button
                  onClick={() => toggleStatus({ id: task._id, status: task.status === "completed" ? "pending" : "completed" })}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${task.status === "completed" ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-300 dark:border-slate-600 hover:border-indigo-500"}`}
                >
                  {task.status === "completed" && <Check className="w-3.5 h-3.5" />}
                </button>

                <div className="min-w-0">
                  <p className={`font-medium truncate ${task.status === "completed" ? "line-through text-slate-400" : ""}`}>
                    {task.title}
                  </p>
                  {task.subject && <p className="text-xs text-slate-400 mt-0.5">{task.subject}</p>}
                </div>

                <div className="hidden md:flex items-center gap-1.5 text-sm text-slate-400 w-40">
                  {task.dueDate
                    ? <><Calendar className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{task.dueDate}</span></>
                    : <span className="text-slate-300">No date</span>
                  }
                </div>

                <div className="w-20 text-right">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border capitalize ${priorityColor[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(task._id)}
                  disabled={deletingId === task._id}
                  className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  {deletingId === task._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal title="Add New Task" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete DBMS assignment"
              autoFocus
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject <span className="text-slate-400 font-normal">(optional)</span></label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="">No subject</option>
              {subjects?.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${priority === p ? `${priorityColor[p]} border-current` : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !title.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
