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

    const maxHeight = maxLines * lineHeight;

    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const setMeasurerContent = (candidateText: string) => {
      measurer.innerHTML = `${escapeHtml(candidateText)}&nbsp;<span style="display: inline; margin-left: 4px; font-weight: 600;">...&nbsp;${moreText}&nbsp;</span>`;
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
        setMeasurerContent(candidate);

        if (measurer.scrollHeight <= maxHeight) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      let finalTruncated = "";
      if (best > 0) {
        finalTruncated = tokens.slice(0, best).join("").trimEnd().replace(/[,;:\s—\-]+$/, "");

        // If the next token is an unbroken long string (e.g. >= 10 chars without whitespace),
        // try to fit as many characters as possible into the remaining line space
        const nextToken = tokens[best];
        if (nextToken && nextToken.trim().length >= 10) {
          const baseText = tokens.slice(0, best).join("");
          let cLow = 1;
          let cHigh = nextToken.length;
          let cBest = 0;
          while (cLow <= cHigh) {
            const cMid = Math.floor((cLow + cHigh) / 2);
            const cCandidate = nextToken.slice(0, cMid);
            setMeasurerContent(`${baseText}${cCandidate}`);
            if (measurer.scrollHeight <= maxHeight) {
              cBest = cMid;
              cLow = cMid + 1;
            } else {
              cHigh = cMid - 1;
            }
          }
          if (cBest > 0) {
            // Safety buffer: take 3 fewer characters to guarantee ... See more never wraps to next line
            const safeChars = Math.max(1, cBest - 3);
            finalTruncated = `${baseText}${nextToken.slice(0, safeChars)}`.trimEnd();
          }
        }
      } else if (tokens[0]) {
        // Fallback for long single word
        let cLow = 1;
        let cHigh = tokens[0].length;
        let cBest = 1;
        while (cLow <= cHigh) {
          const cMid = Math.floor((cLow + cHigh) / 2);
          const cCandidate = tokens[0].slice(0, cMid);
          setMeasurerContent(cCandidate);
          if (measurer.scrollHeight <= maxHeight) {
            cBest = cMid;
            cLow = cMid + 1;
          } else {
            cHigh = cMid - 1;
          }
        }
        const safeChars = Math.max(1, cBest - 3);
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
        className={`whitespace-pre-wrap break-words pointer-events-none absolute top-0 left-0 right-0 invisible -z-50 ${textClassName}`}
      />

      <p
        style={
          !isExpanded && isOverflowing
            ? { maxHeight: `${maxLines * lineHeight + 4}px`, overflow: "hidden" }
            : undefined
        }
        className={`self-stretch whitespace-pre-wrap break-words ${textClassName}`}
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
              "inline select-none cursor-pointer ml-1 bg-transparent border-none p-0 align-baseline"
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
