"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTrendingHashtags, HashtagSuggestion } from '@/services/api/hashtags';
import { Hash, TrendingUp, Loader2 } from 'lucide-react';

export default function TrendingHashtags() {
  const [hashtags, setHashtags] = useState<HashtagSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrendingHashtags()
      .then(setHashtags)
      .catch(err => console.error("Failed to fetch trending hashtags", err))
      .finally(() => setLoading(false));
  }, []);

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
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Trending Now
        </h2>
      </div>
      <div className="p-2">
        {hashtags.map((h) => (
          <Link
            key={h.tag}
            href={`/hashtag/${h.tag}`}
            className="flex flex-col px-3 py-2 hover:bg-muted transition-colors rounded-lg group"
          >
            <span className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1">
              <Hash className="w-3 h-3 text-muted-foreground" />
              {h.tag}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {h.usage_count} Posts
            </span>
          </Link>
        ))}
      </div>
      <div className="p-3 border-t border-border">
          <button className="text-xs text-primary font-medium hover:underline w-full text-left">
              Show more
          </button>
      </div>
    </div>
  );
}
