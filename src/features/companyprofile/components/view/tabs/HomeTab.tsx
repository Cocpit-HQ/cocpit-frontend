"use client";

import React from "react";
import { CompanyProfileData } from "../../../types/company-profile.types";

import AboutSection from "../sections/AboutSection";
import CoreTeamSection from "../sections/CoreTeamSection";
import PostsSection from "../sections/PostsSection";
import PeopleSection from "../sections/PeopleSection";
import KeyOfferingsSection from "../sections/KeyOfferingsSection";
import CommunitySection from "../sections/CommunitySection";

interface HomeTabProps {
  data: CompanyProfileData;
  isOwnProfile: boolean;
  onTabChange?: (tab: string) => void;
}

export default function HomeTab({ data, isOwnProfile, onTabChange }: HomeTabProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <AboutSection data={data} onViewMoreClick={() => onTabChange?.("about")} />

      {isOwnProfile && <CoreTeamSection data={data} isOwnProfile={isOwnProfile} />}

      <PostsSection data={data} isOwnProfile={isOwnProfile} onSeeAllClick={() => onTabChange?.("posts")} />

      {!isOwnProfile && (
        <>
          <PeopleSection data={data} onViewMoreClick={() => onTabChange?.("people")} />
          <KeyOfferingsSection keyOfferings={data.keyOfferings} />
          <CommunitySection data={data} />
        </>
      )}
    </div>
  );
}
