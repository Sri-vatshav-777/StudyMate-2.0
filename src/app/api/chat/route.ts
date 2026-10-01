import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retrieveRelevantChunks, RetrievedChunk } from "@/lib/rag";

const SYSTEM_PROMPT = `You are StudyMate AI — a brilliant, patient, and highly structured personal academic tutor for students.
Your goal is to help students truly understand complex concepts rather than just memorizing them.

Guidelines:
1. Explain with crystal clarity, using real-world analogies where helpful.
2. If code or technical structures are involved, provide clean, well-commented code snippets.
3. Structure responses with clear headings, bullet points, and highlight key takeaways.
4. Keep explanations educational, engaging, and directly actionable.
5. End with an encouraging follow-up check or practice question to test the student's understanding.`;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, mode, history, documentId } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    // Optional Mode modifier to tailor tutor responses
    let modeInstruction = "";
    if (mode === "simple") {
      modeInstruction = "\nMode: Explain this as simply as possible with an intuitive analogy for a beginner.";
    } else if (mode === "examples") {
      modeInstruction = "\nMode: Focus heavily on concrete, practical examples and step-by-step code demonstrations.";
    } else if (mode === "quiz") {
      modeInstruction = "\nMode: After a brief 2-sentence overview, generate 3 practice quiz questions (multiple choice or short answer) with hidden answers at the end.";
    } else if (mode === "summary") {
      modeInstruction = "\nMode: Summarize this topic into concise bullet points and high-yield revision notes.";
    }

    if (!apiKey) {
      // Simulation mode fallback
      const fallbackResponse = `### 🤖 StudyMate AI Tutor (Simulation Mode)

I received your prompt: **"${message.trim()}"**

To connect me to live Google Gemini AI with RAG document retrieval:
1. Get a free API key at [Google AI Studio](https://aistudio.google.com/).
2. Add it to your \`.env.local\` file:
   \`\`\`env
   GEMINI_API_KEY=your_gemini_api_key_here
   \`\`\`
3. Restart your dev server.

---

### Concept Overview: ${message.trim()}
- **Core Concept**: Break complex topics into smaller, self-contained components.
- **Mental Model**: Think of how data flows step-by-step through inputs, transformations, and outputs.
- **Best Practice**: Validate inputs early, keep functions pure, and handle edge cases gracefully.`;

      return NextResponse.json({ response: fallbackResponse, sources: [] });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RAG RETRIEVAL (Part 7)
    // If a documentId is provided or documents exist, retrieve relevant chunks
    // ─────────────────────────────────────────────────────────────────────────
    let retrievedChunks: RetrievedChunk[] = [];
    let ragContextBlock = "";

    if (convexUrl && (documentId || documentId === "")) {
      try {
        retrievedChunks = await retrieveRelevantChunks({
          query: message.trim(),
          documentId: documentId || undefined,
          userId,
          apiKey,
          convexUrl,
        });

        if (retrievedChunks.length > 0) {
          ragContextBlock = `\n\n--- 
[DOCUMENT CONTEXT FOR GROUNDING]
The student has attached their study material. Use the following excerpts from their uploaded document to answer their question with factual accuracy:

${retrievedChunks
  .map(
    (chunk, i) =>
      `[Excerpt ${i + 1} | Relevance: ${(chunk.score * 100).toFixed(0)}%]:\n"${chunk.text}"`
  )
  .join("\n\n")}

CRITICAL INSTRUCTION FOR DOCUMENT QUESTIONS:
- Base your explanations on the excerpts above.
- Cite specific sections or points when answering.
- If the excerpt doesn't fully answer the question, answer what you can from the text and supplement with general academic knowledge while noting the distinction.
---`;
        }
      } catch (ragError) {
        console.warn("RAG retrieval failed, falling back to standard AI:", ragError);
      }
    }

    // Clean and validate chat history for Gemini (must start with 'user', alternate strictly, and end with 'model')
    const formattedHistory: { role: "user" | "model"; parts: [{ text: string }] }[] = [];
    if (Array.isArray(history)) {
      for (const item of history) {
        if (!item || !item.content || typeof item.content !== "string") continue;
        const role: "user" | "model" = item.role === "assistant" || item.role === "model" ? "model" : "user";
        if (formattedHistory.length === 0) {
          if (role !== "user") continue;
          formattedHistory.push({ role: "user", parts: [{ text: item.content }] });
        } else {
          const prev = formattedHistory[formattedHistory.length - 1];
          if (prev.role === role) {
            prev.parts[0].text += "\n\n" + item.content;
          } else {
            formattedHistory.push({ role, parts: [{ text: item.content }] });
          }
        }
      }
      while (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === "user") {
        formattedHistory.pop();
      }
    }

    const geminiHistory = formattedHistory.slice(-10);

    // Initialize Google Gemini API with robust model fallback
    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.7-flash",
    ];

    let responseText = "";
    let lastError: any = null;

    const fullUserPrompt = message + ragContextBlock + modeInstruction;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
        });

        const chat = model.startChat({
          history: geminiHistory,
        });

        const result = await chat.sendMessage(fullUserPrompt);
        responseText = result.response.text();
        if (responseText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} returned error:`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error("Failed to receive response from Gemini models.");
    }

    return NextResponse.json({
      response: responseText,
      sources: retrievedChunks.map((c) => ({
        _id: c._id,
        chunkIndex: c.chunkIndex,
        score: c.score,
        snippet: c.text.slice(0, 180) + (c.text.length > 180 ? "..." : ""),
      })),
    });
  } catch (error: any) {
    console.error("AI Tutor API Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate AI response. Please check your API key or try again.",
      },
      { status: 500 }
    );
  }
}
