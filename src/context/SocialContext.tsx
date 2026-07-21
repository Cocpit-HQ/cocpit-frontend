"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useQueryClient } from '@tanstack/react-query';

interface SocialContextType {
  followingIds: string[];
  followUser: (id: string) => void;
  unfollowUser: (id: string) => void;
  isFollowing: (id: string) => boolean;
  startChat: (userId: string, companyId?: string) => void;
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
  const { activeProfile, isCompany } = useActiveProfile();
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followingLoading, setFollowingLoading] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const isFollowLoading = (id: string) => {
    return followingLoading.has(id);
  };

  const followUser = async (id: string) => {
    if (isCompany) return; // Follow is a user-only action
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

      const currentUserId = session?.user?.id;
      queryClient.invalidateQueries({ queryKey: ['profileStats', id] });
      queryClient.invalidateQueries({ queryKey: ['profile', id] });
      queryClient.invalidateQueries({ queryKey: ['followers', id] });
      queryClient.invalidateQueries({ queryKey: ['following', id] });
      queryClient.invalidateQueries({ queryKey: ['followersCount', id] });

      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: ['profileStats', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['profile', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['followers', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['following', currentUserId] });
      }
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
    if (isCompany) return; // Unfollow is a user-only action
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

      const currentUserId = session?.user?.id;
      queryClient.invalidateQueries({ queryKey: ['profileStats', id] });
      queryClient.invalidateQueries({ queryKey: ['profile', id] });
      queryClient.invalidateQueries({ queryKey: ['followers', id] });
      queryClient.invalidateQueries({ queryKey: ['following', id] });
      queryClient.invalidateQueries({ queryKey: ['followersCount', id] });

      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: ['profileStats', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['profile', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['followers', currentUserId] });
        queryClient.invalidateQueries({ queryKey: ['following', currentUserId] });
      }
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

  const startChat = (userId: string, companyId?: string) => {
    // Auto-include companyId when acting as a company profile
    const effectiveCompanyId = companyId || (isCompany ? activeProfile?.id : undefined);
    if (effectiveCompanyId) {
      router.push(`/messaging?userId=${userId}&companyId=${effectiveCompanyId}`);
    } else {
      router.push(`/messaging?userId=${userId}`);
    }
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
    if (isCompany) return; // Block is a user-only action
    setBlockedIds(prev => [...prev, id]);

    setFollowingIds(prev => prev.filter(uid => uid !== id));

    try {
      await api.post(`/users/${id}/block`);
      toast({ title: "User blocked", description: "You will no longer see their content." });
    } catch (error: any) {
      console.error("Block failed", error);
      setBlockedIds(prev => prev.filter(uid => uid !== id));
      const errorMsg = error?.response?.data?.message || "Failed to block user";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    }
  };

  const unblockUser = async (id: string) => {
    if (isCompany) return; // Unblock is a user-only action
    setBlockedIds(prev => prev.filter(uid => uid !== id));
    try {
      await api.delete(`/users/${id}/unblock`);
      toast({ title: "User unblocked" });
    } catch (error: any) {
      console.error("Unblock failed", error);
      setBlockedIds(prev => [...prev, id]); // Revert
      const errorMsg = error?.response?.data?.message || "Failed to unblock user";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    }
  };

  const { data: session, status } = useSession();

  React.useEffect(() => {
    if (status === 'authenticated' && !session?.user?.error && !isCompany) {
      // Fetch blocked users
      api.get('/users/me/blocks').then(res => {
        const ids = res.data.map((u: any) => (u.user_id || u.id)?.toString()).filter(Boolean);
        setBlockedIds(ids);
      }).catch(err => {
        console.warn("Failed to fetch blocked users", err);
      });

      // Fetch following users to sync follow states in UI on initial load / refresh
      const userId = session?.user?.id;
      if (userId) {
        api.get(`/users/${userId}/following`).then(res => {
          const ids = res.data.map((u: any) => (u.following_id || u.user_id || u.id)?.toString()).filter(Boolean);
          setFollowingIds(ids);
        }).catch(err => {
          console.warn("Failed to fetch following users", err);
        });
      }
    }
  }, [status, session?.user?.id, isCompany]);

  return (
    <SocialContext.Provider value={{
      followingIds, followUser, unfollowUser, isFollowing, startChat, isFollowLoading, syncFollowStatus,
      blockedIds, blockUser, unblockUser, isBlocked
    }}>
      {children}
    </SocialContext.Provider>
  );
};
