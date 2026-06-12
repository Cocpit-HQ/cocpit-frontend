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
            background: "#FFFFFF",
            borderRadius: "12px 12px 12px 0px",
            padding: "0px",
            fontFamily: "Poppins",
            fontWeight: 400,
            fontSize: "16px",
            lineHeight: "24px",
            color: "#000000",
            boxSizing: "border-box",
          }}
        >
          {/* Streaming content with cursor animation */}
          <div className="text-base" style={{ fontFamily: "Poppins", color: content ? "#000000" : "#6B7280" }}>
            {content || "Thinking..."}
            {content && (
              <span className="inline-block w-0.5 h-4 bg-[#6366F1] animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        </div>

        {/* Streaming indicator */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]/50 animate-pulse" />
          <span className="text-[10px] text-[#6B7280]">
            AI is generating response...
          </span>
        </div>
      </div>
    </div>
  );
}