import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper: get the logged-in user's ID or throw an error
async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: You must be logged in to perform this action.");
  }
  return identity.subject; // This is the user's unique Clerk ID
}

// 1. QUERY: Only returns tasks that belong to the logged-in user
export const getTasks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    // The .withIndex("by_user") makes this query fast and secure
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// 2. MUTATION: Creates a task and automatically attaches the logged-in user's ID
export const createTask = mutation({
  args: {
    title: v.string(),
    subject: v.string(),
    dueDate: v.string(),
    priority: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("tasks", {
      userId, // Attach ownership automatically
      ...args,
    });
  },
});

// 3. MUTATION: Ensures a user can only toggle THEIR OWN tasks
export const toggleTaskStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(args.id);

    // AUTHORIZATION CHECK: Does this task belong to the user?
    if (!task || task.userId !== userId) {
      throw new Error("Forbidden: You do not own this task.");
    }

    return await ctx.db.patch(args.id, { status: args.status });
  },
});

// 4. MUTATION: Delete a task (with ownership check)
export const deleteTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(args.id);

    if (!task || task.userId !== userId) {
      throw new Error("Forbidden: You do not own this task.");
    }

    return await ctx.db.delete(args.id);
  },
});
