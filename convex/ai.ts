import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity.subject;
}

// 1. Get all conversations belonging to the user
export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

// 2. Create a new conversation
export const createConversation = mutation({
  args: {
    title: v.string(),
    subjectName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("conversations", {
      userId,
      title: args.title,
      subjectName: args.subjectName,
      createdAt: Date.now(),
    });
  },
});

// 3. Get all messages for a specific conversation
export const getMessages = query({
  args: { conversationId: v.optional(v.id("conversations")) },
  handler: async (ctx, args) => {
    if (!args.conversationId) return [];
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId!))
      .order("asc")
      .collect();

    // Verify messages belong to the user
    return messages.filter((m) => m.userId === identity.subject);
  },
});

// 4. Add a message (from user or AI) to the conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Forbidden: You do not own this conversation.");
    }

    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

// 5. Delete a conversation and all its messages
export const deleteConversation = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const conversation = await ctx.db.get(args.id);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Forbidden: You do not own this conversation.");
    }

    // Delete all messages belonging to this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.id))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return await ctx.db.delete(args.id);
  },
});
