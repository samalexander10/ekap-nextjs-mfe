"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, ExternalLink } from "lucide-react";
import { ActionSuggestion, ChatMessage } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { chatService } from "@/services/chatService";

const DEMO_SESSION_ID = "00000000-0000-0000-0000-000000000099";
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

interface Props {
  onActionSuggestion?: (action: ActionSuggestion) => void;
}

export function ChatWindow({ onActionSuggestion }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreamingContent("");

    try {
      let fullContent = "";
      let capturedActions: ActionSuggestion[] = [];

      await chatService.streamChat(
        {
          session_id: DEMO_SESSION_ID,
          user_id: DEMO_USER_ID,
          message: trimmed,
          top_k_docs: 5,
        },
        (token) => {
          fullContent += token;
          setStreamingContent(fullContent);
        },
        (actions) => {
          capturedActions = actions;
        }
      );

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullContent,
        createdAt: new Date().toISOString(),
        actionSuggestions: capturedActions.length > 0 ? capturedActions : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I could not connect to the HR assistant right now. Please try again shortly.",
          createdAt: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setStreamingContent(null);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-ekap-border rounded-2xl overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-3">
            <Bot className="w-12 h-12 opacity-30" />
            <p className="font-medium">Ask me anything about HR policies</p>
            <p className="text-sm">e.g. "How many days of annual leave am I entitled to?"</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble message={msg} />
            {msg.role === "assistant" && msg.actionSuggestions && msg.actionSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-10">
                {msg.actionSuggestions.map((action) => (
                  <button
                    key={action.mini_app_id}
                    onClick={() => onActionSuggestion?.(action)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && streamingContent !== null && (
          <MessageBubble
            message={{
              id: "streaming",
              role: "assistant",
              content: streamingContent || "▍",
              createdAt: new Date().toISOString(),
            }}
            isStreaming
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-ekap-border p-4 flex items-end gap-3"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about HR policies, leave, or procedures…"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-ekap-border px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ekap-primary focus:border-transparent transition-shadow"
          style={{ maxHeight: "120px", overflowY: "auto" }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-3 rounded-xl bg-ekap-primary text-white disabled:opacity-40 hover:bg-blue-700 transition-colors shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
