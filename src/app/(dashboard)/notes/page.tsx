"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Modal } from "@/components/Modal";
import { Plus, FileText, Tag, Trash2, Loader2, Search, Share2, Globe } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

export default function NotesPage() {
  const notes = useQuery(api.notes.getNotes);
  const subjects = useQuery(api.subjects.getSubjects);
  const createNote = useMutation(api.notes.createNote);
  const deleteNote = useMutation(api.notes.deleteNote);
  const toggleShareNote = useMutation(api.community.toggleShareNote);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<Id<"notes"> | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await createNote({
        title: title.trim(),
        content: content.trim(),
        subjectName: subjectName || undefined,
      });
      setTitle("");
      setContent("");
      setSubjectName("");
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"notes">) => {
    setDeletingId(id);
    try {
      await deleteNote({ id });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredNotes = notes?.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      (n.subjectName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {notes === undefined ? "Loading..." : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Note
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Loading */}
      {notes === undefined && (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading notes...
        </div>
      )}

      {/* Empty state */}
      {notes !== undefined && notes.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">No notes yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-4">Create your first study note</p>
          <button onClick={() => setIsModalOpen(true)} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            + Create Note
          </button>
        </div>
      )}

      {/* Notes list */}
      {filteredNotes && filteredNotes.length > 0 && (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-xl shadow-sm hover:border-indigo-500/40 transition-colors group flex gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <h3 className="text-lg font-bold truncate">{note.title}</h3>
                    {note.isPublic && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full shrink-0">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleShareNote({ noteId: note._id, isPublic: !note.isPublic })}
                      className={`p-1 rounded-md transition ${
                        note.isPublic
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      }`}
                      title={note.isPublic ? "Unshare from Community" : "Share with Community Hub"}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(note._id)}
                      disabled={deletingId === note._id}
                      className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      {deletingId === note._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {note.content && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-2">{note.content}</p>
                )}
                {note.subjectName && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-3 rounded-md bg-slate-100 dark:bg-white/10 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <Tag className="w-3 h-3" />
                    {note.subjectName}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search returned nothing */}
      {filteredNotes !== undefined && notes !== undefined && notes.length > 0 && filteredNotes.length === 0 && (
        <p className="text-center text-slate-400 py-12">No notes match your search.</p>
      )}

      {/* Create Note Modal */}
      <Modal title="Create Note" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              autoFocus
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              rows={5}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subject <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <select
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="">No subject</option>
              {subjects?.map((s) => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !title.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Note
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
