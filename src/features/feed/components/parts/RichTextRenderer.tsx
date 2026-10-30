"use client";

import React, { Fragment, memo, useMemo } from 'react';
import Link from 'next/link';
import { DynamicMention } from '@/shared/commonComponents/DynamicMention';

export interface RichTextRendererProps {
  content: string;
  authorName?: string;
  authorSlug?: string;
  mentionedUsers?: { user_id: string; full_name: string; account_name: string }[];
  disableLinks?: boolean;
}

/**
 * Enhanced text renderer that automatically detects and links:
 * 1. Mentions (@username)
 * 2. Author Name (e.g., "Swaroop Manade") - Smart Highlight
 * 3. Hashtags (#tag)
 * 4. Email addresses (user@domain.com)
 * 5. URLs (https://..., www. ..., or naked domains)
 */

// Patterns for the different types of rich text
const HASHTAG_PATTERN = '(?:^|\\s)#[a-zA-Z0-9_]+';
const EMAIL_PATTERN = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}';
const FULL_URL_PATTERN = '(?:https?://|www\\.)[^\\s/$.?#].[^\\s]*';
const NAKED_DOMAIN_PATTERN = '\\b[a-zA-Z0-9-]+\\.(?:com|net|org|in|io|me|ai|app|dev|site|page|biz|info)\\b';

// Structured mentions: @[Display Name](handle) - Only registered platform users selected from autocomplete generate structured mentions
const STRUCTURED_MENTION_PATTERN = '@\\[[^\\]]+\\]\\([^)]+\\)';
// Only highlight valid registered mentions in orange accent colour; unregistered raw @usernames are left as plain text
const MENTION_PATTERN = STRUCTURED_MENTION_PATTERN;

// Helper to escape special characters for regex
const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
};

export const RichTextRenderer = memo(({ content, authorName, authorSlug, mentionedUsers, disableLinks = false }: RichTextRendererProps) => {
  if (!content) return null;

  // Dynamically build regex based on whether authorName is provided
  const RICH_TEXT_REGEX = useMemo(() => {
    const patterns = [
      MENTION_PATTERN,
      HASHTAG_PATTERN,
      EMAIL_PATTERN,
      FULL_URL_PATTERN,
      NAKED_DOMAIN_PATTERN
    ];

    if (authorName) {
      // Look for the author's name as a whole word
      patterns.push(`\\b${escapeRegExp(authorName)}\\b`);
    }

    // Sort patterns by length descending to catch longer matches first
    return new RegExp(`(${patterns.sort((a, b) => b.length - a.length).join('|')})`, 'gi');
  }, [authorName]);

  // Split content by the patterns
  const parts = content.split(RICH_TEXT_REGEX);

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (!part) return null;

        // 1. Handle Author Name Highlight (Smart Link)
        if (authorName && authorSlug && part.toLowerCase() === authorName.toLowerCase()) {
          if (disableLinks) {
            return (
              <span
                key={i}
                className="mention-link text-ds-accent text-[var(--ds-accent)] !text-[var(--ds-accent)] font-semibold"
                style={{ color: 'var(--ds-accent)' }}
              >
                {part}
              </span>
            );
          }
          return (
            <Link
              key={i}
              href={`/profile/${authorSlug}`}
              className="mention-link text-ds-accent text-[var(--ds-accent)] !text-[var(--ds-accent)] font-semibold no-underline hover:no-underline cursor-pointer transition-opacity hover:opacity-80"
              style={{ color: 'var(--ds-accent)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }

        // 2. Handle Structured Mentions (@[Display Name](handle))
        const structuredMatch = part.match(/(?:^|\s)?@\[([^\]]+)\]\(([^)]+)\)/);
        if (structuredMatch) {
          const displayName = structuredMatch[1];
          const handle = structuredMatch[2];

          return (
            <DynamicMention
              key={i}
              displayName={displayName}
              handle={handle}
              mentionedUsers={mentionedUsers}
              disableLinks={disableLinks}
            />
          );
        }

        // Note: Unregistered @usernames are not structured mentions and will fall through to plain text rendering below without orange styling.

        // 4. Handle Hashtags (#tag)
        const hashtagMatch = part.match(/(^|\s)#([a-zA-Z0-9_]+)/i);
        if (hashtagMatch) {
          const leadingSpace = hashtagMatch[1];
          const tag = hashtagMatch[2].toLowerCase();

          if (tag.length >= 2 && tag.length <= 30) {
            if (disableLinks) {
              return (
                <Fragment key={i}>
                  {leadingSpace}
                  <span
                    className="inline-block px-1 -mx-1 text-ds-text-primary text-[var(--ds-text-primary)] !text-[var(--ds-text-primary)] font-semibold"
                    style={{ color: 'var(--ds-text-primary)' }}
                  >
                    #{hashtagMatch[2]}
                  </span>
                </Fragment>
              );
            }

            // Disabled hashtag navigation: do not redirect to any page
            /*
            return (
              <Fragment key={i}>
                {leadingSpace}
                <Link
                  href={`/hashtag/${tag}`}
                  className="inline-block px-1 -mx-1 text-ds-text-primary text-[var(--ds-text-primary)] !text-[var(--ds-text-primary)] font-semibold hover:bg-ds-surface-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 rounded-md focus:outline-none"
                  style={{ color: 'var(--ds-text-primary)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  #{hashtagMatch[2]}
                </Link>
              </Fragment>
            );
            */
            return (
              <Fragment key={i}>
                {leadingSpace}
                <span
                  className="inline-block px-1 -mx-1 text-ds-text-primary text-[var(--ds-text-primary)] !text-[var(--ds-text-primary)] font-semibold"
                  style={{ color: 'var(--ds-text-primary)' }}
                >
                  #{hashtagMatch[2]}
                </span>
              </Fragment>
            );
          }
        }

        // 5. Handle Emails
        if (part.includes('@') && new RegExp(`^${EMAIL_PATTERN}$`, 'i').test(part)) {
          if (disableLinks) {
            return (
              <span key={i} className="text-[#EC6229] font-medium">
                {part}
              </span>
            );
          }

          return (
            <a
              key={i}
              href={`mailto:${part}`}
              className="text-[#EC6229] font-medium no-underline hover:opacity-80 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }

        // 6. Handle URLs (Full, www, or Naked)
        const isUrl = new RegExp(`^${FULL_URL_PATTERN}$`, 'i').test(part) ||
          new RegExp(`^${NAKED_DOMAIN_PATTERN}$`, 'i').test(part);

        if (isUrl) {
          if (disableLinks) {
            return (
              <span key={i} className="text-[#EC6229] font-medium break-all">
                {part}
              </span>
            );
          }

          let href = part;
          if (!/^https?:\/\//i.test(part)) {
            href = `https://${part}`;
          }

          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#EC6229] font-medium no-underline hover:opacity-80 transition-all break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }

        // 7. Return plain text
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </span>
  );
});

RichTextRenderer.displayName = 'RichTextRenderer';
export default RichTextRenderer;
