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

/** Get all recent focus sessions for the current user */
export const getRecentSessions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("focusSessions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(20);
  },
});

/** Aggregate focus statistics: total time, today's time, subject distribution, streaks */
export const getFocusStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const sessions = await ctx.db
      .query("focusSessions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTimestamp = startOfToday.getTime();

    let totalMinutes = 0;
    let todayMinutes = 0;
    let completedCount = 0;

    const subjectMap: Record<string, number> = {};
    const activeDates = new Set<string>();

    for (const s of sessions) {
      if (s.completed && s.sessionType === "focus") {
        totalMinutes += s.durationMinutes;
        completedCount++;

        if (s.createdAt >= todayTimestamp) {
          todayMinutes += s.durationMinutes;
        }

        const subj = s.subjectName || "Uncategorized";
        subjectMap[subj] = (subjectMap[subj] || 0) + s.durationMinutes;

        const dateStr = new Date(s.createdAt).toISOString().split("T")[0];
        activeDates.add(dateStr);
      }
    }

    const subjectBreakdown = Object.entries(subjectMap).map(([name, minutes]) => ({
      name,
      minutes,
      hours: Math.round((minutes / 60) * 10) / 10,
    }));

    return {
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalMinutes,
      todayMinutes,
      completedCount,
      activeDaysCount: activeDates.size,
      subjectBreakdown,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Log a completed Pomodoro study block */
export const logFocusSession = mutation({
  args: {
    subjectName: v.optional(v.string()),
    durationMinutes: v.number(),
    sessionType: v.string(), // "focus" | "short_break" | "long_break"
    completed: v.boolean(),
    reflection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    return await ctx.db.insert("focusSessions", {
      userId,
      subjectName: args.subjectName,
      durationMinutes: args.durationMinutes,
      sessionType: args.sessionType,
      completed: args.completed,
      reflection: args.reflection,
      createdAt: Date.now(),
    });
  },
});

/** Delete a logged session */
export const deleteSession = mutation({
  args: { id: v.id("focusSessions") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const session = await ctx.db.get(args.id);
    if (!session || session.userId !== userId) throw new Error("Forbidden");

    return await ctx.db.delete(args.id);
  },
});
