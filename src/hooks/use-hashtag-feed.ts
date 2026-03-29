"use client";

import { useInfiniteQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getHashtagFeed } from '@/services/api/hashtags';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';
import { useMemo, useCallback } from 'react';

export const useHashtagFeed = (tag: string) => {
  const { data: session } = useSession();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['hashtag-feed', tag],
    queryFn: async ({ pageParam }) => {
      const response = await getHashtagFeed(tag, pageParam?.cursorCreatedAt, pageParam?.cursorPostId);
      return {
        ...response,
        posts: response.posts.map(mapBackendPostToFrontend)
      };
    },
    initialPageParam: null as { cursorCreatedAt: string; cursorPostId: string } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    refetchOnWindowFocus: false,
    enabled: !!session && !!tag,
  });

  const posts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.posts);
  }, [data]);

  const loadMorePosts = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    posts,
    loadMorePosts,
    hasMore: !!hasNextPage,
    loading: isLoading || isFetchingNextPage,
  };
};
