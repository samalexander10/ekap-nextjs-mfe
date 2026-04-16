"use client";

import { useState } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { NameChangeSidePanel } from "@/components/NameChangeSidePanel";
import { ActionSuggestion } from "@/types/chat";

export default function ChatPage() {
  const [activeAction, setActiveAction] = useState<ActionSuggestion | null>(null);

  const handleActionSuggestion = (action: ActionSuggestion) => {
    setActiveAction(action);
  };

  const handlePanelClose = () => {
    setActiveAction(null);
  };

  const panelOpen = activeAction !== null;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">HR Assistant</h1>
        <p className="text-slate-500 text-sm mt-1">
          Ask anything about HR policies, leave, or procedures.
        </p>
      </div>
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Chat — shrinks when panel is open */}
        <div className={panelOpen ? "flex-1 min-w-0" : "w-full"}>
          <ChatWindow onActionSuggestion={handleActionSuggestion} />
        </div>

        {/* Side panel — fixed width, slides in */}
        {panelOpen && (
          <div className="w-96 shrink-0">
            <NameChangeSidePanel open={panelOpen} onClose={handlePanelClose} />
          </div>
        )}
      </div>
    </div>
  );
}
