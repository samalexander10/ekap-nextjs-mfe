import { ActionSuggestion, ChatRequest, ChatResponse } from "@/types/chat";

const BASE_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:8080";

export const chatService = {
  /**
   * Send a non-streaming chat request.
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Chat API error: ${res.status}`);
    }

    return res.json() as Promise<ChatResponse>;
  },

  /**
   * Stream chat chunks via SSE.
   * The Python backend emits:
   *   {"type":"chunk","content":"...","done":false}
   *   {"type":"done","done":true,"action_suggestions":[...]}
   *
   * onToken   — called for each text chunk
   * onActions — called once at the end with any action suggestions
   */
  async streamChat(
    request: ChatRequest,
    onToken: (token: string) => void,
    onActions?: (actions: ActionSuggestion[]) => void
  ): Promise<void> {
    const res = await fetch(`${BASE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: request.message,
        conversation_id: request.session_id,
        user_id: request.user_id,
        user_roles: [],
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Stream API error: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "chunk" && data.content) {
              onToken(data.content as string);
            } else if (data.type === "done" && onActions) {
              const actions = (data.action_suggestions ?? []) as ActionSuggestion[];
              if (actions.length > 0) onActions(actions);
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }
    }
  },
};
