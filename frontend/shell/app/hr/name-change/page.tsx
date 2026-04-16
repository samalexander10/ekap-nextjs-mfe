"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamically load the Module Federation remote component (Webpack 5 remote, no SSR)
const NameChangeApp = dynamic(
  () =>
    import("hrNamechange/NameChangeApp").catch(() => {
      const Fallback = () => (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
          <p className="font-semibold mb-1">Remote module unavailable</p>
          <p className="text-sm">
            The HR Name Change micro-frontend is not reachable. Make sure the{" "}
            <code className="bg-amber-100 px-1 rounded">hr-namechange</code>{" "}
            remote is running on port 3001.
          </p>
        </div>
      );
      return { default: Fallback };
    }),
  { ssr: false, loading: () => <p className="text-slate-500">Loading…</p> }
);

export default function NameChangePage() {
  const router = useRouter();

  const handleComplete = (requestId: string) => {
    console.log("Name change submitted, requestId:", requestId);
    // Navigate back to chat after a short delay so the user sees the success state
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
      <NameChangeApp onComplete={handleComplete} />
    </div>
  );
}
