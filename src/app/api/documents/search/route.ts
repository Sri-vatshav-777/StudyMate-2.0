import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { retrieveRelevantChunks } from "@/lib/rag";

/**
 * RAG Search API:
 * Given a search query and optional documentId, returns top matching chunks
 * with their text and cosine similarity score.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, documentId } = await req.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Query string is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_CONVEX_URL is not configured." }, { status: 500 });
    }

    const chunks = await retrieveRelevantChunks({
      query: query.trim(),
      documentId: documentId || undefined,
      userId,
      apiKey,
      convexUrl,
    });

    return NextResponse.json({ chunks });
  } catch (error: any) {
    console.error("RAG search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search document chunks." },
      { status: 500 }
    );
  }
}
