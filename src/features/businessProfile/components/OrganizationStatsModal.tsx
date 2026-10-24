"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useSocial } from "@/context/SocialContext";
import {
  CloseCrossIcon,
  SearchIcon,
  EmptyFollowIcon,
  UserIcon,
  BusinessBuildingIcon,
  LockPrivateIcon,
} from "@/components/icons";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";
import { cn } from "@/lib/utils";
import { businessProfileService } from "../services/businessProfile.service";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useCompanyFollowPermission } from "@/hooks/useCompanyFollowPermission";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface OrganizationStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "followers" | "following" | "subscribers";
  orgId: string;
  isOwnProfile?: boolean;
  showFollowersList?: boolean;
  showFollowingList?: boolean;
}

export const OrganizationStatsModal: React.FC<OrganizationStatsModalProps> = ({
  isOpen,
  onClose,
  initialTab = "followers",
  orgId,
  isOwnProfile = false,
  showFollowersList = true,
  showFollowingList = true,
}) => {
  const router = useRouter();
  const normalizedInitialTab = initialTab === "following" ? "following" : "followers";
  const [activeTab, setActiveTab] = useState<"following" | "followers">(normalizedInitialTab);
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "unfollow";
    id: string;
    name: string;
    entityType?: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { isFollowing, startChat, syncFollowStatus, notifyFollowEvent, followUser, unfollowUser } = useSocial();
  const { activeProfile, isCompany } = useActiveProfile();
  const { isCompanyActor, canFollow, message: noFollowMessage } = useCompanyFollowPermission();
  const actingOrgId = (isCompanyActor && activeProfile?.id) ? activeProfile.id : orgId;
  const loggedInUserId = currentUser?.id?.toString();

  const [optimisticFollows, setOptimisticFollows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab === "following" ? "following" : "followers");
      setSearch("");
      setOptimisticFollows({});
    }
  }, [isOpen, initialTab]);

  // Query: Followers
  const {
    data: followers,
    isLoading: isLoadingFollowers,
  } = useQuery({
    queryKey: ["org_followers", orgId, search],
    queryFn: () => businessProfileService.getOrganizationFollowers(orgId, { search }),
    enabled: isOpen && activeTab === "followers",
    retry: false,
  });

  // Query: Following
  const {
    data: following,
    isLoading: isLoadingFollowing,
  } = useQuery({
    queryKey: ["org_following", orgId, search],
    queryFn: () => businessProfileService.getOrganizationFollowing(orgId, { search }),
    enabled: isOpen && activeTab === "following",
    retry: false,
  });

  const unfollowMutation = useMutation({
    mutationFn: async (data: { type: string; targetId: string }) => {
      setOptimisticFollows((prev) => ({ ...prev, [data.targetId]: false }));
      syncFollowStatus(data.targetId, false);
      notifyFollowEvent(data.targetId, false);
      if (isCompanyActor && actingOrgId) {
        return data.type === "company"
          ? businessProfileService.organizationUnfollowOrganization(actingOrgId, data.targetId)
          : businessProfileService.organizationUnfollowUser(actingOrgId, data.targetId);
      } else {
        return data.type === "company"
          ? businessProfileService.unfollowOrganization(data.targetId)
          : await unfollowUser(data.targetId);
      }
    },
    onError: (err, data) => {
      setOptimisticFollows((prev) => ({ ...prev, [data.targetId]: true }));
      syncFollowStatus(data.targetId, true);
      notifyFollowEvent(data.targetId, true);
      toast.error("Failed to unfollow");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["org_following", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org_followers", orgId] });
      if (actingOrgId !== orgId) {
        queryClient.invalidateQueries({ queryKey: ["org_following", actingOrgId] });
      }
      queryClient.invalidateQueries({ queryKey: ["orgPeople", orgId] });
    },
    onSuccess: () => {
      toast.success("Unfollowed successfully");
    },
  });

  const followMutation = useMutation({
    mutationFn: async (data: { type: string; targetId: string }) => {
      setOptimisticFollows((prev) => ({ ...prev, [data.targetId]: true }));
      syncFollowStatus(data.targetId, true);
      notifyFollowEvent(data.targetId, true);
      if (isCompanyActor && actingOrgId) {
        return data.type === "company"
          ? businessProfileService.organizationFollowOrganization(actingOrgId, data.targetId)
          : businessProfileService.organizationFollowUser(actingOrgId, data.targetId);
      } else {
        return data.type === "company"
          ? businessProfileService.followOrganization(data.targetId)
          : await followUser(data.targetId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org_followers", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org_following", orgId] });
      if (actingOrgId !== orgId) {
        queryClient.invalidateQueries({ queryKey: ["org_following", actingOrgId] });
      }
      queryClient.invalidateQueries({ queryKey: ["orgPeople", orgId] });
      toast.success("Followed successfully");
    },
    onError: (err, data) => {
      setOptimisticFollows((prev) => ({ ...prev, [data.targetId]: false }));
      syncFollowStatus(data.targetId, false);
      notifyFollowEvent(data.targetId, false);
      toast.error("Failed to follow");
    },
  });

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === "unfollow") {
        if (isCompanyActor && !canFollow) {
          toast.error(noFollowMessage);
          return;
        }
        await unfollowMutation.mutateAsync({
          type: confirmAction.entityType || "user",
          targetId: confirmAction.id,
        });
      }
    } finally {
      setConfirmAction(null);
    }
  };

  const handleMessage = async (targetId: string) => {
    try {
      if (startChat) {
        await startChat(targetId, orgId);
      }
      router.push(`/messaging?companyId=${orgId}&userId=${targetId}`);
      onClose();
    } catch {
      router.push(`/messaging?companyId=${orgId}&userId=${targetId}`);
      onClose();
    }
  };

  const currentUsers = useMemo(() => {
    if (activeTab === "following") return following || [];
    if (activeTab === "followers") return followers || [];
    return [];
  }, [activeTab, following, followers]);

  const isLoadingCurrentTab =
    (activeTab === "following" && isLoadingFollowing) ||
    (activeTab === "followers" && isLoadingFollowers);

  const isRestricted =
    !isOwnProfile &&
    ((activeTab === "followers" && (showFollowersList === false || (followers as any)?.is_restricted)) ||
      (activeTab === "following" && (showFollowingList === false || (following as any)?.is_restricted)));

  const renderAction = (item: any, id: string, name: string) => {
    const currentActorId = (isCompanyActor && activeProfile?.id ? activeProfile.id : loggedInUserId)?.toString();
    if (id?.toString() === currentActorId) {
      return null;
    }

    const isTargetFollowed =
      id in optimisticFollows
        ? optimisticFollows[id]
        : activeTab === "following" && isOwnProfile
        ? true
        : Boolean(
            isFollowing(id) ||
            item.is_following ||
            (isOwnProfile && (item.isFollowedBack || item.is_following_back))
          );

    if (isTargetFollowed) {
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
          onClick={() =>
            setConfirmAction({
              type: "unfollow",
              id,
              name,
              entityType: item.type,
            })
          }
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
        onClick={() => followMutation.mutate({ type: item.type || "user", targetId: id })}
        disabled={followMutation.isPending}
        className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-medium text-center text-[var(--ds-accent)] flex-none hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap disabled:opacity-50"
      >
        Follow
      </button>
    );
  };

  return (
    <>
      <Dialog open={isOpen && !confirmAction} onOpenChange={(open) => { if (!open) onClose(); }}>
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
            {(["followers", "following"] as const).map((tabKey) => {
              const isActive = activeTab === tabKey;
              const label = tabKey === "followers" ? "Followers" : "Following";

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
          {isRestricted ? (
            <div className="w-full flex-1 flex flex-col justify-center items-center p-0 gap-3 self-stretch">
              {/* IconFrame: 56x56 Circle */}
              <div className="w-14 h-14 rounded-full bg-[var(--ds-surface-1)] p-3 flex items-center justify-center flex-none">
                <LockPrivateIcon className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0" fill="currentColor" />
              </div>

              {/* Text Box (48px height) */}
              <div className="flex flex-col items-center p-0 gap-2 w-full max-w-[307px] flex-none">
                <h4 className="font-['DM_Sans'] text-base font-normal leading-6 text-[var(--ds-text-primary)] text-center whitespace-nowrap">
                  {activeTab === "following" ? "Following is private" : "Followers are private"}
                </h4>
                <p className="font-['DM_Sans'] text-xs font-normal leading-4 text-[var(--ds-text-primary)] text-center whitespace-nowrap">
                  {activeTab === "following"
                    ? "This page has chosen to keep their following list private"
                    : "This page has chosen to keep their followers private"}
                </p>
              </div>
            </div>
          ) : isLoadingCurrentTab && !search ? (
            <div className="w-full flex-1 flex justify-center items-center">
              <div className="w-6 h-6 rounded-full border-2 border-[var(--ds-accent)] border-t-transparent animate-spin" />
            </div>
          ) : !search && currentUsers.length === 0 ? (
            <div className="w-full flex-1 flex flex-col justify-center items-center p-0 gap-3 self-stretch">
              <div className="w-14 h-14 rounded-full bg-[var(--ds-surface-1)] p-3 flex items-center justify-center flex-none">
                <EmptyFollowIcon className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0" fill="currentColor" />
              </div>
              <div className="flex flex-col items-center p-0 gap-2 w-full max-w-[220px] h-12 flex-none">
                <h4 className="font-['DM_Sans'] text-base font-normal leading-6 text-[var(--ds-text-primary)] text-center whitespace-nowrap">
                  {activeTab === "following" ? "Not Following Yet" : "No Followers Yet"}
                </h4>
                <p className="font-['DM_Sans'] text-xs font-normal leading-4 text-[var(--ds-text-secondary)] text-center whitespace-nowrap">
                  {activeTab === "following"
                    ? isOwnProfile
                      ? "You aren't following anyone yet."
                      : "This organization isn't following anyone yet."
                    : isOwnProfile
                    ? "You don't have any followers yet."
                    : "This organization doesn't have any followers yet."}
                </p>
              </div>
            </div>
          ) : (
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
                  currentUsers.map((item: any) => {
                    const id = item.id || item.user_id || item.follower_id || item.following_id;
                    const name = item.name || item.full_name || "User";
                    const avatar = item.avatarUrl || item.avatar || item.avatar_url;
                    const isCompany = item.type === "company" || item.type === "COMPANY" || item.account_type === "company" || item.account_type === "COMPANY" || Boolean(item.org_id);
                    const linkHref = isCompany
                      ? `/organization/${item.slug || id}`
                      : `/profile/${item.account_name || id}`;

                    return (
                      <div
                        key={`${item.type || "user"}-${id}`}
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
                          <span className="h-5 font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-[var(--ds-text-primary)] max-w-[60%] truncate">
                            {name}
                          </span>
                        </Link>

                        {/* Right-side Action */}
                        <div className="shrink-0 flex items-center flex-none order-1">
                          {renderAction(item, id, name)}
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
          type="unfollow"
          targetName={confirmAction.name}
          title="Unfollow this account?"
          description="You’ll no longer see their updates in your following feed"
          confirmText="Unfollow"
          isLoading={unfollowMutation.isPending}
        />
      )}
    </>
  );
};
