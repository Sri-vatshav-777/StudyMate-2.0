"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  Plus,
  RotateCw,
  Clock,
  CheckCircle2,
  Trash2,
  FileText,
  BookOpen,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Loader2,
  RotateCcw,
  Zap,
  Globe,
  Share2,
} from "lucide-react";

export default function FlashcardsPage() {
  const decks = useQuery(api.flashcards.getDecks);
  const subjects = useQuery(api.subjects.getSubjects);
  const documents = useQuery(api.documents.getDocuments);
  const dueCount = useQuery(api.flashcards.getDueCardsCount);

  const deleteDeck = useMutation(api.flashcards.deleteDeck);
  const reviewCard = useMutation(api.flashcards.reviewCard);
  const addCard = useMutation(api.flashcards.addCard);
  const toggleShareDeck = useMutation(api.community.toggleShareDeck);

  // Generator modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [cardCount, setCardCount] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  // Add card modal state
  const [addingCardToDeckId, setAddingCardToDeckId] = useState<Id<"flashcardDecks"> | null>(null);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [isSavingCard, setIsSavingCard] = useState(false);

  // Active study mode state
  const [studyingDeckId, setStudyingDeckId] = useState<Id<"flashcardDecks"> | null>(null);
  const activeDeckData = useQuery(
    api.flashcards.getDeckWithCards,
    studyingDeckId ? { deckId: studyingDeckId } : "skip"
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedInSession, setReviewedInSession] = useState<number>(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Reset study session state on deck change
  useEffect(() => {
    if (activeDeckData) {
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setReviewedInSession(0);
      setSessionCompleted(false);
    }
  }, [studyingDeckId]);

  // Handle deck AI generation
  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isGenerating) return;

    try {
      setIsGenerating(true);
      setGenerationError("");

      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          subjectName: selectedSubject || undefined,
          documentId: selectedDocId || undefined,
          cardCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate flashcard deck.");
      }

      setIsGeneratorOpen(false);
      setTopic("");
      setSelectedSubject("");
      setSelectedDocId("");
      // Launch newly generated deck in study mode immediately!
      setStudyingDeckId(data.deckId);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Failed to generate deck.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle adding custom manual card
  const handleAddManualCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingCardToDeckId || !newFront.trim() || !newBack.trim() || isSavingCard) return;

    try {
      setIsSavingCard(true);
      await addCard({
        deckId: addingCardToDeckId,
        front: newFront.trim(),
        back: newBack.trim(),
      });
      setNewFront("");
      setNewBack("");
      setAddingCardToDeckId(null);
    } catch (err: any) {
      alert("Failed to add card: " + err.message);
    } finally {
      setIsSavingCard(false);
    }
  };

  // Handle card review rating
  const handleGradeCard = async (grade: "again" | "good" | "easy") => {
    if (!activeDeckData || !activeDeckData.cards[currentCardIndex]) return;

    const currentCard = activeDeckData.cards[currentCardIndex];
    try {
      await reviewCard({
        cardId: currentCard._id,
        grade,
      });

      setReviewedInSession((prev) => prev + 1);

      // Advance to next card or complete session
      if (currentCardIndex < activeDeckData.cards.length - 1) {
        setIsFlipped(false);
        setCurrentCardIndex((prev) => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    } catch (err: any) {
      console.error("Failed to record review:", err);
    }
  };

  // Keyboard shortcut listener for study mode (Space to flip, 1/2/3 to grade)
  useEffect(() => {
    if (!studyingDeckId || sessionCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") handleGradeCard("again");
        if (e.key === "2") handleGradeCard("good");
        if (e.key === "3") handleGradeCard("easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [studyingDeckId, isFlipped, currentCardIndex, sessionCompleted]);

  // Overall totals
  const totalCards = decks?.reduce((acc, d) => acc + d.cardCount, 0) ?? 0;
  const totalMastered = decks?.reduce((acc, d) => acc + d.masteredCount, 0) ?? 0;
  const currentCard = activeDeckData?.cards[currentCardIndex];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Flashcards & Spaced Repetition</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Master core terms and concepts using the scientifically backed Leitner 5-box algorithm.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsGeneratorOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-sm flex items-center gap-2 text-sm"
        >
          <Sparkles className="w-4 h-4" />
          Generate Deck with AI
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400">Decks</span>
          </div>
          <h3 className="text-2xl font-bold">{decks?.length ?? 0}</h3>
          <p className="text-xs text-slate-500 mt-1">Study collections</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400">Total Cards</span>
          </div>
          <h3 className="text-2xl font-bold">{totalCards}</h3>
          <p className="text-xs text-slate-500 mt-1">Flashcards created</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400">Due for Review</span>
          </div>
          <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {dueCount ?? 0}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Ready for study today</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400">Mastered (Box 4+)</span>
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {totalMastered}
          </h3>
          <p className="text-xs text-slate-500 mt-1">In long-term memory</p>
        </div>
      </div>

      {/* Decks Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-4">Your Flashcard Decks</h2>

        {decks === undefined ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading decks...</div>
        ) : decks.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Layers className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No flashcard decks yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
              Generate a high-yield study deck with Gemini AI or create custom cards for active recall.
            </p>
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-medium transition inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Your First Deck
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {decks.map((deck) => {
              const masteryPercent = deck.cardCount > 0
                ? Math.round((deck.masteredCount / deck.cardCount) * 100)
                : 0;

              return (
                <div
                  key={deck._id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-purple-500/40 bg-slate-50/50 dark:bg-white/[0.02] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          {deck.cardCount} Cards
                        </span>
                        {deck.isPublic && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                            <Globe className="w-3 h-3" />
                            Public
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {masteryPercent}% Mastered
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm line-clamp-1 mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {deck.title}
                    </h3>
                    {deck.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                        {deck.description}
                      </p>
                    )}

                    {/* Mastery Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${masteryPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      {deck.subjectName && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                          {deck.subjectName}
                        </span>
                      )}
                      {deck.documentId && (
                        <span className="flex items-center gap-1 text-purple-500">
                          <FileText className="w-3 h-3" />
                          PDF Grounded
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStudyingDeckId(deck._id)}
                        className="px-3.5 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm"
                      >
                        Study Deck
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setAddingCardToDeckId(deck._id)}
                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition"
                        title="Add card"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleShareDeck({ deckId: deck._id, isPublic: !deck.isPublic })}
                        className={`p-1.5 rounded-lg transition ${
                          deck.isPublic
                            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
                            : "text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        }`}
                        title={deck.isPublic ? "Unshare from Community Hub" : "Share with Community Hub"}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete deck "${deck.title}" and all its flashcards?`)) {
                            deleteDeck({ deckId: deck._id });
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Delete deck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: AI DECK GENERATOR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Generate Flashcards with AI</h3>
                  <p className="text-xs text-slate-500">Gemini will distill high-yield recall prompts</p>
                </div>
              </div>
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Topic / Conceptual Area *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operating System Deadlocks, OSI 7 Layers, SQL Window Functions..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  disabled={isGenerating}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Deck Size
                </label>
                <select
                  value={cardCount}
                  onChange={(e) => setCardCount(Number(e.target.value))}
                  disabled={isGenerating}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  <option value={5}>5 Cards (Bite-sized review)</option>
                  <option value={8}>8 Cards (Standard deck)</option>
                  <option value={12}>12 Cards (Comprehensive deck)</option>
                  <option value={15}>15 Cards (Deep mastery)</option>
                </select>
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
                  className="px-5 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Synthesizing Flashcards...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Create Deck
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: ADD MANUAL CARD MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {addingCardToDeckId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Add New Flashcard</h3>
              <button
                onClick={() => setAddingCardToDeckId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualCard} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Front (Prompt / Term)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. What is Cache Invalidation?"
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Back (Definition / Answer)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. The process of purging obsolete entries from a cache when underlying data changes."
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddingCardToDeckId(null)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCard || !newFront.trim() || !newBack.trim()}
                  className="px-4 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition"
                >
                  {isSavingCard ? "Saving..." : "Add Flashcard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: 3D FLIP CARD INTERACTIVE STUDY RUNNER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {studyingDeckId && activeDeckData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl p-6 space-y-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base truncate">{activeDeckData.title}</h3>
                <span className="text-xs text-slate-400">
                  Card {currentCardIndex + 1} of {activeDeckData.cards.length}
                </span>
              </div>
              <button
                onClick={() => setStudyingDeckId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-purple-600 h-full transition-all duration-300"
                style={{
                  width: `${((currentCardIndex + 1) / activeDeckData.cards.length) * 100}%`,
                }}
              />
            </div>

            {!sessionCompleted && currentCard ? (
              <>
                {/* 3D Flip Card Container */}
                <div
                  onClick={() => setIsFlipped((prev) => !prev)}
                  className="w-full min-h-[260px] cursor-pointer select-none perspective-[1000px] flex items-center justify-center"
                >
                  <div
                    className={`relative w-full h-[260px] rounded-2xl border transition-all duration-500 shadow-sm p-8 flex flex-col justify-between ${
                      isFlipped
                        ? "bg-purple-50/60 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800/40 text-purple-950 dark:text-purple-100"
                        : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {/* Card Top Label */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono uppercase font-semibold text-[11px] text-purple-600 dark:text-purple-400">
                        {isFlipped ? "Answer / Back" : "Prompt / Front"}
                      </span>
                      <span className="text-[11px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        Leitner Box {currentCard.box}
                      </span>
                    </div>

                    {/* Card Content Text */}
                    <div className="my-auto text-center">
                      <p className="text-base sm:text-lg font-medium leading-relaxed">
                        {isFlipped ? currentCard.back : currentCard.front}
                      </p>
                    </div>

                    {/* Card Footer Hint */}
                    <div className="text-center text-[11px] text-slate-400">
                      {isFlipped
                        ? "Rate recall accuracy below (or keys 1, 2, 3)"
                        : "Click anywhere or press Space to flip"}
                    </div>
                  </div>
                </div>

                {/* Leitner Spaced Repetition Rating Buttons */}
                <div className="space-y-2">
                  {isFlipped ? (
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleGradeCard("again")}
                        className="py-3 px-3 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-semibold text-xs flex flex-col items-center gap-1 transition"
                      >
                        <span>1. Hard / Again</span>
                        <span className="text-[10px] font-normal opacity-70">Reset to Box 1</span>
                      </button>

                      <button
                        onClick={() => handleGradeCard("good")}
                        className="py-3 px-3 rounded-xl border border-indigo-300 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-semibold text-xs flex flex-col items-center gap-1 transition"
                      >
                        <span>2. Good</span>
                        <span className="text-[10px] font-normal opacity-70">+1 Box</span>
                      </button>

                      <button
                        onClick={() => handleGradeCard("easy")}
                        className="py-3 px-3 rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-xs flex flex-col items-center gap-1 transition"
                      >
                        <span>3. Easy</span>
                        <span className="text-[10px] font-normal opacity-70">+2 Boxes</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reveal Answer (Space)
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Review Session Complete Screen */
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Session Complete! 🎉</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You reviewed {reviewedInSession} flashcard{reviewedInSession === 1 ? "" : "s"} in this deck. Next review intervals have been automatically rescheduled via the Leitner algorithm!
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setCurrentCardIndex(0);
                      setIsFlipped(false);
                      setSessionCompleted(false);
                    }}
                    className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Review Again
                  </button>
                  <button
                    onClick={() => setStudyingDeckId(null)}
                    className="px-5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
