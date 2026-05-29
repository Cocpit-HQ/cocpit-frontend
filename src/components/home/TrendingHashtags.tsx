"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTrendingHashtags, HashtagSuggestion } from '@/services/api/hashtags';
import { Hash, TrendingUp, Loader2, X } from 'lucide-react';

export default function TrendingHashtags() {
  const [hashtags, setHashtags] = useState<HashtagSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const isHidden = sessionStorage.getItem('hideTrendingNow') === 'true';
    if (isHidden) {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    getTrendingHashtags()
      .then(setHashtags)
      .catch(err => console.error("Failed to fetch trending hashtags", err))
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('hideTrendingNow', 'true');
  };

  if (!isVisible) return null;

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 space-y-4 shadow-sm animate-pulse">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-muted rounded"></div>
          <div className="w-24 h-4 bg-muted rounded"></div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-1">
            <div className="w-20 h-4 bg-muted rounded"></div>
            <div className="w-12 h-3 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!hashtags || hashtags.length === 0) return null;

  return (
    <div className="bg-white border border-[#EEF2FF] rounded-[24px] w-[336px] h-[172px] p-4 flex flex-col gap-4 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between w-full pb-3 border-b border-[#EEF2FF]">
        <h2 className="font-bold flex items-center gap-2 text-black text-[16px] font-['Poppins']">
          <TrendingUp className="w-4 h-4 text-[#6366F1]" />
          Trending Now
        </h2>
        <button
          onClick={handleDismiss}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Dismiss trending"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col gap-3">
        {hashtags.slice(0, 5).map((h) => (
          <Link
            key={h.tag}
            href={`/hashtag/${h.tag.toLowerCase()}`}
            className="flex flex-col text-left transition-colors rounded-lg group"
          >
            <span className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1 font-['Poppins']">
              <Hash className="w-3.5 h-3.5 text-muted-foreground" />
              {h.tag}
            </span>
            <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium font-['Poppins']">
              {h.usage_count.toLocaleString()} Posts
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
