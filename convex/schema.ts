import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    // Every task now belongs to a specific user
    userId: v.string(),
    title: v.string(),
    subject: v.string(),
    dueDate: v.string(),
    priority: v.string(), // "high" | "medium" | "low"
    status: v.string(),   // "pending" | "completed"
  }).index("by_user", ["userId"]), // Index allows fast lookup by userId

  subjects: defineTable({
    userId: v.string(),
    name: v.string(),
    color: v.string(),
  }).index("by_user", ["userId"]),

  notes: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    subjectId: v.optional(v.id("subjects")),
    subjectName: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    authorName: v.optional(v.string()),
    likes: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),

  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    subjectName: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    role: v.string(), // "user" | "assistant"
    content: v.string(),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  // Part 7: RAG Pipeline
  // Stores metadata about each uploaded PDF/document
  documents: defineTable({
    userId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    subjectName: v.optional(v.string()),
    storageId: v.string(),        // Convex file storage reference
    status: v.string(),           // "uploading" | "processing" | "ready" | "error"
    totalChunks: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Each document is split into small overlapping text chunks for retrieval
  documentChunks: defineTable({
    documentId: v.id("documents"),
    userId: v.string(),
    chunkIndex: v.number(),       // position in document (0, 1, 2...)
    text: v.string(),             // actual text content of the chunk
    pageNumber: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"]),

  // Stores the embedding vector for each chunk (array of floats ≈ 768 numbers)
  // We use this to calculate semantic similarity at query time
  documentEmbeddings: defineTable({
    chunkId: v.id("documentChunks"),
    documentId: v.id("documents"),
    userId: v.string(),
    embedding: v.array(v.float64()), // The numerical "meaning" of the chunk
    createdAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"]),

  // Part 8: AI Quizzes & Assessments
  quizzes: defineTable({
    userId: v.string(),
    title: v.string(),
    topic: v.string(),
    subjectName: v.optional(v.string()),
    documentId: v.optional(v.id("documents")),
    difficulty: v.string(), // "easy" | "medium" | "hard"
    totalQuestions: v.number(),
    score: v.optional(v.number()), // e.g. 4
    completed: v.boolean(),
    timeSpentSeconds: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  quizQuestions: defineTable({
    quizId: v.id("quizzes"),
    userId: v.string(),
    questionIndex: v.number(),
    question: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.number(), // 0, 1, 2, or 3
    explanation: v.string(),
    userAnswer: v.optional(v.number()), // index picked by student
    isCorrect: v.optional(v.boolean()),
  })
    .index("by_quiz", ["quizId"])
    .index("by_user", ["userId"]),

  // Part 9: Flashcards & Spaced Repetition (Leitner System)
  flashcardDecks: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    subjectName: v.optional(v.string()),
    documentId: v.optional(v.id("documents")),
    cardCount: v.number(),
    masteredCount: v.number(), // cards in box >= 4
    isPublic: v.optional(v.boolean()),
    authorName: v.optional(v.string()),
    forksCount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),

  flashcards: defineTable({
    deckId: v.id("flashcardDecks"),
    userId: v.string(),
    front: v.string(), // Prompt / Concept / Question
    back: v.string(),  // Answer / Definition / Explanation
    box: v.number(),   // Leitner box 1 (new) to 5 (mastered)
    nextReviewDate: v.number(), // timestamp when card is due
    reviewCount: v.number(),
    correctStreak: v.number(),
    lastReviewedAt: v.optional(v.number()),
  })
    .index("by_deck", ["deckId"])
    .index("by_user", ["userId"])
    .index("by_review", ["userId", "nextReviewDate"]),

  // Part 10: Study Analytics & AI Performance Insights
  studyInsights: defineTable({
    userId: v.string(),
    overallScore: v.number(), // Academic Health Index (0-100)
    summary: v.string(),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    recommendations: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Part 11: Pomodoro Study Timer & Focus Sessions
  focusSessions: defineTable({
    userId: v.string(),
    subjectName: v.optional(v.string()),
    durationMinutes: v.number(),
    sessionType: v.string(), // "focus" | "short_break" | "long_break"
    completed: v.boolean(),
    reflection: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
