"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UnavailableContentCard } from "./components/ui/UnavailableContentCard";
import { useSocial } from "@/context/SocialContext";
import Avatar from "@/components/shared/Avatar";

interface ProfilePreviewCardProps {
    profile?: {
        name: string;
        avatar: string | null;
        headline?: string;
        location?: string;
        industry?: string;
        username?: string;
        slug?: string;
        id?: string;
    } | null;
    profileId: string;
    profileType: "user" | "company";
    isUnavailable?: boolean;
    isMe?: boolean;
}

export function ProfilePreviewCard({ profile, profileId, profileType, isUnavailable, isMe = false }: ProfilePreviewCardProps) {
    const router = useRouter();
    const { isBlocked } = useSocial();

    const isTargetBlocked = isBlocked(profileId) || (profile?.id && isBlocked(profile.id));

    if (isUnavailable || isTargetBlocked || !profile || profile.name === 'Deactivated User' || profile.name === 'Deleted Page') {
        return <UnavailableContentCard isMe={isMe} />;
    }

    const profileUrl = profileType === "user"
        ? `/profile/${profile.username || profileId}`
        : `/organization/${profile.slug || profileId}`;

    return (
        <div
            className="flex flex-col justify-center items-start p-[16px] gap-[10px] w-[200px] h-[72px] bg-[#F3F5F7] dark:bg-zinc-800/80 rounded-[12px_12px_12px_0px] cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-zinc-700/80 transition-colors shrink-0"
            onClick={(e) => { e.stopPropagation(); router.push(profileUrl); }}
            role="button"
            tabIndex={0}
        >
            <div className="flex flex-row items-center p-0 gap-[8px] w-full h-[40px]">
                <Avatar
                    url={profile.avatar || undefined}
                    name={profile.name}
                    size="md"
                    isCompany={profileType === "company"}
                    className="w-[40px] h-[40px]"
                />
                <div className="flex flex-col items-start p-0 flex-1 min-w-0 justify-center">
                    <span className="font-['Poppins'] font-medium text-[14px] leading-[20px] text-[#000000] dark:text-zinc-100 truncate w-full block text-left">
                        {profile.name}
                    </span>
                    {profile.headline && profile.headline !== "Cocpit Member" ? (
                        <span className="font-['Poppins'] font-normal text-[10px] leading-[14px] text-[#6B7280] dark:text-gray-400 truncate w-full block text-left">
                            {profile.headline}
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
