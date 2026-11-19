"use client";

import React from "react";
import { ProfilePreviewCard } from "../../ProfilePreviewCard";
import { useQuery } from "@tanstack/react-query";
import { useSocial } from "@/context/SocialContext";
import UnavailableContentCard from "../ui/UnavailableContentCard";

export interface SharedProfileCardProps {
  profileId: string;
  profileType: "user" | "company";
  initialProfile?: any;
  isMe?: boolean;
}

export function SharedProfileCard({
  profileId,
  profileType,
  initialProfile,
  isMe = false,
}: SharedProfileCardProps) {
  const { isBlocked } = useSocial();

  const isLocalBlocked =
    isBlocked(profileId) ||
    (initialProfile?.id && isBlocked(initialProfile.id)) ||
    (initialProfile?.user_id && isBlocked(initialProfile.user_id));

  if (isLocalBlocked) {
    return (
      <ProfilePreviewCard
        profile={{
          name: "Unknown user",
          avatar: null,
          headline: "",
          username: profileType === "user" ? profileId : undefined,
          slug: profileType === "company" ? profileId : undefined,
          id: profileId,
        }}
        profileId={profileId}
        profileType={profileType}
        isMe={isMe}
      />
    );
  }

  const { data: preview, isLoading, error } = useQuery({
    queryKey: ["profilePreview", profileType, profileId],
    queryFn: async () => {
      const { fetchEntityPreview } = await import("@/services/api/shareService");
      return fetchEntityPreview(profileType === "user" ? "profile" : "company", profileId);
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const avatarShape = profileType === "user" ? "rounded-full" : "rounded-[6px]";

  if (isLoading) {
    return (
      <div className="box-border flex flex-row items-center justify-center px-3 py-2 gap-2.5 h-[54px] w-fit min-w-[178px] rounded-[16px] border border-[var(--ds-border)] bg-transparent shrink-0">
        <div className="flex flex-row items-center p-0 gap-2 h-9 w-full min-w-0 animate-pulse">
          <div className={`w-8 h-8 ${avatarShape} bg-[var(--ds-surface-2)] shrink-0`} />
          <div className="flex flex-col items-start justify-center gap-1 flex-1 min-w-[112px] h-9">
            <div className="h-4 bg-[var(--ds-surface-2)] rounded w-[78px]" />
            <div className="h-2.5 bg-[var(--ds-surface-2)] rounded w-[112px]" />
          </div>
        </div>
      </div>
    );
  }

  if (
    preview?.title === "Deactivated User" ||
    preview?.title === "Deleted Page"
  ) {
    return <UnavailableContentCard isMe={isMe} />;
  }

  if (error || !preview) {
    return (
      <ProfilePreviewCard
        profile={{
          name: "Unknown user",
          avatar: null,
          headline: "",
          username: profileType === "user" ? profileId : undefined,
          slug: profileType === "company" ? profileId : undefined,
          id: profileId,
        }}
        profileId={profileId}
        profileType={profileType}
        isMe={isMe}
      />
    );
  }

  const rawHeadline = preview.subtitle || initialProfile?.headline;
  const cleanHeadline = (rawHeadline && rawHeadline !== "Cocpit Member") ? rawHeadline : undefined;

  const profileData = {
    name: preview.title || initialProfile?.name,
    avatar: preview.image || initialProfile?.avatar,
    headline: cleanHeadline,
    username: profileType === "user" ? (preview.entityId || profileId) : undefined,
    slug: profileType === "company" ? (preview.entityId || profileId) : undefined,
    id: preview.entityId || profileId,
  };

  return (
    <ProfilePreviewCard
      profile={profileData}
      profileId={preview.entityId || profileId}
      profileType={profileType}
      isMe={isMe}
    />
  );
}

export default SharedProfileCard;

