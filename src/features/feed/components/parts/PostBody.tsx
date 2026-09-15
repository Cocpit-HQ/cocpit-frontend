import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { RichTextRenderer } from './RichTextRenderer';

export interface PostBodyProps {
  content?: string;
  author: string;
  authorSlug?: string;
  isExpanded: boolean;
  onToggleExpand?: () => void;
  variant?: 'default' | 'overlay';
  hasMedia?: boolean;
  maxLines?: number;
}

// Isomorphic layout effect to avoid Next.js SSR warnings
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const PostBody = ({
  content,
  author,
  authorSlug,
  isExpanded,
  onToggleExpand,
  variant = 'default',
  hasMedia = false,
  maxLines,
}: PostBodyProps) => {
  if (!content) return null;

  const effectiveMaxLines = maxLines ?? (hasMedia ? 2 : 10);
  const maxHeight = effectiveMaxLines * 16; // 16px per line (leading-[16px])

  const containerRef = useRef<HTMLDivElement>(null);
  const measurerRef = useRef<HTMLDivElement>(null);

  // Initial rough guess for SSR / first paint before measurement
  const [isLong, setIsLong] = useState(() => {
    const lines = content.split('\n').filter((l) => l.trim() !== '');
    return lines.length > effectiveMaxLines || content.length > effectiveMaxLines * 45;
  });

  const [truncatedContent, setTruncatedContent] = useState<string | null>(null);
  const [dynamicMaxHeight, setDynamicMaxHeight] = useState<number>(maxHeight);

  useIsomorphicLayoutEffect(() => {
    if (!content) {
      setIsLong(false);
      setTruncatedContent(null);
      return;
    }

    const measurer = measurerRef.current;
    if (!measurer) return;

    const getDynamicMaxHeight = (text: string) => {
      // Count empty lines (2 consecutive newlines, optionally separated by spaces)
      const emptyLines = (text.match(/\n\s*\n/g) || []).length;
      return (effectiveMaxLines + emptyLines) * 16;
    };

    const measureAndTruncate = () => {
      // 1. Check if the entire raw content fits within dynamic maxHeight
      const fullDynamicMaxHeight = getDynamicMaxHeight(content);
      measurer.textContent = content;
      if (measurer.scrollHeight <= fullDynamicMaxHeight + 1) {
        setIsLong(false);
        setTruncatedContent(null);
        setDynamicMaxHeight(fullDynamicMaxHeight);
        return;
      }

      // If it overflows, truncation with "See more" is required
      setIsLong(true);

      // For media posts (effectiveMaxLines <= 2), collapse consecutive empty lines (\n\n) to a single \n
      // so empty lines don't consume the 2-line visual budget.
      // For text-only posts, collapse 3+ consecutive newlines to 2.
      const collapsed = effectiveMaxLines <= 2
        ? content.replace(/\n\s*\n+/g, '\n').trimEnd()
        : content.replace(/\n\s*\n\s*\n+/g, '\n\n').trimEnd();

      const tokens = collapsed.split(/(\s+)/);
      if (tokens.length === 0) {
        setTruncatedContent(null);
        return;
      }

      // Binary search on tokens to find the maximum text that fits with " ... See more"
      let low = 1;
      let high = tokens.length;
      let best = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = tokens.slice(0, mid).join('').trimEnd();
        const cleanCandidate = candidate.replace(/[,;:\s—\-]+$/, '');
        const currentMaxHeight = getDynamicMaxHeight(candidate);
        
        measurer.textContent = cleanCandidate + ' ... See more';

        if (measurer.scrollHeight <= currentMaxHeight + 1) {
          best = mid;
          low = mid + 1; // Try to fit more tokens
        } else {
          high = mid - 1; // Too tall, reduce tokens
        }
      }

      let finalTruncated = '';
      if (best > 0) {
        finalTruncated = tokens.slice(0, best).join('').trimEnd().replace(/[,;:\s—\-]+$/, '');
        setDynamicMaxHeight(getDynamicMaxHeight(finalTruncated));
      }

      // Fallback for extreme cases (e.g. single unbroken token overflowing)
      const currentMaxHeight = getDynamicMaxHeight(finalTruncated || tokens[0] || '');
      measurer.textContent = finalTruncated + ' ... See more';
      
      if ((best === 0 || measurer.scrollHeight > currentMaxHeight + 1) && tokens[0]) {
        let charLow = 1;
        let charHigh = tokens[0].length;
        let bestChar = 1;
        while (charLow <= charHigh) {
          const charMid = Math.floor((charLow + charHigh) / 2);
          const charCandidate = tokens[0].slice(0, charMid);
          const charMaxHeight = getDynamicMaxHeight(charCandidate);
          measurer.textContent = charCandidate + ' ... See more';
          
          if (measurer.scrollHeight <= charMaxHeight + 1) {
            bestChar = charMid;
            charLow = charMid + 1;
          } else {
            charHigh = charMid - 1;
          }
        }
        finalTruncated = tokens[0].slice(0, bestChar);
        setDynamicMaxHeight(getDynamicMaxHeight(finalTruncated));
      }

      setTruncatedContent(finalTruncated || null);
    };

    measureAndTruncate();

    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const observer = new ResizeObserver(() => {
        measureAndTruncate();
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [content, effectiveMaxLines, maxHeight]);

  const displayContent = !isExpanded && isLong && truncatedContent !== null
    ? truncatedContent
    : content;

  return (
    <div ref={containerRef} className="w-full flex flex-col gap-1 relative">
      {/* Hidden offscreen measurer that exactly mirrors the post text container styles and width */}
      <div
        ref={measurerRef}
        aria-hidden="true"
        className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] whitespace-pre-wrap break-words pointer-events-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          visibility: 'hidden',
          zIndex: -9999,
        }}
      />

      {/* Main post text */}
      <div
        style={
          !isExpanded && isLong
            ? {
                maxHeight: `${dynamicMaxHeight}px`,
                overflow: 'hidden',
              }
            : undefined
        }
        className={`font-['DM_Sans'] font-normal text-[12px] leading-[16px] whitespace-pre-wrap break-words ${
          variant === 'overlay'
            ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
            : 'text-ds-text-primary'
        }`}
      >
        <RichTextRenderer
          content={displayContent}
          authorName={author}
          authorSlug={authorSlug}
        />

        {/* Inline "... See more" placed directly at the end of the last word */}
        {isLong && !isExpanded && (
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleExpand?.();
            }}
            className="inline select-none cursor-pointer group ml-1"
          >
            <span className={variant === 'overlay' ? 'text-white/80' : 'text-ds-text-muted'}>
              ...{' '}
            </span>
            <span
              className={`font-semibold ${
                variant === 'overlay'
                  ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                  : 'text-[var(--ds-accent)]'
              }`}
            >
              See more
            </span>
          </span>
        )}
      </div>

      {/* "Show less" button when expanded */}
      {isLong && isExpanded && (
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleExpand?.();
          }}
          className={`block mt-1.5 w-fit cursor-pointer font-semibold text-[12px] leading-[16px] ${
            variant === 'overlay'
              ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
              : 'text-[var(--ds-accent)]'
          }`}
        >
          Show less
        </span>
      )}
    </div>
  );
};
