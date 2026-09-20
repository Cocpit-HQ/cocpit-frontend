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
} from "../services/profile.service";
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
} from "@/components/icons";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";
import { cn } from "@/lib/utils";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "followers" | "following" | "connections";
  userId: string;
  userName?: string;
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
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"following" | "followers" | "connections">(initialTab);
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { isFollowing, syncFollowStatus, startChat } = useSocial();
  const { activeProfile } = useActiveProfile();

  const loggedInUserId = currentUser?.id?.toString();
  const isOwnProfile = activeProfile?.type === "USER" && (loggedInUserId === userId?.toString() || (currentUser as any)?.username === userId);

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
    mutationFn: followUser,
    onMutate: async (newUserId) => {
      await queryClient.cancelQueries({ queryKey: ["profileStats", userId] });
      await queryClient.cancelQueries({ queryKey: ["followers", userId] });
      await queryClient.cancelQueries({ queryKey: ["following", userId] });

      const previousStats = queryClient.getQueryData(["profileStats", userId]);
      const previousFollowing = queryClient.getQueryData(["following", userId, search]);
      const previousFollowers = queryClient.getQueryData(["followers", userId, search]);

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

      return { previousStats, previousFollowing, previousFollowers };
    },
    onError: (err, newUserId, context: any) => {
      syncFollowStatus(newUserId, false);
      if (context) {
        queryClient.setQueryData(["profileStats", userId], context.previousStats);
        queryClient.setQueryData(["following", userId, search], context.previousFollowing);
        queryClient.setQueryData(["followers", userId, search], context.previousFollowers);
      }
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["following", userId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: unfollowUser,
    onMutate: async (targetId) => {
      await queryClient.cancelQueries({ queryKey: ["profileStats", userId] });
      await queryClient.cancelQueries({ queryKey: ["following", userId] });
      await queryClient.cancelQueries({ queryKey: ["followers", userId] });

      const previousStats = queryClient.getQueryData(["profileStats", userId]);
      const previousFollowing = queryClient.getQueryData(["following", userId, search]);
      const previousFollowers = queryClient.getQueryData(["followers", userId, search]);

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

      syncFollowStatus(targetId, false);

      return { previousStats, previousFollowing, previousFollowers };
    },
    onError: (err, targetId, context: any) => {
      syncFollowStatus(targetId, true);
      if (context) {
        queryClient.setQueryData(["profileStats", userId], context.previousStats);
        queryClient.setQueryData(["following", userId, search], context.previousFollowing);
        queryClient.setQueryData(["followers", userId, search], context.previousFollowers);
      }
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["following", userId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["relationshipStatus", userId] });
    },
  });

  const unfollowCompanyMutation = useMutation({
    mutationFn: (companyId: string) => companyService.unfollowCompany(companyId),
    onMutate: async (companyId) => {
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
    onError: (err, companyId, context: any) => {
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

      const previousStats = queryClient.getQueryData(["profileStats", userId]);
      const previousConnections = queryClient.getQueryData(["connections", userId, search]);

      queryClient.setQueryData(["connections", userId, search], (old: any[]) =>
        old?.filter((u) => (u.user_id || u.follower_id || u.following_id || u.id) !== data.id)
      );

      return { previousStats, previousConnections };
    },
    onError: (err, data, context: any) => {
      if (context) {
        queryClient.setQueryData(["profileStats", userId], context.previousStats);
        queryClient.setQueryData(["connections", userId, search], context.previousConnections);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["connections", userId] });
      queryClient.invalidateQueries({ queryKey: ["following", userId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats", userId] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["relationshipStatus", userId] });
    },
  });

  const handleFollow = (id: string) => {
    followMutation.mutate(id);
  };

  const handleUnfollow = (id: string, name: string, type?: string) => {
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
    const { type, userId: targetId, userType } = confirmAction;

    try {
      if (type === "unfollow") {
        if (userType === "company") {
          await unfollowCompanyMutation.mutateAsync(targetId);
        } else {
          await unfollowMutation.mutateAsync(targetId);
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
        if (id === loggedInUserId) {
          return null; // Cannot follow yourself
        }

        const isUserFollowed = isFollowing(id) || Boolean(user.is_following);

        if (isUserFollowed) {
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

        return (
          <button
            type="button"
            onClick={() => handleFollow(id)}
            className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-accent)] flex-none hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
          >
            Follow
          </button>
        );
      }

      // Own profile: everyone in following tab is followed by you
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
      if (id === loggedInUserId) {
        return null; // Cannot follow yourself
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
        return (
          <button
            type="button"
            onClick={() => handleFollow(id)}
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
    if (activeTab === "following") {
      return {
        title: "Not Following Yet",
        description: "This profile isn't following anyone yet.",
        Icon: EmptyFollowIcon,
      };
    }
    if (activeTab === "followers") {
      return {
        title: "No Followers Yet",
        description: "This profile doesn't have any followers yet.",
        Icon: EmptyFollowIcon,
      };
    }
    return {
      title: "No Connections Yet",
      description: "This profile doesn't have any connections yet.",
      Icon: EmptyConnectionIcon,
    };
  }, [activeTab]);

  return (
    <>
      <Dialog open={isOpen && !confirmAction} onOpenChange={(open) => { if (!open) return; }}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="w-full h-full sm:h-auto sm:max-w-[384px] max-h-[100dvh] sm:max-h-[640px] px-4 pb-4 pt-8 sm:px-3 sm:pb-3 sm:pt-8 bg-[var(--ds-bg)] border-0 sm:border border-[var(--ds-border)] rounded-none sm:rounded-[16px] overflow-hidden shadow-2xl gap-0 outline-none [&>button:last-child]:hidden select-text flex flex-col justify-start"
      >
        {/* Top Close Row & Title */}
        <div className="w-full flex justify-between items-center h-5 relative">
          <DialogTitle className="absolute left-1/2 -translate-x-1/2 font-['DM_Sans'] text-base font-medium text-[var(--ds-text-primary)]">
            People
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex-none ml-auto"
            title="Close"
          >
            <CloseCrossIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
          </button>
        </div>

        {/* Tabs: Following, Followers, Connection */}
        <div className="w-full grid grid-cols-3 border-b border-[var(--ds-border)] mt-3">
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
                  "pb-2.5 flex justify-center items-center text-center font-['DM_Sans'] text-base font-medium leading-6 transition-all relative cursor-pointer",
                  isActive
                    ? "text-[var(--ds-text-primary)]"
                    : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                )}
              >
                <div className="relative">
                  {label}
                  {isActive && (
                    <div className="absolute -bottom-2.5 left-0 right-0 h-[1.5px] bg-[var(--ds-accent)]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        {isCurrentTabPrivate ? (
          /* Private Profile State */
          <div className="w-full py-12 px-2 flex flex-col items-center justify-center text-center gap-4">
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
          <div className="w-full h-[304px] flex justify-center items-center">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--ds-accent)] border-t-transparent animate-spin" />
          </div>
        ) : !search && currentUsers.length === 0 ? (
          /* Frame 2609691: Pixel-perfect Empty State */
          <div className="w-full h-[304px] flex flex-col justify-center items-center p-0 gap-3 self-stretch flex-none">
            {/* IconFrame: 56x56 Circle */}
            <div className="w-14 h-14 rounded-full bg-[var(--ds-surface-1)] p-3 flex items-center justify-center flex-none">
              <emptyStateConfig.Icon className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0" fill="currentColor" />
            </div>

            {/* Frame 2609596: Text Box (48px height) */}
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
            {/* Component 10: Search Bar */}
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

            {/* User List: Frame 2609539 with 12px gap between items and 12px margin below search */}
            <div className="w-full flex-1 sm:flex-none flex flex-col gap-3 mt-3 sm:max-h-[300px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-2 self-stretch">
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
                  const isCompany = user.type === "company";
                  const linkHref = isCompany
                    ? `/organization/${user.slug}`
                    : `/profile/${user.account_name || id}`;

                  return (
                    /* Frame 2609539 */
                    <div
                      key={`${user.type || "user"}-${id}`}
                      className="w-full h-9 flex flex-row justify-between items-center p-0 gap-2 flex-none self-stretch"
                    >
                      {/* Frame 2609542: Avatar & Name Box */}
                      <Link
                        href={linkHref}
                        onClick={onClose}
                        className="flex flex-row items-center p-0 gap-2 h-5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                      >
                        {/* Rectangle 31: Avatar 20x20 */}
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-[var(--ds-surface-1)] flex items-center justify-center shrink-0">
                          {avatar ? (
                            <img src={avatar} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-full h-full text-[var(--ds-text-secondary)]" />
                          )}
                        </div>
                        {/* Name Text: 14px / 20px Regular */}
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
