"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import {
  Globe,
  Layers,
  BookOpen,
  Search,
  Copy,
  Check,
  Eye,
  GitFork,
  ArrowRight,
  Sparkles,
  User,
  Share2,
  FileText,
  Loader2,
} from "lucide-react";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"decks" | "notes">("decks");
  const [searchQuery, setSearchQuery] = useState("");

  const publicDecks = useQuery(api.community.getPublicDecks, { search: searchQuery || undefined });
  const publicNotes = useQuery(api.community.getPublicNotes, { search: searchQuery || undefined });

  const cloneDeck = useMutation(api.community.cloneDeck);
  const cloneNote = useMutation(api.community.cloneNote);

  // Deck Preview modal state
  const [previewDeckId, setPreviewDeckId] = useState<Id<"flashcardDecks"> | null>(null);
  const previewDeckData = useQuery(
    api.community.getPublicDeckCards,
    previewDeckId ? { deckId: previewDeckId } : "skip"
  );

  // Note Preview modal state
  const [previewNote, setPreviewNote] = useState<any | null>(null);

  // Cloning loading indicators
  const [cloningDeckId, setCloningDeckId] = useState<string | null>(null);
  const [clonedDeckSuccess, setClonedDeckSuccess] = useState<string | null>(null);
  const [cloningNoteId, setCloningNoteId] = useState<string | null>(null);
  const [clonedNoteSuccess, setClonedNoteSuccess] = useState<string | null>(null);

  const handleCloneDeck = async (deckId: Id<"flashcardDecks">) => {
    try {
      setCloningDeckId(deckId);
      await cloneDeck({ deckId });
      setClonedDeckSuccess(deckId);
      setTimeout(() => setClonedDeckSuccess(null), 3000);
    } catch (err: any) {
      alert("Failed to clone deck: " + err.message);
    } finally {
      setCloningDeckId(null);
    }
  };

  const handleCloneNote = async (noteId: Id<"notes">) => {
    try {
      setCloningNoteId(noteId);
      await cloneNote({ noteId });
      setClonedNoteSuccess(noteId);
      setTimeout(() => setClonedNoteSuccess(null), 3000);
    } catch (err: any) {
      alert("Failed to copy note: " + err.message);
    } finally {
      setCloningNoteId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Community Study Hub</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Discover, fork, and learn from shared flashcard decks and peer study notes.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("decks")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "decks"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Shared Decks ({publicDecks?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "notes"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Public Notes ({publicNotes?.length ?? 0})
          </button>
        </div>
      </div>

      {/* Search & Discover Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={
            activeTab === "decks"
              ? "Search shared flashcard decks by subject, topic, or keyword..."
              : "Search public revision notes and study summaries..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: SHARED FLASHCARD DECKS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "decks" && (
        <div>
          {publicDecks === undefined ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading community decks...</div>
          ) : publicDecks.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
              <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-semibold text-sm">No shared decks found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Be the first to publish a deck from your Flashcards library to the community hub!
              </p>
              <Link
                href="/flashcards"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition inline-flex items-center gap-1.5"
              >
                Go to Flashcards
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {publicDecks.map((deck) => (
                <div
                  key={deck._id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm hover:border-blue-500/40 transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {deck.cardCount} Flashcards
                      </span>
                      {deck.forksCount ? (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <GitFork className="w-3 h-3" />
                          {deck.forksCount} forks
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-bold text-sm line-clamp-1 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {deck.title}
                    </h3>
                    {deck.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {deck.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {deck.authorName || "StudyMate Scholar"}
                      </span>
                      {deck.subjectName && (
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                          {deck.subjectName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setPreviewDeckId(deck._id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>

                    <button
                      onClick={() => handleCloneDeck(deck._id)}
                      disabled={cloningDeckId === deck._id}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                      {cloningDeckId === deck._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : clonedDeckSuccess === deck._id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          Forked!
                        </>
                      ) : (
                        <>
                          <GitFork className="w-3.5 h-3.5" />
                          Fork to Library
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: PUBLIC STUDY NOTES */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "notes" && (
        <div>
          {publicNotes === undefined ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading public notes...</div>
          ) : publicNotes.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-semibold text-sm">No public notes published yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Share a revision guide or lecture summary from your Notes to inspire classmates.
              </p>
              <Link
                href="/notes"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition inline-flex items-center gap-1.5"
              >
                Go to Notes
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {publicNotes.map((note) => (
                <div
                  key={note._id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm hover:border-blue-500/40 transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {note.authorName || "StudyMate Scholar"}
                      </span>
                      {note.subjectName && (
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] px-2 py-0.5 rounded-md font-medium">
                          {note.subjectName}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm line-clamp-1 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {note.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-3">
                      {note.content}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setPreviewNote(note)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Read Note
                    </button>

                    <button
                      onClick={() => handleCloneNote(note._id)}
                      disabled={cloningNoteId === note._id}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm"
                    >
                      {cloningNoteId === note._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : clonedNoteSuccess === note._id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy to Notes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: PREVIEW DECK CARDS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {previewDeckId && previewDeckData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{previewDeckData.title}</h3>
                <span className="text-xs text-slate-400">
                  {previewDeckData.cards.length} cards • Shared by {previewDeckData.authorName || "Peer"}
                </span>
              </div>
              <button
                onClick={() => setPreviewDeckId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {previewDeckData.cards.map((c, i) => (
                <div
                  key={c._id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1.5"
                >
                  <span className="font-bold text-blue-600 dark:text-blue-400 block font-mono">
                    CARD {i + 1}
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{c.front}</p>
                  <p className="text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    {c.back}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setPreviewDeckId(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCloneDeck(previewDeckData._id);
                  setPreviewDeckId(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5"
              >
                <GitFork className="w-3.5 h-3.5" />
                Fork Deck to My Flashcards
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: READ PUBLIC NOTE MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {previewNote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{previewNote.title}</h3>
                <span className="text-xs text-slate-400">
                  By {previewNote.authorName || "Peer"} • {previewNote.subjectName || "General"}
                </span>
              </div>
              <button
                onClick={() => setPreviewNote(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {previewNote.content}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setPreviewNote(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCloneNote(previewNote._id);
                  setPreviewNote(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy to My Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
