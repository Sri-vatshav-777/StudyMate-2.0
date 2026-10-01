import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity.subject;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregates live data across all StudyMate modules:
 * Subjects, Tasks, Notes, Documents, Quizzes, and Flashcards.
 * Computes an Academic Health Index (0-100) and subject-by-subject metrics.
 */
export const getComprehensiveAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;
    const now = Date.now();

    // 1. Fetch data across all tables concurrently
    const [tasks, notes, subjects, documents, quizzes, flashcards] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("subjects").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("documents").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("quizzes").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("flashcards").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);

    // 2. Task metrics
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const pendingTasks = tasks.filter((t) => t.status === "pending").length;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // 3. Quiz metrics
    const finishedQuizzes = quizzes.filter((q) => q.completed && q.score !== undefined);
    const avgQuizScore = finishedQuizzes.length > 0
      ? Math.round(
          (finishedQuizzes.reduce((acc, q) => acc + (q.score! / q.totalQuestions), 0) /
            finishedQuizzes.length) *
            100
        )
      : 0;

    // 4. Flashcard & Leitner Box Distribution
    const boxDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let dueCards = 0;
    let masteredCards = 0;

    for (const card of flashcards) {
      const box = (card.box >= 1 && card.box <= 5 ? card.box : 1) as 1 | 2 | 3 | 4 | 5;
      boxDistribution[box]++;
      if (card.nextReviewDate <= now) dueCards++;
      if (box >= 4) masteredCards++;
    }

    const flashcardMasteryRate = flashcards.length > 0
      ? Math.round((masteredCards / flashcards.length) * 100)
      : 0;

    // 5. Subject Breakdown Matrix
    const subjectMetrics = subjects.map((subj) => {
      const subjTasks = tasks.filter((t) => t.subject === subj.name);
      const subjNotes = notes.filter((n) => n.subjectName === subj.name);
      const subjQuizzes = quizzes.filter((q) => q.subjectName === subj.name && q.completed);
      const subjDocs = documents.filter((d) => d.subjectName === subj.name);

      const subjCompletedTasks = subjTasks.filter((t) => t.status === "completed").length;
      const subjTaskRate = subjTasks.length > 0
        ? Math.round((subjCompletedTasks / subjTasks.length) * 100)
        : 100;

      const subjQuizAvg = subjQuizzes.length > 0
        ? Math.round(
            (subjQuizzes.reduce((acc, q) => acc + (q.score! / q.totalQuestions), 0) /
              subjQuizzes.length) *
              100
          )
        : null;

      return {
        _id: subj._id,
        name: subj.name,
        color: subj.color,
        tasksCount: subjTasks.length,
        notesCount: subjNotes.length,
        docsCount: subjDocs.length,
        taskCompletionRate: subjTaskRate,
        quizAccuracy: subjQuizAvg,
      };
    });

    // 6. Academic Health Index (0-100)
    // Weighted formula:
    // - 35% Quiz Accuracy
    // - 30% Task Completion
    // - 25% Flashcard Mastery
    // - 10% Resource Volume
    const quizWeight = finishedQuizzes.length > 0 ? avgQuizScore * 0.35 : 30;
    const taskWeight = tasks.length > 0 ? taskCompletionRate * 0.3 : 25;
    const flashcardWeight = flashcards.length > 0 ? flashcardMasteryRate * 0.25 : 20;
    const volumeBonus = Math.min(15, (notes.length * 2 + documents.length * 3));

    const academicHealthScore = Math.min(
      100,
      Math.max(10, Math.round(quizWeight + taskWeight + flashcardWeight + volumeBonus))
    );

    return {
      academicHealthScore,
      tasks: {
        total: tasks.length,
        completed: completedTasks,
        pending: pendingTasks,
        completionRate: taskCompletionRate,
      },
      quizzes: {
        total: quizzes.length,
        completed: finishedQuizzes.length,
        avgScore: avgQuizScore,
        history: finishedQuizzes.slice(0, 8).map((q) => ({
          title: q.title,
          score: q.score!,
          total: q.totalQuestions,
          percentage: Math.round((q.score! / q.totalQuestions) * 100),
          createdAt: q.createdAt,
        })),
      },
      flashcards: {
        total: flashcards.length,
        dueToday: dueCards,
        mastered: masteredCards,
        masteryRate: flashcardMasteryRate,
        boxDistribution,
      },
      content: {
        notesCount: notes.length,
        documentsCount: documents.length,
        subjectsCount: subjects.length,
      },
      subjects: subjectMetrics,
    };
  },
});

/** Get the latest generated AI study advisor insight report */
export const getLatestInsight = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const insights = await ctx.db
      .query("studyInsights")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(1);

    return insights[0] || null;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Save an AI-generated study insight report */
export const saveInsight = mutation({
  args: {
    userId: v.optional(v.string()),
    overallScore: v.number(),
    summary: v.string(),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    recommendations: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const effectiveUserId = identity ? identity.subject : args.userId;
    if (!effectiveUserId) throw new Error("Unauthorized");

    return await ctx.db.insert("studyInsights", {
      userId: effectiveUserId,
      overallScore: args.overallScore,
      summary: args.summary,
      strengths: args.strengths,
      weaknesses: args.weaknesses,
      recommendations: args.recommendations,
      createdAt: Date.now(),
    });
  },
});
