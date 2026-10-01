import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity.subject;
}

// ─────────────────────────────────────────────────────────────────────────────
// SPACED REPETITION (LEITNER BOX INTERVALS)
// Intervals in milliseconds:
// Box 1: 10 minutes (immediate recall)
// Box 2: 1 day
// Box 3: 3 days
// Box 4: 7 days (Mastered tier)
// Box 5: 16 days (Long-term memory tier)
// ─────────────────────────────────────────────────────────────────────────────

const BOX_INTERVALS_MS: Record<number, number> = {
  1: 10 * 60 * 1000,
  2: 1 * 24 * 60 * 60 * 1000,
  3: 3 * 24 * 60 * 60 * 1000,
  4: 7 * 24 * 60 * 60 * 1000,
  5: 16 * 24 * 60 * 60 * 1000,
};

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/** Get all flashcard decks for the authenticated user */
export const getDecks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("flashcardDecks")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

/** Get single deck and all its flashcards */
export const getDeckWithCards = query({
  args: { deckId: v.id("flashcardDecks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== identity.subject) return null;

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

/** Get count of cards currently due for review */
export const getDueCardsCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const now = Date.now();
    const dueCards = await ctx.db
      .query("flashcards")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.lte(q.field("nextReviewDate"), now))
      .collect();

    return dueCards.length;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Create a new deck with initial cards */
export const createDeck = mutation({
  args: {
    userId: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    subjectName: v.optional(v.string()),
    documentId: v.optional(v.id("documents")),
    cards: v.array(
      v.object({
        front: v.string(),
        back: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const effectiveUserId = identity ? identity.subject : args.userId;
    if (!effectiveUserId) throw new Error("Unauthorized");

    const now = Date.now();

    const deckId = await ctx.db.insert("flashcardDecks", {
      userId: effectiveUserId,
      title: args.title,
      description: args.description,
      subjectName: args.subjectName,
      documentId: args.documentId,
      cardCount: args.cards.length,
      masteredCount: 0,
      createdAt: now,
    });

    for (const card of args.cards) {
      await ctx.db.insert("flashcards", {
        deckId,
        userId: effectiveUserId,
        front: card.front,
        back: card.back,
        box: 1, // Start in Box 1
        nextReviewDate: now, // Due immediately
        reviewCount: 0,
        correctStreak: 0,
      });
    }

    return deckId;
  },
});

/** Add a single manual card to an existing deck */
export const addCard = mutation({
  args: {
    deckId: v.id("flashcardDecks"),
    front: v.string(),
    back: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId) throw new Error("Forbidden");

    const now = Date.now();

    await ctx.db.insert("flashcards", {
      deckId: args.deckId,
      userId,
      front: args.front,
      back: args.back,
      box: 1,
      nextReviewDate: now,
      reviewCount: 0,
      correctStreak: 0,
    });

    await ctx.db.patch(args.deckId, {
      cardCount: deck.cardCount + 1,
    });
  },
});

/**
 * Spaced Repetition Review Engine:
 * Updates box and schedules next review according to the Leitner system.
 * Grade options:
 * - "again": Card was forgotten / hard -> resets to Box 1, due in 10 mins
 * - "good": Card was recalled -> advances 1 Box, due in 1 to 16 days
 * - "easy": Card was effortless -> advances 2 Boxes, extended interval
 */
export const reviewCard = mutation({
  args: {
    cardId: v.id("flashcards"),
    grade: v.string(), // "again" | "good" | "easy"
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const card = await ctx.db.get(args.cardId);
    if (!card || card.userId !== userId) throw new Error("Forbidden");

    const now = Date.now();
    let newBox = card.box;
    let newStreak = card.correctStreak;

    if (args.grade === "again") {
      newBox = 1;
      newStreak = 0;
    } else if (args.grade === "good") {
      newBox = Math.min(5, card.box + 1);
      newStreak = card.correctStreak + 1;
    } else if (args.grade === "easy") {
      newBox = Math.min(5, card.box + 2);
      newStreak = card.correctStreak + 1;
    }

    const intervalMs = BOX_INTERVALS_MS[newBox] || BOX_INTERVALS_MS[1];
    const nextReviewDate = now + intervalMs;

    await ctx.db.patch(args.cardId, {
      box: newBox,
      nextReviewDate,
      reviewCount: card.reviewCount + 1,
      correctStreak: newStreak,
      lastReviewedAt: now,
    });

    // Recompute mastered count for deck (cards with box >= 4)
    const deckCards = await ctx.db
      .query("flashcards")
      .withIndex("by_deck", (q) => q.eq("deckId", card.deckId))
      .collect();

    const masteredCount = deckCards.filter(
      (c) => (c._id === args.cardId ? newBox >= 4 : c.box >= 4)
    ).length;

    await ctx.db.patch(card.deckId, {
      masteredCount,
    });

    return { newBox, nextReviewDate };
  },
});

/** Delete a deck and all its flashcards */
export const deleteDeck = mutation({
  args: { deckId: v.id("flashcardDecks") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId) throw new Error("Forbidden");

    const cards = await ctx.db
      .query("flashcards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    for (const c of cards) {
      await ctx.db.delete(c._id);
    }

    return await ctx.db.delete(args.deckId);
  },
});
