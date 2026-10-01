import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity.subject;
}

// ─────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────

/** List all quizzes created by the current user */
export const getQuizzes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("quizzes")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

/** Get single quiz with its full set of questions */
export const getQuizWithQuestions = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.userId !== identity.subject) return null;

    const questions = await ctx.db
      .query("quizQuestions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    // Sort by question index
    questions.sort((a, b) => a.questionIndex - b.questionIndex);

    return {
      ...quiz,
      questions,
    };
  },
});

// ─────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────

/**
 * Creates a complete quiz with questions.
 * Supports both client and server API calls with verified userId.
 */
export const createQuiz = mutation({
  args: {
    userId: v.optional(v.string()),
    title: v.string(),
    topic: v.string(),
    subjectName: v.optional(v.string()),
    documentId: v.optional(v.id("documents")),
    difficulty: v.string(),
    totalQuestions: v.number(),
    questions: v.array(
      v.object({
        questionIndex: v.number(),
        question: v.string(),
        options: v.array(v.string()),
        correctAnswer: v.number(),
        explanation: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const effectiveUserId = identity ? identity.subject : args.userId;
    if (!effectiveUserId) throw new Error("Unauthorized");

    const quizId = await ctx.db.insert("quizzes", {
      userId: effectiveUserId,
      title: args.title,
      topic: args.topic,
      subjectName: args.subjectName,
      documentId: args.documentId,
      difficulty: args.difficulty,
      totalQuestions: args.totalQuestions,
      completed: false,
      createdAt: Date.now(),
    });

    for (const q of args.questions) {
      await ctx.db.insert("quizQuestions", {
        quizId,
        userId: effectiveUserId,
        questionIndex: q.questionIndex,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      });
    }

    return quizId;
  },
});

/**
 * Submit answers for a quiz.
 * Calculates score, records student answers, and marks quiz as completed.
 */
export const submitQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    answers: v.array(
      v.object({
        questionId: v.id("quizQuestions"),
        userAnswer: v.number(),
      })
    ),
    timeSpentSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.userId !== userId) throw new Error("Forbidden");

    let correctCount = 0;

    for (const item of args.answers) {
      const q = await ctx.db.get(item.questionId);
      if (q && q.quizId === args.quizId) {
        const isCorrect = q.correctAnswer === item.userAnswer;
        if (isCorrect) correctCount++;

        await ctx.db.patch(item.questionId, {
          userAnswer: item.userAnswer,
          isCorrect,
        });
      }
    }

    await ctx.db.patch(args.quizId, {
      completed: true,
      score: correctCount,
      timeSpentSeconds: args.timeSpentSeconds,
    });

    return {
      score: correctCount,
      total: quiz.totalQuestions,
      percentage: Math.round((correctCount / quiz.totalQuestions) * 100),
    };
  },
});

/** Delete a quiz and all its questions */
export const deleteQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.userId !== userId) throw new Error("Forbidden");

    const questions = await ctx.db
      .query("quizQuestions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    for (const q of questions) {
      await ctx.db.delete(q._id);
    }

    return await ctx.db.delete(args.quizId);
  },
});
