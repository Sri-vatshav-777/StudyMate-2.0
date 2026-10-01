"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Sparkles,
  Search,
  Eye,
  Layers,
  ArrowRight,
  RefreshCw,
  BookOpen,
} from "lucide-react";

export default function DocumentsPage() {
  const documents = useQuery(api.documents.getDocuments);
  const subjects = useQuery(api.subjects.getSubjects);

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.createDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");

  // Chunk inspector modal state
  const [inspectDocId, setInspectDocId] = useState<Id<"documents"> | null>(null);
  const inspectingDoc = documents?.find((d) => d._id === inspectDocId);
  const inspectedChunks = useQuery(
    api.documents.getChunks,
    inspectDocId ? { documentId: inspectDocId } : "skip"
  );

  // Semantic search sandbox state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchDocFilter, setSearchDocFilter] = useState<string>("");

  // Handle file drop / select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setUploadError("Only PDF documents are supported for RAG parsing.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File size exceeds 10MB limit.");
        return;
      }
      setSelectedFile(file);
      setUploadError("");
    }
  };

  // Upload and start processing pipeline
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadError("");

      // Step 1: Request upload URL from Convex
      setUploadStep("1/3 Requesting secure upload URL...");
      const postUrl = await generateUploadUrl();

      // Step 2: Upload file directly to Convex storage
      setUploadStep("2/3 Uploading PDF to cloud storage...");
      const uploadRes = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to cloud storage.");
      }

      const { storageId } = await uploadRes.json();

      // Step 3: Create document record in database
      setUploadStep("3/3 Initializing document record...");
      const docId = await createDocument({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        storageId,
        subjectName: selectedSubject || undefined,
      });

      // Step 4: Trigger background text extraction, chunking, and embedding generation
      setUploadStep("Parsing text, creating chunks & generating embeddings...");
      const processRes = await fetch("/api/documents/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: docId,
          storageId,
        }),
      });

      const processData = await processRes.json();
      if (!processRes.ok) {
        throw new Error(processData.error || "Failed to process document.");
      }

      // Reset form
      setSelectedFile(null);
      setSelectedSubject("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "An unexpected error occurred during processing.");
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  // Retry processing a failed document
  const handleRetryProcessing = async (doc: any) => {
    try {
      setIsUploading(true);
      setUploadError("");
      setUploadStep(`Reprocessing ${doc.fileName}...`);
      const processRes = await fetch("/api/documents/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: doc._id,
          storageId: doc.storageId,
        }),
      });
      const data = await processRes.json();
      if (!processRes.ok) {
        throw new Error(data.error || "Failed to reprocess document.");
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to reprocess document.");
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  // Run semantic search sandbox
  const handleRunSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await fetch("/api/documents/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          documentId: searchDocFilter || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.chunks || []);
      } else {
        alert(data.error || "Search failed.");
      }
    } catch (err: any) {
      alert(err.message || "Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Study Materials & RAG</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload your syllabus or lecture PDFs to chunk, vectorize, and enable grounded AI tutoring.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Upload Box + Search Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-500" />
            Upload PDF Document
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Your document will be parsed into 800-character overlapping chunks, vectorized with Google&apos;s{" "}
            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">text-embedding-004</code>{" "}
            model, and stored for instant semantic search.
          </p>

          <form onSubmit={handleUpload} className="space-y-4">
            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                selectedFile
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <FileText className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatFileSize(selectedFile.size)} • Click to choose a different PDF
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Click to select or drag and drop a PDF
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF up to 10MB</p>
                </div>
              )}
            </div>

            {/* Subject Link Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Associate with Subject (Optional)
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No specific subject</option>
                  {subjects?.map((s) => (
                    <option key={s._id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="w-full h-[38px] flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition shadow-sm"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing Pipeline...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Process Document
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Progress indicator */}
            {isUploading && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Pipeline in Progress</span>
                </div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                  {uploadStep}
                </p>
              </div>
            )}

            {uploadError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}
          </form>
        </div>

        {/* Semantic Search Sandbox (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-500" />
            RAG Semantic Search Test
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Test how cosine similarity retrieves relevant chunks from your documents in real-time.
          </p>

          <form onSubmit={handleRunSearch} className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="e.g. What is database normalization?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <select
                value={searchDocFilter}
                onChange={(e) => setSearchDocFilter(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              >
                <option value="">All Documents</option>
                {documents
                  ?.filter((d) => d.status === "ready")
                  .map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.fileName}
                    </option>
                  ))}
              </select>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Query
              </button>
            </div>
          </form>

          {/* Search Results Display */}
          <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1">
            {searchResults.length > 0 ? (
              searchResults.map((chunk, i) => (
                <div
                  key={chunk._id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      Chunk #{chunk.chunkIndex + 1}
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono px-1.5 py-0.5 rounded">
                      Similarity: {(chunk.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 line-clamp-3 italic">
                    &ldquo;{chunk.text}&rdquo;
                  </p>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Layers className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-xs">
                  {searchQuery ? "No matching chunks found above threshold" : "Enter a query to test chunk retrieval"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold">Your Document Library</h2>
            <p className="text-xs text-slate-500">
              {documents?.length || 0} document{documents?.length === 1 ? "" : "s"} indexed in your personal vector store
            </p>
          </div>
        </div>

        {documents === undefined ? (
          <div className="p-8 text-center text-slate-400">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No documents yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Upload your course PDFs above. Once processed, they become the grounding knowledge base for your AI Tutor.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{doc.fileName}</span>
                      {doc.status === "ready" && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready
                        </span>
                      )}
                      {doc.status === "processing" && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                          <Clock className="w-3 h-3 animate-spin" />
                          Processing
                        </span>
                      )}
                      {doc.status === "error" && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Error
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      {doc.totalChunks !== undefined && (
                        <>
                          <span>•</span>
                          <span>{doc.totalChunks} chunks vectorized</span>
                        </>
                      )}
                      {doc.subjectName && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-500">{doc.subjectName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {doc.status === "error" && (
                    <button
                      onClick={() => handleRetryProcessing(doc)}
                      disabled={isUploading}
                      className="px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry Processing
                    </button>
                  )}

                  {doc.status === "ready" && (
                    <>
                      {/* Inspect Chunks Button */}
                      <button
                        onClick={() => setInspectDocId(doc._id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Chunks
                      </button>

                      {/* Study in AI Tutor Button */}
                      <Link
                        href={`/ai-tutor?docId=${doc._id}`}
                        className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Study with Tutor
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${doc.fileName}" and all associated embeddings?`)) {
                        deleteDocument({ id: doc._id });
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspect Chunks Modal */}
      {inspectDocId && inspectingDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  Chunk Inspector: {inspectingDoc.fileName}
                </h3>
                <p className="text-xs text-slate-500">
                  Showing {inspectedChunks?.length || 0} parsed chunks and vector associations
                </p>
              </div>
              <button
                onClick={() => setInspectDocId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {inspectedChunks === undefined ? (
                <div className="p-8 text-center text-slate-400 text-sm">Loading chunks...</div>
              ) : inspectedChunks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No chunks generated for this file.</div>
              ) : (
                inspectedChunks.map((chunk) => (
                  <div
                    key={chunk._id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        CHUNK #{chunk.chunkIndex + 1}
                      </span>
                      <span>Length: {chunk.text.length} chars</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {chunk.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectDocId(null)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
