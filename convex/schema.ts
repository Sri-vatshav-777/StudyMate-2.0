import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    subject: v.string(),
    dueDate: v.string(),
    priority: v.string(), // e.g., "high", "medium", "low"
    status: v.string(), // e.g., "pending", "completed"
  }),
  
  subjects: defineTable({
    name: v.string(),
    color: v.string(),
  }),
});
