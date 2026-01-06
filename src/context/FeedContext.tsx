"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Post } from '@/types/entities';
import { getPublicFeed } from '@/services/api/feed';
import { mapApiPostToPost } from '@/lib/mappers/feed.mapper';

const currentUser = {
  name: 'Sally Liang',
};

interface FeedContextType {
  posts: Post[];
  currentUser: { name: string };
  addPost: (post: Post) => void;
  deletePost: (id: number | string) => void;
  togglePostVisibility: (id: number | string) => void;
  loadMore: () => Promise<void>;
  isLoading: boolean;
  hasMore: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchFeed = useCallback(async (cursor?: string) => {
    try {
      setIsLoading(true);
      const data = await getPublicFeed(cursor);

      const newPosts = data.posts.map(mapApiPostToPost);

      setPosts(prev => {
        // If it's a new fetch (no cursor or first load), replace, else append
        // Actually the logic is: append if scrolling.
        // But react strict mode might double invoke, so we need to be careful with unique keys.
        // For simplicity here:
        if (!cursor) {
           return newPosts;
        }

        // Filter out duplicates just in case
        const existingIds = new Set(prev.map(p => p.id));
        const filteredNewPosts = newPosts.filter(p => !existingIds.has(p.id));
        return [...prev, ...filteredNewPosts];
      });

      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error('Error fetching feed:', error);
      // setHasMore(false); // Stop trying on error? Or let user retry? For now, keep state as is or handle error better.
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const loadMore = async () => {
    if (isLoading || !hasMore || !nextCursor) return;
    await fetchFeed(nextCursor);
  };

  const addPost = (post: Post) => {
    setPosts((prevPosts) => [post, ...prevPosts]);
  };

  const deletePost = (id: number | string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
  };

  const togglePostVisibility = (id: number | string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === id
          ? { ...post, visibility: post.visibility === 'private' ? 'public' : 'private' }
          : post
      )
    );
  };

  return (
    <FeedContext.Provider value={{
      posts,
      addPost,
      currentUser,
      deletePost,
      togglePostVisibility,
      loadMore,
      isLoading,
      hasMore
    }}>
      {children}
    </FeedContext.Provider>
  );
};
