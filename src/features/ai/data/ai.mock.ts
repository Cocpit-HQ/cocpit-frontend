import type { AIMessage, AISuggestion } from "../types/ai.types";

export const MOCK_SUGGESTIONS: AISuggestion[] = [
  {
    id: "s1",
    label: "Summarize my profile",
    prompt: "Can you summarize my professional profile?",
  },
  {
    id: "s2",
    label: "Improve my bio",
    prompt: "Help me improve my bio to sound more professional.",
  },
  {
    id: "s3",
    label: "Suggest skills to add",
    prompt: "What skills should I add based on my experience?",
  },
  {
    id: "s4",
    label: "Write a connection message",
    prompt: "Write a personalized connection request message for a recruiter.",
  },
];

export const MOCK_MESSAGES: AIMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "Can you summarize my professional profile?",
    status: "done",
    createdAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "Sure! Based on your profile, you are a skilled frontend developer with experience in React, TypeScript, and modern UI systems. You have worked on social platforms and design systems, and you bring strong attention to detail in both code quality and user experience.",
    status: "done",
    createdAt: new Date(Date.now() - 55000).toISOString(),
  },
  {
    id: "m3",
    role: "user",
    content: "What skills should I add to stand out more?",
    status: "done",
    createdAt: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: "m4",
    role: "assistant",
    content:
      "Great question! To stand out, consider adding: Next.js App Router, Figma to code workflows, performance optimization, and accessibility (WCAG). These are highly valued in product-focused frontend roles right now.",
    status: "done",
    createdAt: new Date(Date.now() - 25000).toISOString(),
  },
];

export const MOCK_STREAMING_MESSAGE: AIMessage = {
  id: "m-streaming",
  role: "assistant",
  content: "Let me think about that for you...",
  status: "streaming",
  createdAt: new Date().toISOString(),
};