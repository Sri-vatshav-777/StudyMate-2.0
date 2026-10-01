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

/** Get all documents belonging to the logged-in user */
export const getDocuments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

/** Get a single document by ID (ownership verified) */
export const getDocument = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== identity.subject) return null;
    return doc;
  },
});

/** Get all chunks for a specific document */
export const getChunks = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documentChunks")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("asc")
      .collect();
  },
});

/** Generate a temporary download URL for a file in Convex Storage */
export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId as any);
  },
});

/** Fetch multiple chunks by their IDs (for RAG context assembly) */
export const getAllChunksByIds = query({
  args: { chunkIds: v.array(v.id("documentChunks")) },
  handler: async (ctx, args) => {
    const results = await Promise.all(args.chunkIds.map((id) => ctx.db.get(id)));
    return results.filter(Boolean);
  },
});

// ─────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────

/** Generate a Convex upload URL that the browser will PUT a file directly to */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Step 1 of the pipeline: Create a document record with "uploading" status.
 * Called immediately after the browser uploads the file, before processing begins.
 */
export const createDocument = mutation({
  args: {
    storageId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    subjectName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("documents", {
      userId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      subjectName: args.subjectName,
      status: "processing",
      createdAt: Date.now(),
    });
  },
});

/**
 * Step 2: Save parsed text chunks from the document.
 * Supports both client authenticated calls and server route calls with validated userId.
 */
export const saveChunks = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.optional(v.string()),
    chunks: v.array(
      v.object({
        chunkIndex: v.number(),
        text: v.string(),
        pageNumber: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const effectiveUserId = identity ? identity.subject : args.userId;
    if (!effectiveUserId) throw new Error("Unauthorized");

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== effectiveUserId) throw new Error("Forbidden");

    for (const chunk of args.chunks) {
      await ctx.db.insert("documentChunks", {
        documentId: args.documentId,
        userId: effectiveUserId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        pageNumber: chunk.pageNumber,
        createdAt: Date.now(),
      });
    }
  },
});

/**
 * Step 3: Save an embedding for a single chunk.
 */
export const saveEmbedding = mutation({
  args: {
    chunkId: v.id("documentChunks"),
    documentId: v.id("documents"),
    userId: v.optional(v.string()),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const effectiveUserId = identity ? identity.subject : args.userId;
    if (!effectiveUserId) throw new Error("Unauthorized");

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== effectiveUserId) throw new Error("Forbidden");

    await ctx.db.insert("documentEmbeddings", {
      chunkId: args.chunkId,
      documentId: args.documentId,
      userId: effectiveUserId,
      embedding: args.embedding,
      createdAt: Date.now(),
    });
  },
});

/**
 * Step 4: Mark the document as fully processed ("ready" or "error").
 */
export const updateDocumentStatus = mutation({
  args: {
    id: v.id("documents"),
    status: v.string(),
    userId: v.optional(v.string()),
    totalChunks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const effectiveUserId = identity ? identity.subject : args.userId;
    if (!effectiveUserId) throw new Error("Unauthorized");

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== effectiveUserId) throw new Error("Forbidden");

    return await ctx.db.patch(args.id, {
      status: args.status,
      ...(args.totalChunks !== undefined ? { totalChunks: args.totalChunks } : {}),
    });
  },
});

/**
 * Get all embeddings for a specific document or user.
 */
export const getEmbeddings = query({
  args: { 
    documentId: v.optional(v.id("documents")),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const effectiveUserId = identity ? identity.subject : args.userId;

    if (args.documentId) {
      return await ctx.db
        .query("documentEmbeddings")
        .withIndex("by_document", (q) => q.eq("documentId", args.documentId!))
        .collect();
    }

    if (!effectiveUserId) return [];

    return await ctx.db
      .query("documentEmbeddings")
      .withIndex("by_user", (q) => q.eq("userId", effectiveUserId))
      .collect();
  },
});

/** Delete a document and all its chunks and embeddings */
export const deleteDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) throw new Error("Forbidden");

    const embeddings = await ctx.db
      .query("documentEmbeddings")
      .withIndex("by_document", (q) => q.eq("documentId", args.id))
      .collect();
    for (const e of embeddings) await ctx.db.delete(e._id);

    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_document", (q) => q.eq("documentId", args.id))
      .collect();
    for (const c of chunks) await ctx.db.delete(c._id);

    try {
      await ctx.storage.delete(doc.storageId as any);
    } catch (e) {
      console.warn("Could not delete file from storage:", e);
    }

    return await ctx.db.delete(args.id);
  },
});
