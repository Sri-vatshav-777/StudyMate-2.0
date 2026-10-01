"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import { 
  Bot, 
  Send, 
  Plus, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  Code, 
  HelpCircle, 
  FileText, 
  Loader2, 
  MessageSquare,
  ChevronRight,
  Database,
  ExternalLink
} from "lucide-react";

const MODES = [
  { id: "normal", label: "General Tutor", icon: Bot },
  { id: "simple", label: "Explain Simply", icon: BookOpen },
  { id: "examples", label: "Code Examples", icon: Code },
  { id: "quiz", label: "Quiz Me", icon: HelpCircle },
  { id: "summary", label: "Quick Summary", icon: FileText },
];

const STARTER_PROMPTS = [
  "Explain Time Complexity & Big O notation with a simple analogy",
  "How does indexing work in SQL databases to speed up queries?",
  "What is the difference between TCP and UDP in computer networks?",
  "Quiz me on Binary Search Trees with 3 practice questions",
];

function AiTutorContent() {
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get("docId") || "";

  const conversations = useQuery(api.ai.getConversations);
  const documents = useQuery(api.documents.getDocuments);
  
  const [selectedConvId, setSelectedConvId] = useState<Id<"conversations"> | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId);
  const messages = useQuery(api.ai.getMessages, { conversationId: selectedConvId ?? undefined });

  const createConversation = useMutation(api.ai.createConversation);
  const addMessage = useMutation(api.ai.addMessage);
  const deleteConversation = useMutation(api.ai.deleteConversation);

  const [input, setInput] = useState("");
  const [selectedMode, setSelectedMode] = useState("normal");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSources, setRecentSources] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initialDocId from URL if changed
  useEffect(() => {
    if (initialDocId) {
      setSelectedDocId(initialDocId);
    }
  }, [initialDocId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-select latest conversation if none selected
  useEffect(() => {
    if (!selectedConvId && conversations && conversations.length > 0) {
      setSelectedConvId(conversations[0]._id);
    }
  }, [conversations, selectedConvId]);

  const handleStartNewChat = async () => {
    setSelectedConvId(null);
    setInput("");
    setError(null);
    setRecentSources([]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend ?? input).trim();
    if (!messageContent || isLoading) return;

    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      let convId = selectedConvId;

      // If no conversation is active, create one first
      if (!convId) {
        const title = messageContent.length > 35 
          ? messageContent.slice(0, 35) + "..." 
          : messageContent;
        convId = await createConversation({ title });
        setSelectedConvId(convId);
      }

      // 1. Save user message to database
      await addMessage({
        conversationId: convId,
        role: "user",
        content: messageContent,
      });

      // 2. Format history for server AI
      const historyContext = (messages ?? []).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // 3. Call server-side AI route with document grounding support
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageContent,
          mode: selectedMode,
          history: historyContext,
          documentId: selectedDocId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response.");
      }

      if (data.sources && data.sources.length > 0) {
        setRecentSources(data.sources);
      } else {
        setRecentSources([]);
      }

      // 4. Save AI response to database
      await addMessage({
        conversationId: convId,
        role: "assistant",
        content: data.response,
      });
    } catch (err: any) {
      console.error("AI chat error:", err);
      setError(err.message || "Failed to connect to AI tutor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: Id<"conversations">) => {
    e.stopPropagation();
    try {
      await deleteConversation({ id });
      if (selectedConvId === id) {
        setSelectedConvId(null);
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const activeDoc = documents?.find((d) => d._id === selectedDocId);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      {/* Sidebar: Conversation History */}
      <div className="w-full md:w-72 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col shrink-0 shadow-sm">
        <button
          onClick={handleStartNewChat}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2 mb-4 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Study Session
        </button>

        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
          Study History
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {conversations === undefined ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading sessions...
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No previous study chats. Start one above!
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => setSelectedConvId(conv._id)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-sm transition-all group ${
                  selectedConvId === conv._id
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, conv._id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-1"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        {/* Tutor Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight flex items-center gap-2">
                StudyMate AI Tutor
                {selectedDocId ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-normal text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    <Database className="w-3 h-3" />
                    RAG Grounded
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-normal text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeDoc 
                  ? `Answering using verified excerpts from: ${activeDoc.fileName}`
                  : "Ask any academic question or ground with your course materials below"}
              </p>
            </div>
          </div>

          {/* Document Grounding Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-xl text-xs">
              <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-300 focus:outline-none max-w-[150px] truncate"
              >
                <option value="">No Document (General AI)</option>
                {documents
                  ?.filter((d) => d.status === "ready")
                  .map((d) => (
                    <option key={d._id} value={d._id}>
                      📄 {d.fileName}
                    </option>
                  ))}
              </select>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-white/10 p-1 rounded-xl">
              {MODES.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMode(m.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title={m.label}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {(!messages || messages.length === 0) && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">What would you like to master today?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {activeDoc ? (
                  <span>
                    Currently grounded with <span className="font-semibold text-indigo-600 dark:text-indigo-400">&ldquo;{activeDoc.fileName}&rdquo;</span>. Ask questions directly from this document!
                  </span>
                ) : (
                  <span>
                    Choose a starter prompt below, or attach an uploaded syllabus PDF to ask questions grounded in your course materials.
                  </span>
                )}
              </p>

              {/* Quick links to Documents if none uploaded */}
              {(!documents || documents.length === 0) && (
                <Link
                  href="/documents"
                  className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/40 hover:underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Upload a PDF in Documents to enable RAG tutoring
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              )}

              <div className="grid grid-cols-1 gap-2.5 w-full text-left">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between group shadow-sm"
                  >
                    <span>{prompt}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages?.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg._id}
                    className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl p-4.5 text-sm leading-relaxed ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-tr-none shadow-sm"
                          : "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-white/10"
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                    </div>
                  </div>
                );
              })}

              {/* Display RAG Sources if available from last turn */}
              {recentSources.length > 0 && !isLoading && (
                <div className="pl-11">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs space-y-1.5">
                    <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-500" />
                      Grounded Citations ({recentSources.length} relevant chunks used)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSources.map((source, i) => (
                        <span
                          key={source._id || i}
                          className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 px-2 py-0.5 rounded-lg text-[11px] font-mono"
                          title={source.snippet}
                        >
                          Chunk #{source.chunkIndex + 1} ({(source.score * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl rounded-tl-none p-4 text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>
                      {selectedDocId
                        ? "Searching document chunks with vector similarity & generating grounded response..."
                        : "StudyMate AI is analyzing and generating response..."}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeDoc
                  ? `Ask anything from "${activeDoc.fileName}"...`
                  : `Ask anything in ${MODES.find((m) => m.id === selectedMode)?.label} mode...`
              }
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AiTutorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading AI Tutor...</div>}>
      <AiTutorContent />
    </Suspense>
  );
}
