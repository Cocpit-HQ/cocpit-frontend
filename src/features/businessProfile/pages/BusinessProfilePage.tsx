/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessProfileService } from "../services/businessProfile.service";
import { BusinessProfileData } from "../types/business-profile.types";
import BusinessProfileHeader from "../components/BusinessProfileHeader";
import BusinessProfileTabs from "../components/BusinessProfileTabs";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useSocket } from "@/context/SocketContext";
import { Icon } from "@iconify/react";
import { ChevronLeft, X, Building2 } from "lucide-react";
import { GlobalSearch } from "@/features/navigation/components/GlobalSearch";
import { useUIStore } from "@/store/ui.store";
import { toast } from "sonner";

interface BusinessProfilePageProps {
  isOwnProfile?: boolean;
}

export function BusinessProfilePage({ isOwnProfile = false }: BusinessProfilePageProps) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExplicitPublic = searchParams?.get("view") === "public" || searchParams?.get("mode") === "public" || searchParams?.get("preview") === "true";
  const rawSlug = (params?.slug as string) || "";
  const slug = decodeURIComponent(rawSlug);
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const { data: profileResponse, isLoading, isError } = useQuery({
    queryKey: ["companyProfile", rawSlug],
    queryFn: () => businessProfileService.getOrgProfile(rawSlug),
    retry: false,
    staleTime: 0,
  });

  const { activeProfile } = useActiveProfile();
  const { data: session } = useSession();
  const { setOrgPublicView } = useUIStore();

  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  const derivedOrgId = profileResponse?.org?.company_id || profileResponse?.org?.org_id || null;

  React.useEffect(() => {
    if (!socket) return;

    const handlePrivacyUpdate = (payload: { orgId?: string }) => {
      if (!derivedOrgId || !payload?.orgId || payload.orgId === derivedOrgId) {
        queryClient.invalidateQueries({ queryKey: ["companyProfile", rawSlug] });
        queryClient.invalidateQueries({ queryKey: ["orgProfile", rawSlug] });
      }
    };

    socket.on("company_privacy_updated", handlePrivacyUpdate);
    socket.on("ORGANIZATION_PRIVACY_UPDATED", handlePrivacyUpdate);

    return () => {
      socket.off("company_privacy_updated", handlePrivacyUpdate);
      socket.off("ORGANIZATION_PRIVACY_UPDATED", handlePrivacyUpdate);
    };
  }, [socket, derivedOrgId, rawSlug, queryClient]);

  const company = profileResponse?.org || profileResponse?.organization || {};
  const isEdu =
    company.entity_type === "INSTITUTION" ||
    (company as any)?.entityType === "INSTITUTION" ||
    Boolean(company.institution_type) ||
    ["school", "college", "university", "coaching", "tuition", "higher education"].includes((company.industry || "").toLowerCase().trim());
  const orgId = company.company_id || company.org_id || company.id || derivedOrgId;

  const { data: peopleResponse } = useQuery({
    queryKey: ["orgPeoplePreview", orgId, isEdu],
    queryFn: () =>
      isEdu
        ? businessProfileService.getOrgAlumni(orgId, { page: 1, limit: 4 })
        : businessProfileService.getOrgPeople(orgId, { page: 1, limit: 4 }),
    enabled: Boolean(orgId),
    staleTime: 60000,
  });
  const unblockMutation = useMutation({
    mutationFn: () => businessProfileService.unblockTarget(orgId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProfile", rawSlug] });
      queryClient.invalidateQueries({ queryKey: ["companyProfile"] });
      queryClient.invalidateQueries({ queryKey: ["company_relationship", orgId] });
      toast.success("Profile unblocked successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to unblock company");
    },
  });

  // Normalized comparisons to detect if activeProfile actor is this organization
  const normalizedActiveSlug = activeProfile?.slug ? decodeURIComponent(activeProfile.slug).toLowerCase().trim() : "";
  const normalizedPageSlug = slug.toLowerCase().trim();
  const normalizedActiveName = activeProfile?.name ? activeProfile.name.toLowerCase().trim() : "";
  const normalizedCompanyName = company?.name ? company.name.toLowerCase().trim() : "";

  const isActorThisCompany = activeProfile?.type === "COMPANY" && Boolean(
    (activeProfile.id && (
      activeProfile.id === company.company_id ||
      activeProfile.id === company.org_id ||
      activeProfile.id === company.id ||
      activeProfile.id === (company as any)._id ||
      activeProfile.id === derivedOrgId
    )) ||
    (normalizedActiveSlug && (normalizedActiveSlug === normalizedPageSlug || normalizedActiveSlug === company.slug?.toLowerCase().trim())) ||
    (normalizedActiveName && (normalizedActiveName === normalizedCompanyName || normalizedActiveName === normalizedPageSlug))
  );

  const isOrgAdminOrOwner = Boolean(
    profileResponse?.is_own_profile ||
    profileResponse?.viewer_permissions?.includes('*') ||
    profileResponse?.viewer_permissions?.includes('MANAGE_COMPANY') ||
    profileResponse?.viewer_permissions?.includes('MANAGE_ORGANIZATION')
  );

  const hasEditPermission = Boolean(
    isOwnProfile ||
    isOrgAdminOrOwner ||
    profileResponse?.viewer_permissions?.includes('MANAGE_COMPANY_DETAILS') ||
    isActorThisCompany
  );

  // When visiting as a user (not active company actor) or with ?view=public, open as public profile
  const isPublicView = isExplicitPublic || !isActorThisCompany;
  const ownProfile = !isPublicView;
  const canManageCompany = ownProfile && isOrgAdminOrOwner;

  React.useEffect(() => {
    if (isLoading) return;
    if (isPublicView) {
      setOrgPublicView(true);
    } else {
      setOrgPublicView(false);
    }
    return () => {
      setOrgPublicView(false);
    };
  }, [isLoading, isPublicView, setOrgPublicView]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ds-bg)]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--ds-accent)]"></div>
      </div>
    );
  }

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
  if (isError || !profileResponse || !profileResponse.org) {
    return (
      <div className="min-h-screen bg-[var(--ds-bg)] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md mx-auto bg-[var(--ds-surface-1)] border border-[var(--ds-border)] p-8 rounded-[16px]">
          <div className="w-16 h-16 bg-[var(--ds-surface-2)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon icon="lucide:ban" className="w-8 h-8 text-[var(--ds-text-muted)]" />
          </div>
          <h1 className="text-xl font-bold text-[var(--ds-text-primary)]">Profile Unavailable</h1>
          <p className="text-[var(--ds-text-secondary)] text-sm leading-relaxed">
            The profile you are looking for could not be found. They may have been removed or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/feed')}
            className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors bg-[var(--ds-accent)] text-white hover:opacity-90 h-9 px-6 py-2 mt-4 cursor-pointer"
          >
            Return to Feed
          </button>
        </div>
      </div>
    );
  }

  const isBlocked = Boolean(profileResponse?.relationship?.is_blocked);

  const renderTopNavigation = () => (
    <>
      {/* Occlusion bar for smooth scrolling under top navigation */}
      <div className="fixed top-0 left-0 right-0 h-[88px] sm:h-[100px] bg-ds-bg z-40 pointer-events-none" />

      {/* Back button (top: 40px, left: 40px) */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Back"
        className="fixed top-6 left-4 sm:top-10 sm:left-10 flex items-center gap-2 h-9 px-2 rounded-md text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent z-[60] group"
      >
        <ChevronLeft className="w-5 h-5 text-ds-text-primary group-hover:text-ds-text-secondary transition-colors shrink-0" />
        <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px]">Back</span>
      </button>

      {/* Center Search (Figma top: 40px) */}
      {!isBlocked && (
        <div className="w-full">
          <GlobalSearch hasSidebar={false} />
        </div>
      )}

      {/* Cross / Close to Feed button (top: 40px, right: 40px) */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close to feed"
        className="fixed top-6 right-4 sm:top-10 sm:right-10 flex items-center justify-center w-9 h-9 rounded-md text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent z-[60]"
      >
        <X className="w-5 h-5" />
      </button>
    </>
  );

  const currentUserId = (session?.user as any)?.id;
  const canManageOwnPosts = Boolean(
    ownProfile && (canManageCompany || profileResponse.viewer_permissions?.includes('CREATE_POST'))
  );

  const effectiveViewerPermissions = isOrgAdminOrOwner
    ? Array.from(new Set([...(profileResponse.viewer_permissions || []), '*']))
    : (profileResponse.viewer_permissions || []);

  const data: BusinessProfileData = {
    id: company.company_id || company.org_id || company.id || derivedOrgId,
    orgId: company.company_id || company.org_id || company.id || derivedOrgId,
    name: company.name,
    slug: rawSlug,
    logoUrl: company.logo_url,
    coverUrl: company.cover_url,
    isVerified: Boolean(
      company.verification_status === 'VERIFIED' ||
      company.verification_status === 'DOMAIN_VERIFIED' ||
      company.verification_status === 'DOCUMENT_VERIFIED' ||
      company.verificationStatus === 'VERIFIED' ||
      company.verified_edu ||
      company.is_verified ||
      company.isVerified ||
      company.verified
    ),
    tagline: company.headline || company.slogan || "",
    industry: (isEdu ? (company.institution_type || company.industry) : company.industry) || (isEdu ? "Higher Education" : ""),
    location: company.location || company.city || "",
    employeeCount: company.size || "",
    websiteUrl: company.website || "",
    description: company.description || "",
    slogan: company.slogan || "",
    socialLinks: profileResponse.links ? profileResponse.links.map((link: any) => ({ label: link.display_label || link.platform, platform: link.platform, url: link.url })) : [],
    email: company.email || "",
    phoneNumber: company.phone || company.phoneNumber || "",
    isEmailShow: company.isEmailShow ?? company.is_email_show ?? true,
    isMobileShow: company.isMobileShow ?? company.is_mobile_show ?? true,
    showMessage: company.showMessage ?? true,
    showFollowersList: company.showFollowersList ?? true,
    showFollowingList: company.showFollowingList ?? true,
    keyOfferings: company.key_offerings || company.keyOfferings || [],
    stats: {
      following: company.following_count || 0,
      followers: company.followers_count || 0,
      subscribers: company.subscribers_count || 0,
    },
    coreTeam: (() => {
      const fetchedPeopleList = peopleResponse?.people || peopleResponse?.alumni || [];
      const backendPeopleList = profileResponse?.people || profileResponse?.alumni || [];
      const coreTeamList = profileResponse?.core_team || [];

      // For public view, strictly show people/alumni associated with the company through Experience.
      // Do not fall back to internal core_team (company owner/admin).
      // If no people are associated, the People section remains hidden on public view.
      // For own profile view, display the company's core team members.
      const rawCandidates = isPublicView
        ? [...fetchedPeopleList, ...backendPeopleList]
        : [...coreTeamList, ...fetchedPeopleList, ...backendPeopleList];

      const seenIds = new Set<string>();
      const resolvedMembers: Array<{
        id: string;
        name: string;
        role: string;
        avatarUrl: string;
      }> = [];

      for (const m of rawCandidates) {
        if (!m) continue;
        const mId = String(m.user_id || m.id || m._id || m.full_name || m.name || "");
        if (!mId || seenIds.has(mId)) continue;
        seenIds.add(mId);

        resolvedMembers.push({
          id: mId,
          name: m.full_name || m.name || "Member",
          role: m.headline || m.title || m.role_display || m.role || (isEdu ? "Alumni" : "Member"),
          avatarUrl: m.avatar_url || m.avatar || m.profile_image || m.avatarUrl || "",
        });

        if (resolvedMembers.length >= 4) {
          break;
        }
      }

      return resolvedMembers;
    })(),
    posts: profileResponse.latest_posts ? profileResponse.latest_posts.map((p: any) => ({
      id: p.post_id || p.id || p._id,
      authorName: p.author?.full_name || p.author_name || company.name,
      authorAvatarUrl: p.author?.avatar_url || p.author_avatar_url || company.logo_url || "/images/companyonboarding/companyprofileDefault.jpg",
      authorSubLabel: "Company Post",
      timestamp: p.created_at || p.timestamp || "Just now",
      content: p.content || "",
      imageUrl:
        p.image_url ||
        p.imageUrl ||
        p.imageSrc ||
        (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : undefined) ||
        (Array.isArray(p.media) && p.media.length > 0
          ? (p.media.find((m: any) => m?.type === "image" || m?.media_type === "image" || m?.url)?.url ||
             (typeof p.media[0] === "string" ? p.media[0] : p.media[0]?.url))
          : undefined),
      likesCount: p.like_count || p.likes_count || p.likesCount || 0,
      commentsCount: p.comment_count || p.comments_count || p.commentsCount || 0,
      repostsCount: p.repost_count || p.reposts_count || p.repostsCount || 0,
      sharesCount: p.share_count || p.shares_count || p.sharesCount || 0,
      likedBy: p.liked_by || p.likedBy || [],
      sampleLikerUsername: p.sample_liker_username || p.sampleLikerUsername || undefined,
      isLiked: p.is_liked || p.isLiked || false,
    })) : [],
    entityType: isEdu ? "INSTITUTION" : "COMPANY",
    isFollowing: !isActorThisCompany && Boolean(profileResponse.relationship?.is_following),
    isSubscribed: profileResponse.relationship?.is_subscribed || false,
    isBlocked: profileResponse.relationship?.is_blocked || false,
    employeeGrowth: (() => {
      const eg = profileResponse.relevance?.employee_growth || profileResponse.employee_growth;
      if (!eg) return undefined;
      let percentage = eg.percentage;
      let growth_value = eg.growth_value;
      if (typeof growth_value === "number" && growth_value > 100) {
        growth_value = 100;
      }
      if (typeof percentage === "string") {
        const match = percentage.match(/([+-]?\d+(?:\.\d+)?)/);
        if (match && parseFloat(match[1]) > 100) {
          percentage = "+100%";
        }
      }
      return {
        ...eg,
        percentage,
        growth_value,
      };
    })(),
    community: profileResponse.community_details ? {
      communityId: profileResponse.community_details.community_id,
      name: profileResponse.community_details.name,
      bannerUrl: profileResponse.community_details.banner_url,
      description: profileResponse.community_details.description,
      isSubscribed: profileResponse.community_details.is_subscribed || false,
      subscriberCount: profileResponse.community_details.subscriber_count || 0,
      isOwner: profileResponse.community_details.is_owner || canManageCompany,
    } : undefined,
  };

  return (
    <div
      className={
        isPublicView
          ? "w-full min-h-screen bg-ds-bg text-ds-text-primary font-sans flex flex-col items-center pt-20 sm:pt-[100px] pb-24 px-4 select-text relative"
          : "min-h-screen bg-ds-bg text-ds-text-primary font-sans pb-24 sm:pr-[220px]"
      }
    >
      {isPublicView && renderTopNavigation()}

      {/* Floating quick action when owner is previewing public view */}
      {isExplicitPublic && hasEditPermission && (
        <button
          type="button"
          onClick={() => router.push(`/organization/${rawSlug}`)}
          className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-ds-surface-2 hover:bg-ds-surface-1 border border-ds-border text-ds-text-primary rounded-full text-xs font-medium shadow-lg transition-colors cursor-pointer flex items-center gap-2"
        >
          <span>Exit public view</span>
        </button>
      )}

      {/* Centered container w-[800px] matching Figma plugin reference */}
      <div
        className={
          isPublicView
            ? "w-full max-w-[800px] flex flex-col justify-start items-center gap-5"
            : "w-full max-w-[800px] mx-auto flex flex-col justify-start items-center gap-5 px-4 md:px-0 pt-5 sm:pt-0 sm:-mt-5"
        }
      >
        {isBlocked ? (
          <>
            {/* Hero Block (w-full h-64 relative) */}
            <div className="w-full h-64 relative">
              {/* Banner (w-full h-48 left-0 top-0 absolute rounded-2xl bg-[#17171C] overflow-hidden) */}
              <div className="w-full h-48 left-0 top-0 absolute rounded-2xl bg-[#17171C] overflow-hidden" />
              
              {/* Avatar (w-28 h-28 left-[20px] top-[140px] absolute bg-neutral-800 rounded-xl overflow-hidden border border-[#2C2C33] flex items-center justify-center) */}
              <div className="w-28 h-28 left-[20px] top-[140px] absolute bg-neutral-800 rounded-xl overflow-hidden border border-[#2C2C33] flex items-center justify-center">
                <Building2 className="w-10 h-10 text-ds-text-primary" />
              </div>
            </div>

            {/* Info Block (self-stretch pl-5 flex justify-between items-center gap-4) */}
            <div className="w-full pl-5 flex justify-between items-center gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-ds-text-primary text-2xl font-bold font-['DM_Sans'] leading-8 truncate">
                  {company.name || "Cocpit Technologies"}
                </h1>
              </div>
              <div className="flex justify-start items-center gap-6 shrink-0">
                <div className="text-center text-ds-text-primary text-sm font-medium font-['DM_Sans'] leading-5">
                  0<br />Followers
                </div>
                <div className="text-center text-ds-text-primary text-sm font-medium font-['DM_Sans'] leading-5">
                  0<br />Following
                </div>
              </div>
            </div>

            {/* Blocked Message and Unblock Action */}
            <div className="w-full px-4 flex flex-col justify-center items-center gap-4 mt-6 sm:mt-10">
              <div className="w-full flex flex-col justify-center items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <Icon icon="lucide:ban" className="w-10 h-10 text-ds-text-primary" />
                </div>
                <div className="w-full text-center text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
                  You&apos;ve blocked
                </div>
                <div className="w-full text-center text-stone-400 text-xs font-normal font-['DM_Sans'] leading-4">
                  Unblock this member to view their profile, posts, and professional information again.
                </div>
              </div>
              <button
                type="button"
                onClick={() => unblockMutation.mutate()}
                disabled={unblockMutation.isPending}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-[100px] inline-flex justify-center items-center gap-2.5 transition-colors cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent disabled:opacity-50"
              >
                <span className="text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                  {unblockMutation.isPending ? "Unblocking..." : "Unblock"}
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <BusinessProfileHeader
              data={data}
              isOwnProfile={ownProfile}
              canManageCompany={canManageCompany}
              logoUrl={company.logo_url}
              coverUrl={company.cover_url}
              orgId={orgId}
              slug={rawSlug}
              onShareClick={() => setIsShareModalOpen(true)}
            />

            {/* Tabs and Content Section */}
            <div className="w-full">
              <BusinessProfileTabs
                data={data}
                isOwnProfile={ownProfile}
                canManageCompany={canManageCompany}
                currentUserId={currentUserId}
                canManageOwnPosts={canManageOwnPosts}
                viewerPermissions={effectiveViewerPermissions}
              />
            </div>
          </>
        )}
      </div>

      <CocpitShareModel
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        profileId={orgId}
        entityType="company"
        entityId={orgId}
        customUrl={`/organization/${rawSlug}`}
        onShare={() => {
          setIsShareModalOpen(false);
        }}
      />
    </div>
  );
}

export default BusinessProfilePage;
