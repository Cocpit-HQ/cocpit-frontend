"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

interface SocialContextType {
  followingIds: string[];
  followUser: (id: string) => void;
  unfollowUser: (id: string) => void;
  isFollowing: (id: string) => boolean;
  startChat: (userId: string) => void;
  isFollowLoading: (id: string) => boolean;
  syncFollowStatus: (userId: string, isFollowing: boolean) => void;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};

interface SocialProviderProps {
  children: ReactNode;
}

export const SocialProvider = ({ children }: SocialProviderProps) => {
  const router = useRouter();
  const { toast } = useToast();
  // Mock initial following state
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followingLoading, setFollowingLoading] = useState<Set<string>>(new Set());

  const isFollowLoading = (id: string) => {
    return followingLoading.has(id);
  };

  const followUser = async (id: string) => {
    // 1. Set loading state
    setFollowingLoading((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // 2. Optimistic update
    setFollowingIds((prev) => [...prev, id]);

    try {
      // 3. API call
      await api.post(`/users/${id}/follow`);

      // 4. On success, just clear loading (state already updated)
      setFollowingLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error('Failed to follow user:', error);

      // 5. Revert optimistic update
      setFollowingIds((prev) => prev.filter((userId) => userId !== id));

      // Clear loading
      setFollowingLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // Show toast
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const unfollowUser = async (id: string) => {
    // 1. Set loading state
    setFollowingLoading((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // 2. Optimistic update
    setFollowingIds((prev) => prev.filter((userId) => userId !== id));

    try {
      // 3. API call
      await api.delete(`/users/${id}/unfollow`);

      // 4. On success, just clear loading
      setFollowingLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error('Failed to unfollow user:', error);

      // 5. Revert optimistic update
      setFollowingIds((prev) => [...prev, id]);

      // Clear loading
      setFollowingLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // Show toast
      toast({
        title: "Error",
        description: "Failed to unfollow user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isFollowing = (id: string) => {
    return followingIds.includes(id);
  };

  const startChat = (userId: string) => {
    // Navigate to messaging with the user ID to potentially open specific chat
    router.push(`/messaging?userId=${userId}`);
  };

  const syncFollowStatus = (userId: string, isFollowing: boolean) => {
    setFollowingIds(prev => {
      const exists = prev.includes(userId);
      if (isFollowing && !exists) {
        return [...prev, userId];
      } else if (!isFollowing && exists) {
        return prev.filter(id => id !== userId);
      }
      return prev;
    });
  };

  return (
    <SocialContext.Provider value={{ followingIds, followUser, unfollowUser, isFollowing, startChat, isFollowLoading, syncFollowStatus }}>
      {children}
    </SocialContext.Provider>
  );
};
