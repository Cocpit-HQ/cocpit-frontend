"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { Post } from '@/types/entities';
import { getFeed } from '@/services/api/feed';
import { deletePost as apiDeletePost } from '@/services/api/posts';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';

import { useSession } from "next-auth/react";
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveProfile } from '@/context/ActiveProfileContext';

interface FeedContextType {
  posts: Post[];
  currentUser: { id: string; name: string; image?: string | null };
  addPost: (post: Post) => void;
  deletePost: (id: string) => Promise<void>;
  togglePostVisibility: (id: string) => void;
  updatePostInFeed: (id: string, updates: Partial<Post>) => void;
  loadMorePosts: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};

interface FeedProviderProps {
  children: ReactNode;
}

export const FeedProvider = ({ children }: FeedProviderProps) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { activeProfile } = useActiveProfile();

  const currentUser = {
    id: session?.user?.id || '',
    name: session?.user?.name || '',
    image: session?.user?.image,
  };

  // Include activeProfile.type in query key to separate user vs company feed caches
  const feedQueryKey = ['feed', activeProfile?.type ?? 'USER', currentUser.id];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: feedQueryKey,
    queryFn: async ({ pageParam }) => {
      const response = await getFeed(pageParam?.cursorCreatedAt, pageParam?.cursorPostId);
      return {
        ...response,
        posts: response.posts.map(mapBackendPostToFrontend)
      };
    },
    initialPageParam: null as { cursorCreatedAt: string; cursorPostId: string } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    refetchOnWindowFocus: false, // Prevent overwhelming refetches
  });

  const posts = React.useMemo(() => {
    if (!data?.pages) return [];
    const allPosts = data.pages.flatMap(page => page.posts);
    // Deduplicate by ID to prevent key collisions
    const seen = new Set();
    return allPosts.filter(post => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, [data?.pages]);

  // Combine initial loading and pagination loading for simpler consumer logic,
  // or expose them separately if needed. Here we follow previous interface.
  const loading = isLoading || isFetchingNextPage;

  const loadMorePosts = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const addPost = useCallback((post: Post) => {
    queryClient.setQueryData(feedQueryKey, (oldData: any) => {
      if (!oldData) return oldData;

      // Add to the first page
      const newPages = [...oldData.pages];
      if (newPages.length > 0) {
        newPages[0] = {
          ...newPages[0],
          posts: [post, ...newPages[0].posts]
        };
      }

      return {
        ...oldData,
        pages: newPages
      };
    });
  }, [queryClient]);

  const deletePost = useCallback(async (id: string) => {
    // Optimistic update
    queryClient.setQueryData(feedQueryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.filter((p: Post) => p.id !== id)
        }))
      };
    });

    try {
      await apiDeletePost(id);
    } catch (error) {
      console.error('Failed to delete post:', error);
      // Revert is complex with infinite query, simplified: invalidate to refetch
      queryClient.invalidateQueries({ queryKey: feedQueryKey });
    }
  }, [queryClient, currentUser.id]);

  const togglePostVisibility = useCallback((id: string) => {
    queryClient.setQueryData(feedQueryKey, (oldData: any) => {
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
  }, [queryClient]);

  const updatePostInFeed = useCallback((id: string, updates: Partial<Post>) => {
    queryClient.setQueryData(feedQueryKey, (oldData: any) => {
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
  }, [queryClient]);

  return (
    <FeedContext.Provider value={{
      posts,
      addPost,
      currentUser,
      deletePost,
      togglePostVisibility,
      updatePostInFeed,
      loadMorePosts,
      hasMore: !!hasNextPage,
      loading
    }}>
      {children}
    </FeedContext.Provider>
  );
};
