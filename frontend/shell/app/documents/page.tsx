"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadResult {
  document_id: string;
  filename: string;
  status: string;
  message: string;
}

export default function DocumentsPage() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setStatus("uploading");
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaded_by", "00000000-0000-0000-0000-000000000001"); // demo user

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_DOC_PROCESSOR_URL}/api/documents/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }

      const data: UploadResult = await res.json();
      setResult(data);
      setStatus("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Document Library</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload HR policy documents (PDF, DOCX, or TXT). They will be
          automatically indexed for the chat assistant.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-ekap-primary bg-blue-50"
            : "border-ekap-border hover:border-ekap-primary hover:bg-slate-50"
        }`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
        <p className="text-slate-700 font-medium mb-1">
          Drop a file here or click to browse
        </p>
        <p className="text-slate-400 text-sm">Supports PDF, DOCX, TXT — max 20 MB</p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Status messages */}
      {status === "uploading" && (
        <div className="mt-4 flex items-center gap-2 text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Uploading and queuing for processing…</span>
        </div>
      )}

      {status === "success" && result && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-green-800 font-medium">{result.filename} uploaded</p>
            <p className="text-green-700 text-sm mt-0.5">{result.message}</p>
            <p className="text-green-600 text-xs mt-1">Document ID: {result.document_id}</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Upload failed</p>
            <p className="text-red-700 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
