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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReportModal } from "@/components/shared/ReportModal";
import { BusinessBuildingIcon, VerifyIcon } from "@/components/icons";
import { ViewMediaModal } from "@/features/profile/commonProfileComponents/ViewMediaModal";
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
      queryClient.invalidateQueries({ queryKey: ["companyProfile", rawSlug] });
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
    blockMutation.mutate();
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
      {/* 1. Hero Block: w-full max-w-[800px] h-[260px] relative */}
      <div className="w-full h-[260px] relative">
        {/* Cover Banner: Frame 2609600 (800x200px) */}
        <div
          onClick={handleBannerClick}
          className={cn(
            "w-full max-w-[800px] h-[200px] left-0 top-0 absolute rounded-2xl overflow-hidden select-none",
            displayCover
              ? "cursor-pointer"
              : "bg-ds-surface-1 border border-ds-border flex flex-col justify-center items-center"
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

        {/* Logo Avatar: Frame 2609490 (120x120, left: 20px, top: 140px, rounded-[12px]) */}
        <div
          onClick={handleAvatarClick}
          className={cn(
            "w-[120px] h-[120px] left-[20px] top-[140px] absolute rounded-[12px] overflow-hidden z-10 select-none",
            displayAvatar
              ? "cursor-pointer"
              : "bg-ds-surface-2 flex flex-col justify-center items-center p-[10px]"
          )}
        >
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={`${data.name} Logo`}
              className="w-full h-full object-cover rounded-[12px]"
            />
          ) : (
            <BusinessBuildingIcon className="w-10 h-10 text-ds-text-primary flex-none order-0 grow-0" />
          )}
        </div>

        {/* Right Section: Action Buttons */}
        <div className="right-0 top-[216px] absolute inline-flex justify-end items-center gap-3 z-10">
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
                        <span className="inline-flex cursor-not-allowed" tabIndex={0} title="You don't have access to this screen">
                          <button
                            type="button"
                            disabled
                            aria-label="Edit profile disabled"
                            className="px-3 py-1.5 bg-ds-accent opacity-50 rounded-[100px] flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 pointer-events-none shadow-sm cursor-not-allowed"
                          >
                            Edit profile
                          </button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs font-['DM_Sans'] z-50">
                        You don't have access to this screen
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
                <button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending || !orgId || !actingCompanyCanFollow}
                  title={!actingCompanyCanFollow ? "Only company admins/owners can follow on behalf of the company" : ""}
                  className={cn(
                    "px-4 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 text-base font-medium font-['DM_Sans'] leading-6 transition-colors shadow-sm cursor-pointer",
                    data.isFollowing
                      ? "outline outline-1 outline-ds-border text-ds-text-secondary hover:bg-ds-surface-2"
                      : "bg-ds-accent text-white hover:opacity-90",
                    !actingCompanyCanFollow && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {followMutation.isPending ? "..." : data.isFollowing ? "Unfollow" : "Follow"}
                </button>

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
                    <DropdownMenuItem
                      onClick={handleBlockToggle}
                      disabled={blockMutation.isPending}
                      className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-[14px] font-normal font-['DM_Sans'] leading-[20px] cursor-pointer outline-none transition-colors border-none h-[20px] flex-none order-1 grow-0 disabled:opacity-50"
                    >
                      {blockMutation.isPending ? "Updating..." : data.isBlocked ? "Unblock page" : "Block page"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsReportModalOpen(true)}
                      className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-[14px] font-normal font-['DM_Sans'] leading-[20px] cursor-pointer outline-none transition-colors border-none h-[20px] flex-none order-2 grow-0"
                    >
                      Report page
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
        </div>
      </div>

      {/* 2. Info Block: Frame 2609613 (800 Fill x 100 Hug, pl-[20px]) */}
      <div className="w-full max-w-[800px] min-h-[100px] flex flex-row items-start pl-5 pr-0 self-stretch">
        {/* Frame 2609607: Left Column (w-full, flex-1, min-w-0, gap-1) */}
        <div className="flex-1 w-full max-w-full min-w-0 flex flex-col items-start gap-1 p-0">
          {/* Frame 2609650 / NameRow (gap: 8px, height: 32px, max-w-full, min-w-0) */}
          <div className="flex flex-row items-center p-0 gap-2 h-8 max-w-full min-w-0">
            <h1 className="text-ds-text-primary text-2xl font-bold font-['DM_Sans'] leading-8 truncate min-w-0">
              {data.name}
            </h1>
            {data.isVerified && (
              <VerifyIcon
                className="w-6 h-6 shrink-0 order-1 grow-0"
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

          {/* Followers & Following Stats (Left-aligned under website link) */}
          <div className="flex flex-row items-center p-0 gap-6 mt-3 shrink-0">
            {/* Followers */}
            <button
              type="button"
              onClick={() => {
                setStatsModalTab("followers");
                setIsStatsModalOpen(true);
              }}
              className="min-w-[54px] h-[40px] flex flex-col items-center justify-center p-0 cursor-pointer hover:opacity-80 transition-opacity font-['DM_Sans'] font-medium text-[14px] leading-[20px] text-center text-ds-text-primary shrink-0"
            >
              <span className="w-full text-center truncate">{formatNumber(data.stats?.followers || data.stats?.subscribers || 0)}</span>
              <span className="w-full text-center">Followers</span>
            </button>

            {/* Following */}
            <button
              type="button"
              onClick={() => {
                setStatsModalTab("following");
                setIsStatsModalOpen(true);
              }}
              className="min-w-[54px] h-[40px] flex flex-col items-center justify-center p-0 cursor-pointer hover:opacity-80 transition-opacity font-['DM_Sans'] font-medium text-[14px] leading-[20px] text-center text-ds-text-primary shrink-0"
            >
              <span className="w-full text-center truncate">{formatNumber(data.stats?.following || 0)}</span>
              <span className="w-full text-center">Following</span>
            </button>
          </div>
        </div>
      </div>

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
    </div>
  );
}
