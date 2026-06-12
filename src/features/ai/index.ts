// AI Feature Barrel Export

// Types
export type {
  AIMessageRole,
  AIMessageStatus,
  AIChatUIState,
  AIMessage,
  AISuggestion,
  AIChatState,
} from "./types/ai.types";

// Hooks
export { useAIChat } from "./hooks/use-ai-chat";

// Mock Data
export { MOCK_SUGGESTIONS, MOCK_MESSAGES, MOCK_STREAMING_MESSAGE } from "./data/ai.mock";

// UI Components
export { default as AISuggestionChip } from "./components/ui/AISuggestionChip";
export { default as AIEmptyState } from "./components/ui/AIEmptyState";
export { default as AILoadingState } from "./components/ui/AILoadingState";
export { default as AIErrorState } from "./components/ui/AIErrorState";
export { default as AIMessageBubble } from "./components/ui/AIMessageBubble";
export { default as AIStreamingMessage } from "./components/ui/AIStreamingMessage";
export { default as AIMessageList } from "./components/ui/AIMessageList";
export { default as AIChatInput } from "./components/ui/AIChatInput";
export { default as AIChatHeader } from "./components/ui/AIChatHeader";

// Pages
export { default as AIChatPage } from "./pages/AIChatPage";