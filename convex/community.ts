import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string; name?: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/** Get all publicly shared flashcard decks */
export const getPublicDecks = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let decks = await ctx.db
      .query("flashcardDecks")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .collect();

    if (args.search && args.search.trim()) {
      const q = args.search.toLowerCase().trim();
      decks = decks.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          (d.subjectName && d.subjectName.toLowerCase().includes(q))
      );
    }

    return decks;
  },
});

/** Preview cards inside a public deck */
export const getPublicDeckCards = query({
  args: { deckId: v.id("flashcardDecks") },
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck || !deck.isPublic) return null;

    const cards = await ctx.db
      .query("flashcards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    return {
      ...deck,
      cards,
    };
  },
});

/** Get all publicly shared study notes */
export const getPublicNotes = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let notes = await ctx.db
      .query("notes")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .collect();

    if (args.search && args.search.trim()) {
      const q = args.search.toLowerCase().trim();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.subjectName && n.subjectName.toLowerCase().includes(q))
      );
    }

    return notes;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fork / Clone a public deck into the authenticated user's personal flashcards library.
 * Resets Leitner Box to 1 and schedules cards for immediate active recall.
 */
export const cloneDeck = mutation({
  args: { deckId: v.id("flashcardDecks") },
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx);
    const sourceDeck = await ctx.db.get(args.deckId);
    if (!sourceDeck || !sourceDeck.isPublic) throw new Error("Deck not available for cloning");

    const sourceCards = await ctx.db
      .query("flashcards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    const now = Date.now();

    // Create cloned deck in student's account
    const newDeckId = await ctx.db.insert("flashcardDecks", {
      userId: identity.subject,
      title: `${sourceDeck.title} (Forked)`,
      description: sourceDeck.description,
      subjectName: sourceDeck.subjectName,
      cardCount: sourceCards.length,
      masteredCount: 0,
      isPublic: false,
      createdAt: now,
    });

    // Copy cards into new deck with fresh Leitner state
    for (const card of sourceCards) {
      await ctx.db.insert("flashcards", {
        deckId: newDeckId,
        userId: identity.subject,
        front: card.front,
        back: card.back,
        box: 1,
        nextReviewDate: now,
        reviewCount: 0,
        correctStreak: 0,
      });
    }

    // Increment fork count on source deck
    await ctx.db.patch(args.deckId, {
      forksCount: (sourceDeck.forksCount || 0) + 1,
    });

    return newDeckId;
  },
});

/** Toggle sharing visibility of a deck */
export const toggleShareDeck = mutation({
  args: {
    deckId: v.id("flashcardDecks"),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx);
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== identity.subject) throw new Error("Forbidden");

    return await ctx.db.patch(args.deckId, {
      isPublic: args.isPublic,
      authorName: args.isPublic ? (identity.name || "StudyMate Scholar") : undefined,
    });
  },
});

/** Copy a public note into personal notes */
export const cloneNote = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx);
    const sourceNote = await ctx.db.get(args.noteId);
    if (!sourceNote || !sourceNote.isPublic) throw new Error("Note not available for copying");

    return await ctx.db.insert("notes", {
      userId: identity.subject,
      title: `${sourceNote.title} (Forked)`,
      content: sourceNote.content,
      subjectName: sourceNote.subjectName,
      isPublic: false,
    });
  },
});

/** Toggle sharing visibility of a note */
export const toggleShareNote = mutation({
  args: {
    noteId: v.id("notes"),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== identity.subject) throw new Error("Forbidden");

    return await ctx.db.patch(args.noteId, {
      isPublic: args.isPublic,
      authorName: args.isPublic ? (identity.name || "StudyMate Scholar") : undefined,
    });
  },
});
