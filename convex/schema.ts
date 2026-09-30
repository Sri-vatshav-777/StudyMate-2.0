import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    // Every task now belongs to a specific user
    userId: v.string(),
    title: v.string(),
    subject: v.string(),
    dueDate: v.string(),
    priority: v.string(), // "high" | "medium" | "low"
    status: v.string(),   // "pending" | "completed"
  }).index("by_user", ["userId"]), // Index allows fast lookup by userId

  subjects: defineTable({
    userId: v.string(),
    name: v.string(),
    color: v.string(),
  }).index("by_user", ["userId"]),

  notes: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    subjectId: v.optional(v.id("subjects")),
    subjectName: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    subjectName: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    role: v.string(), // "user" | "assistant"
    content: v.string(),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
