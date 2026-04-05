"use client";

import React, { Fragment, memo } from 'react';
import Link from 'next/link';

interface HashtagTextRendererProps {
  content: string;
}

// Improved regex to handle boundaries (prevents matching hello#react)
// Matches #tag that starts at the beginning of a string OR after a whitespace character
const HASHTAG_REGEX = /(^|\s)(#[a-zA-Z0-9_]+)/g;

export const HashtagTextRenderer = memo(({ content }: HashtagTextRendererProps) => {
  if (!content) return null;

  // We split the content by the regex, but since we have two capturing groups, 
  // we need to be careful with how we map the parts.
  // parts will contain: [text before, group1 (space/start), group2 (#tag), text after...]
  const parts = content.split(HASHTAG_REGEX);

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        // If part matches the hashtag pattern (starting with #)
        if (part.startsWith('#') && part.length >= 2) {
          const tag = part.substring(1).toLowerCase();
          
          // Validation: Sync with backend 2-30 constraint
          if (tag.length < 2 || tag.length > 30) {
            return <Fragment key={i}>{part}</Fragment>;
          }

          return (
            <Link
              key={i}
              href={`/hashtag/${tag}`}
              className="inline-block px-1 -mx-1 text-primary font-bold hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        
        // Return plain text parts and the leading whitespace/start capture group as-is
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </span>
  );
});

HashtagTextRenderer.displayName = 'HashtagTextRenderer';
