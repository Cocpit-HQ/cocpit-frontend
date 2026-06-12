export type AIMessageRole = "user" | "assistant";

export type AIMessageStatus = "sending" | "streaming" | "done" | "error";

export type AIChatUIState =
  | "empty"
  | "empty_with_suggestions"
  | "active"
  | "loading"
  | "streaming"
  | "error";

export interface AIAttachment {
  name: string;
  url: string;
  type: string;
  isUnsupported?: boolean;
  isTooLarge?: boolean;
}

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  status: AIMessageStatus;
  createdAt: string;
  attachments?: AIAttachment[];
  error?: string;
}

export interface AISuggestion {
  id: string;
  label: string;
  prompt: string;
}

export interface AIChatState {
  messages: AIMessage[];
  uiState: AIChatUIState;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  streamingMessageId: string | null;
}