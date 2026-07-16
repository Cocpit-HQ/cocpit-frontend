
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { companyProfileService } from "../../services/companyprofile.service";
import { CompanyProfileData } from "../../types/company-profile.types";
import CompanyProfileHeader from "./CompanyProfileHeader";
import CompanyProfileTabs from "./CompanyProfileTabs";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import { useActiveProfile } from "@/context/ActiveProfileContext";

interface CompanyProfilePageProps {
  isOwnProfile?: boolean;
}

export default function CompanyProfilePage({ isOwnProfile = false }: CompanyProfilePageProps) {
  const params = useParams();
  const slug = (params?.slug as string) || "nexsus-global-systems";

  const { data: profileResponse, isLoading, isError } = useQuery({
    queryKey: ["companyProfile", slug],
    queryFn: () => companyProfileService.getOrgProfile(slug),
    retry: false,
  });

  const { activeProfile } = useActiveProfile();

  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError || !profileResponse || !profileResponse.org) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
        <h2 className="text-2xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Organization not found</h2>
        <p className="text-zinc-500 dark:text-zinc-400">The profile you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  const company = profileResponse.org;
  const isEdu = company.entity_type === "INSTITUTION" || company.entity_type === "INSTITUTE";
  const ownProfile = activeProfile?.type === "COMPANY" && activeProfile?.id === (company.company_id || company.org_id);

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
    entityType: isEdu ? "INSTITUTE" : "COMPANY",
    isFollowing: profileResponse.relationship?.is_following || false,
    isSubscribed: profileResponse.relationship?.is_subscribed || false,
    community: profileResponse.community_details ? {
      communityId: profileResponse.community_details.community_id,
      name: profileResponse.community_details.name,
      bannerUrl: profileResponse.community_details.banner_url,
      description: profileResponse.community_details.description,
      isSubscribed: profileResponse.community_details.is_subscribed || false,
      subscriberCount: profileResponse.community_details.subscriber_count || 0,
    } : undefined,
  };

  const orgId = company.company_id || company.org_id;

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
          logoUrl={company.logo_url}
          coverUrl={company.cover_url}
          orgId={orgId}
          onShareClick={() => setIsShareModalOpen(true)}
        />

        {/* Tabs and Content Section */}
        <div className="mt-4 pl-[40px] pr-0 max-md:!px-4">
          <CompanyProfileTabs data={data} isOwnProfile={ownProfile} />
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
