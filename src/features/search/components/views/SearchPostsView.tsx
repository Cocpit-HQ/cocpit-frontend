'use client';

import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { FeedPost } from '@/features/feed/components/FeedPost';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';
import { Loader2 } from 'lucide-react';

interface SearchPostsViewProps {
  items: any[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  query: string;
  returnTo?: string;
}

export const SearchPostsView: React.FC<SearchPostsViewProps> = ({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  query,
  returnTo,
}) => {
  const { ref, inView } = useInView({ threshold: 0, rootMargin: '200px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!isLoading && items.length === 0) {
    return (
      <div className="w-full max-w-[442px] mx-auto px-4 py-16 text-center">
        <h3 className="text-ds-text-primary text-base font-medium font-dm-sans mb-1">
          {query.trim()
            ? `No posts found for \u201C${query}\u201D`
            : 'No posts found matching your filters'}
        </h3>
        <p className="text-ds-text-secondary text-sm font-dm-sans">
          {query.trim()
            ? 'Try searching for different keywords or topics.'
            : 'Try adjusting or clearing your filter options.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[538px] mx-auto px-4 sm:px-12 flex flex-col items-center gap-6">
      {/* Posts List Column */}
      <div className="w-full max-w-[442px] flex flex-col gap-3 mx-auto">
        {items.map((post, idx) => {
          const mappedPost = post.author ? post : mapBackendPostToFrontend(post);
          return (
            <div key={mappedPost.id || mappedPost.post_id || `search-post-${idx}`} className="w-full max-w-[442px]">
              <FeedPost {...mappedPost} id={mappedPost.id || mappedPost.post_id} returnTo={returnTo} />
            </div>
          );
        })}
      </div>

      {/* Keyset pagination trigger */}
      <div ref={ref} className="w-full py-4 min-h-[40px] flex justify-center items-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-ds-text-secondary text-sm font-dm-sans">
            <Loader2 className="size-4 animate-spin text-ds-accent" />
            <span>Loading more posts...</span>
          </div>
        )}
      </div>
    </div>
  );
};
