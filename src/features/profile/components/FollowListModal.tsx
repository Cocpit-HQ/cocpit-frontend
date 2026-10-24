"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFollowers,
  getFollowing,
  getMyConnections,
  getConnections,
  followUser,
  unfollowUser,
  removeFollower,
  removeConnection,
  sendConnectionRequest,
} from "../services/profile.service";
import { toast } from "sonner";
import { companyService } from "@/services/organization.service";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useSocial } from "@/context/SocialContext";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import {
  CloseCrossIcon,
  SearchIcon,
  LockPrivateIcon,
  EmptyFollowIcon,
  EmptyConnectionIcon,
  UserIcon,
  BusinessBuildingIcon,
} from "@/components/icons";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";
import { cn } from "@/lib/utils";
import { useCompanyFollowPermission } from "@/hooks/useCompanyFollowPermission";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "followers" | "following" | "connections";
  userId: string;
  userName?: string;
  isOwnProfile?: boolean;
}

interface ConfirmAction {
  type: "unfollow" | "remove_follower" | "remove_connection";
  userId: string;
  userName: string;
  userType?: string;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  isOpen,
  onClose,
  initialTab = "followers",
  userId,
  userName,
  isOwnProfile: isOwnProfileProp,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"following" | "followers" | "connections">(initialTab);
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [pendingConnectUserIds, setPendingConnectUserIds] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { isFollowing, syncFollowStatus, startChat } = useSocial();
  const { activeProfile } = useActiveProfile();
  const { isCompanyActor, canFollow, message: noFollowMessage } = useCompanyFollowPermission();

  const loggedInUserId = currentUser?.id?.toString();
  const currentActorId = (isCompanyActor && activeProfile?.id ? activeProfile.id : loggedInUserId)?.toString();
  const isOwnProfile = isOwnProfileProp !== undefined
    ? isOwnProfileProp
    : (activeProfile?.type === "USER" && (loggedInUserId === userId?.toString() || (currentUser as any)?.username === userId));

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearch("");
    }
  }, [isOpen, initialTab]);

  // Query: Followers
  const {
    data: followers,
    isLoading: isLoadingFollowers,
    error: followersError,
  } = useQuery({
    queryKey: ["followers", userId, search],
    queryFn: () => getFollowers(userId, search),
    enabled: isOpen && activeTab === "followers",
    retry: false,
  });

  // Query: Following
  const {
    data: following,
    isLoading: isLoadingFollowing,
    error: followingError,
  } = useQuery({
    queryKey: ["following", userId, search],
    queryFn: () => getFollowing(userId, search),
    enabled: isOpen && activeTab === "following",
    retry: false,
  });

  // Query: Connections
  const {
    data: connections,
    isLoading: isLoadingConnections,
    error: connectionsError,
  } = useQuery({
    queryKey: ["connections", userId, search],
    queryFn: () => isOwnProfile ? getMyConnections(search) : getConnections(userId, search),
    enabled: isOpen && activeTab === "connections",
    retry: false,
  });

  // Privacy checks for public profile
  const isFollowingPrivate = useMemo(() => {
    if (isOwnProfile) return false;
    if ((followingError as any)?.response?.status === 403) return true;
    if ((following as any)?.is_private) return true;
    return false;
  }, [isOwnProfile, followingError, following]);

  const isFollowersPrivate = useMemo(() => {
    if (isOwnProfile) return false;
    if ((followersError as any)?.response?.status === 403) return true;
    if ((followers as any)?.is_private) return true;
    return false;
  }, [isOwnProfile, followersError, followers]);

  const isConnectionsPrivate = useMemo(() => {
    if (isOwnProfile) return false;
    if ((connectionsError as any)?.response?.status === 403) return true;
    return false;
  }, [isOwnProfile, connectionsError]);

  const isCurrentTabPrivate = useMemo(() => {
    if (activeTab === "following") return isFollowingPrivate;
    if (activeTab === "followers") return isFollowersPrivate;
    if (activeTab === "connections") return isConnectionsPrivate;
    return false;
  }, [activeTab, isFollowingPrivate, isFollowersPrivate, isConnectionsPrivate]);

  // Mutations
  const followMutation = useMutation({
    mutationFn: (data: { id: string; name?: string }) => followUser(data.id),
    onMutate: async ({ id: newUserId }) => {
      await queryClient.cancelQueries({ queryKey: ["profileStats", userId] });
      await queryClient.cancelQueries({ queryKey: ["followers", userId] });
      await queryClient.cancelQueries({ queryKey: ["following", userId] });
      await queryClient.cancelQueries({ queryKey: ["connections", userId] });

      const previousStats = queryClient.getQueryData(["profileStats", userId]);
      const previousFollowing = queryClient.getQueryData(["following", userId, search]);
      const previousFollowers = queryClient.getQueryData(["followers", userId, search]);
      const previousConnections = queryClient.getQueryData(["connections", userId, search]);

      if (activeTab === "followers") {
        queryClient.setQueryData(["followers", userId, search], (old: any[]) =>
          old?.map((u) =>
            (u.user_id === newUserId || u.follower_id === newUserId || u.id === newUserId)
              ? { ...u, is_following_back: true, is_following: true }
              : u
          )
        );
      }

      if (activeTab === "following") {
        queryClient.setQueryData(["following", userId, search], (old: any[]) =>
          old?.map((u) =>
            (u.user_id === newUserId || u.following_id === newUserId || u.id === newUserId)
              ? { ...u, is_following: true }
              : u
          )
        );
      }

      syncFollowStatus(newUserId, true);

      return { previousStats, previousFollowing, previousFollowers, previousConnections };
    },
    onSuccess: (_, variables) => {
      toast.success(variables.name ? `Started following ${variables.name}` : "Started following user");
    },
    onError: (err, { id: newUserId }, context: any) => {
      syncFollowStatus(newUserId, false);
      if (context) {
        queryClient.setQueryData(["profileStats", userId], context.previousStats);
        queryClient.setQueryData(["following", userId, search], context.previousFollowing);
        queryClient.setQueryData(["followers", userId, search], context.previousFollowers);
        queryClient.setQueryData(["connections", userId, search], context.previousConnections);
      }
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["following", userId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["connections", userId] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["relationshipStatus", userId] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (data: { id: string; name?: string }) => unfollowUser(data.id),
    onMutate: async ({ id: targetId }) => {
      await queryClient.cancelQueries({ queryKey: ["profileStats", userId] });
      await queryClient.cancelQueries({ queryKey: ["following", userId] });
      await queryClient.cancelQueries({ queryKey: ["followers", userId] });
      await queryClient.cancelQueries({ queryKey: ["connections", userId] });

      const previousStats = queryClient.getQueryData(["profileStats", userId]);
      const previousFollowing = queryClient.getQueryData(["following", userId, search]);
      const previousFollowers = queryClient.getQueryData(["followers", userId, search]);
      const previousConnections = queryClient.getQueryData(["connections", userId, search]);

      if (activeTab === "following") {
        if (isOwnProfile) {
          queryClient.setQueryData(["following", userId, search], (old: any[]) =>
            old?.filter((u) => (u.user_id || u.following_id || u.id) !== targetId)
          );
        } else {
          queryClient.setQueryData(["following", userId, search], (old: any[]) =>
            old?.map((u) =>
              (u.user_id === targetId || u.following_id === targetId || u.id === targetId)
                ? { ...u, is_following: false }
                : u
            )
          );
        }
      }
      if (activeTab === "followers") {
        queryClient.setQueryData(["followers", userId, search], (old: any[]) =>
          old?.map((u) =>
            (u.user_id === targetId || u.follower_id === targetId || u.id === targetId)
              ? { ...u, is_following_back: false, is_following: false }
              : u
          )
        );
      }

      // Optimistically remove from connections since unfollowing breaks the connection
      if (isOwnProfile) {
        queryClient.setQueryData(["connections", userId, search], (old: any[]) =>
          old?.filter((u) => (u.user_id || u.following_id || u.id) !== targetId)
        );
      }

      syncFollowStatus(targetId, false);

      return { previousStats, previousFollowing, previousFollowers, previousConnections };
    },
    onSuccess: (_, variables) => {
      toast.success(variables.name ? `Unfollowed ${variables.name}` : "Unfollowed user");
    },
    onError: (err, { id: targetId }, context: any) => {
      syncFollowStatus(targetId, true);
      if (context) {
        queryClient.setQueryData(["profileStats", userId], context.previousStats);
        queryClient.setQueryData(["following", userId, search], context.previousFollowing);
        queryClient.setQueryData(["followers", userId, search], context.previousFollowers);
        queryClient.setQueryData(["connections", userId, search], context.previousConnections);
      }
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["following", userId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["connections", userId] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["relationshipStatus", userId] });
    },
  });

  const unfollowCompanyMutation = useMutation({
    mutationFn: (data: { id: string; name?: string }) => companyService.unfollowCompany(data.id),
    onMutate: async ({ id: companyId }) => {
      await queryClient.cancelQueries({ queryKey: ["profileStats", userId] });
      await queryClient.cancelQueries({ queryKey: ["following", userId] });

      const previousStats = queryClient.getQueryData(["profileStats", userId]);
      const previousFollowing = queryClient.getQueryData(["following", userId, search]);

      if (activeTab === "following") {
        if (isOwnProfile) {
          queryClient.setQueryData(["following", userId, search], (old: any[]) =>
            old?.filter((u) => u.user_id !== companyId && u.id !== companyId)
          );
        } else {
          queryClient.setQueryData(["following", userId, search], (old: any[]) =>
            old?.map((u) =>
              (u.user_id === companyId || u.id === companyId)
                ? { ...u, is_following: false }
                : u
            )
          );
        }
      }

      syncFollowStatus(companyId, false);

      return { previousStats, previousFollowing };
    },
    onSuccess: (_, variables) => {
      toast.success(variables.name ? `Unfollowed ${variables.name}` : "Unfollowed user");
    },
    onError: (err, { id: companyId }, context: any) => {
      if (context) {
        queryClient.setQueryData(["profileStats", userId], context.previousStats);
        queryClient.setQueryData(["following", userId, search], context.previousFollowing);
      }
      syncFollowStatus(companyId, true);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["following", userId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats", userId] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const removeConnectionMutation = useMutation({
    mutationFn: (data: { id: string; type?: string }) => {
      if (data.type === "company") {
        return companyService.removeConnection(data.id, userId);
      }
      return removeConnection(data.id);
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["profileStats", userId] });
      await queryClient.cancelQueries({ queryKey: ["connections", userId] });
      await queryClient.cancelQueries({ queryKey: ["followers", userId] });
      await queryClient.cancelQueries({ queryKey: ["following", userId] });

      const previousStats = queryClient.getQueryData(["profileStats", userId]);
      const previousConnections = queryClient.getQueryData(["connections", userId, search]);
      const previousFollowers = queryClient.getQueryData(["followers", userId, search]);
      const previousFollowing = queryClient.getQueryData(["following", userId, search]);

      const filterFn = (old: any[]) =>
        old?.filter((u) => (u.user_id || u.follower_id || u.following_id || u.id) !== data.id);

      queryClient.setQueryData(["connections", userId, search], filterFn);
      queryClient.setQueryData(["followers", userId, search], filterFn);
      queryClient.setQueryData(["following", userId, search], filterFn);

      return { previousStats, previousConnections, previousFollowers, previousFollowing };
    },
    onSuccess: () => {
      toast.success("Connection removed");
    },
    onError: (err, data, context: any) => {
      if (context) {
        queryClient.setQueryData(["profileStats", userId], context.previousStats);
        queryClient.setQueryData(["connections", userId, search], context.previousConnections);
        queryClient.setQueryData(["followers", userId, search], context.previousFollowers);
        queryClient.setQueryData(["following", userId, search], context.previousFollowing);
      }
    },
    onSettled: (data, err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["connections", userId] });
      queryClient.invalidateQueries({ queryKey: ["following", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats", userId] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["relationshipStatus"] });
      syncFollowStatus(variables.id, false);
    },
  });

  const connectMutation = useMutation({
    mutationFn: (targetId: string) => sendConnectionRequest(targetId),
    onMutate: async (targetId) => {
      await queryClient.cancelQueries({ queryKey: ["connections", userId] });
      await queryClient.cancelQueries({ queryKey: ["followers", userId] });
      await queryClient.cancelQueries({ queryKey: ["following", userId] });

      const updateList = (old: any[]) =>
        old?.map((u: any) =>
          (u.user_id === targetId || u.follower_id === targetId || u.following_id === targetId || u.id === targetId)
            ? { ...u, is_pending: true, connection_status: "pending_sent" }
            : u
        );

      queryClient.setQueryData(["connections", userId, search], updateList);
      queryClient.setQueryData(["followers", userId, search], updateList);
      queryClient.setQueryData(["following", userId, search], updateList);
    },
    onSuccess: () => {
      toast.success("Connection request sent!");
    },
    onError: (err: any, targetId: string) => {
      setPendingConnectUserIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      const msg = err?.response?.data?.message || "Failed to send connection request";
      toast.error(msg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["connections", userId] });
      queryClient.invalidateQueries({ queryKey: ["following", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["relationshipStatus"] });
    },
  });

  const handleConnect = (id: string) => {
    if (isCompanyActor) return;
    setPendingConnectUserIds((prev) => new Set(prev).add(id));
    connectMutation.mutate(id);
  };

  const handleFollow = (id: string, name?: string) => {
    if (isCompanyActor && !canFollow) {
      toast.error(noFollowMessage);
      return;
    }
    followMutation.mutate({ id, name });
  };

  const handleUnfollow = (id: string, name: string, type?: string) => {
    if (isCompanyActor && !canFollow) {
      toast.error(noFollowMessage);
      return;
    }
    setConfirmAction({
      type: "unfollow",
      userId: id,
      userName: name,
      userType: type,
    });
  };

  const handleRemoveConnection = (id: string, name: string, type?: string) => {
    setConfirmAction({
      type: "remove_connection",
      userId: id,
      userName: name,
      userType: type,
    });
  };

  const handleMessageUser = async (targetId: string) => {
    try {
      if (startChat) {
        await startChat(targetId);
      }
      router.push(`/messaging?userId=${targetId}`);
      onClose();
    } catch {
      router.push(`/messaging?userId=${targetId}`);
      onClose();
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, userId: targetId, userType, userName } = confirmAction;

    try {
      if (type === "unfollow") {
        if (userType === "company") {
          await unfollowCompanyMutation.mutateAsync({ id: targetId, name: userName });
        } else {
          await unfollowMutation.mutateAsync({ id: targetId, name: userName });
        }
      } else if (type === "remove_connection") {
        await removeConnectionMutation.mutateAsync({ id: targetId, type: userType });
      }
    } catch (err) {
      // Error handled by mutation onError
    } finally {
      setConfirmAction(null);
    }
  };

  // Private empty state texts
  const privateStateInfo = useMemo(() => {
    switch (activeTab) {
      case "following":
        return {
          title: "Following is private",
          description: userName
            ? `${userName}${userName.endsWith('s') || userName.endsWith('S') ? "'" : "'s"} following list is private`
            : "This person has chosen to keep their following list private",
        };
      case "followers":
        return {
          title: "Followers are private",
          description: userName
            ? `${userName}${userName.endsWith('s') || userName.endsWith('S') ? "'" : "'s"} followers are private`
            : "This person has chosen to keep their followers private",
        };
      case "connections":
      default:
        return {
          title: "Connections are private",
          description: userName
            ? `${userName}${userName.endsWith('s') || userName.endsWith('S') ? "'" : "'s"} connections are private`
            : "This person has chosen to keep their connections private",
        };
    }
  }, [activeTab, userName]);

  const renderAction = (user: any, id: string, name: string) => {
    if (activeTab === "following") {
      if (!isOwnProfile) {
        // Public profile view: action reflects the logged-in user's relationship to this user
        if (id?.toString() === currentActorId) {
          return null; // Cannot follow yourself / current actor
        }

        const isUserFollowed = isFollowing(id) || Boolean(user.is_following);

        if (isUserFollowed) {
          if (isCompanyActor && !canFollow) {
            return (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-not-allowed">
                      <button
                        type="button"
                        disabled
                        className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-accent)] flex-none pointer-events-none whitespace-nowrap"
                      >
                        Unfollow
                      </button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" className="text-xs font-['DM_Sans']">
                    {noFollowMessage}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return (
            <button
              type="button"
              onClick={() => handleUnfollow(id, name, user.type)}
              className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-accent)] flex-none hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
            >
              Unfollow
            </button>
          );
        }

        if (isCompanyActor && !canFollow) {
          return (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-not-allowed">
                    <button
                      type="button"
                      disabled
                      className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-accent)] flex-none pointer-events-none whitespace-nowrap"
                    >
                      Follow
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="end" className="text-xs font-['DM_Sans']">
                  {noFollowMessage}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return (
          <button
            type="button"
            onClick={() => handleFollow(id, name)}
            className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-accent)] flex-none hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
          >
            Follow
          </button>
        );
      }

      // Own profile: everyone in following tab is followed by you
      if (isCompanyActor && !canFollow) {
        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-not-allowed">
                  <button
                    type="button"
                    disabled
                    className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-accent)] flex-none pointer-events-none whitespace-nowrap"
                  >
                    Unfollow
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="end" className="text-xs font-['DM_Sans']">
                {noFollowMessage}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return (
        <button
          type="button"
          onClick={() => handleUnfollow(id, name, user.type)}
          className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-accent)] flex-none hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
        >
          Unfollow
        </button>
      );
    }

    if (activeTab === "followers") {
      if (id?.toString() === currentActorId) {
        return null; // Cannot follow yourself / current actor
      }

      const isConnected = !!(user.is_connected || user.connection_status === "connected" || user.is_connection);
      const isUserFollowed = isFollowing(id) || !!(user.is_following_back || user.is_following);

      if (isConnected) {
        return (
          <button
            type="button"
            onClick={() => handleMessageUser(id)}
            className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-text-primary)] flex-none hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
          >
            Message
          </button>
        );
      }

      if (!isUserFollowed) {
        if (isCompanyActor && !canFollow) {
          return (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-not-allowed">
                    <button
                      type="button"
                      disabled
                      className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-accent)] flex-none pointer-events-none whitespace-nowrap"
                    >
                      Follow
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="end" className="text-xs font-['DM_Sans']">
                  {noFollowMessage}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return (
          <button
            type="button"
            onClick={() => handleFollow(id, name)}
            className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-accent)] flex-none hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
          >
            Follow
          </button>
        );
      }

      return (
        <button
          type="button"
          onClick={() => handleMessageUser(id)}
          className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-text-primary)] flex-none hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
        >
          Message
        </button>
      );
    }

    if (activeTab === "connections") {
      if (isOwnProfile) {
        return (
          <button
            type="button"
            onClick={() => handleRemoveConnection(id, name, user.type)}
            className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-accent)] flex-none hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
          >
            Remove connection
          </button>
        );
      }

      if (id?.toString() === currentActorId) {
        return null; // Cannot connect with yourself
      }

      if (isCompanyActor) {
        return null; // Business accounts do not have connections and cannot connect with users
      }

      const isConnected = !!(user.is_connected || user.connection_status === "connected" || user.is_connection);
      const isPending = pendingConnectUserIds.has(id) || user.connection_status === "pending_sent" || user.connection_status === "pending" || user.is_pending;

      if (isConnected) {
        return (
          <button
            type="button"
            onClick={() => handleMessageUser(id)}
            className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-text-primary)] flex-none hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
          >
            Message
          </button>
        );
      }

      if (isPending) {
        return (
          <span className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-text-muted)] flex-none cursor-default whitespace-nowrap">
            Pending
          </span>
        );
      }

      return (
        <button
          type="button"
          onClick={() => handleConnect(id)}
          className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-accent)] flex-none hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
        >
          Connect
        </button>
      );
    }

    return null;
  };

  const currentUsers = useMemo(() => {
    if (activeTab === "following") return following || [];
    if (activeTab === "followers") return followers || [];
    if (activeTab === "connections") return connections || [];
    return [];
  }, [activeTab, following, followers, connections]);

  const isLoadingCurrentTab =
    (activeTab === "following" && isLoadingFollowing) ||
    (activeTab === "followers" && isLoadingFollowers) ||
    (activeTab === "connections" && isLoadingConnections);

  const emptyStateConfig = useMemo(() => {
    const name = isOwnProfile ? "You" : (userName || "This user");
    const doesnt = isOwnProfile ? "don't" : "doesn't";
    if (activeTab === "following") {
      return {
        title: "Not Following Yet",
        description: `${name} ${isOwnProfile ? "aren't" : "isn't"} following anyone yet.`,
        Icon: EmptyFollowIcon,
      };
    }
    if (activeTab === "followers") {
      return {
        title: "No Followers Yet",
        description: `${name} ${doesnt} have any followers yet.`,
        Icon: EmptyFollowIcon,
      };
    }
    return {
      title: "No Connections Yet",
      description: `${name} ${doesnt} have any connections yet.`,
      Icon: EmptyConnectionIcon,
    };
  }, [activeTab, isOwnProfile, userName]);

  return (
    <>
      <Dialog open={isOpen && !confirmAction} onOpenChange={(open) => { if (!open) return; }}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          className="w-full h-full sm:w-[400px] sm:max-w-[400px] sm:h-[434px] sm:max-h-[434px] p-4 sm:p-3 bg-[var(--ds-bg)] border-0 sm:border border-[var(--ds-border)] rounded-none sm:rounded-[16px] overflow-hidden shadow-2xl gap-0 outline-none [&>button:last-child]:hidden select-text flex flex-col justify-start"
        >
          {/* Row 1: Close button (right-aligned, 20px height) */}
          <div className="w-full flex flex-row justify-end items-center h-5 gap-[10px]">
            <button
              type="button"
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer"
              title="Close"
            >
              <CloseCrossIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
            </button>
          </div>

          {/* Row 2: Title */}
          <DialogTitle className="w-full text-center font-['DM_Sans'] text-base font-medium text-[var(--ds-text-primary)] mt-3">
            People
          </DialogTitle>

          {/* Row 3: Tabs */}
          <div className="w-full flex flex-row mt-3">
            {(["following", "followers", "connections"] as const).map((tabKey) => {
              const isActive = activeTab === tabKey;
              const label =
                tabKey === "following"
                  ? "Following"
                  : tabKey === "followers"
                    ? "Followers"
                    : "Connection";

              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => {
                    setActiveTab(tabKey);
                    setSearch("");
                  }}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center h-[36px] px-0 py-0 border-b-[1.5px] transition-all cursor-pointer focus:outline-none font-['DM_Sans'] text-base font-medium leading-6",
                    isActive
                      ? "border-b-[var(--ds-accent)] text-[var(--ds-text-primary)]"
                      : "border-b-transparent text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          {isCurrentTabPrivate ? (
            /* Private Profile State */
            <div className="w-full flex-1 px-2 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[var(--ds-surface-1)] p-3 flex items-center justify-center text-[var(--ds-text-muted)] shrink-0">
                <LockPrivateIcon className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0" />
              </div>
              <div className="flex flex-col items-center gap-1.5 w-full">
                <h4 className="text-[var(--ds-text-primary)] text-base font-normal font-['DM_Sans'] leading-6 text-center">
                  {privateStateInfo.title}
                </h4>
                <p className="text-[var(--ds-text-secondary)] text-xs font-normal font-['DM_Sans'] leading-4 text-center whitespace-nowrap">
                  {privateStateInfo.description}
                </p>
              </div>
            </div>
          ) : isLoadingCurrentTab && !search ? (
            /* Loading indicator when switching tabs */
            <div className="w-full flex-1 flex justify-center items-center">
              <div className="w-6 h-6 rounded-full border-2 border-[var(--ds-accent)] border-t-transparent animate-spin" />
            </div>
          ) : !search && currentUsers.length === 0 ? (
            /* Pixel-perfect Empty State */
            <div className="w-full flex-1 flex flex-col justify-center items-center p-0 gap-3 self-stretch">
              {/* IconFrame: 56x56 Circle */}
              <div className="w-14 h-14 rounded-full bg-[var(--ds-surface-1)] p-3 flex items-center justify-center flex-none">
                <emptyStateConfig.Icon className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0" fill="currentColor" />
              </div>

              {/* Text Box (48px height) */}
              <div className="flex flex-col items-center p-0 gap-2 w-full max-w-[205px] h-12 flex-none">
                <h4 className="font-['DM_Sans'] text-base font-normal leading-6 text-[var(--ds-text-primary)] text-center whitespace-nowrap">
                  {emptyStateConfig.title}
                </h4>
                <p className="font-['DM_Sans'] text-xs font-normal leading-4 text-[var(--ds-text-secondary)] text-center whitespace-nowrap">
                  {emptyStateConfig.description}
                </p>
              </div>
            </div>
          ) : (
            /* Public / Accessible State with Search & User List */
            <div className="w-full flex-1 flex flex-col self-stretch overflow-hidden">
              {/* Search Bar */}
              <div className="w-full h-9 flex flex-row justify-between items-center py-2 px-0 gap-1 border-b border-[var(--ds-text-primary)] self-stretch mt-3">
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] outline-none border-none flex-1 pr-2"
                />
                <SearchIcon className="w-4 h-4 text-[var(--ds-text-primary)] shrink-0 flex-none order-1" />
              </div>

              {/* User List */}
              <div className="w-full flex-1 flex flex-col gap-3 mt-3 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-2 self-stretch">
                {isLoadingCurrentTab ? (
                  <div className="w-full py-8 flex justify-center items-center">
                    <div className="w-6 h-6 rounded-full border-2 border-[var(--ds-accent)] border-t-transparent animate-spin" />
                  </div>
                ) : currentUsers.length === 0 ? (
                  <div className="w-full py-8 text-center text-xs font-normal font-['DM_Sans'] text-[var(--ds-text-muted)]">
                    No results found
                  </div>
                ) : (
                  currentUsers.map((user: any) => {
                    const id = user.user_id || user.follower_id || user.following_id || user.id;
                    const name = user.full_name || user.name || "User";
                    const avatar = user.avatar_url || user.avatar;
                    const isCompany = user.type === "company" || user.type === "COMPANY" || user.account_type === "company" || user.account_type === "COMPANY" || Boolean(user.org_id);
                    const linkHref = isCompany
                      ? `/organization/${user.slug}`
                      : `/profile/${user.account_name || id}`;

                    return (
                      <div
                        key={`${user.type || "user"}-${id}`}
                        className="w-full h-9 flex flex-row justify-between items-center p-0 gap-2 flex-none self-stretch"
                      >
                        {/* Avatar & Name Box */}
                        <Link
                          href={linkHref}
                          onClick={onClose}
                          className="flex flex-row items-center p-0 gap-2 h-5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                        >
                          <div className={`w-5 h-5 ${isCompany ? 'rounded-[4px]' : 'rounded-full'} overflow-hidden bg-[var(--ds-surface-1)] flex items-center justify-center shrink-0`}>
                            {avatar ? (
                              <img src={avatar} alt={name} className={`w-full h-full object-cover ${isCompany ? 'rounded-[4px]' : 'rounded-full'}`} />
                            ) : isCompany ? (
                              <BusinessBuildingIcon className="w-full h-full text-[var(--ds-text-secondary)]" />
                            ) : (
                              <UserIcon className="w-full h-full text-[var(--ds-text-secondary)]" />
                            )}
                          </div>
                          <span className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-[var(--ds-text-primary)] max-w-[50%] truncate">
                            {name}
                          </span>
                        </Link>

                        {/* Right-side Action */}
                        <div className="shrink-0 flex items-center flex-none order-1">
                          {renderAction(user, id, name)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      {confirmAction && (
        <ActionConfirmModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={executeConfirmedAction}
          type={
            confirmAction.type === "unfollow"
              ? "unfollow"
              : confirmAction.type === "remove_connection"
                ? "remove_connection"
                : "custom"
          }
          targetName={confirmAction.userName}
          title={
            confirmAction.type === "remove_follower"
              ? "Remove follower?"
              : undefined
          }
          description={
            confirmAction.type === "remove_follower"
              ? "You’ll no longer have them in your followers list"
              : undefined
          }
          confirmText={
            confirmAction.type === "remove_follower"
              ? "Remove"
              : undefined
          }
          isLoading={
            unfollowMutation.isPending ||
            unfollowCompanyMutation.isPending ||
            removeConnectionMutation.isPending
          }
        />
      )}
    </>
  );
};

export default FollowListModal;
