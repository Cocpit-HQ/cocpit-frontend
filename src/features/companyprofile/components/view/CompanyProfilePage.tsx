
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { companyProfileService } from "../../services/companyprofile.service";
import { CompanyProfileData } from "../../types/company-profile.types";
import CompanyProfileHeader from "./CompanyProfileHeader";
import CompanyProfileTabs from "./CompanyProfileTabs";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Icon } from "@iconify/react";

interface CompanyProfilePageProps {
  isOwnProfile?: boolean;
}

export default function CompanyProfilePage({ isOwnProfile = false }: CompanyProfilePageProps) {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "nexsus-global-systems";

  const { data: profileResponse, isLoading, isError } = useQuery({
    queryKey: ["companyProfile", slug],
    queryFn: () => companyProfileService.getOrgProfile(slug),
    retry: false,
    staleTime: 0,
  });

  const { activeProfile } = useActiveProfile();
  const { data: session } = useSession();

  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  // Derive these early (before conditional returns) so hook order is stable.
  // company is null until profileResponse loads, so we guard with optional chaining.
  const derivedOrgId = profileResponse?.org?.company_id || profileResponse?.org?.org_id || null;
  const ownProfileEarly = activeProfile?.type === 'COMPANY' &&
    activeProfile?.id === derivedOrgId;
  const actingAsCompanyOnExternalProfile = activeProfile?.type === 'COMPANY' && !ownProfileEarly;

  // Fetch the org-level relationship when acting as a company on an external org profile.
  // This must be called before any early returns to obey the Rules of Hooks.
  const { data: orgRelationship } = useQuery({
    queryKey: ['orgRelationship', derivedOrgId ?? '', activeProfile?.id ?? ''],
    queryFn: () => companyProfileService.getOrgRelationship(derivedOrgId!),
    enabled: actingAsCompanyOnExternalProfile && !!derivedOrgId,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError || !profileResponse || !profileResponse.org || profileResponse.relationship?.is_blocked) {
    return (
      <div className="min-h-screen bg-card flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <div className="w-20 h-20 bg-muted/60 dark:bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon icon="lucide:ban" className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Profile Unavailable</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The profile you are looking for could not be found. They may have been removed or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/feed')}
            className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 mt-4 cursor-pointer"
          >
            Return to Feed
          </button>
        </div>
      </div>
    );
  }

  const company = profileResponse.org;
  const isEdu = company.entity_type === "INSTITUTION";
  
  // Check if the user has the permission to manage company details (or is the owner)
  const hasEditPermission = 
    profileResponse.is_own_profile || 
    profileResponse.viewer_permissions?.includes('*') || 
    profileResponse.viewer_permissions?.includes('MANAGE_COMPANY_DETAILS');
    
  // Any team member currently acting as this company sees the private/internal template,
  // regardless of their specific permission level — "just viewing" is not a privileged action.
  // Mutating action buttons are separately gated on `canManageCompany`/`canManageOwnPosts` below.
  const ownProfile = activeProfile?.type === "COMPANY" &&
    activeProfile?.id === (company.company_id || company.org_id);

  // Full admin/owner access: any company post, plus all profile-management actions.
  const canManageCompany = Boolean(ownProfile && hasEditPermission);

  // orgId and actingAsCompanyOnExternalProfile are already computed above (before early returns)
  const orgId = derivedOrgId;

  // A team member who authored a specific post on behalf of the company can manage
  // that post even when not currently "acting as" the company (e.g. browsing as themselves).
  const currentUserId = (session?.user as any)?.id;
  const canManageOwnPosts = Boolean(
    ownProfile && (canManageCompany || profileResponse.viewer_permissions?.includes('CREATE_POST'))
  );

  // hasEditPermission/canManageCompany can be true via `is_own_profile` (literal org creator)
  // even when the viewer's assigned role permissions array doesn't literally contain '*'
  // (e.g. the creator is also on a limited custom role). Downstream per-post permission
  // checks (getPostMenuAccess) only look at the raw permissions array, so make sure that
  // array reflects the same effective full-access signal as canManageCompany.
  const effectiveViewerPermissions = canManageCompany
    ? Array.from(new Set([...(profileResponse.viewer_permissions || []), '*']))
    : (profileResponse.viewer_permissions || []);

  const data: CompanyProfileData = {
    id: company.company_id || company.org_id,
    orgId: company.company_id || company.org_id,
    name: company.name,
    slug: slug,
    logoUrl: company.logo_url,
    coverUrl: company.cover_url,
    isVerified: company.verification_status === 'DOMAIN_VERIFIED',
    tagline: company.headline || company.slogan || "",
    industry: company.industry || (isEdu ? "Higher Education" : ""),
    location: company.location || [company.city, company.country].filter(Boolean).join(", ") || "",
    employeeCount: company.size || "",
    websiteUrl: company.website || "",
    description: company.description || "",
    slogan: company.slogan || "",
    socialLinks: profileResponse.links ? profileResponse.links.map((link: any) => ({ label: link.display_label || link.platform, platform: link.platform, url: link.url })) : [],
    keyOfferings: company.key_offerings || company.keyOfferings || [],
    stats: {
      following: company.following_count || 0,
      followers: company.followers_count || 0,
      subscribers: company.subscribers_count || 0,
    },
    coreTeam: profileResponse.core_team ? profileResponse.core_team.map((member: any) => ({
      id: member.user_id,
      name: member.full_name,
      role: member.title || member.role_display || "Member",
      avatarUrl: member.avatar_url || ""
    })) : [],
    posts: profileResponse.latest_posts ? profileResponse.latest_posts.map((p: any) => ({
      id: p.post_id || p.id || p._id,
      authorName: p.author?.full_name || p.author_name || company.name,
      authorAvatarUrl: p.author?.avatar_url || p.author_avatar_url || company.logo_url || "/images/companyonboarding/companyprofileDefault.jpg",
      authorSubLabel: "Company Post",
      timestamp: p.created_at || p.timestamp || "Just now",
      content: p.content || "",
      imageUrl: p.image_url || p.imageUrl || (p.media && p.media.length > 0 ? p.media[0].url : undefined),
      likesCount: p.like_count || p.likes_count || p.likesCount || 0,
      commentsCount: p.comment_count || p.comments_count || p.commentsCount || 0,
      repostsCount: p.repost_count || p.reposts_count || p.repostsCount || 0,
      sharesCount: p.share_count || p.shares_count || p.sharesCount || 0,
      likedBy: p.liked_by || p.likedBy || [],
      sampleLikerUsername: p.sample_liker_username || p.sampleLikerUsername || undefined,
      isLiked: p.is_liked || p.isLiked || false,
    })) : [],
    entityType: isEdu ? "INSTITUTION" : "COMPANY",
    // When acting as a company on an external org profile, override with the org-level follow state
    isFollowing: actingAsCompanyOnExternalProfile && orgRelationship !== undefined
      ? orgRelationship.isFollowing
      : (profileResponse.relationship?.is_following || false),
    isSubscribed: profileResponse.relationship?.is_subscribed || false,
    isBlocked: profileResponse.relationship?.is_blocked || false,
    employeeGrowth: profileResponse.relevance?.employee_growth || profileResponse.employee_growth || undefined,
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
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-poppins pb-20">
      {/* Container max width 960px, shifted to align with the 998px header search box */}
      <div 
        style={{ marginLeft: "max(0px, calc((100% - 998px) / 2))" }}
        className="w-full max-w-[960px] sm:px-4 md:px-0 pt-[20px]"
      >

        <CompanyProfileHeader
          data={data}
          isOwnProfile={ownProfile}
          canManageCompany={canManageCompany}
          logoUrl={company.logo_url}
          coverUrl={company.cover_url}
          orgId={orgId}
          onShareClick={() => setIsShareModalOpen(true)}
        />

        {/* Tabs and Content Section */}
        <div className="mt-4 pl-[40px] pr-0 max-md:!px-4">
          <CompanyProfileTabs
            data={data}
            isOwnProfile={ownProfile}
            canManageCompany={canManageCompany}
            currentUserId={currentUserId}
            canManageOwnPosts={canManageOwnPosts}
            viewerPermissions={effectiveViewerPermissions}
          />
        </div>

      </div>

      <CocpitShareModel
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        profileId={orgId}
        onShare={(selectedIds) => {
          console.log("Shared profile with:", selectedIds);
          setIsShareModalOpen(false);
        }}
      />
    </div>
  );
}
