"use client"

import React from "react";

interface AIStreamingMessageProps {
  content: string;
}

export default function AIStreamingMessage({ content }: AIStreamingMessageProps) {
  return (
    <div className="flex w-full mb-0" style={{ boxSizing: "border-box" }}>
      <div className="flex flex-col items-start w-full">
        {/* Assistant bubble card: white bg, border-radius 12px 12px 12px 0px, padding 0px, full width */}
        <div
          style={{
            width: "100%",
            background: "var(--background)",
            borderRadius: "12px 12px 12px 0px",
            padding: "0px",
            fontFamily: "Poppins",
            fontWeight: 400,
            fontSize: "16px",
            lineHeight: "24px",
            color: "var(--foreground)",
            boxSizing: "border-box",
          }}
        >
          {/* Streaming content with cursor animation */}
          <div className="text-base" style={{ fontFamily: "Poppins", color: content ? "var(--foreground)" : "var(--muted-foreground)" }}>
            {content || "Thinking..."}
            {content && (
              <span className="inline-block w-0.5 h-4 bg-[var(--primary)] animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        </div>

        {/* Streaming indicator */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]/50 animate-pulse" />
          <span className="text-[10px] text-[var(--muted-foreground)]">
            AI is generating response...
          </span>
        </div>
      </div>
    </div>
  );
}