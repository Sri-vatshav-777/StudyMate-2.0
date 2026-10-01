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
      difficulty = "medium",
      questionCount = 5,
    } = await req.json();

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const count = Math.min(Math.max(Number(questionCount) || 5, 3), 10);
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
    // RAG RETRIEVAL (Ground with Document if documentId provided)
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
          ragContext = `\n\nGROUNDING MATERIAL FROM STUDENT'S UPLOADED COURSE DOCUMENT:\n` +
            relevantChunks.map((c, i) => `[Source Chunk ${i + 1}]:\n"${c.text}"`).join("\n\n") +
            `\n\nEnsure questions directly test key principles and facts found in the source excerpts above.`;
        }
      } catch (ragErr) {
        console.warn("Could not retrieve RAG chunks for quiz:", ragErr);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GEMINI PROMPT FOR STRUCTURED ASSESSMENT
    // ─────────────────────────────────────────────────────────────────────────
    const prompt = `You are a university-level computer science and academic assessment designer.
Generate a high-quality ${count}-question multiple choice assessment on the following topic.

Topic: "${topic.trim()}"
Subject: "${subjectName || "General"}"
Difficulty Level: "${difficulty}" (easy = definitions & core principles, medium = applied scenarios & trade-offs, hard = deep edge cases, complex problem solving)
${ragContext}

CRITICAL RULES:
1. Provide EXACTLY ${count} questions.
2. Each question MUST have exactly 4 choices (index 0, 1, 2, 3).
3. The correct answer index (0, 1, 2, or 3) MUST accurately point to the right choice.
4. Distractors (wrong answers) MUST be plausible misconceptions, NOT obviously silly answers.
5. Provide a detailed, pedagogically sound "explanation" for why the correct answer is right and why other options are incomplete or incorrect.
6. Return ONLY a single raw JSON object with NO markdown formatting, NO backticks, NO commentary.

JSON Schema:
{
  "title": "Concise, descriptive quiz title",
  "questions": [
    {
      "question": "Full question prompt",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": 1,
      "explanation": "Clear explanation of the answer"
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
            temperature: 0.4,
          },
        });

        const res = await model.generateContent(prompt);
        rawOutput = res.response.text();
        if (rawOutput) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Quiz generation model ${modelName} error:`, err?.message || err);
      }
    }

    if (!rawOutput) {
      throw lastError || new Error("Failed to receive output from AI model.");
    }

    // Clean JSON output in case model included markdown fence
    const cleanedJson = rawOutput
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsedQuiz: any;
    try {
      parsedQuiz = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error("JSON parse error:", cleanedJson);
      throw new Error("AI returned malformed JSON structure.");
    }

    if (!parsedQuiz.questions || !Array.isArray(parsedQuiz.questions)) {
      throw new Error("Invalid quiz structure returned by AI.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SAVE QUIZ TO CONVEX DATABASE
    // ─────────────────────────────────────────────────────────────────────────
    const convex = new ConvexHttpClient(convexUrl);

    const formattedQuestions = parsedQuiz.questions.map((q: any, i: number) => ({
      questionIndex: i,
      question: String(q.question || `Question ${i + 1}`),
      options: Array.isArray(q.options) && q.options.length === 4
        ? q.options.map(String)
        : ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer <= 3
        ? q.correctAnswer
        : 0,
      explanation: String(q.explanation || "No explanation provided."),
    }));

    const quizId = await convex.mutation(api.quizzes.createQuiz, {
      userId,
      title: parsedQuiz.title || `${topic.trim()} Assessment`,
      topic: topic.trim(),
      subjectName: subjectName || undefined,
      documentId: documentId || undefined,
      difficulty,
      totalQuestions: formattedQuestions.length,
      questions: formattedQuestions,
    });

    return NextResponse.json({
      success: true,
      quizId,
      title: parsedQuiz.title,
      questionCount: formattedQuestions.length,
    });
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate assessment." },
      { status: 500 }
    );
  }
}
