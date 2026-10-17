"use client";

import React from "react";
import { WarningTriangleIcon } from "@/components/icons";

export type FailedToLoadSectionType =
  | "posts"
  | "experience"
  | "education"
  | "projects"
  | "skills";

const SECTION_PRESETS: Record<
  FailedToLoadSectionType,
  { title: string; description: string }
> = {
  posts: {
    title: "Could not load posts",
    description: "Something went wrong while loading posts.",
  },
  experience: {
    title: "Could not load experience",
    description: "Something went wrong while loading your work history.",
  },
  education: {
    title: "Could not load education",
    description: "Something went wrong while loading your education history.",
  },
  projects: {
    title: "Could not load projects",
    description: "Something went wrong while loading projects.",
  },
  skills: {
    title: "Could not load skills",
    description: "Something went wrong while loading skills.",
  },
};

export interface FailedToLoadProps {
  /** Optional section preset ('posts' | 'experience' | 'education' | 'projects' | 'skills') */
  type?: FailedToLoadSectionType;
  /** Custom title, overrides section preset */
  title?: string;
  /** Custom description, overrides section preset */
  description?: string;
  /** Callback triggered when the user clicks "Retry" */
  onRetry?: () => void;
  /** Custom label for retry button (default: "Retry") */
  retryLabel?: string;
  /** Optional additional class names for the outer container */
  className?: string;
}

/**
 * Reusable "Failed to Load" screen component matching Figma design system specifications.
 * Fits 780px wide container with 64px icon frame and 36px action button.
 */
export const FailedToLoad: React.FC<FailedToLoadProps> = ({
  type,
  title,
  description,
  onRetry,
  retryLabel = "Retry",
  className = "",
}) => {
  const preset = type ? SECTION_PRESETS[type] : undefined;
  const resolvedTitle = title || preset?.title || "Could not load content";
  const resolvedDescription =
    description || preset?.description || "Something went wrong while loading this content.";

  return (
    <div
      className={`w-full max-w-[780px] h-[262px] py-10 px-5 flex flex-col items-center justify-center gap-4 self-stretch ${className}`}
    >
      {/* IconFrame: 64x64px, rounded-full, #1A1A20, p-4 (16px) */}
      <div className="w-16 h-16 rounded-full bg-[var(--ds-surface-1)] p-4 flex items-center justify-center shrink-0">
        <WarningTriangleIcon className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0" fill="currentColor" />
      </div>

      {/* TextBlock: 740px, gap 6px, text-center */}
      <div className="w-full max-w-[740px] h-[50px] flex flex-col items-center gap-1.5 text-center">
        <h3 className="w-full text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6">
          {resolvedTitle}
        </h3>
        <p className="w-full text-[var(--ds-text-secondary)] text-sm font-normal font-['DM_Sans'] leading-5">
          {resolvedDescription}
        </p>
      </div>

      {/* Primary emphasis button: 36px height, rounded-full #EC6229 */}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-w-[64px] h-9 px-3 py-1.5 bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 rounded-[100px] flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};

export default FailedToLoad;
