import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractText } from "unpdf";
import { chunkText, generateEmbedding } from "@/lib/rag";

/** Maximum file size: 10 MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTE: POST /api/documents/process
// Triggered after the client uploads a PDF to Convex Storage.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. AUTHENTICATION
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. PARSE REQUEST
    const { documentId, storageId } = await req.json();
    if (!documentId || !storageId) {
      return NextResponse.json(
        { error: "documentId and storageId are required." },
        { status: 400 }
      );
    }

    // 3. CHECK API KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_CONVEX_URL is not configured." },
        { status: 500 }
      );
    }

    // 4. CONNECT TO CONVEX via HTTP client
    const convex = new ConvexHttpClient(convexUrl);

    // 5. FETCH THE PDF FROM CONVEX FILE STORAGE
    const fileUrl = await convex.query(api.documents.getFileUrl, { storageId });
    if (!fileUrl) {
      throw new Error("Could not retrieve file URL from storage.");
    }

    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) throw new Error("Failed to download file from storage.");

    const fileBuffer = await fileRes.arrayBuffer();

    // Validate file size server-side
    if (fileBuffer.byteLength > MAX_FILE_SIZE) {
      await convex.mutation(api.documents.updateDocumentStatus, {
        id: documentId,
        status: "error",
        userId,
      });
      return NextResponse.json({ error: "File exceeds 10MB limit." }, { status: 400 });
    }

    // 6. PARSE PDF TEXT USING unpdf (Works natively without fake worker file issues)
    let rawText = "";
    try {
      const { text } = await extractText(new Uint8Array(fileBuffer), { mergePages: true });
      rawText = Array.isArray(text) ? text.join("\n\n") : (text || "");
    } catch (parseError: any) {
      console.error("PDF parse error:", parseError);
      throw new Error("Failed to parse PDF document text: " + (parseError?.message || parseError));
    }

    if (!rawText || rawText.trim().length < 40) {
      await convex.mutation(api.documents.updateDocumentStatus, {
        id: documentId,
        status: "error",
        userId,
      });
      return NextResponse.json(
        { error: "Could not extract readable text from this PDF (it may be scanned/image-only)." },
        { status: 400 }
      );
    }

    // 7. CHUNK THE TEXT (Overlapping chunks for dense semantic retrieval)
    const textChunks = chunkText(rawText);

    if (textChunks.length === 0) {
      throw new Error("No valid chunks could be created from the document.");
    }

    // 8. SAVE CHUNKS TO CONVEX
    await convex.mutation(api.documents.saveChunks, {
      documentId,
      userId,
      chunks: textChunks.map((text, i) => ({
        chunkIndex: i,
        text,
      })),
    });

    // 9. RETRIEVE SAVED CHUNKS TO ACQUIRE CONVEX ID REFERENCES
    const savedChunks = await convex.query(api.documents.getChunks, { documentId });

    // 10. GENERATE AND SAVE EMBEDDINGS
    const genAI = new GoogleGenerativeAI(apiKey);

    let embeddingsGenerated = 0;
    for (const chunk of savedChunks) {
      try {
        const embedding = await generateEmbedding(chunk.text, genAI);
        await convex.mutation(api.documents.saveEmbedding, {
          chunkId: chunk._id,
          documentId,
          userId,
          embedding,
        });
        embeddingsGenerated++;
      } catch (embErr) {
        console.warn(`Could not generate embedding for chunk ${chunk.chunkIndex}:`, embErr);
      }
    }

    // 11. MARK DOCUMENT AS READY
    await convex.mutation(api.documents.updateDocumentStatus, {
      id: documentId,
      status: "ready",
      userId,
      totalChunks: textChunks.length,
    });

    return NextResponse.json({
      success: true,
      chunks: textChunks.length,
      embeddingsGenerated,
      message: `Document processed: ${textChunks.length} chunks, ${embeddingsGenerated} embeddings stored.`,
    });
  } catch (error: any) {
    console.error("Document processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process document." },
      { status: 500 }
    );
  }
}
