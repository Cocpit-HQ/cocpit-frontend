"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveScrollPosition } from "@/hooks/use-scroll-restoration";
import { Share2, Flag, ChevronLeft, X } from "lucide-react";
import { BlockIcon } from "@/components/icons";
import { toast } from "sonner";
import { FeatureDisabledTooltip } from "@/components/feature-flags";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/features/navigation/components/GlobalSearch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocial } from "@/context/SocialContext";
import { useProfile, useProfilePostsPreview } from "./hooks/usePublicProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  sendConnectionRequest,
  cancelConnectionRequest,
  handleConnectionRequest,
  removeConnection,
  getRelationshipStatus,
} from "@/services/api/social";
import { useConnectionActions } from "@/features/connection/hooks/useConnectionActions";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { companyService } from "@/services/organization.service";

// Layout & Header Components
import { ProfileCoverSection } from "@/features/profile/components/ProfileCoverSection";
import { ProfileUserBio } from "@/features/profile/components/ProfileUserBio";
import { ProfileAboutSection } from "@/features/profile/components/ProfileAboutSection";
import { ProfileBlockedState } from "./components/ProfileBlockedState";

// Tab Content Components
import { ProfilePostsTab } from "@/features/profile/components/tabs/ProfilePostsTab";
import { ProfileExperienceTab } from "@/features/profile/components/tabs/ProfileExperienceTab";
import { ProfileEducationTab } from "@/features/profile/components/tabs/ProfileEducationTab";
import { ProfileProjectsTab } from "@/features/profile/components/tabs/ProfileProjectsTab";
import { ProfileSkillsTab } from "@/features/profile/components/tabs/ProfileSkillsTab";

// Modals
import { ViewAvatarModal } from "@/features/profile/commonProfileComponents/ViewAvatarModal";
import { SendOfferDialog } from "@/features/profile/commonProfileComponents/SendOfferDialog";
import { FollowListModal } from "@/features/profile/components/FollowListModal";
import { ContactInfoModal } from "@/features/profile/components/ContactInfoModal";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";
import { DownloadProfileScreen } from "@/shared/commonComponents/DownloadProfileScreen";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import { ReportModal } from "@/components/shared/ReportModal";
import { MobilePublicProfileMenuDrawer } from "@/features/profile/components/drawers/MobilePublicProfileMenuDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Post } from "@/types/entities";
import type { UserData } from "@/types/user";

interface PublicProfileProps {
  userId: string;
}

export default function PublicProfilePage({ userId }: PublicProfileProps) {
  const router = useRouter();
  const { startChat, blockUser, unblockUser, isBlocked, followUser, unfollowUser, isFollowing, isFollowLoading, syncFollowStatus } = useSocial();
  const { activeProfile, isCompany } = useActiveProfile();
  const isCompanyActor = Boolean(isCompany || activeProfile?.type === "COMPANY");

  const queryClient = useQueryClient();
  const [isViewAvatarOpen, setIsViewAvatarOpen] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [showRemoveConnectionDialog, setShowRemoveConnectionDialog] = useState(false);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDownloadProfileOpen, setIsDownloadProfileOpen] = useState(false);
  const [downloadPdfUrl, setDownloadPdfUrl] = useState<string | null>(null);
  const [isFollowListModalOpen, setIsFollowListModalOpen] = useState(false);
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [isSendOfferOpen, setIsSendOfferOpen] = useState(false);
  const [activeFollowTab, setActiveFollowTab] = useState<"followers" | "following" | "connections">("followers");
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const isMobile = useIsMobile();

  // Fetch Public Profile Data
  const { data: user, isLoading: isUserLoading, error: userError, refetch: refetchProfile } = useProfile(userId);
  const { data: publicPosts } = useProfilePostsPreview(userId);

  const visiblePosts = useMemo(() => {
    if (!publicPosts) return [];
    return publicPosts.filter((post) => post.visibility !== "private") as Post[];
  }, [publicPosts]);

  // Fallback: if user not found, check if it's an organization and redirect
  useEffect(() => {
    if (userError && userId) {
      const errorData = (userError as any)?.response?.data;
      if (errorData?.is_company && (errorData?.slug || errorData?.org_id)) {
        router.replace(`/organization/${errorData.slug || errorData.org_id}`);
        return;
      }
      companyService.getCompany(userId)
        .then((comp) => {
          if (comp && (comp.slug || comp.org_id)) {
            router.replace(`/organization/${comp.slug || comp.org_id}`);
          }
        })
        .catch(() => {});
    }
  }, [userError, userId, router]);

  // Always ensure public profile opens scrolled to top (0, 0)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [userId]);

  const targetUserId = user?.id || userId;

  const experiences = useMemo(() => user?.experiences || [], [user?.experiences]);
  const educations = useMemo(() => user?.educations || [], [user?.educations]);
  const projects = useMemo(() => user?.projects || [], [user?.projects]);
  const skills = useMemo(() => (user?.skills || []) as any[], [user?.skills]);

  const blocked = isBlocked(targetUserId) || (user?.id ? isBlocked(user.id) : false) || Boolean(user?.is_blocked_by_me);
  const following = Boolean(
    (targetUserId && isFollowing(targetUserId)) ||
    (user?.id && isFollowing(user.id)) ||
    (isCompanyActor ? (user as any)?.is_following : false)
  );
  const followLoading = isFollowLoading(targetUserId) || (user?.id ? isFollowLoading(user.id) : false);

  // Fetch Relationship / Connection status
  const { data: relationshipData } = useQuery({
    queryKey: ["relationshipStatus", targetUserId],
    queryFn: async () => {
      try {
        const res = await getRelationshipStatus(targetUserId);
        return res;
      } catch {
        return { status: "none", request_id: null };
      }
    },
    enabled: !!targetUserId && !isCompanyActor,
  });

  // ─── Derived connection state ────────────────────────────────────────────────
  // Priority: query cache > profile response fallback
  const connectionStatus = useMemo(() => {
    if (isCompanyActor) return "none";
    if (relationshipData?.status) return relationshipData.status as string;
    // Fallback: map the profile-level connection_request_sender to directional status
    const profileStatus = (user as any)?.connection_request_status;
    const profileSender = (user as any)?.connection_request_sender;
    if (profileStatus === "connected") return "connected";
    if (profileStatus === "pending") {
      return profileSender === "me" ? "pending_sent" : "pending_received";
    }
    if ((user as any)?.is_connected) return "connected";
    return "none";
  }, [relationshipData, user, isCompanyActor]);

  // The request_id needed for cancel / accept / decline
  const pendingRequestId = relationshipData?.request_id ||
    (user as any)?.connection_request_id ||
    null;

  // Directional states
  const isConnected = connectionStatus === "connected";
  const isPendingSent = connectionStatus === "pending_sent";
  const isPendingReceived = connectionStatus === "pending_received";

  // 500-threshold: threshold for Creator Mode
  const targetConnectionCount = blocked ? 0 : ((user as any)?.connections_count ?? 0);
  const isCreatorMode = targetConnectionCount >= 500;
  const showConnect = !isCompanyActor && connectionStatus === "none" && !isCreatorMode;
  const showFollow = isCompanyActor || (isCreatorMode && (connectionStatus === "none" || isPendingSent));

  // ─── Action handlers ─────────────────────────────────────────────────────────

  const invalidateRelationshipCaches = () => {
    queryClient.invalidateQueries({ queryKey: ["relationshipStatus", targetUserId] });
    queryClient.invalidateQueries({ queryKey: ["profileStats", targetUserId] });
    queryClient.invalidateQueries({ queryKey: ["profile", targetUserId] });
    queryClient.invalidateQueries({ queryKey: ["connectionCount", targetUserId] });
  };

  const handleFollowToggle = async () => {
    const targetIdToUse = user?.id || targetUserId;
    if (!targetIdToUse) return;
    if (following) {
      setShowUnfollowDialog(true);
    } else {
      const userName = user?.name;
      await followUser(targetIdToUse, undefined, userName);
      refetchProfile();
    }
  };

  const handleConnect = async () => {
    if (!targetUserId) return;
    // Optimistic update
    queryClient.setQueryData(["relationshipStatus", targetUserId], { status: "pending_sent" });
    try {
      await sendConnectionRequest(targetUserId);
      invalidateRelationshipCaches();
      toast.success("Connection request sent!");
    } catch (err: any) {
      // Rollback
      queryClient.setQueryData(["relationshipStatus", targetUserId], { status: "none", request_id: null });
      const msg = err?.response?.data?.message || "Failed to send connection request";
      toast.error(msg);
    }
  };

  const { undo } = useConnectionActions();

  const handleWithdraw = async () => {
    const idToCancel = pendingRequestId || targetUserId;
    if (!idToCancel) return;

    // We can just use the undo mutation to handle optimistic updates identically to the connections panel
    undo.mutate(idToCancel, {
      onSuccess: () => {
        // Additional invalidations specific to profile page
        invalidateRelationshipCaches();
      }
    });
  };

  const handleAccept = async () => {
    if (!pendingRequestId) return;
    // Optimistic update
    queryClient.setQueryData(["relationshipStatus", targetUserId], { status: "connected" });
    try {
      await handleConnectionRequest(pendingRequestId, "connected");
      invalidateRelationshipCaches();
      toast.success("Connected!");
    } catch (err: any) {
      // Rollback
      queryClient.setQueryData(["relationshipStatus", targetUserId], { status: "pending_received", request_id: pendingRequestId });
      toast.error("Failed to accept request.");
    }
  };

  const handleDecline = async () => {
    if (!pendingRequestId) return;
    // Optimistic update
    queryClient.setQueryData(["relationshipStatus", targetUserId], { status: "none", request_id: null });
    try {
      await handleConnectionRequest(pendingRequestId, "rejected");
      invalidateRelationshipCaches();
    } catch (err: any) {
      // Rollback
      queryClient.setQueryData(["relationshipStatus", targetUserId], { status: "pending_received", request_id: pendingRequestId });
      toast.error("Failed to decline request.");
    }
  };

  const handleRemoveConnection = async () => {
    if (!targetUserId) return;
    try {
      await removeConnection(targetUserId);
      queryClient.setQueryData(["relationshipStatus", targetUserId], { status: "none" });
      queryClient.invalidateQueries({ queryKey: ["relationshipStatus", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats"] }); // invalidate current user's stats too
      queryClient.invalidateQueries({ queryKey: ["connections", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] }); // Updates followersCount on the page
      syncFollowStatus(targetUserId, false); // immediately reflect unfollow in UI
      setShowRemoveConnectionDialog(false);
      toast.success("Connection removed");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to remove connection";
      toast.error(msg);
    }
  };

  const handleViewResume = () => {
    if (user?.resume?.url) {
      window.open(user.resume.url, "_blank");
    } else {
      toast.info("No resume uploaded yet");
    }
  };

  const handleDownloadProfile = async () => {
    if (!user?.id) return;
    try {
      const toastId = toast.loading("Downloading resume...");

      const { downloadProfileResumePdf } = await import("@/services/api/profile");
      const { blob } = await downloadProfileResumePdf(user.id);

      const url = window.URL.createObjectURL(blob);
      setDownloadPdfUrl(url);
      setIsDownloadProfileOpen(true);

      // Automatically trigger the download
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `resume-${(user as any)?.first_name || (user as any)?.username || "profile"}.pdf`;
      document.body.appendChild(a);
      a.click();

      toast.dismiss(toastId);
      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("Failed to fetch resume:", error);
      toast.error("Failed to load resume preview.");
    }
  };

  const handleMessage = async () => {
    if (!user) return;
    try {
      await startChat(user.id);
      router.push(`/messaging?userId=${user.id}`);
    } catch {
      toast.error("Failed to start conversation");
    }
  };

  const handleBlockToggle = async () => {
    if (isBlockLoading) return;
    setIsBlockLoading(true);
    try {
      if (blocked) {
        await unblockUser(targetUserId);
      } else {
        await blockUser(targetUserId);
      }
      setShowBlockDialog(false);
    } catch {
      // Error toast is handled by SocialContext
    } finally {
      setIsBlockLoading(false);
    }
  };

  const openFollowList = (tab: "followers" | "following" | "connections") => {
    setActiveFollowTab(tab);
    setIsFollowListModalOpen(true);
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/feed");
    }
  };

  const handleClose = () => {
    router.push("/feed");
  };

  const renderTopNavigation = () => (
    <>
      {/* Occlusion bar for smooth scrolling under top navigation */}
      <div className="fixed top-0 left-0 right-0 h-[88px] sm:h-[100px] bg-[var(--ds-bg)] z-40 pointer-events-none" />

      {/* Back button (top: 40px, left: 40px) */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Back"
        className="fixed top-6 left-4 sm:top-10 sm:left-10 flex items-center gap-2 h-9 px-2 rounded-md text-[var(--ds-text-primary)] hover:text-[var(--ds-text-secondary)] transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] z-[60] group"
      >
        <ChevronLeft className="w-5 h-5 text-[var(--ds-text-primary)] group-hover:text-[var(--ds-text-secondary)] transition-colors shrink-0" />
        <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px]">Back</span>
      </button>

      {/* Center Search (Figma top: 40px) */}
      <div className="hidden sm:block">
        <GlobalSearch hasSidebar={false} />
      </div>

      {/* Cross / Close to Feed button (top: 40px, right: 40px) */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close to feed"
        className="fixed top-6 right-4 sm:top-10 sm:right-10 flex items-center justify-center w-9 h-9 rounded-md text-[var(--ds-text-primary)] hover:text-[var(--ds-text-secondary)] transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] z-[60]"
      >
        <X className="w-5 h-5" />
      </button>
    </>
  );

  if (isUserLoading) {
    return (
      <div className="w-full min-h-screen bg-[var(--ds-bg)] flex flex-col items-center pt-20 sm:pt-[100px] relative">
        {renderTopNavigation()}
        <div className="flex-1 flex justify-center items-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--ds-accent)] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const userDataForModal = user as unknown as any;

  if (userError || !user) {
    return (
      <div className="min-h-screen w-full bg-[var(--ds-bg)] flex flex-col items-center justify-center p-5 select-none">
        {/* FullPageError: max-w-[800px], flex flex-col items-center justify-center, gap: 24px */}
        <div className="w-full max-w-[800px] flex flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-200">
          {/* IconFrame: 64x64px, rounded-full, bg #1A1A20, p-4 (16px) */}
          <div className="w-16 h-16 rounded-full bg-[var(--ds-surface-1)] p-4 flex items-center justify-center shrink-0">
            <BlockIcon
              size={32}
              className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0"
              fill="var(--ds-text-muted)"
            />
          </div>

          {/* TextBlock: w: 760px, gap: 8px, text-center */}
          <div className="w-full max-w-[760px] flex flex-col items-center gap-2">
            {/* Title: 16px semibold (600), line-height: 24px, #FFECE6 */}
            <h1 className="text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 text-center">
              Profile unavailable
            </h1>

            {/* Description: 14px regular (400), line-height: 20px, #B8ADA8, max-w-[360px] */}
            <p className="w-full max-w-[360px] text-[var(--ds-text-secondary)] text-sm font-normal font-['DM_Sans'] leading-5 text-center">
              This profile could not be found. It may have been removed, or the link may be incorrect.
            </p>
          </div>

          {/* Primary emphasis button: h: 36px, px: 12px, py: 6px, gap: 10px, bg: #EC6229, rounded: 100px */}
          <button
            type="button"
            onClick={() => router.push('/feed')}
            className="h-9 px-3 py-1.5 bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] rounded-[100px] flex items-center justify-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
          >
            <span className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
              Back to Feed
            </span>
          </button>
        </div>
      </div>
    );
  }

  const profileActionButtons = blocked ? null : (
    <>
      {/* ── SCENARIO 2: pending_received — ACCEPT + DECLINE ── */}
      {!isCompanyActor && isPendingReceived && (
        <>
          <button
            type="button"
            onClick={handleAccept}
            className="px-3 py-1.5 rounded-[100px] bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] flex justify-center items-center gap-2.5 transition-all cursor-pointer"
          >
            <span className="text-white text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
              Accept
            </span>
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-[0.98] flex justify-center items-center gap-2.5 transition-all cursor-pointer"
          >
            <span className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
              Decline
            </span>
          </button>
        </>
      )}

      {/* ── SCENARIO 1: pending_sent — WITHDRAW ── */}
      {!isCompanyActor && isPendingSent && !isCreatorMode && (
        <button
          type="button"
          onClick={handleWithdraw}
          className="px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-[0.98] flex justify-center items-center gap-2.5 transition-all cursor-pointer"
        >
          <span className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
            Withdraw
          </span>
        </button>
      )}

      {/* ── SCENARIO 3a: no relationship, target < 2 connections → CONNECT ── */}
      {showConnect && (
        <button
          type="button"
          onClick={handleConnect}
          className="px-3 py-1.5 rounded-[100px] bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] flex justify-center items-center gap-2.5 transition-all cursor-pointer"
        >
          <span className="text-white text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
            Connect
          </span>
        </button>
      )}

      {/* ── SCENARIO 3b: no relationship, target >= 500 connections → FOLLOW ── */}
      {showFollow && (
        <button
          type="button"
          onClick={handleFollowToggle}
          disabled={followLoading}
          className={cn(
            "px-3 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 transition-all cursor-pointer active:scale-[0.98]",
            following
              ? "border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)]"
              : "bg-[var(--ds-accent)] hover:opacity-90"
          )}
        >
          <span className={cn(
            "text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap",
            following ? "text-[var(--ds-text-primary)]" : "text-white"
          )}>
            {following ? "Unfollow" : "Follow"}
          </span>
        </button>
      )}

      {/* ── MESSAGE (Always Shown except for incoming requests) ── */}
      {!isPendingReceived && (
        <button
          type="button"
          onClick={handleMessage}
          className="px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-[0.98] flex justify-center items-center gap-2.5 transition-all cursor-pointer"
        >
          <span className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
            Message
          </span>
        </button>
      )}

      {/* More button: Mobile → Drawer, Desktop → Dropdown */}
      {isMobile ? (
        <button
          type="button"
          onClick={() => setIsMobileMoreOpen(true)}
          className="px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-[0.98] flex justify-center items-center gap-2.5 transition-all cursor-pointer outline-none"
        >
          <span className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
            More
          </span>
        </button>
      ) : (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-[0.98] flex justify-center items-center gap-2.5 transition-all cursor-pointer outline-none"
            >
              <span className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
                More
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="p-3 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-2xl flex flex-col justify-start items-start gap-4 overflow-hidden shadow-2xl z-50 outline-none min-w-[155px]"
            align="end"
            sideOffset={8}
          >
            {/* Show Follow in More menu whenever Follow is not the primary header button and not connected */}
            {!showFollow && !isConnected && (
              <DropdownMenuItem
                onClick={handleFollowToggle}
                className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-sm font-normal font-['DM_Sans'] leading-5 cursor-pointer outline-none transition-colors border-none"
              >
                {following ? "Unfollow" : "Follow"}
              </DropdownMenuItem>
            )}

            {/* ── SCENARIO 2: pending_received — show Message in menu ── */}
            {isPendingReceived && (
              <DropdownMenuItem
                onClick={handleMessage}
                className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-sm font-normal font-['DM_Sans'] leading-5 cursor-pointer outline-none transition-colors border-none"
              >
                Message
              </DropdownMenuItem>
            )}

            {/* Connection actions in More menu when Follow is the primary header button */}
            {!isCompanyActor && isCreatorMode && connectionStatus === "none" && (
              <DropdownMenuItem
                onClick={handleConnect}
                className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-sm font-normal font-['DM_Sans'] leading-5 cursor-pointer outline-none transition-colors border-none"
              >
                Connect
              </DropdownMenuItem>
            )}

            {!isCompanyActor && isCreatorMode && isPendingSent && (
              <DropdownMenuItem
                onClick={handleWithdraw}
                className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-sm font-normal font-['DM_Sans'] leading-5 cursor-pointer outline-none transition-colors border-none"
              >
                Withdraw request
              </DropdownMenuItem>
            )}

            {/* ── Connected state — Remove connection ── */}
            {!isCompanyActor && isConnected && (
              <DropdownMenuItem
                onClick={() => setShowRemoveConnectionDialog(true)}
                className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-sm font-normal font-['DM_Sans'] leading-5 cursor-pointer outline-none transition-colors border-none"
              >
                Remove connection
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => setIsContactInfoModalOpen(true)}
              className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-sm font-normal font-['DM_Sans'] leading-5 cursor-pointer outline-none transition-colors border-none"
            >
              Contact info
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleViewResume}
              className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-sm font-normal font-['DM_Sans'] leading-5 cursor-pointer outline-none transition-colors border-none"
            >
              View resume
            </DropdownMenuItem>

            {Number(user?.profile_score?.score) >= 100 && (
              <DropdownMenuItem
                onClick={handleDownloadProfile}
                className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-sm font-normal font-['DM_Sans'] leading-5 cursor-pointer outline-none transition-colors border-none"
              >
                Download profile
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => setIsShareModalOpen(true)}
              className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-sm font-normal font-['DM_Sans'] leading-5 cursor-pointer outline-none transition-colors border-none"
            >
              Share profile
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setShowBlockDialog(true)}
              className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-sm font-normal font-['DM_Sans'] leading-5 cursor-pointer outline-none transition-colors border-none"
            >
              Block profile
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setIsReportModalOpen(true)}
              className="!p-0 !m-0 w-full justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-sm font-normal font-['DM_Sans'] leading-5 cursor-pointer outline-none transition-colors border-none"
            >
              Report profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );

  return (
    <div className="w-full min-h-screen bg-[var(--ds-bg)] text-[var(--ds-text-primary)] font-['DM_Sans'] flex flex-col items-center pt-20 sm:pt-[100px] pb-16 px-4 select-text relative">
      {renderTopNavigation()}

      {/* 800px Centered Main Profile Container */}
      <div className="w-full max-w-[800px] flex flex-col items-start gap-5">
        {/* Cover + Profile Image + Action Buttons */}
        <ProfileCoverSection
          coverImage={blocked ? null : user?.cover_image}
          avatarImage={blocked ? null : user?.avatar}
          userName={user?.name}
          isOwnProfile={false}
          onEditAvatar={blocked ? undefined : () => setIsViewAvatarOpen(true)}
          actionButtons={
            blocked ? null : (
              <div className="hidden md:inline-flex justify-start items-center gap-3">
                {profileActionButtons}
              </div>
            )
          }
        />

        {/* User Bio & Details */}
        <ProfileUserBio
          actionButtons={
            blocked ? null : (
              <div className="flex md:hidden w-full justify-start items-center gap-3 pt-2">
                {profileActionButtons}
              </div>
            )
          }
          fullName={user?.name}
          userName={user?.account_name || user?.name?.toLowerCase().replace(/\s+/g, ".")}
          role={user?.headline}
          location={user?.location}
          openTo={user?.identity?.openTo}
          availability={user?.identity?.availability}
          workPreference={user?.identity?.workPreference}
          website={user?.website}
          followersCount={blocked ? 0 : (user?.followers_count ?? 0)}
          followingCount={blocked ? 0 : (user?.following_count ?? 0)}
          connectionsCount={blocked ? 0 : (user?.connections_count ?? 0)}
          onOpenFollowers={blocked ? undefined : () => openFollowList("followers")}
          onOpenFollowing={blocked ? undefined : () => openFollowList("following")}
          onOpenConnections={blocked ? undefined : () => openFollowList("connections")}
        />

        {/* About Section */}
        {user?.about && (
          <ProfileAboutSection bio={user.about} isOwnProfile={false} />
        )}

        {blocked ? (
          <ProfileBlockedState onUnblock={handleBlockToggle} isLoading={isBlockLoading} />
        ) : (
          <>
            {/* Divider */}
            <div className="w-full max-w-[800px] h-0 border-t border-[var(--ds-text-muted)]/40 self-stretch my-1 flex-none" />

            {/* 1. Post Section */}
            <div className="w-full flex flex-col items-start gap-4">
              <div className="w-full flex justify-between items-center px-4 md:px-0 md:pl-5">
                <div className="w-[43px] h-[24px] text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 flex-none order-0 grow-0">
                  Posts
                </div>
              </div>
              <div className="w-full px-4 md:px-0 md:pl-5">
                <ProfilePostsTab
                  posts={visiblePosts}
                  isOwnProfile={false}
                  userName={user?.name}
                  onSeeAll={() => {
                    saveScrollPosition("profile");
                    router.push(`/profile/${userId}/posts`);
                  }}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="w-full max-w-[800px] h-0 border-t border-[var(--ds-text-muted)]/40 self-stretch my-1 flex-none" />

            {/* 2. Skills Section */}
            <ProfileSkillsTab
              skills={skills}
              isOwnProfile={false}
            />

            {/* 3. Experience Section */}
            {experiences.length > 0 && (
              <>
                {/* Divider */}
                <div className="w-full max-w-[800px] h-0 border-t border-[var(--ds-text-muted)]/40 self-stretch my-1 flex-none" />

                <div className="w-full flex flex-col items-start gap-4">
                  <div className="w-full flex justify-between items-center px-4 md:px-0 md:pl-5">
                    <div className="w-[87px] h-[24px] text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 flex-none order-0 grow-0">
                      Experience
                    </div>
                  </div>
                  <div className="w-full px-4 md:px-0 md:pl-5">
                    <ProfileExperienceTab
                      experiences={experiences}
                      isOwnProfile={false}
                    />
                  </div>
                </div>
              </>
            )}

            {/* 4. Education Section */}
            {educations.length > 0 && (
              <>
                {/* Divider */}
                <div className="w-full max-w-[800px] h-0 border-t border-[var(--ds-text-muted)]/40 self-stretch my-1 flex-none" />

                <div className="w-full flex flex-col items-start gap-4">
                  <div className="w-full flex justify-between items-center px-4 md:px-0 md:pl-5">
                    <div className="w-[79px] h-[24px] text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 flex-none order-0 grow-0">
                      Education
                    </div>
                  </div>
                  <div className="w-full px-4 md:px-0 md:pl-5">
                    <ProfileEducationTab
                      educations={educations}
                      isOwnProfile={false}
                    />
                  </div>
                </div>
              </>
            )}

            {/* 5. Project Section */}
            {projects.length > 0 && (
              <>
                {/* Divider */}
                <div className="w-full max-w-[800px] h-0 border-t border-[var(--ds-text-muted)]/40 self-stretch my-1 flex-none" />

                <div className="w-full flex flex-col items-start gap-4">
                  <div className="w-full flex justify-between items-center px-4 md:px-0 md:pl-5">
                    <div className="w-[56px] h-[24px] text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 flex-none order-0 grow-0">
                      Project
                    </div>
                  </div>
                  <div className="w-full px-4 md:px-0 md:pl-5">
                    <ProfileProjectsTab
                      projects={projects}
                      isOwnProfile={false}
                    />
                  </div>
                </div>
              </>
            )}

          </>
        )}
      </div>

      {/* Modals */}
      {isViewAvatarOpen && (
        <ViewAvatarModal
          isOpen={isViewAvatarOpen}
          onClose={() => setIsViewAvatarOpen(false)}
          avatarUrl={user?.avatar || null}
        />
      )}

      {isContactInfoModalOpen && (
        <ContactInfoModal
          isOpen={isContactInfoModalOpen}
          onClose={() => setIsContactInfoModalOpen(false)}
          user={userDataForModal || null}
          isOwnProfile={false}
        />
      )}

      {isFollowListModalOpen && (
        <FollowListModal
          isOpen={isFollowListModalOpen}
          onClose={() => setIsFollowListModalOpen(false)}
          initialTab={activeFollowTab}
          userId={targetUserId}
          userName={user?.name || user?.account_name || ""}
          isOwnProfile={false}
        />
      )}

      {isDownloadProfileOpen && downloadPdfUrl && (
        <DownloadProfileScreen
          isOpen={isDownloadProfileOpen}
          onClose={() => {
            setIsDownloadProfileOpen(false);
            if (downloadPdfUrl) {
              window.URL.revokeObjectURL(downloadPdfUrl);
              setDownloadPdfUrl(null);
            }
          }}
          pdfUrl={downloadPdfUrl}
        />
      )}

      {isShareModalOpen && (
        <CocpitShareModel
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          profileId={targetUserId}
          entityType="profile"
          entityId={targetUserId}
          customUrl={`/profile/${user?.account_name || targetUserId}`}
          onShare={() => { }}
        />
      )}

      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetId={targetUserId}
          targetType="USER"
        />
      )}

      <SendOfferDialog
        targetUserId={targetUserId}
        targetUserName={user?.name || "Candidate"}
        isOpen={isSendOfferOpen}
        onOpenChange={setIsSendOfferOpen}
      />

      {/* Block Confirmation Modal */}
      <ActionConfirmModal
        isOpen={showBlockDialog}
        onClose={() => setShowBlockDialog(false)}
        onConfirm={handleBlockToggle}
        isLoading={isBlockLoading}
        type={blocked ? "custom" : "block_profile"}
        targetName={user?.name || "this user"}
        title={
          blocked ? (
            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px]">
              Unblock <span className="font-['DM_Sans'] font-semibold text-[14px] leading-[20px]">{user?.name || "this user"}</span>?
            </span>
          ) : undefined
        }
        titleClassName={blocked ? "font-['Poppins'] font-normal text-[14px] leading-[20px]" : undefined}
        description={
          blocked
            ? "They will be able to see your profile and posts again"
            : undefined
        }
        confirmText={blocked ? "Unblock" : undefined}
      />

      {/* Remove Connection Confirmation Modal */}
      <ActionConfirmModal
        isOpen={showRemoveConnectionDialog}
        onClose={() => setShowRemoveConnectionDialog(false)}
        onConfirm={handleRemoveConnection}
        type="remove_connection"
        targetName={user?.name}
      />

      {/* Unfollow Confirmation Modal */}
      <ActionConfirmModal
        isOpen={showUnfollowDialog}
        onClose={() => setShowUnfollowDialog(false)}
        onConfirm={async () => {
          const targetIdToUse = user?.id || targetUserId;
          if (targetIdToUse) {
            const userName = user?.name || undefined;
            await unfollowUser(targetIdToUse, userName);
            refetchProfile();
          }
          setShowUnfollowDialog(false);
        }}
        type="unfollow"
        targetName={user?.name}
      />

      {/* Mobile Public Profile More Drawer */}
      <MobilePublicProfileMenuDrawer
        isOpen={isMobileMoreOpen}
        onClose={() => setIsMobileMoreOpen(false)}
        isCompanyActor={isCompanyActor}
        connectionStatus={connectionStatus}
        showFollowPrimary={showFollow}
        isFollowing={following}
        onFollow={handleFollowToggle}
        onConnect={handleConnect}
        onWithdraw={handleWithdraw}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onMessage={handleMessage}
        onRemoveConnection={() => {
          setIsMobileMoreOpen(false);
          setShowRemoveConnectionDialog(true);
        }}
        onContactInfo={() => {
          setIsMobileMoreOpen(false);
          setIsContactInfoModalOpen(true);
        }}
        onSendOffer={() => setIsSendOfferOpen(true)}
        onViewResume={handleViewResume}
        onDownloadProfile={handleDownloadProfile}
        onShareProfile={() => setIsShareModalOpen(true)}
        onBlockProfile={() => setShowBlockDialog(true)}
        onReportProfile={() => setIsReportModalOpen(true)}
        profileScore={user?.profile_score?.score}
      />
    </div>
  );
}
