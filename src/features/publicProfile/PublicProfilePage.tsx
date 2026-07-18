"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, MessageCircle, UserPlus, UserCheck, Share2, Link as LinkIcon, Flag } from "lucide-react";
import { BackButton } from "@/components/shared/BackButton";
import { toast } from "sonner";

import { SkillOverlap } from "./components/SkillOverlap";
import { ConnectionButton } from "./components/ConnectionButton";

// Shared common profile components
import { ProfileHeader } from "@/features/profile/commonProfileComponents/ProfileHeader";
import { ProfileAbout } from "@/features/profile/commonProfileComponents/ProfileAbout";
import { LivingResume } from "@/features/profile/commonProfileComponents/LivingResume";
import { ProfilePosts } from "@/features/profile/commonProfileComponents/ProfilePosts";
import { ProfileSkills } from "@/features/profile/commonProfileComponents/ProfileSkills";
import { ProfileExperience } from "@/features/profile/commonProfileComponents/ProfileExperience";
import { ProfileEducation } from "@/features/profile/commonProfileComponents/ProfileEducation";
import { ViewAvatarModal } from "@/features/profile/commonProfileComponents/ViewAvatarModal";
import { SendOfferDialog } from "@/features/profile/commonProfileComponents/SendOfferDialog";
import { ProfileSkeleton } from "@/features/profile/commonProfileComponents/ProfileSkeleton";
import { OffersTab } from "@/features/profile/commonProfileComponents/OffersTab";

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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

// Hooks and services
import { useProfile, useProfilePosts } from "./hooks/usePublicProfile";
import { useSocial } from "@/context/SocialContext";
import { initialSkills as currentUserSkills } from "@/lib/data/profile";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { getProfileStats, recordProfileView, getProfileViewCount } from "./services/publicProfile.service";
import { CompanyRoleModal } from "@/features/profile/components/CompanyRoleModal";
import { FollowListModal } from "@/features/profile/components/FollowListModal";
import { ContactInfoModal } from "@/features/profile/components/ContactInfoModal";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import { ReportModal } from "@/components/shared/ReportModal";
import { Experience } from "@/types/entities";
import { CompanyRole } from "@/types/user";

interface PublicProfileProps {
  userId: string;
}

function groupExperiences(experiences: Experience[]) {
  const groupsMap = new Map();
  experiences.forEach(exp => {
    const key = exp.company_name;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, { company_name: exp.company_name, logo_url: exp.logo_url || exp.company_logo || null, experiences: [] });
    }
    groupsMap.get(key).experiences.push(exp);
  });
  return Array.from(groupsMap.values());
}

export default function PublicProfilePage({ userId }: PublicProfileProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { isFollowing, followUser, unfollowUser, startChat, isFollowLoading, blockUser, unblockUser, isBlocked } = useSocial();
  const { activeProfile } = useActiveProfile();
  
  const [isViewAvatarOpen, setIsViewAvatarOpen] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CompanyRole | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isFollowListModalOpen, setIsFollowListModalOpen] = useState(false);
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [activeFollowTab, setActiveFollowTab] = useState<"followers" | "following" | "connections">("followers");

  // TanStack Query Hooks
  const { data: user, isLoading: isUserLoading, error: userError } = useProfile(userId);
  const { data: publicPosts, isLoading: isPostsLoading } = useProfilePosts(userId);

  // Filter out private posts from the main profile page preview
  const visiblePosts = useMemo(() => {
    if (!publicPosts) return [];
    return publicPosts.filter(post => post.visibility !== 'private');
  }, [publicPosts]);

  // Scroll Restoration Logic
  const hasRestoredScroll = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (typeof window !== "undefined" && !(window as any).__cocpit_popstate_registered) {
      (window as any).__cocpit_popstate_registered = true;
      window.addEventListener("popstate", () => {
        sessionStorage.setItem("cocpit_popstate_occurred", "true");
      }, { capture: true });
    }

    if (typeof window !== "undefined" && !(window as any).__cocpit_history_patched) {
      (window as any).__cocpit_history_patched = true;

      const handleRouteScroll = (url: string | URL | null | undefined) => {
        if (!url) return;
        const urlStr = url.toString();
        if (!urlStr.includes("/post/")) return;

        const isComments = urlStr.includes("comments=true");

        // Disconnect any existing observer
        if ((window as any).__cocpit_scroll_observer) {
          try {
            (window as any).__cocpit_scroll_observer.disconnect();
          } catch (e) {}
        }

        let observerTimeout: NodeJS.Timeout;

        const cleanup = () => {
          observer.disconnect();
          clearTimeout(observerTimeout);
          window.removeEventListener("wheel", handleUserInteraction);
          window.removeEventListener("touchmove", handleUserInteraction);
          window.removeEventListener("keydown", handleUserInteraction);
        };

        const handleUserInteraction = () => {
          cleanup();
        };

        const observer = new MutationObserver(() => {
          if (window.location.pathname.includes("/post/")) {
            const hasPostDetails = document.querySelector(".feed-card-shell");
            if (hasPostDetails) {
              if (isComments) {
                window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
              } else {
                window.scrollTo({ top: 0, behavior: "instant" });
                cleanup();
              }
            }
          }
        });

        (window as any).__cocpit_scroll_observer = observer;

        window.addEventListener("wheel", handleUserInteraction, { passive: true });
        window.addEventListener("touchmove", handleUserInteraction, { passive: true });
        window.addEventListener("keydown", handleUserInteraction, { passive: true });

        // Run once immediately in case the elements are already rendered
        if (window.location.pathname.includes("/post/")) {
          const hasPostDetails = document.querySelector(".feed-card-shell");
          if (hasPostDetails) {
            if (isComments) {
              window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
            } else {
              window.scrollTo({ top: 0, behavior: "instant" });
              cleanup();
              return;
            }
          }
        }

        observer.observe(document.body, { childList: true, subtree: true });

        observerTimeout = setTimeout(cleanup, 2500);
      };

      const originalPushState = window.history.pushState;
      window.history.pushState = function(state, unused, url) {
        originalPushState.apply(this, [state, unused, url]);
        try {
          handleRouteScroll(url);
        } catch (e) {
          console.error(e);
        }
      };

      const originalReplaceState = window.history.replaceState;
      window.history.replaceState = function(state, unused, url) {
        originalReplaceState.apply(this, [state, unused, url]);
        try {
          handleRouteScroll(url);
        } catch (e) {
          console.error(e);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (hasRestoredScroll.current) return;

    const historyState = typeof window !== "undefined" ? window.history.state : null;

    const savedPath = historyState?.cocpit_scroll_path || sessionStorage.getItem("cocpit_profile_scroll_path");
    const savedScrollY = historyState?.cocpit_scroll_y !== undefined ? historyState.cocpit_scroll_y.toString() : sessionStorage.getItem("cocpit_profile_scroll_y");
    const savedSource = historyState?.cocpit_scroll_source || sessionStorage.getItem("cocpit_profile_scroll_source");
    const popstateOccurred = (historyState?.cocpit_popstate_occurred ? "true" : "") || sessionStorage.getItem("cocpit_popstate_occurred");

    const isTargetPage = savedPath === window.location.pathname && savedSource === "post" && popstateOccurred === "true" && savedScrollY;

    const clearScrollData = () => {
      sessionStorage.removeItem("cocpit_profile_scroll_path");
      sessionStorage.removeItem("cocpit_profile_scroll_y");
      sessionStorage.removeItem("cocpit_profile_scroll_source");
      sessionStorage.removeItem("cocpit_popstate_occurred");

      if (typeof window !== "undefined") {
        try {
          const currentState = { ...window.history.state };
          delete currentState.cocpit_scroll_y;
          delete currentState.cocpit_scroll_source;
          delete currentState.cocpit_scroll_path;
          delete currentState.cocpit_popstate_occurred;
          window.history.replaceState(currentState, "", window.location.href);
        } catch (e) {}
      }
    };

    if (isTargetPage) {
      const targetScroll = parseInt(savedScrollY, 10);
      if (!isNaN(targetScroll)) {
        // Disconnect any existing observer
        if ((window as any).__cocpit_profile_restore_observer) {
          try {
            (window as any).__cocpit_profile_restore_observer.disconnect();
          } catch (e) {}
        }

        const cleanup = () => {
          observer.disconnect();
          window.removeEventListener("wheel", handleUserInteraction);
          window.removeEventListener("touchmove", handleUserInteraction);
          window.removeEventListener("keydown", handleUserInteraction);
        };

        const handleUserInteraction = () => {
          // If user interacts manually, cancel auto-scrolling
          hasRestoredScroll.current = true;
          clearScrollData();
          cleanup();
        };

        const observer = new MutationObserver(() => {
          window.scrollTo(0, targetScroll);
          const currentScroll = window.scrollY;

          // Once the page height expands enough and scroll succeeds, finish and cleanup
          if (Math.abs(currentScroll - targetScroll) < 5) {
            hasRestoredScroll.current = true;
            clearScrollData();
            cleanup();
          }
        });

        (window as any).__cocpit_profile_restore_observer = observer;

        window.addEventListener("wheel", handleUserInteraction, { passive: true });
        window.addEventListener("touchmove", handleUserInteraction, { passive: true });
        window.addEventListener("keydown", handleUserInteraction, { passive: true });

        // Run once immediately
        window.scrollTo(0, targetScroll);
        if (Math.abs(window.scrollY - targetScroll) < 5) {
          hasRestoredScroll.current = true;
          clearScrollData();
          cleanup();
          return;
        }

        observer.observe(document.body, { childList: true, subtree: true, attributes: true });

        return () => {
          // Clean up on component unmount
          cleanup();
        };
      }
    } else {
      window.scrollTo(0, 0);
      hasRestoredScroll.current = true;
      clearScrollData();
    }
  }, []);
  
  const { data: profileStats } = useQuery({
    queryKey: ['profileStats', userId],
    queryFn: () => getProfileStats(userId),
    enabled: !!userId && !!user,
    staleTime: Infinity,
    refetchOnMount: false,
  });

  // Record profile view
  useEffect(() => {
    if (user && userId && session?.user?.id && userId !== session.user.id) {
      recordProfileView(userId, 'user').catch(() => {
        // Silently ignore tracking errors to avoid console spam
      });
    }
  }, [userId, session?.user?.id, user]);

  const isOwnProfile = !!(activeProfile?.type === 'USER' && (session?.user?.id === userId || (user && session?.user?.id === user.id)));
  const isUserFollowing = user ? isFollowing(user.id) : false;
  const isUserBlocked = user ? isBlocked(user.id) : false;

  const queryClient = useQueryClient();
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['profileStats', userId] });
    queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    queryClient.invalidateQueries({ queryKey: ['followers', userId] });
    queryClient.invalidateQueries({ queryKey: ['following', userId] });
  }, [isUserFollowing, userId, queryClient]);

  const handleFollowToggle = useCallback(() => {
    if (!user) return;
    if (isUserFollowing) {
      unfollowUser(user.id);
    } else {
      followUser(user.id);
    }
  }, [user, isUserFollowing, unfollowUser, followUser]);

  const handleMessage = useCallback(() => {
    if (!user) return;
    const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
    startChat(user.id, companyId);
  }, [user, activeProfile, startChat]);

  const handleBlock = useCallback(async () => {
    if (!user) return;
    await blockUser(user.id);
    setShowBlockDialog(false);
    window.location.reload();
  }, [user, blockUser]);

  const handleRoleClick = useCallback((role: CompanyRole) => {
    setSelectedRole(role);
    setIsRoleModalOpen(true);
  }, []);

  const openFollowList = useCallback((tab: "followers" | "following" | "connections") => {
    setActiveFollowTab(tab);
    setIsFollowListModalOpen(true);
  }, []);

  // Sort and group experiences
  const flatExperiences = useMemo(() => {
    const exps = user?.experiences || [];
    return [...exps].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }, [user?.experiences]);

  const groupedExperiences = useMemo(() => {
    if (!user?.experiences) return [];
    return groupExperiences(flatExperiences);
  }, [user?.experiences, flatExperiences]);

  const latestExperience = flatExperiences[0] || null;
  const latestEducation = user?.educations?.[0] || null;

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-card">
        <div className="w-full md:max-w-[998px] mx-auto pt-0 md:pt-8 pb-[100px] md:pb-12 px-0 md:px-4 xl:px-0">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Profile Unavailable</h1>
          <p className="text-muted-foreground">
            The user you are looking for could not be found. They may have been removed or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/feed')}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-4 cursor-pointer"
          >
            Return to Feed
          </button>
        </div>
      </div>
    );
  }

  // Action slots for shared ProfileHeader
  const publicActions = !isOwnProfile && (
    <>
      <button
        onClick={handleMessage}
        title="Message"
        className="bg-background hover:bg-muted text-foreground border border-input p-2 sm:px-4 sm:py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
      >
        <MessageCircle className="w-5 h-5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Message</span>
      </button>
      <SendOfferDialog targetUserId={user.id} targetUserName={user.name} />
      <button
        onClick={handleFollowToggle}
        disabled={isFollowLoading(user.id)}
        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer ${
          isUserFollowing
            ? "bg-muted text-foreground hover:bg-muted/80"
            : "bg-primary text-primary-foreground hover:opacity-90"
        } ${isFollowLoading(user.id) ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isUserFollowing ? (
          <>
            <UserCheck className="w-4 h-4" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Follow
          </>
        )}
      </button>
    </>
  );

  const dropdownActions = !isOwnProfile && (
    <>
      <ConnectionButton
        asMenuItem
        userId={user.id}
        username={userId}
        isFollowing={user.is_following || false}
        isFollowedBy={user.is_followed_by || false}
        connectionRequestStatus={user.connection_request_status}
        connectionRequestId={user.connection_request_id}
        connectionRequestSender={user.connection_request_sender}
      />
      <DropdownMenuItem
        onClick={() => setIsShareModalOpen(true)}
        className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none group transition-colors"
      >
        <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Share Profile</span>
        <Share2 className="w-4 h-4 text-black group-focus:text-[#6366F1] transition-colors" />
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Profile link copied");
        }}
        className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none group transition-colors"
      >
        <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Copy Profile Link</span>
        <LinkIcon className="w-4 h-4 text-black group-focus:text-[#6366F1] transition-colors" />
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setIsReportModalOpen(true)}
        className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none group transition-colors"
      >
        <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Report Profile</span>
        <Flag className="w-4 h-4 text-black group-focus:text-[#6366F1] transition-colors" />
      </DropdownMenuItem>
      {isUserBlocked ? (
        <DropdownMenuItem
          onClick={async () => {
            if (user) {
              await unblockUser(user.id);
              window.location.reload();
            }
          }}
          className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none group transition-colors"
        >
          <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Unblock User</span>
          <Ban className="w-4 h-4 group-focus:text-[#6366F1] transition-colors" />
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem
          onClick={() => setShowBlockDialog(true)}
          className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-red-50 focus:text-destructive text-destructive rounded-xl outline-none group transition-colors"
        >
          <span className="text-sm font-medium group-focus:text-destructive">Block User</span>
          <Ban className="w-4 h-4 group-focus:text-destructive transition-colors" />
        </DropdownMenuItem>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-card">
      <div className="w-full md:max-w-[998px] mx-auto pt-0 md:pt-8 pb-[100px] md:pb-12 px-0 md:px-4 xl:px-0">
        <div className="px-4 md:px-0 mb-4">
          <BackButton />
        </div>

        <div id="profile-card" className="overflow-hidden relative bg-card md:rounded-[24px] rounded-none border-none outline-none pb-8 md:pb-0">
          <ProfileHeader
            user={user}
            isOwnProfile={isOwnProfile}
            coverImage={user.cover_image}
            profileStats={profileStats}
            latestExperience={latestExperience}
            latestEducation={latestEducation}
            onAvatarClick={() => setIsViewAvatarOpen(true)}
            onContactInfoClick={() => setIsContactInfoModalOpen(true)}
            onShareProfileClick={() => setIsShareModalOpen(true)}
            onFollowListClick={openFollowList}
            onRoleClick={handleRoleClick}
            publicActions={publicActions}
            dropdownActions={dropdownActions}
          />

          <SkillOverlap currentUserSkills={currentUserSkills} profileUserSkills={user.skills} />

          <ProfileAbout
            aboutText={user.about}
            isOwnProfile={isOwnProfile}
          />

          <LivingResume
            experiences={flatExperiences}
            skills={user.skills}
            resumeName={user.resume?.originalName}
            resumeUrl={user.resume?.url}
            isOwnProfile={isOwnProfile}
          />

          <ProfilePosts
            posts={visiblePosts}
            isOwnProfile={isOwnProfile}
            isCompany={activeProfile?.type === 'COMPANY'}
            profileSlug={user?.account_name || user?.id || ""}
            userName={user?.name || ""}
            isLoading={isPostsLoading}
          />

          <ProfileSkills
            skills={user.skills}
            experiences={flatExperiences}
            posts={visiblePosts}
            isOwnProfile={isOwnProfile}
          />

          <ProfileExperience
            experiences={groupedExperiences}
            isOwnProfile={isOwnProfile}
          />

          <ProfileEducation
            educations={user.educations || []}
            isOwnProfile={isOwnProfile}
          />

          <OffersTab isOwnProfile={isOwnProfile} />
        </div>
      </div>

      <ViewAvatarModal
        isOpen={isViewAvatarOpen}
        onClose={() => setIsViewAvatarOpen(false)}
        avatarUrl={user?.avatar || null}
      />

      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Block {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will not be able to find your profile, posts, or message you. This will also remove any connection between you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer">
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CocpitShareModel
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        profileId={user?.id}
        onShare={(selectedIds) => {
          console.log("Shared profile with:", selectedIds);
          setIsShareModalOpen(false);
        }}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="USER"
        targetId={user.id}
      />

      <CompanyRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        role={selectedRole}
        isOwnProfile={isOwnProfile}
      />

      <FollowListModal
        isOpen={isFollowListModalOpen}
        onClose={() => setIsFollowListModalOpen(false)}
        initialTab={activeFollowTab}
        userId={user?.id || ""}
      />

      <ContactInfoModal
        isOpen={isContactInfoModalOpen}
        onClose={() => setIsContactInfoModalOpen(false)}
        user={user as any}
        isOwnProfile={false}
      />
    </div>
  );
}
