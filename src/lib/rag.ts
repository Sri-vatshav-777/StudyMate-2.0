import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export const EMBEDDING_MODEL = "text-embedding-004";
export const CHUNK_SIZE = 800;
export const CHUNK_OVERLAP = 150;
export const TOP_K = 4;

/**
 * Splits raw document text into overlapping segments to preserve context
 * across boundaries while keeping chunks small enough for dense semantic search.
 */
export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const cleanText = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+/g, " ")
    .trim();

  let start = 0;
  while (start < cleanText.length) {
    let end = start + CHUNK_SIZE;

    // Prefer breaking at sentence ends
    if (end < cleanText.length) {
      const breakAt = cleanText.lastIndexOf(". ", end);
      if (breakAt > start + CHUNK_SIZE / 2) {
        end = breakAt + 1;
      }
    }

    const chunk = cleanText.slice(start, end).trim();
    if (chunk.length > 40) {
      chunks.push(chunk);
    }

    start = end - CHUNK_OVERLAP;
    if (start >= cleanText.length) break;
  }

  return chunks;
}

/**
 * Calculates cosine similarity between two vector embeddings.
 * Cosine similarity measures the angle between two high-dimensional vectors,
 * ranging from -1 (opposite) to +1 (identical meaning).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates vector embeddings for a given text snippet using Google's text-embedding-004 model.
 */
export async function generateEmbedding(
  text: string,
  genAI: GoogleGenerativeAI
): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export interface RetrievedChunk {
  _id: Id<"documentChunks">;
  documentId: Id<"documents">;
  chunkIndex: number;
  text: string;
  score: number;
}

/**
 * Core RAG retrieval algorithm:
 * 1. Embeds the user's prompt query
 * 2. Fetches stored embeddings for the specified document (or user)
 * 3. Ranks all chunks by cosine similarity
 * 4. Returns top-K most semantically relevant text chunks
 */
export async function retrieveRelevantChunks({
  query,
  documentId,
  userId,
  apiKey,
  convexUrl,
}: {
  query: string;
  documentId?: string;
  userId?: string;
  apiKey: string;
  convexUrl: string;
}): Promise<RetrievedChunk[]> {
  const convex = new ConvexHttpClient(convexUrl);
  const genAI = new GoogleGenerativeAI(apiKey);

  // 1. Embed the incoming question
  const queryEmbedding = await generateEmbedding(query, genAI);

  // 2. Fetch stored chunk embeddings
  const storedEmbeddings = await convex.query(api.documents.getEmbeddings, {
    documentId: documentId ? (documentId as Id<"documents">) : undefined,
    userId: userId || undefined,
  });

  if (!storedEmbeddings || storedEmbeddings.length === 0) {
    return [];
  }

  // 3. Compute cosine similarity for each chunk
  const scored = storedEmbeddings.map((item) => ({
    chunkId: item.chunkId,
    documentId: item.documentId,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  // 4. Sort descending by similarity score
  scored.sort((a, b) => b.score - a.score);

  // Take top-K chunks with minimum similarity threshold (0.25)
  const topScored = scored.slice(0, TOP_K).filter((s) => s.score >= 0.25);
  if (topScored.length === 0) return [];

  // 5. Fetch actual text bodies for the top chunks
  const chunkIds = topScored.map((s) => s.chunkId);
  const chunkDocs = await convex.query(api.documents.getAllChunksByIds, { chunkIds });

  return topScored
    .map((s) => {
      const doc = chunkDocs.find((c: any) => c?._id === s.chunkId);
      if (!doc) return null;
      return {
        _id: doc._id,
        documentId: doc.documentId,
        chunkIndex: doc.chunkIndex,
        text: doc.text,
        score: Math.round(s.score * 1000) / 1000,
      };
    })
    .filter((c): c is RetrievedChunk => c !== null);
}
