"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";

// Isomorphic layout effect to avoid SSR warnings in Next.js
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface UseExpandableTextOptions {
  text?: string | null;
  maxLines?: number;
  lineHeight?: number;
  moreText?: string;
  initialExpanded?: boolean;
}

export interface UseExpandableTextReturn {
  measurerRef: React.RefObject<HTMLDivElement | null>;
  isExpanded: boolean;
  isOverflowing: boolean;
  displayText: string;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  toggleExpand: () => void;
  expand: () => void;
  collapse: () => void;
}

/**
 * Custom hook to measure and truncate text after `maxLines` (default: 2),
 * placing "... See more" inline at the end of the last line.
 * Automatically checks if content genuinely overflows before displaying the toggle.
 */
export function useExpandableText({
  text,
  maxLines = 2,
  lineHeight = 16,
  moreText = "See more",
  initialExpanded = false,
}: UseExpandableTextOptions): UseExpandableTextReturn {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const measurerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [truncatedText, setTruncatedText] = useState<string | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!text) {
      setIsOverflowing(false);
      setTruncatedText(null);
      return;
    }

    const measurer = measurerRef.current;
    if (!measurer) return;

    const maxHeight = maxLines * lineHeight + Math.min(8, Math.floor(lineHeight * 0.35));

    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const setMeasurerContent = (candidateText: string) => {
      measurer.innerHTML = `${escapeHtml(candidateText)}<span style="display: inline; margin-left: 4px; white-space: nowrap; font-weight: 600;">...&nbsp;${escapeHtml(moreText)}</span>`;
    };

    const testFit = (candidateText: string) => {
      setMeasurerContent(candidateText);
      return measurer.scrollHeight <= maxHeight;
    };

    const measure = () => {
      measurer.textContent = text;
      if (measurer.scrollHeight <= maxHeight) {
        setIsOverflowing(false);
        setTruncatedText(null);
        return;
      }

      setIsOverflowing(true);

      const collapsed = text.replace(/\n\s*\n+/g, "\n").trimEnd();
      const tokens = collapsed.split(/(\s+)/);
      if (tokens.length === 0) {
        setTruncatedText(null);
        return;
      }

      // Binary search on tokens to find max text fitting with " ... moreText"
      let low = 1;
      let high = tokens.length;
      let best = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = tokens.slice(0, mid).join("").trimEnd().replace(/[,;:\s—\-]+$/, "");

        if (testFit(candidate)) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      let finalTruncated = "";
      if (best > 0) {
        finalTruncated = tokens.slice(0, best).join("").trimEnd().replace(/[,;:\s—\-]+$/, "");

        // If the next word token is unbroken / long (>= 8 chars), try fitting as many characters as possible into remaining line space
        let nextIdx = best;
        while (nextIdx < tokens.length && tokens[nextIdx].trim().length === 0) {
          nextIdx++;
        }
        const nextWord = tokens[nextIdx];
        if (nextWord && nextWord.length >= 8) {
          const baseText = tokens.slice(0, nextIdx).join("");
          let cLow = 1;
          let cHigh = nextWord.length;
          let cBest = 0;
          while (cLow <= cHigh) {
            const cMid = Math.floor((cLow + cHigh) / 2);
            const candidate = `${baseText}${nextWord.slice(0, cMid)}`;
            if (testFit(candidate)) {
              cBest = cMid;
              cLow = cMid + 1;
            } else {
              cHigh = cMid - 1;
            }
          }
          if (cBest > 0) {
            const safeChars = Math.max(1, cBest - 1);
            finalTruncated = `${baseText}${nextWord.slice(0, safeChars)}`.trimEnd();
          }
        }
      } else if (tokens[0]) {
        // Fallback for long single word exceeding maxHeight
        let cLow = 1;
        let cHigh = tokens[0].length;
        let cBest = 1;
        while (cLow <= cHigh) {
          const cMid = Math.floor((cLow + cHigh) / 2);
          const cCandidate = tokens[0].slice(0, cMid);
          if (testFit(cCandidate)) {
            cBest = cMid;
            cLow = cMid + 1;
          } else {
            cHigh = cMid - 1;
          }
        }
        const safeChars = Math.max(1, cBest - 1);
        finalTruncated = tokens[0].slice(0, safeChars);
      }

      setTruncatedText(finalTruncated || null);
    };

    measure();

    if (measurer.clientWidth === 0) {
      requestAnimationFrame(() => {
        measure();
      });
    }

    if (typeof ResizeObserver !== "undefined" && measurer.parentElement) {
      const observer = new ResizeObserver(() => {
        measure();
      });
      observer.observe(measurer.parentElement);
      return () => observer.disconnect();
    }
  }, [text, maxLines, lineHeight, moreText]);

  const displayText =
    !isExpanded && isOverflowing && truncatedText !== null ? truncatedText : text || "";

  const toggleExpand = () => setIsExpanded((prev) => !prev);
  const expand = () => setIsExpanded(true);
  const collapse = () => setIsExpanded(false);

  return {
    measurerRef,
    isExpanded,
    isOverflowing,
    displayText,
    setIsExpanded,
    toggleExpand,
    expand,
    collapse,
  };
}

export interface ExpandableTextProps {
  text?: string | null;
  maxLines?: number;
  lineHeight?: number;
  moreText?: string;
  lessText?: string;
  className?: string;
  textClassName?: string;
  buttonClassName?: string;
  showLess?: boolean;
}

/**
 * Reusable component powered by `useExpandableText`
 */
export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLines = 2,
  lineHeight = 16,
  moreText = "See more",
  lessText = "See less",
  className = "",
  textClassName = "text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4",
  buttonClassName,
  showLess = true,
}) => {
  const { measurerRef, isExpanded, isOverflowing, displayText, setIsExpanded } =
    useExpandableText({ text, maxLines, lineHeight, moreText });

  if (!text) return null;

  return (
    <div className={`w-full relative ${className}`}>
      {/* Hidden offscreen measurer mirroring width and typography */}
      <div
        ref={measurerRef}
        aria-hidden="true"
        className={`whitespace-pre-wrap break-words [overflow-wrap:anywhere] pointer-events-none absolute top-0 left-0 right-0 invisible -z-50 ${textClassName}`}
      />

      <p
        style={
          !isExpanded && isOverflowing
            ? { maxHeight: `${maxLines * lineHeight + 8}px`, overflow: "hidden" }
            : undefined
        }
        className={`self-stretch whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${textClassName}`}
      >
        <span>{displayText}</span>
        {isOverflowing && !isExpanded && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className={
              buttonClassName ||
              "inline select-none cursor-pointer ml-1 bg-transparent border-none p-0 align-baseline whitespace-nowrap"
            }
          >
            <span className="text-[var(--ds-text-muted)]">... </span>
            <span className="font-semibold text-[var(--ds-accent)] hover:opacity-80 transition-opacity">
              {moreText}
            </span>
          </button>
        )}
      </p>

      {showLess && isOverflowing && isExpanded && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(false);
          }}
          className={
            buttonClassName ||
            `block mt-1 cursor-pointer font-semibold text-[var(--ds-accent)] hover:opacity-80 transition-opacity bg-transparent border-none p-0 ${
              lineHeight >= 20 ? "text-sm leading-5" : "text-xs leading-4"
            }`
          }
        >
          {lessText}
        </button>
      )}
    </div>
  );
};
