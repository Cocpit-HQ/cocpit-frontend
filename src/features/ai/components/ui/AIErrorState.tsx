"use client"

import React from "react";
import { Icon } from "@iconify/react";

interface AIErrorStateProps {
  error: string;
  onRetry?: () => void;
  onClear?: () => void;
}

export default function AIErrorState({
  error,
  onRetry,
  onClear,
}: AIErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      {/* Error Icon */}
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
        <Icon icon="ri:error-warning-line" width={32} height={32} className="text-red-500" />
      </div>

      {/* Title */}
      <h2
        className="text-xl font-semibold text-[var(--foreground)] mb-2 text-center"
        style={{ fontFamily: "Poppins" }}
      >
        Something went wrong
      </h2>

      {/* Error Message */}
      <p className="text-sm text-[var(--muted-foreground)] text-center max-w-sm leading-relaxed mb-8" style={{ fontFamily: "Poppins" }}>
        {error}
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 active:scale-[0.98] shadow-md hover:shadow-lg"
          >
            <Icon icon="ri:refresh-line" width={16} height={16} />
            Try Again
          </button>
        )}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--primary-tint)] active:scale-[0.98]"
          >
            Start New Chat
          </button>
        )}
      </div>
    </div>
  );
}