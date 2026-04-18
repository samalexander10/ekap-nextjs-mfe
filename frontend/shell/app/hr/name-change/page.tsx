"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, ComponentType } from "react";
import { loadRemoteModule } from "../../../lib/load-remote";

const REMOTE_URL =
  process.env.NEXT_PUBLIC_REMOTE_HR_NAMECHANGE_URL || "http://localhost:3001";

export default function NameChangePage() {
  const router = useRouter();
  const [RemoteComponent, setRemoteComponent] = useState<ComponentType<any> | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    loadRemoteModule("hrNamechange", `${REMOTE_URL}/remoteEntry.js`, "./NameChangeApp")
      .then((mod) => setRemoteComponent(() => mod.default || mod))
      .catch(() => setLoadError(true));
  }, []);

  const handleComplete = (requestId: string) => {
    console.log("Name change submitted, requestId:", requestId);
    setTimeout(() => router.push("/chat"), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Legal Name Change Request
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Submit a request to update your legal name in company records.
        </p>
      </div>
      {loadError ? (
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
      ) : (
        <p className="text-slate-500">Loading…</p>
      )}
    </div>
  );
}
