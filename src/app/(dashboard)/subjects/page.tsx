"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Modal } from "@/components/Modal";
import { Plus, BookOpen, Trash2, Loader2 } from "lucide-react";

const COLORS = [
  { label: "Indigo", value: "indigo" },
  { label: "Purple", value: "purple" },
  { label: "Blue", value: "blue" },
  { label: "Green", value: "green" },
  { label: "Orange", value: "orange" },
  { label: "Pink", value: "pink" },
  { label: "Red", value: "red" },
];

const colorClasses: Record<string, { bg: string; text: string; dot: string }> = {
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500", dot: "bg-indigo-500" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500", dot: "bg-purple-500" },
  blue:   { bg: "bg-blue-500/10",   text: "text-blue-500",   dot: "bg-blue-500"   },
  green:  { bg: "bg-green-500/10",  text: "text-green-500",  dot: "bg-green-500"  },
  orange: { bg: "bg-orange-500/10", text: "text-orange-500", dot: "bg-orange-500" },
  pink:   { bg: "bg-pink-500/10",   text: "text-pink-500",   dot: "bg-pink-500"   },
  red:    { bg: "bg-red-500/10",    text: "text-red-500",    dot: "bg-red-500"    },
};

export default function SubjectsPage() {
  const subjects = useQuery(api.subjects.getSubjects);
  const createSubject = useMutation(api.subjects.createSubject);
  const deleteSubject = useMutation(api.subjects.deleteSubject);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("indigo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await createSubject({ name: name.trim(), color });
      setName("");
      setColor("indigo");
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {subjects === undefined ? "Loading..." : `${subjects.length} subject${subjects.length !== 1 ? "s" : ""} added`}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Loading state */}
      {subjects === undefined && (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading subjects...
        </div>
      )}

      {/* Empty state */}
      {subjects !== undefined && subjects.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">No subjects yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-4">Add your first subject to get started</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            + Add Subject
          </button>
        </div>
      )}

      {/* Subject grid */}
      {subjects && subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const c = colorClasses[subject.color] ?? colorClasses.indigo;
            return (
              <div
                key={subject._id}
                className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <BookOpen className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <button
                    onClick={() => deleteSubject({ id: subject._id })}
                    className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-xl font-bold mb-2">{subject.name}</h3>
                <div className="flex items-center gap-2 mt-4">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className="text-xs text-slate-400 capitalize">{subject.color}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Subject Modal */}
      <Modal title="Add New Subject" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subject Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Data Structures"
              autoFocus
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => {
                const cls = colorClasses[c.value];
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-full ${cls.dot} ring-offset-2 ring-offset-white dark:ring-offset-slate-900 transition-all ${color === c.value ? "ring-2 ring-slate-900 dark:ring-white scale-110" : "opacity-60 hover:opacity-100"}`}
                    title={c.label}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Subject
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
