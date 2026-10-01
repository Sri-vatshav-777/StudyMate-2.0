import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { retrieveRelevantChunks } from "@/lib/rag";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      topic,
      subjectName,
      documentId,
      cardCount = 8,
    } = await req.json();

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const count = Math.min(Math.max(Number(cardCount) || 8, 4), 15);
    const apiKey = process.env.GEMINI_API_KEY;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    if (!convexUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_CONVEX_URL is not configured." },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RAG RETRIEVAL (Optional Grounding from Uploaded Document)
    // ─────────────────────────────────────────────────────────────────────────
    let ragContext = "";
    if (documentId) {
      try {
        const relevantChunks = await retrieveRelevantChunks({
          query: topic.trim(),
          documentId,
          userId,
          apiKey,
          convexUrl,
        });

        if (relevantChunks.length > 0) {
          ragContext = `\n\nCOURSE DOCUMENT REFERENCE EXCERPTS:\n` +
            relevantChunks.map((c, i) => `[Source Passage ${i + 1}]:\n"${c.text}"`).join("\n\n") +
            `\n\nEnsure flashcards directly distill key definitions, formulas, and concepts from the excerpts above.`;
        }
      } catch (ragErr) {
        console.warn("Could not retrieve RAG chunks for flashcards:", ragErr);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GEMINI PROMPT FOR STRUCTURED FLASHCARD CREATION
    // ─────────────────────────────────────────────────────────────────────────
    const prompt = `You are an expert cognitive learning scientist and academic flashcard designer.
Create a high-impact set of ${count} study flashcards for spaced repetition.

Topic: "${topic.trim()}"
Subject: "${subjectName || "General"}"
${ragContext}

CRITICAL FLASHCARD RULES:
1. Provide EXACTLY ${count} flashcards.
2. The "front" should be a clear, unambiguous question, concept prompt, or term.
3. The "back" should be a crisp, high-yield explanation, formula, or definition (1-3 sentences max).
4. Focus on high-yield retention concepts: definitions, mechanisms, contrast/comparisons, and common exam pitfalls.
5. Return ONLY a single raw JSON object with NO markdown formatting, NO backticks.

JSON Schema:
{
  "title": "Short descriptive deck title",
  "description": "One sentence summary of what this deck covers",
  "cards": [
    {
      "front": "Question or prompt",
      "back": "Concise, precise explanation or definition"
    }
  ]
}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.7-flash",
    ];

    let rawOutput = "";
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });

        const res = await model.generateContent(prompt);
        rawOutput = res.response.text();
        if (rawOutput) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Flashcard generation model ${modelName} error:`, err?.message || err);
      }
    }

    if (!rawOutput) {
      throw lastError || new Error("Failed to receive output from AI model.");
    }

    const cleanedJson = rawOutput
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error("JSON parse error:", cleanedJson);
      throw new Error("AI returned malformed JSON structure.");
    }

    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      throw new Error("Invalid flashcard structure returned by AI.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SAVE DECK TO CONVEX DATABASE
    // ─────────────────────────────────────────────────────────────────────────
    const convex = new ConvexHttpClient(convexUrl);

    const formattedCards = parsed.cards.map((c: any, i: number) => ({
      front: String(c.front || `Card ${i + 1} Prompt`),
      back: String(c.back || "Answer not specified."),
    }));

    const deckId = await convex.mutation(api.flashcards.createDeck, {
      userId,
      title: parsed.title || `${topic.trim()} Deck`,
      description: parsed.description || undefined,
      subjectName: subjectName || undefined,
      documentId: documentId || undefined,
      cards: formattedCards,
    });

    return NextResponse.json({
      success: true,
      deckId,
      title: parsed.title,
      cardCount: formattedCards.length,
    });
  } catch (error: any) {
    console.error("Flashcard generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate flashcard deck." },
      { status: 500 }
    );
  }
}
