import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const { message, mode, history } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

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
      // Helpful fallback response when GEMINI_API_KEY is not yet configured in .env.local
      const fallbackResponse = `### 🤖 StudyMate AI Tutor (Simulation Mode)

I received your prompt: **"${message.trim()}"**

To connect me to live Google Gemini AI:
1. Get a free API key at [Google AI Studio](https://aistudio.google.com/).
2. Add it to your \`.env.local\` file:
   \`\`\`env
   GEMINI_API_KEY=your_gemini_api_key_here
   \`\`\`
3. Restart your dev server.

---

### Concept Overview: ${message.trim()}
Here is an architectural breakdown of what you asked:

- **Core Concept**: Break complex topics into smaller, self-contained components.
- **Mental Model**: Think of how data flows step-by-step through inputs, transformations, and outputs.
- **Best Practice**: Validate inputs early, keep functions pure, and handle edge cases gracefully.

*Add your \`GEMINI_API_KEY\` to unlock personalized real-time tutoring with full deep-dive explanations!*`;

      return NextResponse.json({ response: fallbackResponse });
    }

    // Initialize Google Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.7-flash", "gemini-3.6-flash"];

    let responseText = "";
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT + modeInstruction,
        });

        // Build conversation context if history exists
        const chat = model.startChat({
          history: Array.isArray(history)
            ? history.slice(-8).map((h: { role: string; content: string }) => ({
                role: h.role === "assistant" ? "model" : "user",
                parts: [{ text: h.content }],
              }))
            : [],
        });

        const result = await chat.sendMessage(message + modeInstruction);
        responseText = result.response.text();
        if (responseText) break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} unavailable, attempting fallback...`);
      }
    }

    if (!responseText) {
      throw lastError || new Error("Failed to receive response from Gemini models.");
    }

    return NextResponse.json({ response: responseText });
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
