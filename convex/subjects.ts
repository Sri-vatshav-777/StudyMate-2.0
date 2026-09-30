import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity.subject;
}

export const getSubjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("subjects")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const createSubject = mutation({
  args: {
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("subjects", {
      userId,
      name: args.name,
      color: args.color,
    });
  },
});

export const updateSubject = mutation({
  args: {
    id: v.id("subjects"),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const subject = await ctx.db.get(args.id);
    if (!subject || subject.userId !== userId) throw new Error("Forbidden");
    return await ctx.db.patch(args.id, {
      name: args.name,
      color: args.color,
    });
  },
});

export const deleteSubject = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const subject = await ctx.db.get(args.id);
    if (!subject || subject.userId !== userId) throw new Error("Forbidden");
    return await ctx.db.delete(args.id);
  },
});
