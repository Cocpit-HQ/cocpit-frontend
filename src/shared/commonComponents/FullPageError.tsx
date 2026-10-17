"use client";

import React from "react";
import { InfoIcon, CloudOffIcon } from "@/components/icons";

export type FullPageErrorVariant = "profile" | "server" | "connection";

export interface FullPageErrorProps {
  /** Error variant preset (default: "profile") */
  variant?: FullPageErrorVariant;
  /** Title text (default depends on variant) */
  title?: string;
  /** Description / subtitle text (default depends on variant) */
  description?: string;
  /** Optional callback triggered when user clicks "Retry" */
  onRetry?: () => void;
  /** Custom label for retry button (default: "Retry") */
  retryLabel?: string;
  /** Explicitly toggle retry button visibility */
  showRetryButton?: boolean;
  /** Custom icon component override */
  icon?: React.ReactNode;
  /** Optional additional class names for outer container */
  className?: string;
}

const VARIANT_CONFIG: Record<
  FullPageErrorVariant,
  {
    title: string;
    description: string;
    icon: React.FC<{ className?: string; fill?: string }>;
    defaultShowRetry: boolean;
  }
> = {
  profile: {
    title: "Unable to load profile",
    description: "Something went wrong. Please check your connection and try again",
    icon: InfoIcon,
    defaultShowRetry: false,
  },
  server: {
    title: "Something went wrong",
    description:
      "We could not connect to the server. Please check your internet connection and try again",
    icon: CloudOffIcon,
    defaultShowRetry: true,
  },
  connection: {
    title: "Something went wrong",
    description:
      "We could not connect to the server. Please check your internet connection and try again",
    icon: CloudOffIcon,
    defaultShowRetry: true,
  },
};

/**
 * FullPageError: Reusable full-page error state matching Figma specifications.
 * Fits 800px wide container, 64px rounded icon frame, 20px title, 14px secondary body, and optional retry CTA.
 */
export const FullPageError: React.FC<FullPageErrorProps> = ({
  variant = "profile",
  title,
  description,
  onRetry,
  retryLabel = "Retry",
  showRetryButton,
  icon,
  className = "",
}) => {
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.profile;
  const resolvedTitle = title || config.title;
  const resolvedDescription = description || config.description;
  const IconComponent = config.icon;
  const shouldRenderRetry =
    showRetryButton !== undefined ? showRetryButton : config.defaultShowRetry;

  return (
    /* FullPageError: w: 800px max, flex items-center justify-center, gap: 24px */
    <div
      className={`w-full max-w-[800px] px-5 flex flex-col items-center justify-center gap-6 mx-auto ${className}`}
    >
      {/* IconFrame: 64x64px, rounded-full, #1A1A20, p-4 (16px) */}
      <div className="w-16 h-16 rounded-full bg-[var(--ds-surface-1)] p-4 flex items-center justify-center shrink-0">
        {icon ? (
          icon
        ) : (
          <IconComponent className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0" fill="currentColor" />
        )}
      </div>

      {/* TextBlock: w: 760px, gap: 10px, text-center */}
      <div className="w-full max-w-[760px] flex flex-col items-center gap-2.5 text-center">
        {/* Title: 20px semibold (600), line-height: 28px, #FFECE6 */}
        <h2 className="text-[var(--ds-text-primary)] text-[20px] font-semibold font-['DM_Sans'] leading-7 text-center">
          {resolvedTitle}
        </h2>

        {/* Subtitle: 14px regular (400), line-height: 20px, #B8ADA8, max-w-[420px] */}
        <p className="max-w-[420px] text-[var(--ds-text-secondary)] text-sm font-normal font-['DM_Sans'] leading-5 text-center">
          {resolvedDescription}
        </p>
      </div>

      {/* Retry Button matching FailedToLoad styling */}
      {shouldRenderRetry && (
        <button
          type="button"
          onClick={onRetry || (() => window.location.reload())}
          className="min-w-[64px] h-9 px-3 py-1.5 bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 rounded-[100px] flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};

export default FullPageError;
