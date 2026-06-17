"use client"

import React, { useRef, useEffect } from "react";
import type { AIMessage } from "../../types/ai.types";
import AIMessageBubble from "./AIMessageBubble";
import AIStreamingMessage from "./AIStreamingMessage";
import { isJobRelatedQuery } from "../../hooks/use-ai-chat";
import { useIsMobile } from "@/hooks/use-mobile";

interface WebsiteResult {
  id: number;
  company: string;
}

function getWebsiteResultsFromMessage(content: string): WebsiteResult[] {
  const lower = content.toLowerCase();
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
    "landing pages",
  ];
  const isWebsiteRelated = websiteKeywords.some((kw) => lower.includes(kw));
  if (!isWebsiteRelated) return [];

  let count = 2; // Default
  const match = lower.match(/(\d+)\s*compan/);
  if (match) {
    count = parseInt(match[1], 10);
  } else {
    if (lower.includes("one compan")) count = 1;
    else if (lower.includes("two compan")) count = 2;
    else if (lower.includes("three compan")) count = 3;
    else if (lower.includes("four compan")) count = 4;
    else if (lower.includes("five compan")) count = 5;
  }

  const companiesList = ["Notion", "Cursor", "Linear", "Figma", "Slack"];
  const results: WebsiteResult[] = [];
  for (let i = 0; i < count; i++) {
    results.push({
      id: i + 1,
      company: companiesList[i % companiesList.length],
    });
  }
  return results;
}

interface AIMessageListProps {
  messages: AIMessage[];
  streamingMessageId: string | null;
  isStreaming: boolean;
  onEditMessage: (messageId: string, newContent: string) => void;
  onOpenLunarPanel?: (
    title: string,
    mode?: string,
    selectedCompany?: string,
    companies?: Array<{ id: number; company: string }>
  ) => void;
  error?: string | null;
  onSend?: (content: string) => void;
  activeLunarMode?: string;
}

export default function AIMessageList({
  messages,
  streamingMessageId,
  isStreaming,
  onEditMessage,
  onOpenLunarPanel,
  error,
  onSend,
  activeLunarMode,
}: AIMessageListProps) {
  const isMobile = useIsMobile();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    const scrollToBottom = () => {
      if (bottomRef.current) {
        const behavior = isStreaming ? "auto" : "smooth";
        bottomRef.current.scrollIntoView({ behavior, block: "end" });
      }
    };

    scrollToBottom();

    // Secondary delayed scroll for dynamic components layout settling
    const timer = setTimeout(scrollToBottom, 60);
    const timer2 = setTimeout(scrollToBottom, 180);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [messages, streamingMessageId, isStreaming]);

  if (messages.length === 0) return null;

  const getDynamicTitle = (prompt: string): string => {
    const lower = prompt.toLowerCase();
    if (lower.includes("business") || lower.includes("idea")) {
      return "Business Ideas Report";
    }
    if (lower.includes("revenue") || lower.includes("sale") || lower.includes("finance") || lower.includes("money")) {
      return "Revenue Analysis";
    }
    if (lower.includes("growth") || lower.includes("trend")) {
      return "Growth Trends";
    }
    if (lower.includes("market") || lower.includes("insight")) {
      return "Market Insights";
    }
    if (lower.includes("analytics")) return "Analytics Report";
    if (lower.includes("chart")) return "Chart Analytics";
    if (lower.includes("statistics")) return "Statistical Analysis";
    if (lower.includes("metrics")) return "Metrics Overview";
    if (lower.includes("report")) return "Data Report";
    return "Data Visualization";
  };

  return (
    <div className={`flex flex-col w-full py-4 min-h-full ${isMobile ? "px-4" : "px-0"}`}>
      <div className="flex-grow" />
      <div className="flex flex-col gap-[32px] w-full">
        {messages.map((message) => {
          const isStreamingMessage =
            message.id === streamingMessageId && isStreaming;

          if (isStreamingMessage) {
            return (
              <div key={message.id}>
                <AIStreamingMessage content={message.content} />
              </div>
            );
          }

          // Check if this assistant message corresponds to a graph or chart related user prompt
          const cardType = (() => {
            if (message.role !== "assistant") return undefined;
            const index = messages.indexOf(message);
            if (index === -1) return undefined;
            const userMsg = messages.slice(0, index).reverse().find((m) => m.role === "user");
            if (!userMsg) return undefined;

            const lowerContent = userMsg.content.toLowerCase();
            if (lowerContent.includes("chart")) {
              return "chart";
            }
            const keywords = [
              "graph",
              "analytics",
              "analysis",
              "trend",
              "growth",
              "statistics",
              "report",
              "data visualization",
              "metrics",
            ];
            if (keywords.some((kw) => lowerContent.includes(kw))) {
              return "graph";
            }
            return undefined;
          })();

          const userPrompt = (() => {
            if (message.role !== "assistant") return "";
            const index = messages.indexOf(message);
            if (index === -1) return "";
            const userMsg = messages.slice(0, index).reverse().find((m) => m.role === "user");
            return userMsg ? userMsg.content : "";
          })();

          const websiteResults = getWebsiteResultsFromMessage(userPrompt);
          const isJobRelated = message.role === "assistant" && isJobRelatedQuery(userPrompt);

          return (
            <div key={message.id}>
              <AIMessageBubble
                message={message}
                isStreaming={false}
                onEdit={onEditMessage}
                onOpenLunarPanel={onOpenLunarPanel}
                isGraphRelated={cardType !== undefined}
                graphType={cardType}
                graphTitle={cardType !== undefined ? getDynamicTitle(userPrompt) : undefined}
                websiteResults={websiteResults}
                isJobRelated={isJobRelated}
                error={error}
                onSend={onSend}
                activeLunarMode={activeLunarMode}
              />
            </div>
          );
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}