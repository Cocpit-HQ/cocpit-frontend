'use client';

import React from 'react';
import Link from 'next/link';
import { SearchHashtagItem } from '../../types/search.types';

interface SearchHashtagCardProps {
  hashtag: SearchHashtagItem;
  returnTo?: string;
}

export const SearchHashtagCard: React.FC<SearchHashtagCardProps> = ({ hashtag, returnTo }) => {
  const rawTag =
    typeof hashtag === 'string'
      ? hashtag
      : hashtag?.tag || (hashtag as any)?.display_tag || (hashtag as any)?.name || (hashtag as any)?.hashtag || '';

  const cleanTag = typeof rawTag === 'string' ? rawTag.replace(/^#/, '').trim() : '';
  if (!cleanTag) return null;

  const url = `/hashtag/${encodeURIComponent(cleanTag)}` + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '');

  const count = Number(
    typeof hashtag === 'object' && hashtag !== null
      ? (hashtag.post_count ?? (hashtag as any).posts_count ?? (hashtag as any).usage_count ?? 0)
      : 0
  );
  const countDisplay =
    typeof hashtag === 'object' && hashtag !== null && hashtag.posts_display
      ? hashtag.posts_display
      : `${count.toLocaleString()} post${count === 1 ? '' : 's'}`;

  return (
    <Link
      href={url}
      className="w-full flex flex-col justify-center py-2 rounded-xl transition-colors group cursor-pointer"
    >
      <span className="text-ds-text-primary text-[15px] font-medium font-dm-sans group-hover:text-ds-accent transition-colors leading-[20px] truncate">
        #{cleanTag}
      </span>
      <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-[16px] mt-0.5 truncate">
        {countDisplay}
      </span>
    </Link>
  );
};
