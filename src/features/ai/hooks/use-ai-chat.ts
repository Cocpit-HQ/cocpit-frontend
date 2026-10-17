import { useState, useCallback, useRef } from "react";
import type { AIMessage, AIChatState, AIChatUIState, AIAttachment } from "../types/ai.types";
import { MOCK_MESSAGES, MOCK_SUGGESTIONS } from "../data/ai.mock";
import { DUMMY_RESPONSES, DEFAULT_RESPONSE } from "../data/ai.dummy";

if (typeof window !== "undefined") {
  (window as any).MOCK_ERROR = (window as any).MOCK_ERROR || false;
  (window as any).CONNECTION_LOST = (window as any).CONNECTION_LOST || false;
  (window as any).CONNECTION_LOST_USER = (window as any).CONNECTION_LOST_USER || false;
  (window as any).CONNECTION_LOST_ASSISTANT = (window as any).CONNECTION_LOST_ASSISTANT || false;
}

const generateId = () => `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const MOCK_AI_RESPONSES = [
  "That's a great question! Based on your profile, I'd recommend focusing on building projects that showcase your skills clearly.",
  "I can help with that! Here are a few suggestions tailored to your experience level and industry.",
  "Absolutely! Let me break that down for you in a simple and actionable way.",
  "Great thinking! This is something many professionals overlook, but it can make a big difference.",
];

export function isCapabilitiesQuery(content: string): boolean {
  const lower = content.toLowerCase();
  const keywords = [
    "capabilities",
    "assistant capabilities",
    "banner",
    "graphic",
    "graphics",
    "auto-apply",
    "auto apply",
    "apply for me",
    "cannot generate"
  ];
  return keywords.some(kw => lower.includes(kw));
}

export function isSensitiveDataQuery(content: string): boolean {
  const lower = content.toLowerCase();
  const keywords = [
    "sensitive",
    "sensitive data",
    "private",
    "privacy",
    "confidential",
    "security"
  ];
  return keywords.some(kw => lower.includes(kw));
}

export function isTaxQuery(content: string): boolean {
  const lower = content.toLowerCase();
  const keywords = [
    "tax",
    "remote work tax",
    "cross border tax",
    "cross-border tax",
    "insufficient information",
    "tax scenario",
    "cross-border",
    "lisbon",
    "singapore"
  ];
  return keywords.some(kw => lower.includes(kw));
}

export function isJobRelatedQuery(content: string): boolean {
  const lower = content.toLowerCase();
  const keywords = [
    "job list",
    "frontend jobs",
    "react jobs",
    "developer jobs",
    "work opportunities",
    "job recommendations",
    "job",
    "jobs",
    "career",
    "careers",
    "vacancy",
    "vacancies",
    "hiring",
    "openings",
    "opportunities",
    "employment"
  ];
  return keywords.some(kw => lower.includes(kw));
}

export function isJobAndChartQuery(content: string): boolean {
  const lower = content.toLowerCase();
  const hasJob = [
    "job",
    "jobs",
    "career",
    "careers",
    "vacancy",
    "vacancies",
    "hiring",
    "openings",
    "opportunities",
    "employment"
  ].some(kw => lower.includes(kw));
  const hasChart = [
    "graph",
    "chart",
    "analytics",
    "analysis",
    "trend",
    "growth",
    "statistics",
    "report",
    "visualization",
    "metrics"
  ].some(kw => lower.includes(kw));

  if (lower.includes("convo") && (lower.includes("job") || lower.includes("jobs"))) {
    return true;
  }

  return hasJob && hasChart;
}

const getRandomResponse = () =>
  MOCK_AI_RESPONSES[Math.floor(Math.random() * MOCK_AI_RESPONSES.length)];

function findBestMockResponse(userInput: string): string {
  const contentLower = userInput.toLowerCase().trim();
  if (isSensitiveDataQuery(contentLower)) {
    return "Sensitive Data Detected!\n\nI couldn't find enough verifiable database records or uploaded project files to provide an accurate answer regarding this specific cross-border tax scenario\n\nTo fix this, you can:\n• Upload your tax legal documents directly to this chat thread\n• Rephrase your question focusing on general global freelance rules";
  }
  if (isTaxQuery(contentLower)) {
    return "I couldn't find enough verifiable database records or uploaded project files to provide an accurate answer regarding this specific cross-border tax scenario\n\nTo fix this, you can:\n• Upload your tax legal documents directly to this chat thread\n• Rephrase your question focusing on general global freelance rules";
  }
  if (isCapabilitiesQuery(contentLower)) {
    return "I cannot generate images, design graphics, or automatically submit job applications for you.\n\nHowever, I can help you write a highly optimized text blueprint for your profile bio, or craft an exceptional cover letter tailored to that Senior Developer job!\n\nWhat would you like me to do?";
  }
  if (contentLower.includes("optimize profile bio text")) {
    return "Here is a highly optimized text blueprint for your profile bio:\n\n**Headline:** Senior Developer | React & Next.js Specialist | Building High-Performance Web Applications\n\n**About Me:**\nI am a passionate Senior Developer with 5+ years of experience specializing in React, Next.js, and modern frontend architectures. I love crafting clean, accessible, and performant user experiences.\n\n**Core Tech:**\n• Frontend: React, Next.js, TypeScript, Tailwind CSS, Zustand\n• Backend: Node.js, Express, PostgreSQL, Prisma\n• Tools: Git, Docker, Playwright, Vitest\n\nWould you like me to tailor this for a specific industry or modify any section?";
  }
  if (contentLower.includes("write custom cover letter")) {
    return "Here is an exceptional cover letter tailored to the Senior Developer role:\n\nDear Hiring Manager,\n\nI am writing to express my strong interest in the Senior Developer position. With over 5 years of experience designing and implementing scalable web applications, I am confident in my ability to make a significant contribution to your engineering team.\n\nIn my previous role, I led the migration of a legacy platform to Next.js, resulting in a 40% improvement in page load speeds and a 15% increase in conversion rates. I specialize in React, TypeScript, and state management, and I am passionate about mentoring junior developers and establishing engineering best practices.\n\nThank you for your time and consideration. I look forward to discussing how my skills and experience align with your team's needs.\n\nSincerely,\n[Your Name]";
  }
  if (isJobAndChartQuery(contentLower)) {
    return `Based on your recent activity, I've curated some tailored opportunities.

• Found 3 high-match roles in Frontend Development
• Identified 1 upcoming networking event in your area
• Noticed a new skill trend: React Server Components`;
  }
  if (isJobRelatedQuery(contentLower)) {
    return `I have curated the recommended jobs for you. You can view them directly in the Lunar Panel.`;
  }
  const isPDFRequest = contentLower === "create pdf" || contentLower === "create" || contentLower === "generate" || contentLower === "generate pdf" || contentLower.includes("create pdf") || contentLower.includes("generate pdf") || contentLower.includes("create") || contentLower.includes("generate") || contentLower.includes("pdf");
  if (isPDFRequest) {
    return "Download PDF";
  }

  const websiteKeywords = [
    "website",
    "websites",
    "competitors",
    "reference sites",
    "similar products",
    "examples",
    "inspiration",
    "saas examples",
    "product examples",
    "landing pages"
  ];
  if (websiteKeywords.some(kw => contentLower.includes(kw))) {
    return "Here are two strong references for the kind of AI workspace UX you’re describing:\n\nThese two are probably the closest modern references for:\n“AI integrated into a primary product ecosystem”\ninstead of:\n“standalone chatbot app";
  }

  const words = userInput.toLowerCase().split(/\W+/).filter(Boolean);
  if (words.length === 0) return DEFAULT_RESPONSE;

  let bestResponse = DEFAULT_RESPONSE;
  let maxMatchCount = 0;

  for (const item of DUMMY_RESPONSES) {
    let matchCount = 0;
    for (const keyword of item.keywords) {
      if (words.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      bestResponse = item.response;
    }
  }

  return bestResponse;
}

export function useAIChat() {
  const [state, setState] = useState<AIChatState>({
    messages: [],
    uiState: "empty",
    isLoading: false,
    isStreaming: false,
    error: null,
    streamingMessageId: null,
  });

  const streamingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = MOCK_SUGGESTIONS;

  const setUIState = (uiState: AIChatUIState) =>
    setState((prev) => ({ ...prev, uiState }));

  const sendMessage = useCallback(async (content: string, attachments?: AIAttachment[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    const userMessage: AIMessage = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      status: "done",
      createdAt: new Date().toISOString(),
      attachments,
    };

    const contentLower = content.toLowerCase().trim();
    const isTokenLimitTrigger = ["token", "tokens", "recharge", "limit reached", "out of tokens"].some(kw =>
      contentLower.includes(kw)
    );

    if (isTokenLimitTrigger || (typeof window !== "undefined" && (window as any).MOCK_TOKEN_LIMIT)) {
      if (typeof window !== "undefined") {
        (window as any).MOCK_TOKEN_LIMIT = true;
      }
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        uiState: "active",
        isStreaming: false,
        streamingMessageId: null,
        error: null,
      }));
      return;
    }

    const streamingId = generateId();
    const streamingMessage: AIMessage = {
      id: streamingId,
      role: "assistant",
      content: "",
      status: "streaming",
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage, streamingMessage],
      uiState: "streaming",
      isStreaming: true,
      streamingMessageId: streamingId,
      error: null,
    }));

    let fullResponse = getRandomResponse();
    const websiteKeywords = [
      "website",
      "websites",
      "competitors",
      "reference sites",
      "similar products",
      "examples",
      "inspiration",
      "saas examples",
      "product examples",
      "landing pages"
    ];
    
    if (isSensitiveDataQuery(contentLower)) {
      fullResponse = "Sensitive Data Detected!\n\nI couldn't find enough verifiable database records or uploaded project files to provide an accurate answer regarding this specific cross-border tax scenario\n\nTo fix this, you can:\n• Upload your tax legal documents directly to this chat thread\n• Rephrase your question focusing on general global freelance rules";
    } else if (isTaxQuery(contentLower)) {
      fullResponse = "I couldn't find enough verifiable database records or uploaded project files to provide an accurate answer regarding this specific cross-border tax scenario\n\nTo fix this, you can:\n• Upload your tax legal documents directly to this chat thread\n• Rephrase your question focusing on general global freelance rules";
    } else if (isCapabilitiesQuery(contentLower)) {
      fullResponse = "I cannot generate images, design graphics, or automatically submit job applications for you.\n\nHowever, I can help you write a highly optimized text blueprint for your profile bio, or craft an exceptional cover letter tailored to that Senior Developer job!\n\nWhat would you like me to do?";
    } else if (contentLower.includes("optimize profile bio text")) {
      fullResponse = "Here is a highly optimized text blueprint for your profile bio:\n\n**Headline:** Senior Developer | React & Next.js Specialist | Building High-Performance Web Applications\n\n**About Me:**\nI am a passionate Senior Developer with 5+ years of experience specializing in React, Next.js, and modern frontend architectures. I love crafting clean, accessible, and performant user experiences.\n\n**Core Tech:**\n• Frontend: React, Next.js, TypeScript, Tailwind CSS, Zustand\n• Backend: Node.js, Express, PostgreSQL, Prisma\n• Tools: Git, Docker, Playwright, Vitest\n\nWould you like me to tailor this for a specific industry or modify any section?";
    } else if (contentLower.includes("write custom cover letter")) {
      fullResponse = "Here is an exceptional cover letter tailored to the Senior Developer role:\n\nDear Hiring Manager,\n\nI am writing to express my strong interest in the Senior Developer position. With over 5 years of experience designing and implementing scalable web applications, I am confident in my ability to make a significant contribution to your engineering team.\n\nIn my previous role, I led the migration of a legacy platform to Next.js, resulting in a 40% improvement in page load speeds and a 15% increase in conversion rates. I specialize in React, TypeScript, and state management, and I am passionate about mentoring junior developers and establishing engineering best practices.\n\nThank you for your time and consideration. I look forward to discussing how my skills and experience align with your team's needs.\n\nSincerely,\n[Your Name]";
    } else {
      const isPDFRequest = contentLower === "create pdf" || contentLower === "create" || contentLower === "generate" || contentLower === "generate pdf" || contentLower.includes("create pdf") || contentLower.includes("generate pdf") || contentLower.includes("create") || contentLower.includes("generate") || contentLower.includes("pdf");
      if (isPDFRequest) {
        fullResponse = "Download PDF";
      } else if (isJobAndChartQuery(content)) {
        fullResponse = `Based on your recent activity, I've curated some tailored opportunities.

• Found 3 high-match roles in Frontend Development
• Identified 1 upcoming networking event in your area
• Noticed a new skill trend: React Server Components`;
      } else if (isJobRelatedQuery(content)) {
        fullResponse = `I have curated the recommended jobs for you. You can view them directly in the Lunar Panel.`;
      } else if (websiteKeywords.some(kw => contentLower.includes(kw))) {
        fullResponse = "Here are two strong references for the kind of AI workspace UX you’re describing:\n\nThese two are probably the closest modern references for:\n“AI integrated into a primary product ecosystem”\ninstead of:\n“standalone chatbot app";
      } else if (contentLower.includes("project")) {
        fullResponse = "Yes, I'd love to help with your project. Before we begin, I need a bit more information so I can provide accurate and valuable answers.";
      } else if (contentLower.includes("architecture")) {
        fullResponse = "Certainly! I'd recommend a modular frontend architecture with clear separation of features (like we do with src/features), reusable components, and state management scoped to each feature.";
      }
    }

    let currentIndex = 0;
    const isUserConnectionLostTrigger = ["couldn't send", "could not send", "failed to send", "fail to send"].some(kw => contentLower.includes(kw)) || (typeof window !== "undefined" && (window as any).CONNECTION_LOST_USER);
    const isAssistantConnectionLostTrigger = ["connection lost", "lost connection", "lost"].some(kw => contentLower.includes(kw)) || (typeof window !== "undefined" && ((window as any).CONNECTION_LOST_ASSISTANT || (window as any).CONNECTION_LOST));
    const isErrorTrigger = contentLower.includes("error") || contentLower.includes("fail") || (typeof window !== "undefined" && (window as any).MOCK_ERROR);

    const streamNextChar = () => {
      if ((isErrorTrigger || isUserConnectionLostTrigger || isAssistantConnectionLostTrigger) && currentIndex >= Math.min(60, fullResponse.length / 2)) {
        setState((prev) => {
          const updatedMsgs = isUserConnectionLostTrigger
            ? prev.messages
                .filter((m) => m.id !== streamingId)
                .map((m) =>
                  m.id === userMessage.id
                    ? {
                        ...m,
                        status: "error" as const,
                        error: "Couldn't send, try again",
                      }
                    : m
                )
            : prev.messages.map((m) =>
                m.id === streamingId
                  ? {
                      ...m,
                      status: "error" as const,
                      content: m.content,
                      error: isAssistantConnectionLostTrigger
                        ? "Couldn't send, try again"
                        : "Sorry, something went wrong on our end. Please try again",
                    }
                  : m
              );
          return {
            ...prev,
            messages: updatedMsgs,
            uiState: "active",
            isStreaming: false,
            streamingMessageId: null,
            error: (isUserConnectionLostTrigger || isAssistantConnectionLostTrigger)
              ? "Couldn't send, try again"
              : "Sorry, something went wrong on our end. Please try again",
          };
        });
        return;
      }

      if (currentIndex <= fullResponse.length) {
        const partial = fullResponse.slice(0, currentIndex);
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === streamingId ? { ...m, content: partial } : m
          ),
        }));
        currentIndex++;
        streamingRef.current = setTimeout(streamNextChar, 18);
      } else {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === streamingId ? { ...m, status: "done" } : m
          ),
          uiState: "active",
          isStreaming: false,
          streamingMessageId: null,
        }));
      }
    };

    streamingRef.current = setTimeout(streamNextChar, 400);
  }, []);

  const loadMockConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: MOCK_MESSAGES,
      uiState: "active",
      isLoading: false,
      isStreaming: false,
      error: null,
      streamingMessageId: null,
    }));
  }, []);

  const clearChat = useCallback(() => {
    if (streamingRef.current) clearTimeout(streamingRef.current);
    setState({
      messages: [],
      uiState: "empty",
      isLoading: false,
      isStreaming: false,
      error: null,
      streamingMessageId: null,
    });
  }, []);

  const stopStreaming = useCallback(() => {
    if (streamingRef.current) clearTimeout(streamingRef.current);
    setState((prev) => {
      const updatedMessages = prev.messages.map((m) =>
        m.status === "streaming" ? { ...m, status: "done" as const } : m
      );
      return {
        ...prev,
        messages: updatedMessages,
        uiState: "active",
        isStreaming: false,
        streamingMessageId: null,
      };
    });
  }, []);

  const retryLastMessage = useCallback(() => {
    setState((prev) => {
      const lastUser = [...prev.messages].reverse().find((m) => m.role === "user");
      if (!lastUser) return prev;
      return {
        ...prev,
        messages: prev.messages.filter((m) => m.role !== "assistant" || m.status !== "error"),
        uiState: "active",
        error: null,
      };
    });
  }, []);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;

    // 1. Locate the edited message index
    const msgIndex = state.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // 2. Truncate the messages array and update the content of the edited message
    const updatedMessages = state.messages.slice(0, msgIndex + 1);
    updatedMessages[msgIndex] = {
      ...updatedMessages[msgIndex],
      content: newContent.trim(),
      status: "done",
      error: undefined,
    };

    const contentLower = newContent.toLowerCase().trim();
    const isTokenLimitTrigger = ["token", "tokens", "recharge", "limit reached", "out of tokens"].some(kw =>
      contentLower.includes(kw)
    );

    if (isTokenLimitTrigger || (typeof window !== "undefined" && (window as any).MOCK_TOKEN_LIMIT)) {
      if (typeof window !== "undefined") {
        (window as any).MOCK_TOKEN_LIMIT = true;
      }
      setState((prev) => ({
        ...prev,
        messages: updatedMessages,
        uiState: "active",
        isStreaming: false,
        streamingMessageId: null,
        error: null,
      }));
      return;
    }

    const streamingId = generateId();
    const streamingMessage: AIMessage = {
      id: streamingId,
      role: "assistant",
      content: "",
      status: "streaming",
      createdAt: new Date().toISOString(),
    };

    // 3. Clear any existing streaming timeout
    if (streamingRef.current) clearTimeout(streamingRef.current);

    // 4. Update the state to start streaming
    setState((prev) => ({
      ...prev,
      messages: [...updatedMessages, streamingMessage],
      uiState: "streaming",
      isStreaming: true,
      streamingMessageId: streamingId,
      error: null,
    }));

    // 5. Select response using the word matching algorithm
    const fullResponse = findBestMockResponse(newContent);
    const isUserConnectionLostTrigger = ["couldn't send", "could not send", "failed to send", "fail to send"].some(kw => contentLower.includes(kw)) || (typeof window !== "undefined" && (window as any).CONNECTION_LOST_USER);
    const isAssistantConnectionLostTrigger = ["connection lost", "lost connection", "lost"].some(kw => contentLower.includes(kw)) || (typeof window !== "undefined" && ((window as any).CONNECTION_LOST_ASSISTANT || (window as any).CONNECTION_LOST));
    const isErrorTrigger = contentLower.includes("error") || contentLower.includes("fail") || (typeof window !== "undefined" && (window as any).MOCK_ERROR);

    let currentIndex = 0;
    const streamNextChar = () => {
      if ((isErrorTrigger || isUserConnectionLostTrigger || isAssistantConnectionLostTrigger) && currentIndex >= Math.min(60, fullResponse.length / 2)) {
        setState((prev) => {
          const updatedMsgs = isUserConnectionLostTrigger
            ? prev.messages
                .filter((m) => m.id !== streamingId)
                .map((m) =>
                  m.id === messageId
                    ? {
                        ...m,
                        status: "error" as const,
                        error: "Couldn't send, try again",
                      }
                    : m
                )
            : prev.messages.map((m) =>
                m.id === streamingId
                  ? {
                      ...m,
                      status: "error" as const,
                      content: m.content,
                      error: isAssistantConnectionLostTrigger
                        ? "Couldn't send, try again"
                        : "Sorry, something went wrong on our end. Please try again",
                    }
                  : m
              );
          return {
            ...prev,
            messages: updatedMsgs,
            uiState: "active",
            isStreaming: false,
            streamingMessageId: null,
            error: (isUserConnectionLostTrigger || isAssistantConnectionLostTrigger)
              ? "Couldn't send, try again"
              : "Sorry, something went wrong on our end. Please try again",
          };
        });
        return;
      }

      if (currentIndex <= fullResponse.length) {
        const partial = fullResponse.slice(0, currentIndex);
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === streamingId ? { ...m, content: partial } : m
          ),
        }));
        currentIndex++;
        streamingRef.current = setTimeout(streamNextChar, 18);
      } else {
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === streamingId ? { ...m, status: "done" } : m
          ),
          uiState: "active",
          isStreaming: false,
          streamingMessageId: null,
        }));
      }
    };

    streamingRef.current = setTimeout(streamNextChar, 400);
  }, [state.messages]);

  return {
    ...state,
    suggestions,
    sendMessage,
    clearChat,
    stopStreaming,
    retryLastMessage,
    loadMockConversation,
    setUIState,
    editMessage,
  };
}