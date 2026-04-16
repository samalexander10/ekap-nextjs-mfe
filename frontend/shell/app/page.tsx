import Link from "next/link";
import { MessageSquare, FileText, User } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "HR Assistant Chat",
    description:
      "Ask questions about HR policies, leave entitlements, and company procedures. Powered by RAG over your official HR documents.",
    href: "/chat",
    cta: "Start chatting",
    colour: "bg-blue-50 text-blue-600",
  },
  {
    icon: FileText,
    title: "Name Change Request",
    description:
      "Submit a legal name change request. Track its status and receive notifications when reviewed by HR.",
    href: "/hr/name-change",
    cta: "Submit request",
    colour: "bg-violet-50 text-violet-600",
  },
  {
    icon: FileText,
    title: "Document Library",
    description:
      "Upload and manage HR policy documents. Documents are automatically indexed for the chat assistant.",
    href: "/documents",
    cta: "Manage documents",
    colour: "bg-sky-50 text-sky-600",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome to EKAP
        </h1>
        <p className="text-slate-500 text-lg">
          Employee Knowledge &amp; Assistance Platform — your intelligent HR
          companion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div
            key={f.href}
            className="bg-white border border-ekap-border rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.colour}`}>
              <f.icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-lg mb-1">
                {f.title}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                {f.description}
              </p>
            </div>
            <Link
              href={f.href}
              className="mt-auto inline-flex items-center text-sm font-medium text-ekap-primary hover:underline"
            >
              {f.cta} &rarr;
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
