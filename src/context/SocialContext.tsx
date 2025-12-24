"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface SocialContextType {
  followingIds: string[];
  followUser: (id: string) => void;
  unfollowUser: (id: string) => void;
  isFollowing: (id: string) => boolean;
  startChat: (userId: string) => void;
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
  // Mock initial following state
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const followUser = (id: string) => {
    setFollowingIds((prev) => [...prev, id]);
  };

  const unfollowUser = (id: string) => {
    setFollowingIds((prev) => prev.filter((userId) => userId !== id));
  };

  const isFollowing = (id: string) => {
    return followingIds.includes(id);
  };

  const startChat = (userId: string) => {
    // Navigate to messaging with the user ID to potentially open specific chat
    router.push(`/messaging?userId=${userId}`);
  };

  return (
    <SocialContext.Provider value={{ followingIds, followUser, unfollowUser, isFollowing, startChat }}>
      {children}
    </SocialContext.Provider>
  );
};
