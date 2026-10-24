/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { BusinessProfileData } from "../types/business-profile.types";
import { businessProfileService } from "../services/businessProfile.service";
import { OrganizationStatsModal } from "./OrganizationStatsModal";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useSocial } from "@/context/SocialContext";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReportModal } from "@/components/shared/ReportModal";
import { BusinessBuildingIcon, VerifyIcon } from "@/components/icons";
import { ViewMediaModal } from "@/features/profile/commonProfileComponents/ViewMediaModal";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";
import { MobileBusinessProfileMenuDrawer } from "./drawers/MobileBusinessProfileMenuDrawer";
import { useOrgBlockPermissions } from "@/hooks/useOrgBlockPermissions";
import { cn } from "@/lib/utils";

interface BusinessProfileHeaderProps {
  data: BusinessProfileData;
  isOwnProfile?: boolean;
  canManageCompany?: boolean;
  logoUrl?: string;
  coverUrl?: string;
  orgId?: string | null;
  slug?: string;
  onShareClick?: () => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

const formatDisplayUrl = (url: string | undefined): string => {
  if (!url) return "";
  try {
    const formatted = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    return new URL(formatted).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
};

export default function BusinessProfileHeader({
  data,
  isOwnProfile = false,
  canManageCompany = false,
  logoUrl,
  coverUrl,
  orgId,
  slug: propSlug,
  onShareClick,
}: BusinessProfileHeaderProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawSlug = propSlug || (params?.slug as string) || "";
  const sourcePostId = searchParams.get("sourcePostId") || undefined;
  const canEdit = canManageCompany || isOwnProfile;

  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsModalTab, setStatsModalTab] = useState<"followers" | "following">("followers");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [mediaModal, setMediaModal] = useState<{
    isOpen: boolean;
    type: "avatar" | "banner";
    url: string;
  } | null>(null);

  const { activeProfile } = useActiveProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { syncFollowStatus, notifyFollowEvent } = useSocial();

  const actingCompanyRole = activeProfile?.viewer_role_data;
  const actingRoleName = (actingCompanyRole?.name || (data as any)?.viewer_role || "").toLowerCase();
  const isOwner = Boolean(
    actingCompanyRole?.is_owner ||
    (data as any)?.is_own_profile ||
    actingRoleName === "owner"
  );
  const isAdmin = actingRoleName === "admin";
  const actingPermissions: string[] =
    actingCompanyRole?.permissions ||
    (data as any)?.viewer_permissions ||
    [];
  const canEditProfile = isOwner || isAdmin || actingPermissions.includes("*") || actingPermissions.includes("MANAGE_COMPANY_DETAILS");

  const NO_FOLLOW_ACCESS_MESSAGE = "You don't have access to follow/unfollow on the behalf of company";

  const { canBlockTarget: canBlock, message: noBlockMessage, canReportTarget: canReport, noReportMessage } = useOrgBlockPermissions(orgId);

  const actingCompanyCanFollow =
    activeProfile?.type !== "COMPANY" ||
    actingCompanyRole?.is_owner ||
    actingCompanyRole?.permissions?.includes("*") ||
    actingCompanyRole?.permissions?.includes("MANAGE_COMMUNITY") ||
    actingCompanyRole?.permissions?.includes("MANAGE_COMPANY_DETAILS");

  const followMutation = useMutation({
    mutationFn: () => {
      const actingAsCompany = activeProfile?.type === "COMPANY" && activeProfile.id;
      if (actingAsCompany) {
        return data.isFollowing
          ? businessProfileService.organizationUnfollowOrganization(activeProfile.id, orgId!)
          : businessProfileService.organizationFollowOrganization(activeProfile.id, orgId!, sourcePostId);
      }
      return data.isFollowing
        ? businessProfileService.unfollowOrganization(orgId!)
        : businessProfileService.followOrganization(orgId!, sourcePostId);
    },
    onMutate: async () => {
      const nextFollowState = !data.isFollowing;
      if (orgId) {
        syncFollowStatus(orgId, nextFollowState);
        notifyFollowEvent(orgId, nextFollowState);
      }
      await queryClient.cancelQueries({ queryKey: ["companyProfile", rawSlug] });
      const previousProfile = queryClient.getQueryData(["companyProfile", rawSlug]);
      queryClient.setQueryData(["companyProfile", rawSlug], (old: Record<string, unknown> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          relationship: {
            ...((old.relationship as Record<string, unknown>) || {}),
            is_following: nextFollowState,
          },
        };
      });
      return { previousProfile };
    },
    onError: (err, variables, context) => {
      if (orgId) {
        syncFollowStatus(orgId, Boolean(data.isFollowing));
        notifyFollowEvent(orgId, Boolean(data.isFollowing));
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(["companyProfile", rawSlug], context.previousProfile);
      }
      toast({ title: "Error", description: "Failed to update follow status", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProfile", rawSlug] });
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: ["company_relationship", orgId] });
        queryClient.invalidateQueries({ queryKey: ["org_followers", orgId] });
        queryClient.invalidateQueries({ queryKey: ["company_followers", orgId] });
        queryClient.invalidateQueries({ queryKey: ["profileStats"] });
        queryClient.invalidateQueries({ queryKey: ["following"] });
      }
      if (activeProfile?.type === "COMPANY" && activeProfile.id) {
        queryClient.invalidateQueries({ queryKey: ["org_following", activeProfile.id] });
        queryClient.invalidateQueries({ queryKey: ["org_followers", orgId] });
        queryClient.invalidateQueries({ queryKey: ["orgRelationship", orgId, activeProfile.id] });
      }
    },
  });

  const blockMutation = useMutation({
    mutationFn: () => (data.isBlocked ? businessProfileService.unblockTarget(orgId!) : businessProfileService.blockTarget(orgId!)),
    onSuccess: () => {
      const willBeBlocked = !data.isBlocked;

      // 1. Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: ["companyProfile", rawSlug] });
      queryClient.invalidateQueries({ queryKey: ["companyProfile", orgId] });

      // 2. Optimistically purge blocked company's posts from feed queries
      if (willBeBlocked && orgId) {
        queryClient.setQueriesData<any>({ queryKey: ['feed'] }, (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: (page.posts || []).filter((p: any) => {
                const matches =
                  String(p.authorId) === String(orgId) ||
                  String(p.author_org_id) === String(orgId) ||
                  String(p.companyId) === String(orgId) ||
                  String(p.company_id) === String(orgId) ||
                  String(p.shared_post?.authorId) === String(orgId) ||
                  String(p.shared_post?.author_org_id) === String(orgId);
                return !matches;
              }),
            })),
          };
        });

        // Also purge from profile post previews
        queryClient.setQueriesData<any[]>({ queryKey: ["profile-posts"] }, (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.filter((p: any) =>
            String(p.authorId) !== String(orgId) &&
            String(p.author_org_id) !== String(orgId) &&
            String(p.companyId) !== String(orgId) &&
            String(p.shared_post?.authorId) !== String(orgId) &&
            String(p.shared_post?.author_org_id) !== String(orgId)
          );
        });
      }

      // 3. Invalidate feed and social queries
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });

      // 4. Notify app via custom event and cross-tab localStorage
      if (typeof window !== "undefined" && orgId) {
        window.dispatchEvent(
          new CustomEvent("cocpit:block_status_changed", {
            detail: { targetId: orgId, isBlocked: willBeBlocked },
          })
        );
        try {
          localStorage.setItem(
            "cocpit_block_event",
            JSON.stringify({ targetId: orgId, isBlocked: willBeBlocked, timestamp: Date.now() })
          );
        } catch (e) {}
      }

      toast({
        title: "Success",
        description: data.isBlocked ? "Profile unblocked successfully" : "Profile blocked successfully",
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to update block status",
        variant: "destructive",
      });
    },
  });

  const handleBlockToggle = () => {
    if (!orgId) return;
    setShowBlockModal(true);
  };

  const displayCover = coverUrl || data.coverUrl || null;
  const displayAvatar = logoUrl || data.logoUrl || null;

  const handleBannerClick = () => {
    if (displayCover) {
      setMediaModal({ isOpen: true, type: "banner", url: displayCover });
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    if (displayAvatar) {
      e.stopPropagation();
      setMediaModal({ isOpen: true, type: "avatar", url: displayAvatar });
    }
  };

  return (
    <div className="w-full max-w-[800px] flex flex-col justify-start items-start gap-3">
      {/* 1. Hero Block: Responsive h-[185px] on mobile, h-[260px] on desktop */}
      <div className="w-full h-[185px] sm:h-[260px] relative">
        {/* Cover Banner: Full bleed edge-to-edge on mobile, rounded-2xl on desktop */}
        <div
          onClick={handleBannerClick}
          className={cn(
            "w-full max-w-[800px] h-[135px] sm:h-[200px] left-0 top-0 absolute rounded-none sm:rounded-2xl overflow-hidden select-none",
            displayCover
              ? "cursor-pointer"
              : "bg-ds-surface-1 border-b sm:border border-ds-border flex flex-col justify-center items-center"
          )}
        >
          {displayCover ? (
            <img
              src={displayCover}
              alt={`${data.name} Cover`}
              className="w-full h-full object-cover"
            />
          ) : (isOwnProfile || canManageCompany) ? (
            <div className="w-full h-full flex flex-col justify-center items-center gap-2 p-[10px] select-none">
              <div className="text-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 select-none">
                Add banner
              </div>
              <div className="text-center text-ds-text-secondary text-xs font-normal font-['DM_Sans'] leading-4 select-none">
                Recommended: 16:9 · At least 1200 × 675 px · JPG, PNG
              </div>
            </div>
          ) : null}
        </div>

        {/* Logo Avatar: Frame 2609490 (84x84 mobile, 120x120 desktop; left-4 top-[90px] mobile, left-[20px] top-[140px] desktop) */}
        <div
          onClick={handleAvatarClick}
          className={cn(
            "w-[84px] h-[84px] sm:w-[120px] sm:h-[120px] left-4 sm:left-[20px] top-[90px] sm:top-[140px] absolute rounded-[16px] sm:rounded-[12px] overflow-hidden z-10 select-none border-4 border-ds-bg sm:border-0",
            displayAvatar
              ? "cursor-pointer bg-white"
              : "bg-white flex flex-col justify-center items-center p-[6px] sm:p-[10px]"
          )}
        >
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={`${data.name} Logo`}
              className="w-full h-full object-cover rounded-[12px]"
            />
          ) : (
            <BusinessBuildingIcon className="w-8 h-8 sm:w-10 sm:h-10 text-black flex-none order-0 grow-0" />
          )}
        </div>

        {/* Mobile 3-dots button (only on public profile, matching Figma below banner on dark background) */}
        {!isOwnProfile && (
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="More options"
            className="sm:hidden absolute right-4 top-[148px] p-2 text-ds-text-secondary hover:text-ds-text-primary active:scale-95 transition-all cursor-pointer z-10"
          >
            <MoreHorizontal className="w-6 h-6 text-ds-text-secondary" />
          </button>
        )}

        {/* Right Section: Desktop Action Buttons (hidden on mobile, inline-flex on sm:) */}
        <div className="right-0 top-[216px] absolute hidden sm:inline-flex justify-end items-center gap-3 z-10">
          {isOwnProfile ? (
            <>
              {/* Edit profile (accent pill) */}
              {canEditProfile ? (
                <Link
                  href={`/organization/${rawSlug}/edit`}
                  className="px-3 py-1.5 bg-ds-accent rounded-[100px] flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  Edit profile
                </Link>
              ) : (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-not-allowed" tabIndex={0}>
                        <button
                          type="button"
                          disabled
                          aria-label="Edit profile disabled"
                          className="px-3 py-1.5 bg-ds-accent rounded-[100px] flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 pointer-events-none shadow-sm cursor-not-allowed"
                        >
                          Edit profile
                        </button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs font-['DM_Sans'] z-50">
                      You don't have access
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {/* Share page (outline pill) */}
              <button
                type="button"
                onClick={onShareClick}
                className="px-3 py-1.5 rounded-[100px] outline outline-1 outline-offset-[-0.50px] outline-ds-border flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 hover:bg-ds-surface-2 transition-colors shadow-sm cursor-pointer"
              >
                Share page
              </button>
            </>
          ) : (
            <>
              {/* Follow Button */}
              {!actingCompanyCanFollow ? (
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-not-allowed">
                        <button
                          type="button"
                          disabled
                          className={cn(
                            "px-4 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 text-base font-medium font-['DM_Sans'] leading-6 shadow-sm pointer-events-none",
                            data.isFollowing
                              ? "outline outline-1 outline-ds-border text-ds-text-secondary"
                              : "bg-ds-accent text-white"
                          )}
                        >
                          {data.isFollowing ? "Unfollow" : "Follow"}
                        </button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs font-['DM_Sans'] z-50">
                      {NO_FOLLOW_ACCESS_MESSAGE}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <button
                  onClick={() => {
                    if (data.isFollowing) {
                      setShowUnfollowModal(true);
                    } else {
                      followMutation.mutate();
                    }
                  }}
                  disabled={followMutation.isPending || !orgId}
                  className={cn(
                    "px-4 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 text-base font-medium font-['DM_Sans'] leading-6 transition-colors shadow-sm cursor-pointer",
                    data.isFollowing
                      ? "outline outline-1 outline-ds-border text-ds-text-secondary hover:bg-ds-surface-2"
                      : "bg-ds-accent text-white hover:opacity-90"
                  )}
                >
                  {followMutation.isPending ? "..." : data.isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}

              {/* Message Button */}
              {data.showMessage !== false && (
                <Link
                  href={`/messaging?companyId=${orgId}`}
                  className="px-4 py-1.5 rounded-[100px] outline outline-1 outline-offset-[-0.50px] outline-ds-border flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 hover:bg-ds-surface-2 transition-colors shadow-sm cursor-pointer"
                >
                  Message
                </Link>
              )}

              {/* More options button */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="More options"
                    className="px-4 py-1.5 rounded-[100px] outline outline-1 outline-offset-[-0.50px] outline-ds-border flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 hover:bg-ds-surface-2 transition-colors shadow-sm cursor-pointer"
                  >
                    More
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="p-[12px] !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-[16px] flex flex-col justify-start items-start gap-[16px] overflow-hidden shadow-2xl z-50 outline-none w-[135px] box-border"
                >
                  <DropdownMenuItem
                    onClick={onShareClick}
                    className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-[14px] font-normal font-['DM_Sans'] leading-[20px] cursor-pointer outline-none transition-colors border-none h-[20px] flex-none order-0 grow-0"
                  >
                    Share page
                  </DropdownMenuItem>
                  {!canBlock ? (
                    <TooltipProvider>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-[14px] font-normal font-['DM_Sans'] leading-[20px] outline-none border-none h-[20px] flex-none order-1 grow-0 cursor-not-allowed select-none !opacity-100"
                            >
                              {blockMutation.isPending ? "Updating..." : data.isBlocked ? "Unblock page" : "Block page"}
                            </DropdownMenuItem>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs font-['DM_Sans'] z-[9999]">
                          {noBlockMessage}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <DropdownMenuItem
                      onClick={handleBlockToggle}
                      disabled={blockMutation.isPending}
                      className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-[14px] font-normal font-['DM_Sans'] leading-[20px] cursor-pointer outline-none transition-colors border-none h-[20px] flex-none order-1 grow-0 disabled:opacity-50"
                    >
                      {blockMutation.isPending ? "Updating..." : data.isBlocked ? "Unblock page" : "Block page"}
                    </DropdownMenuItem>
                  )}
                  {!canReport ? (
                    <TooltipProvider>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-[14px] font-normal font-['DM_Sans'] leading-[20px] outline-none border-none h-[20px] flex-none order-2 grow-0 cursor-not-allowed select-none !opacity-100"
                            >
                              Report page
                            </DropdownMenuItem>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs font-['DM_Sans'] z-[9999]">
                          {noReportMessage}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => setIsReportModalOpen(true)}
                      className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-[14px] font-normal font-['DM_Sans'] leading-[20px] cursor-pointer outline-none transition-colors border-none h-[20px] flex-none order-2 grow-0"
                    >
                      Report page
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* 2. Info Block: Frame 2609613 (800 Fill x 100 Hug, pl-[20px]) */}
      <div className="w-full max-w-[800px] min-h-[100px] flex flex-row items-start px-4 sm:px-0 sm:pl-5 self-stretch">
        {/* Frame 2609607: Left Column (w-full, flex-1, min-w-0, gap-1) */}
        <div className="flex-1 w-full max-w-full min-w-0 flex flex-col items-start gap-1 p-0">
          {/* Frame 2609650 / NameRow (gap: 8px, height: 32px, max-w-full, min-w-0) */}
          <div className="flex flex-row items-center p-0 gap-2 h-8 max-w-full min-w-0">
            <h1 className="text-ds-text-primary text-xl sm:text-2xl font-bold font-['DM_Sans'] leading-7 sm:leading-8 truncate min-w-0">
              {data.name}
            </h1>
            {data.isVerified && (
              <VerifyIcon
                className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 order-1 grow-0"
                size={24}
                fill="var(--ds-accent)"
                aria-label="Verified organization badge"
              />
            )}
          </div>

          {/* Tagline / Headline: break-words to show full text without premature truncation */}
          {data.tagline && (
            <p className="text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 min-h-[20px] max-w-full break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
              {data.tagline}
            </p>
          )}

          {/* Frame 2609071: Meta line (gap: 8px, height: 16px, align-self: stretch) */}
          <div className="self-stretch flex flex-row flex-wrap items-center p-0 gap-2 min-h-4 max-w-full overflow-hidden">
            {data.industry && (
              <span className="text-ds-text-secondary text-xs font-normal font-['DM_Sans'] leading-4 text-center">
                {data.industry}
              </span>
            )}
            {data.industry && data.location && (
              <span className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />
            )}
            {data.location && (
              <span className="text-ds-text-secondary text-xs font-normal font-['DM_Sans'] leading-4 text-center">
                {data.location}
              </span>
            )}
            {data.location && data.employeeCount && (
              <span className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />
            )}
            {data.employeeCount && (
              <span className="text-ds-text-secondary text-xs font-normal font-['DM_Sans'] leading-4 text-center">
                {data.employeeCount}
                {String(data.employeeCount).toLowerCase().includes("member") ? "" : " Members"}
              </span>
            )}
          </div>
          {/* Website Link (Display clean domain only: SCRUM-1053) */}
          {data.websiteUrl && (
            <a
              href={data.websiteUrl.startsWith("http") ? data.websiteUrl : `https://${data.websiteUrl}`}
              target="_blank"
              rel="noreferrer"
              className="profile-website-link text-[var(--ds-accent)] hover:no-underline hover:opacity-85 transition-opacity text-sm font-medium font-['DM_Sans'] leading-5 min-h-[20px] max-w-full truncate"
            >
              {formatDisplayUrl(data.websiteUrl)}
            </a>
          )}

          {/* StatsRow (Frame 2609861: w-[148px] h-[40px] gap-[24px] mt-4) */}
          <div className="w-[148px] h-[40px] flex flex-row items-center p-0 gap-[24px] mt-4 flex-none shrink-0">
            {/* Followers (Order 0, w-[62px] h-[40px]) */}
            <button
              type="button"
              onClick={() => {
                setStatsModalTab("followers");
                setIsStatsModalOpen(true);
              }}
              className="w-[62px] h-[40px] flex flex-col items-center justify-center p-0 cursor-pointer hover:opacity-80 transition-opacity font-['DM_Sans'] font-medium text-[14px] leading-[20px] text-center text-ds-text-primary shrink-0 flex-none order-0"
            >
              <span className="w-full text-center truncate">{formatNumber(data.stats?.followers || data.stats?.subscribers || 0)}</span>
              <span className="w-full text-center">Followers</span>
            </button>

            {/* Following (Order 1, w-[62px] h-[40px]) */}
            <button
              type="button"
              onClick={() => {
                setStatsModalTab("following");
                setIsStatsModalOpen(true);
              }}
              className="w-[62px] h-[40px] flex flex-col items-center justify-center p-0 cursor-pointer hover:opacity-80 transition-opacity font-['DM_Sans'] font-medium text-[14px] leading-[20px] text-center text-ds-text-primary shrink-0 flex-none order-1"
            >
              <span className="w-full text-center truncate">{formatNumber(data.stats?.following || 0)}</span>
              <span className="w-full text-center">Following</span>
            </button>
          </div>

          {/* Mobile Action Buttons: Own Profile vs Public Profile */}
          {isOwnProfile ? (
            <div className="flex sm:hidden flex-row justify-start items-center gap-3 mt-3 w-full">
              {canEditProfile ? (
                <Link
                  href={`/organization/${rawSlug}/edit`}
                  className="px-4 py-1.5 bg-ds-accent text-white rounded-[100px] text-base font-medium font-['DM_Sans'] leading-6 hover:opacity-90 transition-opacity text-center"
                >
                  Edit profile
                </Link>
              ) : (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-not-allowed">
                        <button
                          type="button"
                          disabled
                          className="px-4 py-1.5 bg-ds-accent text-white rounded-[100px] text-base font-medium font-['DM_Sans'] leading-6 pointer-events-none"
                        >
                          Edit profile
                        </button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs font-['DM_Sans'] z-50">
                      You don't have access
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <button
                type="button"
                onClick={onShareClick}
                className="px-4 py-1.5 rounded-[100px] border border-ds-border text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 hover:bg-ds-surface-2 transition-colors cursor-pointer"
              >
                Share page
              </button>
            </div>
          ) : (
            <div className="flex sm:hidden flex-row justify-start items-center gap-3 mt-3 w-full">
              {!actingCompanyCanFollow ? (
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-not-allowed">
                        <button
                          type="button"
                          disabled
                          className={cn(
                            "w-24 px-3 py-1.5 rounded-[100px] text-base font-medium font-['DM_Sans'] leading-6 flex justify-center items-center pointer-events-none",
                            data.isFollowing
                              ? "border border-ds-border text-ds-text-secondary"
                              : "bg-ds-accent text-white"
                          )}
                        >
                          {data.isFollowing ? "Unfollow" : "Follow"}
                        </button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs font-['DM_Sans'] z-50">
                      {NO_FOLLOW_ACCESS_MESSAGE}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (data.isFollowing) {
                      setShowUnfollowModal(true);
                    } else {
                      followMutation.mutate();
                    }
                  }}
                  disabled={followMutation.isPending || !orgId}
                  className={cn(
                    "w-24 px-3 py-1.5 rounded-[100px] text-base font-medium font-['DM_Sans'] leading-6 flex justify-center items-center transition-all cursor-pointer",
                    data.isFollowing
                      ? "border border-ds-border text-ds-text-secondary"
                      : "bg-ds-accent text-white hover:opacity-90"
                  )}
                >
                  {followMutation.isPending ? "..." : data.isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}

              {data.showMessage !== false && (
                <Link
                  href={`/messaging?companyId=${orgId}`}
                  className="w-24 px-3 py-1.5 rounded-[100px] border border-ds-border text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 flex justify-center items-center hover:bg-ds-surface-2 transition-colors cursor-pointer"
                >
                  Message
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <MobileBusinessProfileMenuDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onSharePage={onShareClick}
        onBlockToggle={handleBlockToggle}
        isBlocked={Boolean(data.isBlocked)}
        isBlocking={blockMutation.isPending}
        canBlock={canBlock}
        noBlockMessage={noBlockMessage}
        canReport={canReport}
        noReportMessage={noReportMessage}
        onReportCompany={() => setIsReportModalOpen(true)}
        onEditProfile={() => {
          if (canEditProfile) {
            window.location.href = `/organization/${rawSlug}/edit`;
          }
        }}
        canEditProfile={canEditProfile}
        isOwnProfile={isOwnProfile}
      />

      {/* Stats Modal */}
      {orgId && isStatsModalOpen && (
        <OrganizationStatsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          orgId={orgId}
          initialTab={statsModalTab}
          isOwnProfile={canEdit}
          showFollowersList={data.showFollowersList}
          showFollowingList={data.showFollowingList}
        />
      )}

      {/* Report Modal */}
      {orgId && isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="COMPANY"
          targetId={orgId}
        />
      )}

      {/* Media Preview Modal */}
      {mediaModal?.isOpen && (
        <ViewMediaModal
          isOpen={mediaModal.isOpen}
          onClose={() => setMediaModal(null)}
          mediaUrl={mediaModal.url}
          type={mediaModal.type}
          shape="square"
          alt={mediaModal.type === "avatar" ? data.name || "Organization logo" : `${data.name} banner`}
        />
      )}

      {/* Unfollow Confirmation Modal */}
      <ActionConfirmModal
        isOpen={showUnfollowModal}
        onClose={() => setShowUnfollowModal(false)}
        onConfirm={() => {
          setShowUnfollowModal(false);
          followMutation.mutate();
        }}
        type="unfollow"
        targetName={data.name}
        isLoading={followMutation.isPending}
      />

      {/* Block / Unblock Confirmation Modal */}
      <ActionConfirmModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={() => {
          setShowBlockModal(false);
          blockMutation.mutate();
        }}
        isLoading={blockMutation.isPending}
        type={data.isBlocked ? "custom" : "block_profile"}
        targetName={data.name || "this page"}
        title={
          data.isBlocked ? (
            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px]">
              Unblock <span className="font-['DM_Sans'] font-semibold text-[14px] leading-[20px]">{data.name || "this page"}</span>?
            </span>
          ) : undefined
        }
        titleClassName={data.isBlocked ? "font-['Poppins'] font-normal text-[14px] leading-[20px]" : undefined}
        description={
          data.isBlocked
            ? "They will be able to see your profile and posts again"
            : undefined
        }
        confirmText={data.isBlocked ? "Unblock" : undefined}
      />
    </div>
  );
}
