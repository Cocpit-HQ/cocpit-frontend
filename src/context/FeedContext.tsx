"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Post } from '@/types/entities';
import { getFeed } from '@/services/api/feed';
import { deletePost as apiDeletePost } from '@/services/api/posts';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';

const currentUser = {
  id: 'current-user-id',
  name: 'Sally Liang',
};

interface FeedContextType {
  posts: Post[];
  currentUser: { id: string; name: string };
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<{ cursorCreatedAt: string; cursorPostId: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Initial fetch
  useEffect(() => {
    const fetchInitialPosts = async () => {
      setLoading(true);
      try {
        const response = await getFeed();
        const mappedPosts = response.posts.map(mapBackendPostToFrontend);
        setPosts(mappedPosts);
        setNextCursor(response.nextCursor);
        setHasMore(!!response.nextCursor);
      } catch (error) {
        console.error("Failed to fetch feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialPosts();
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (!nextCursor || loading) return;

    setLoading(true);
    try {
      const response = await getFeed(nextCursor.cursorCreatedAt, nextCursor.cursorPostId);
      const mappedPosts = response.posts.map(mapBackendPostToFrontend);

      setPosts((prevPosts) => {
        const existingIds = new Set(prevPosts.map((p) => p.id));
        const newUniquePosts = mappedPosts.filter((p) => !existingIds.has(p.id));
        return [...prevPosts, ...newUniquePosts];
      });
      setNextCursor(response.nextCursor);
      setHasMore(!!response.nextCursor);
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading]);

  const addPost = (post: Post) => {
    setPosts((prevPosts) => [post, ...prevPosts]);
  };

  const deletePost = async (id: string) => {
    // Optimistic update
    const previousPosts = [...posts];
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));

    try {
      await apiDeletePost(id);
    } catch (error) {
      console.error('Failed to delete post:', error);
      // Revert if failed
      setPosts(previousPosts);
    }
  };

  const togglePostVisibility = (id: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === id
          ? { ...post, visibility: post.visibility === 'private' ? 'public' : 'private' }
          : post
      )
    );
  };

  const updatePostInFeed = (id: string, updates: Partial<Post>) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === id ? { ...post, ...updates } : post))
    );
  };

  return (
    <FeedContext.Provider value={{
      posts,
      addPost,
      currentUser,
      deletePost,
      togglePostVisibility,
      updatePostInFeed,
      loadMorePosts,
      hasMore,
      loading
    }}>
      {children}
    </FeedContext.Provider>
  );
};
