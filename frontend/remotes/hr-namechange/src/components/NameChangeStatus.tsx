"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, Clock, XCircle } from "lucide-react";
import { hrService, NameChangeRequest } from "../services/hrService";

interface Props {
  requestId: string;
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: "Pending Review",
    colour: "text-amber-600 bg-amber-50 border-amber-200",
  },
  approved: {
    icon: CheckCircle,
    label: "Approved",
    colour: "text-green-600 bg-green-50 border-green-200",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    colour: "text-red-600 bg-red-50 border-red-200",
  },
} as const;

export default function NameChangeStatus({ requestId }: Props) {
  const [request, setRequest] = useState<NameChangeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hrService
      .getNameChangeRequest(requestId)
      .then(setRequest)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading status…</span>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="text-red-600 text-sm">
        Could not load request: {error || "Not found"}
      </div>
    );
  }

  const config =
    STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <div className={`border rounded-xl p-5 ${config.colour}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5" />
        <span className="font-semibold">{config.label}</span>
      </div>

      <dl className="space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="font-medium w-32 shrink-0">Request ID:</dt>
          <dd className="text-xs font-mono">{request.id}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium w-32 shrink-0">From:</dt>
          <dd>{request.oldFullName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium w-32 shrink-0">To:</dt>
          <dd>{request.newFullName}</dd>
        </div>
        {request.reviewerNotes && (
          <div className="flex gap-2">
            <dt className="font-medium w-32 shrink-0">HR Notes:</dt>
            <dd>{request.reviewerNotes}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
