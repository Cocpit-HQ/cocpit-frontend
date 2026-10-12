"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { BusinessProfileData } from "../../types/business-profile.types";
import AboutSection from "../sections/AboutSection";
import FeaturedPostsSection from "../sections/FeaturedPostsSection";
import VerificationStatusCard from "../sections/VerificationStatusCard";
import KeyOfferingsAndTeamsSection from "../sections/KeyOfferingsAndTeamsSection";
import GrowthTrendsSection from "../sections/GrowthTrendsSection";

interface HomeTabProps {
  data: BusinessProfileData;
  isOwnProfile: boolean;
  canManageCompany?: boolean;
  onTabChange?: (tab: string) => void;
  currentUserId?: string;
  canManageOwnPosts?: boolean;
  viewerPermissions?: string[];
}

export default function HomeTab({
  data,
  isOwnProfile,
  canManageCompany,
  canManageOwnPosts,
  onTabChange,
}: HomeTabProps) {
  const router = useRouter();
  const params = useParams();
  const rawSlug = (params?.slug as string) || data.slug || "";

  const handleManageDocuments = () => {
    router.push(`/organization/${rawSlug}/verify`);
  };

  const isEdu = data.entityType === "INSTITUTION";
  const peopleSectionTitle = isOwnProfile
    ? "Teams"
    : isEdu
    ? "Alumni"
    : "People";

  const handleViewMorePeopleOrTeams = () => {
    if (isOwnProfile) {
      router.push("/team");
    } else {
      onTabChange?.("people");
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full pb-8">
      {/* 1. About Section */}
      <AboutSection data={data} onViewMoreClick={() => onTabChange?.("about")} />

      {/* 2. Featured Posts */}
      <FeaturedPostsSection
        data={data}
        isOwnProfile={isOwnProfile}
        canManageCompany={canManageCompany}
        canManageOwnPosts={canManageOwnPosts}
        onSeeAllClick={() => onTabChange?.("posts")}
      />

      {/* 3. Verification Status Card (only for unverified company owner/admin) */}
      {isOwnProfile && !data.isVerified && (
        <VerificationStatusCard
          isVerified={data.isVerified}
          onManageDocumentsClick={handleManageDocuments}
        />
      )}

      {/* 4. Key Offerings & Teams / People / Alumni (Side by Side) */}
      <KeyOfferingsAndTeamsSection
        data={data}
        isOwnProfile={isOwnProfile}
        title={peopleSectionTitle}
        onViewMoreClick={handleViewMorePeopleOrTeams}
      />

      {/* 5. Growth Trends */}
      <GrowthTrendsSection
        employeeGrowth={data.employeeGrowth}
        growthPercentage={data.employeeGrowth?.percentage}
        orgId={data.id || data.orgId}
        orgName={data.name}
      />
    </div>
  );
}
