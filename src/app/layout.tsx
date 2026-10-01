import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "StudyMate - Intelligent AI Study Platform & Spaced Repetition",
    template: "%s | StudyMate",
  },
  description: "Accelerate your learning with AI tutoring, RAG-grounded document analysis, Leitner spaced repetition flashcards, automated quizzes, and focus analytics.",
  keywords: [
    "AI tutor",
    "spaced repetition",
    "flashcards",
    "Leitner system",
    "RAG document search",
    "study analytics",
    "Pomodoro focus timer",
    "exam prep",
  ],
  authors: [{ name: "StudyMate" }],
  openGraph: {
    title: "StudyMate - Intelligent AI Study Platform",
    description: "Accelerate your learning with AI tutoring, RAG document analysis, Leitner flashcards, and live focus tracking.",
    type: "website",
    siteName: "StudyMate",
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyMate - Intelligent AI Study Platform",
    description: "Your personalized intelligent learning platform with AI tutoring, RAG search, and Leitner spaced repetition.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} antialiased`}>
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
