"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useQueryClient } from "@tanstack/react-query";

interface SocialContextType {
  followingIds: string[];
  followUser: (id: string, sourcePostId?: string, userName?: string) => Promise<void> | void;
  unfollowUser: (id: string, userName?: string) => Promise<void> | void;
  isFollowing: (id: string) => boolean;
  startChat: (userId: string, companyId?: string) => void;
  isFollowLoading: (id: string) => boolean;
  syncFollowStatus: (userId: string, isFollowing: boolean) => void;

  blockedIds: string[];
  blockUser: (id: string) => Promise<{ success: boolean; message?: string }>;
  unblockUser: (id: string) => Promise<{ success: boolean; message?: string }>;
  isBlocked: (id: string) => boolean;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error("useSocial must be used within a SocialProvider");
  }
  return context;
};

interface SocialProviderProps {
  children: ReactNode;
}

export const SocialProvider = ({ children }: SocialProviderProps) => {
  const router = useRouter();
  const { activeProfile, isCompany } = useActiveProfile();
  const { data: session, status } = useSession();
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followingLoading, setFollowingLoading] = useState<Set<string>>(
    new Set(),
  );
  const queryClient = useQueryClient();

  const isFollowLoading = (id: string) => {
    return followingLoading.has(id);
  };

  const notifyFollowEvent = (targetId: string, isFollowing: boolean) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cocpit:follow_status_changed", {
          detail: { targetId, isFollowing, orgId: activeProfile?.id },
        }),
      );

      try {
        localStorage.setItem(
          "cocpit_follow_event",
          JSON.stringify({ targetId, isFollowing, orgId: activeProfile?.id, timestamp: Date.now() }),
        );
      } catch (e) {}
    }

    // Optimistically update current user's following count in my-profile
    queryClient.setQueryData(["my-profile"], (old: any) => {
      if (!old?.user) return old;
      const prev = old.user.following_count ?? 0;
      return {
        ...old,
        user: {
          ...old.user,
          following_count: isFollowing ? prev + 1 : Math.max(0, prev - 1),
        },
      };
    });

    // Optimistically update target user's followers count in profile queries
    queryClient.setQueriesData({ queryKey: ["profile"] }, (old: any) => {
      if (!old) return old;
      if (old.id === targetId || old.account_name === targetId || (old.user && (old.user.id === targetId || old.user.account_name === targetId))) {
        const prev = (old.followers_count ?? old.user?.followers_count) ?? 0;
        const nextCount = isFollowing ? prev + 1 : Math.max(0, prev - 1);
        return {
          ...old,
          is_following: isFollowing,
          followers_count: nextCount,
          ...(old.user ? { user: { ...old.user, followers_count: nextCount, is_following: isFollowing } } : {}),
        };
      }
      return old;
    });

    queryClient.invalidateQueries({ queryKey: ["followers"] });
    queryClient.invalidateQueries({ queryKey: ["following"] });
    queryClient.invalidateQueries({ queryKey: ["organization-followers"] });
    queryClient.invalidateQueries({ queryKey: ["organization-following"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
    queryClient.invalidateQueries({ queryKey: ["profileStats"] });
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });
  };

  const followUser = async (id: string, sourcePostId?: string, userName?: string) => {
    setFollowingLoading((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    setFollowingIds((prev) => [...prev, id]);

    try {
      const payload = sourcePostId ? { sourcePostId } : undefined;
      
      if (isCompany && activeProfile?.id) {
        // Company follows a user via the org-specific endpoint
        await api.post(
          `/organizations/${activeProfile.id}/following/users/${id}`,
          payload
        );
      } else {
        await api.post(`/users/${id}/follow`, payload);
      }

      setFollowingLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success(userName ? `Started following ${userName}` : "Started following user");
      notifyFollowEvent(id, true);
      const currentUserId = session?.user?.id;
      queryClient.invalidateQueries({ queryKey: ["profileStats", id] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["followers", id] });
      queryClient.invalidateQueries({ queryKey: ["following", id] });
      queryClient.invalidateQueries({ queryKey: ["followersCount", id] });

      if (currentUserId) {
        queryClient.invalidateQueries({
          queryKey: ["profileStats", currentUserId],
        });
        queryClient.invalidateQueries({ queryKey: ["profile", currentUserId] });
        queryClient.invalidateQueries({
          queryKey: ["followers", currentUserId],
        });
        queryClient.invalidateQueries({
          queryKey: ["following", currentUserId],
        });
      }
    } catch (error) {
      console.error("Failed to follow user:", error);
      setFollowingIds((prev) => prev.filter((userId) => userId !== id));

      setFollowingLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      toast.error("Failed to follow user. Please try again.");
    }
  };

  const unfollowUser = async (id: string, userName?: string) => {
    setFollowingLoading((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    setFollowingIds((prev) => prev.filter((userId) => userId !== id));

    try {
      if (isCompany && activeProfile?.id) {
        // Company unfollows a user via the org-specific endpoint
        await api.delete(
          `/organizations/${activeProfile.id}/following/users/${id}`,
        );
      } else {
        await api.delete(`/users/${id}/unfollow`);
      }

      setFollowingLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success(userName ? `Unfollowed ${userName}` : "Unfollowed user");
      notifyFollowEvent(id, false);
      const currentUserId = session?.user?.id;
      queryClient.invalidateQueries({ queryKey: ["profileStats", id] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["organization-followers"] });
      queryClient.invalidateQueries({ queryKey: ["organization-following"] });
      queryClient.invalidateQueries({ queryKey: ["followersCount", id] });
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["relationshipStatus"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });

      if (currentUserId) {
        queryClient.invalidateQueries({
          queryKey: ["profileStats", currentUserId],
        });
        queryClient.invalidateQueries({ queryKey: ["profile", currentUserId] });
        queryClient.invalidateQueries({
          queryKey: ["followers", currentUserId],
        });
        queryClient.invalidateQueries({
          queryKey: ["following", currentUserId],
        });
      }
    } catch (error) {
      console.error("Failed to unfollow user:", error);

      setFollowingIds((prev) => [...prev, id]);

      setFollowingLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      toast.error("Failed to unfollow user. Please try again.");
    }
  };

  const isFollowing = (id: string) => {
    return followingIds.includes(id);
  };

  const startChat = (userId: string, companyId?: string) => {
    // Auto-include companyId when acting as a company profile
    const effectiveCompanyId =
      companyId || (isCompany ? activeProfile?.id : undefined);
    if (effectiveCompanyId) {
      router.push(
        `/messaging?userId=${userId}&companyId=${effectiveCompanyId}`,
      );
    } else {
      router.push(`/messaging?userId=${userId}`);
    }
  };

  const syncFollowStatus = (userId: string, isFollowing: boolean) => {
    setFollowingIds((prev) => {
      const exists = prev.includes(userId);
      if (isFollowing && !exists) {
        return [...prev, userId];
      } else if (!isFollowing && exists) {
        return prev.filter((id) => id !== userId);
      }
      return prev;
    });
  };

  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const isBlocked = (id: string) => blockedIds.includes(id);

  const notifyBlockEvent = (targetId: string, isBlocked: boolean) => {
    if (typeof window !== "undefined") {
      // 1. In-tab custom DOM event
      window.dispatchEvent(
        new CustomEvent("cocpit:block_status_changed", {
          detail: { targetId, isBlocked },
        }),
      );

      // 2. Cross-tab localStorage event
      try {
        localStorage.setItem(
          "cocpit_block_event",
          JSON.stringify({ targetId, isBlocked, timestamp: Date.now() }),
        );
      } catch (e) {}
    }

    // 3. React Query cache purges
    queryClient.removeQueries({ queryKey: ["profile", targetId] });
    queryClient.removeQueries({ queryKey: ["companyProfile", targetId] });
    queryClient.removeQueries({ queryKey: ["profileStats", targetId] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    queryClient.invalidateQueries({ queryKey: ["profilePreview"] });
    queryClient.invalidateQueries({ queryKey: ["sharedPost"] });
    queryClient.invalidateQueries({ queryKey: ["jobContext"] });
  };

  const blockUser = async (id: string) => {
    try {
      await api.post(`/users/${id}/block`);
      setBlockedIds((prev) => [...prev, id]);
      setFollowingIds((prev) => prev.filter((uid) => uid !== id));
      notifyBlockEvent(id, true);
      toast.success("User blocked. You will no longer see their content.");
      return { success: true };
    } catch (error: any) {
      console.error("Block failed", error);
      const errorMsg = error?.response?.data?.message || "Failed to block user";
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  const unblockUser = async (id: string) => {
    try {
      await api.delete(`/users/${id}/unblock`);
      setBlockedIds((prev) => prev.filter((uid) => uid !== id));
      notifyBlockEvent(id, false);
      toast.success("User unblocked");
      return { success: true };
    } catch (error: any) {
      console.error("Unblock failed", error);
      const errorMsg =
        error?.response?.data?.message || "Failed to unblock user";
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBlockEvent = (e: any) => {
      const detail = e.detail || {};
      if (detail.targetId) {
        if (detail.isBlocked) {
          setBlockedIds((prev) => [...new Set([...prev, detail.targetId])]);
        } else {
          setBlockedIds((prev) => prev.filter((id) => id !== detail.targetId));
        }
        queryClient.removeQueries({ queryKey: ["profile", detail.targetId] });
        queryClient.removeQueries({
          queryKey: ["companyProfile", detail.targetId],
        });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
        queryClient.invalidateQueries({ queryKey: ["feed"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["profilePreview"] });
        queryClient.invalidateQueries({ queryKey: ["sharedPost"] });
        queryClient.invalidateQueries({ queryKey: ["jobContext"] });
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "cocpit_block_event" && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload.targetId) {
            if (payload.isBlocked) {
              setBlockedIds((prev) => [
                ...new Set([...prev, payload.targetId]),
              ]);
            } else {
              setBlockedIds((prev) =>
                prev.filter((id) => id !== payload.targetId),
              );
            }
            queryClient.removeQueries({
              queryKey: ["profile", payload.targetId],
            });
            queryClient.removeQueries({
              queryKey: ["companyProfile", payload.targetId],
            });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            queryClient.invalidateQueries({ queryKey: ["profilePreview"] });
            queryClient.invalidateQueries({ queryKey: ["sharedPost"] });
            queryClient.invalidateQueries({ queryKey: ["jobContext"] });
          }
        } catch (_) {}
      }
    };

    window.addEventListener("cocpit:block_status_changed", handleBlockEvent);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener(
        "cocpit:block_status_changed",
        handleBlockEvent,
      );
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [queryClient]);

  React.useEffect(() => {
    if (status === "authenticated" && !session?.user?.error) {
      if (isCompany && activeProfile?.id) {
        // Fetch the users the organization is following to correctly seed followingIds
        api
          .get(`/organizations/${activeProfile.id}/following`)
          .then((res) => {
            const ids = res.data
              .map((u: any) => (u.user_id || u.id)?.toString())
              .filter(Boolean);
            setFollowingIds(ids);
          })
          .catch((err) => {
            console.warn("Failed to fetch org following users", err);
          });

        // Fetch users blocked by organization
        api
          .get("/users/me/blocks")
          .then((res) => {
            const ids = res.data
              .map((u: any) => (u.user_id || u.id)?.toString())
              .filter(Boolean);
            setBlockedIds(ids);
          })
          .catch((err) => {
            console.warn("Failed to fetch org blocked users", err);
          });
      } else {
        // Fetch blocked users (user-only)
        api
          .get("/users/me/blocks")
          .then((res) => {
            const ids = res.data
              .map((u: any) => (u.user_id || u.id)?.toString())
              .filter(Boolean);
            setBlockedIds(ids);
          })
          .catch((err) => {
            console.warn("Failed to fetch blocked users", err);
          });

        // Fetch following users to sync follow states in UI on initial load / refresh
        const userId = session?.user?.id;
        if (userId) {
          api
            .get(`/users/${userId}/following`)
            .then((res) => {
              const ids = res.data
                .map((u: any) =>
                  (u.following_id || u.user_id || u.id)?.toString(),
                )
                .filter(Boolean);
              setFollowingIds(ids);
            })
            .catch((err) => {
              console.warn("Failed to fetch following users", err);
            });
        }
      }
    }
  }, [status, session?.user?.id, isCompany, activeProfile?.id]);

  return (
    <SocialContext.Provider
      value={{
        followingIds,
        followUser,
        unfollowUser,
        isFollowing,
        startChat,
        isFollowLoading,
        syncFollowStatus,
        blockedIds,
        blockUser,
        unblockUser,
        isBlocked,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};
