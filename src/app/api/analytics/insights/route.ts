import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // 1. Fetch user's cross-module analytics directly from Convex
    const convex = new ConvexHttpClient(convexUrl);
    const analytics = await convex.query(api.analytics.getComprehensiveAnalytics, {});

    if (!analytics) {
      return NextResponse.json(
        { error: "Unable to retrieve academic metrics." },
        { status: 400 }
      );
    }

    // 2. Build diagnostic prompt with student's real numbers
    const prompt = `You are the Lead Academic Advisor and Cognitive Learning Strategist for StudyMate.
Analyze the following student's real learning data across all study modules and generate an actionable diagnostic assessment.

STUDENT ACADEMIC METRICS:
- Academic Health Index: ${analytics.academicHealthScore} / 100
- Tasks: ${analytics.tasks.completed} completed, ${analytics.tasks.pending} pending (${analytics.tasks.completionRate}% completion rate)
- Quizzes: ${analytics.quizzes.completed} completed, Average Score: ${analytics.quizzes.avgScore}%
- Recent Quiz Scores: ${analytics.quizzes.history.map((h: any) => `${h.title}: ${h.percentage}%`).join(", ") || "None yet"}
- Flashcards: ${analytics.flashcards.total} total, ${analytics.flashcards.dueToday} due today for review, ${analytics.flashcards.mastered} in long-term memory (Box 4+)
- Leitner Box Distribution: Box 1: ${analytics.flashcards.boxDistribution[1]}, Box 2: ${analytics.flashcards.boxDistribution[2]}, Box 3: ${analytics.flashcards.boxDistribution[3]}, Box 4: ${analytics.flashcards.boxDistribution[4]}, Box 5: ${analytics.flashcards.boxDistribution[5]}
- Content Volume: ${analytics.content.notesCount} Notes written, ${analytics.content.documentsCount} Course PDFs uploaded
- Subject Breakdown: ${analytics.subjects.map((s: any) => `${s.name} (Task Rate: ${s.taskCompletionRate}%, Quiz Avg: ${s.quizAccuracy !== null ? s.quizAccuracy + "%" : "N/A"})`).join("; ")}

CRITICAL ADVISORY INSTRUCTIONS:
1. Provide an honest, encouraging, and highly specific critique.
2. Avoid generic motivational fluff. Mention specific subjects, overdue review cards, and quiz metrics.
3. Formulate exactly 3 prescriptive, actionable recommendations for their next study session.
4. Return ONLY a single raw JSON object matching the schema below.

JSON Schema:
{
  "summary": "2-sentence high-level evaluation of their current study momentum and risk areas.",
  "strengths": [
    "Specific strength with metric reference",
    "Second specific strength"
  ],
  "weaknesses": [
    "Specific vulnerability or delayed topic",
    "Second area needing immediate attention"
  ],
  "recommendations": [
    "Actionable step 1 (e.g. Complete the 3 overdue flashcards in OS before forgetting curve decays)",
    "Actionable step 2",
    "Actionable step 3"
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
        console.warn(`Advisor model ${modelName} error:`, err?.message || err);
      }
    }

    if (!rawOutput) {
      throw lastError || new Error("Failed to receive response from Gemini advisor.");
    }

    const cleanedJson = rawOutput
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedJson);

    // Save report to database
    await convex.mutation(api.analytics.saveInsight, {
      userId,
      overallScore: analytics.academicHealthScore,
      summary: parsed.summary || "Study diagnostics generated successfully.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    });

    return NextResponse.json({
      success: true,
      insight: parsed,
      score: analytics.academicHealthScore,
    });
  } catch (error: any) {
    console.error("AI Advisor generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate academic advisor insights." },
      { status: 500 }
    );
  }
}
