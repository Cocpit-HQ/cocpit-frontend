"use client";

import React from "react";
import { CompanyProfileData } from "../../../types/company-profile.types";

import CoreTeamSection from "../sections/CoreTeamSection";
import PostsSection from "../sections/PostsSection";
import PeopleSection from "../sections/PeopleSection";
import RelevanceSection from "../sections/RelevanceSection";
import CommunitySection from "../sections/CommunitySection";

interface HomeTabProps {
  data: CompanyProfileData;
  isOwnProfile: boolean;
}

export default function HomeTab({ data, isOwnProfile }: HomeTabProps) {
  return (
    <div className="flex flex-col gap-4 w-full">

      {isOwnProfile && <CoreTeamSection data={data} />}

      <PostsSection data={data} />

      {!isOwnProfile && (
        <>
          <PeopleSection data={data} />
          <RelevanceSection />
          <CommunitySection data={data} />
        </>
      )}
    </div>
  );
}
