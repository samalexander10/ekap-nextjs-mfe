export interface ActionSuggestion {
  mini_app_id: string;
  label: string;
  iframe_url?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  isError?: boolean;
  sources?: SourceChunk[];
  actionSuggestions?: ActionSuggestion[];
}

export interface SourceChunk {
  document_id: string;
  filename: string;
  chunk_index: number;
  content_snippet: string;
}

export interface ChatRequest {
  session_id: string;
  user_id: string;
  message: string;
  stream?: boolean;
  top_k_docs?: number;
}

export interface ChatResponse {
  session_id: string;
  message_id: string;
  answer: string;
  sources: SourceChunk[];
  latency_ms: number;
}
