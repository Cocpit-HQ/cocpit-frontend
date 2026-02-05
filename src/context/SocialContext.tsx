"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

interface SocialContextType {
  followingIds: string[];
  followUser: (id: string) => void;
  unfollowUser: (id: string) => void;
  isFollowing: (id: string) => boolean;
  startChat: (userId: string) => void;
  isFollowLoading: (id: string) => boolean;
  syncFollowStatus: (userId: string, isFollowing: boolean) => void;

  blockedIds: string[];
  blockUser: (id: string) => Promise<void>;
  unblockUser: (id: string) => Promise<void>;
  isBlocked: (id: string) => boolean;
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
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followingLoading, setFollowingLoading] = useState<Set<string>>(new Set());

  const isFollowLoading = (id: string) => {
    return followingLoading.has(id);
  };

  const followUser = async (id: string) => {
    setFollowingLoading((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    setFollowingIds((prev) => [...prev, id]);

    try {
      await api.post(`/users/${id}/follow`);
      setFollowingLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error('Failed to follow user:', error);
      setFollowingIds((prev) => prev.filter((userId) => userId !== id));

      setFollowingLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const unfollowUser = async (id: string) => {
    setFollowingLoading((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    setFollowingIds((prev) => prev.filter((userId) => userId !== id));

    try {
      await api.delete(`/users/${id}/unfollow`);

      setFollowingLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error('Failed to unfollow user:', error);

      setFollowingIds((prev) => [...prev, id]);

      setFollowingLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

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

  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const isBlocked = (id: string) => blockedIds.includes(id);

  const blockUser = async (id: string) => {
    setBlockedIds(prev => [...prev, id]);

    setFollowingIds(prev => prev.filter(uid => uid !== id));

    try {
      await api.post(`/users/${id}/block`);
      toast({ title: "User blocked", description: "You will no longer see their content." });
    } catch (error) {
      console.error("Block failed", error);
      setBlockedIds(prev => prev.filter(uid => uid !== id));
      toast({ title: "Error", description: "Failed to block user", variant: "destructive" });
    }
  };

  const unblockUser = async (id: string) => {
    setBlockedIds(prev => prev.filter(uid => uid !== id));
    try {
      await api.delete(`/users/${id}/unblock`);
      toast({ title: "User unblocked" });
    } catch (error) {
      console.error("Unblock failed", error);
      setBlockedIds(prev => [...prev, id]); // Revert
      toast({ title: "Error", description: "Failed to unblock user", variant: "destructive" });
    }
  };

  const { data: session, status } = useSession();

  React.useEffect(() => {
    if (status === 'authenticated' && !session?.user?.error) {
      api.get('/users/me/blocks').then(res => {
        const ids = res.data.map((u: any) => u.user_id);
        setBlockedIds(ids);
      }).catch(err => {
        console.warn("Failed to fetch blocked users", err);
      });
    }
  }, [status]);

  return (
    <SocialContext.Provider value={{
      followingIds, followUser, unfollowUser, isFollowing, startChat, isFollowLoading, syncFollowStatus,
      blockedIds, blockUser, unblockUser, isBlocked
    }}>
      {children}
    </SocialContext.Provider>
  );
};
