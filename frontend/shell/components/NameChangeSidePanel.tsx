"use client";

import { X, CheckCircle } from "lucide-react";
import { useState, useEffect, ComponentType } from "react";
import { loadRemoteModule } from "../lib/load-remote";

const REMOTE_URL =
  process.env.NEXT_PUBLIC_REMOTE_HR_NAMECHANGE_URL || "http://localhost:3001";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NameChangeSidePanel({ open, onClose }: Props) {
  const [completedId, setCompletedId] = useState<string | null>(null);
  const [RemoteComponent, setRemoteComponent] = useState<ComponentType<any> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || RemoteComponent || loadError) return;
    setLoading(true);
    loadRemoteModule("hrNamechange", `${REMOTE_URL}/remoteEntry.js`, "./NameChangeApp")
      .then((mod) => {
        setRemoteComponent(() => mod.default || mod);
        setLoading(false);
      })
      .catch(() => {
        setLoadError(true);
        setLoading(false);
      });
  }, [open, RemoteComponent, loadError]);

  const handleComplete = (requestId: string) => {
    setCompletedId(requestId);
  };

  const handleClose = () => {
    setCompletedId(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="flex flex-col h-full bg-white border border-ekap-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-ekap-border">
        <h2 className="text-base font-semibold text-slate-900">Legal Name Change</h2>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {completedId ? (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <div>
              <p className="font-semibold text-slate-900 text-lg">Request Submitted!</p>
              <p className="text-slate-500 text-sm mt-1">
                Your name change request has been received and will be processed within 3–5 business days.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <p className="text-xs text-green-700 font-medium">Request ID</p>
              <p className="text-sm font-mono font-semibold text-green-900">{completedId}</p>
            </div>
            <button
              onClick={handleClose}
              className="mt-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        ) : loading ? (
          <p className="text-slate-500 text-sm">Loading form…</p>
        ) : loadError ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
            <p className="font-semibold mb-1">Remote module unavailable</p>
            <p className="text-sm">
              The HR Name Change micro-frontend is not reachable. Make sure the{" "}
              <code className="bg-amber-100 px-1 rounded">hr-namechange</code>{" "}
              remote is running on port 3001.
            </p>
          </div>
        ) : RemoteComponent ? (
          <RemoteComponent onComplete={handleComplete} />
        ) : null}
      </div>
    </div>
  );
}
