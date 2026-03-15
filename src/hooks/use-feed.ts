// Standalone hook for feed management
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { getFeed } from '@/services/api/feed';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';
import { Post } from '@/types/entities';
import React, { useCallback, useMemo } from 'react';

export const useFeed = (enableInitialFetch = true) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { activeProfile } = useActiveProfile();

  const currentUser = useMemo(() => ({
    id: session?.user?.id || '',
    name: session?.user?.name || '',
    image: session?.user?.image,
  }), [session]);

  const feedQueryKey = useMemo(
    () => ['feed', activeProfile?.type ?? 'USER', activeProfile?.id ?? currentUser.id] as const,
    [activeProfile?.id, activeProfile?.type, currentUser.id]
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: feedQueryKey,
    queryFn: async ({ pageParam }) => {
      const companyId = activeProfile?.type !== 'USER' ? activeProfile?.id : undefined;
      const response = await getFeed(pageParam?.cursorCreatedAt, pageParam?.cursorPostId, companyId);
      return {
        ...response,
        posts: response.posts.map(mapBackendPostToFrontend)
      };
    },
    initialPageParam: null as { cursorCreatedAt: string; cursorPostId: string } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    refetchOnWindowFocus: false,
    enabled: !!session && enableInitialFetch,
  });

  const posts = useMemo(() => {
    if (!data?.pages) return [];
    const allPosts = data.pages.flatMap(page => page.posts);
    const seen = new Set();
    return allPosts.filter(post => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, [data]);

  const loadMorePosts = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const deletePost = useCallback(async (id: string) => {
    queryClient.setQueryData<any>(feedQueryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.filter((p: Post) => p.id !== id)
        }))
      };
    });
    // In actual app, call apiDeletePost(id) here
  }, [feedQueryKey, queryClient]);

  const togglePostVisibility = useCallback((id: string) => {
    queryClient.setQueryData<any>(feedQueryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((post: Post) =>
            post.id === id
              ? { ...post, visibility: post.visibility === 'private' ? 'public' : 'private' }
              : post
          )
        }))
      };
    });
  }, [feedQueryKey, queryClient]);

  const addPost = useCallback((post: Post) => {
    queryClient.setQueryData<any>(feedQueryKey, (oldData: any) => {
      if (!oldData) return oldData;
      const newPages = [...oldData.pages];
      if (newPages.length > 0) {
        newPages[0] = {
          ...newPages[0],
          posts: [post, ...newPages[0].posts]
        };
      }
      return { ...oldData, pages: newPages };
    });
  }, [feedQueryKey, queryClient]);

  const updatePostInFeed = useCallback((id: string, updates: Partial<Post>) => {
    queryClient.setQueryData<any>(feedQueryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((post: Post) =>
            post.id === id ? { ...post, ...updates } : post
          )
        }))
      };
    });
  }, [feedQueryKey, queryClient]);

  return {
    posts,
    currentUser,
    loadMorePosts,
    addPost,
    deletePost,
    togglePostVisibility,
    updatePostInFeed,
    hasMore: !!hasNextPage,
    loading: isLoading || isFetchingNextPage,
  };
};
