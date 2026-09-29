import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 1. QUERY: Read data from the database
export const getTasks = query({
  args: {},
  handler: async (ctx) => {
    // We tell the database context (ctx) to query the "tasks" table and collect all results
    return await ctx.db.query("tasks").order("desc").collect();
  },
});

// 2. MUTATION: Write data to the database
export const createTask = mutation({
  // We strictly validate the incoming arguments to prevent bad data
  args: {
    title: v.string(),
    subject: v.string(),
    dueDate: v.string(),
    priority: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // We insert a new document into the "tasks" table
    return await ctx.db.insert("tasks", {
      title: args.title,
      subject: args.subject,
      dueDate: args.dueDate,
      priority: args.priority,
      status: args.status,
    });
  },
});

// 3. MUTATION: Update existing data
export const toggleTaskStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { status: args.status });
  },
});
