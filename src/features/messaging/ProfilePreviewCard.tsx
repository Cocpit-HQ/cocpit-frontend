"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UnavailableContentCard } from "./components/ui/UnavailableContentCard";

interface ProfilePreviewCardProps {
    profile?: {
        name: string;
        avatar: string | null;
        headline?: string;
        location?: string;
        industry?: string;
        username?: string;
        slug?: string;
    } | null;
    profileId: string;
    profileType: "user" | "company";
    isUnavailable?: boolean;
}

export function ProfilePreviewCard({ profile, profileId, profileType, isUnavailable }: ProfilePreviewCardProps) {
    const router = useRouter();

    if (isUnavailable || !profile || profile.name === 'Deactivated User' || profile.name === 'Deleted Page') {
        return <UnavailableContentCard />;
    }

    const profileUrl = profileType === "user"
        ? `/profile/${profile.username || profileId}`
        : `/organization/${profile.slug || profileId}`;

    return (
        <div
            className="box-border flex flex-col justify-center items-start p-[16px] gap-[10px] w-[200px] h-[72px] bg-[#F3F5F7] dark:bg-zinc-800/80 rounded-[12px_12px_12px_0px] cursor-pointer hover:bg-[#E5E7EB] dark:hover:bg-zinc-700/80 transition-colors"
            onClick={(e) => { e.stopPropagation(); router.push(profileUrl); }}
            role="button"
            tabIndex={0}
        >
            <div className="flex flex-row items-center p-0 gap-[8px] w-[168px] h-[40px]">
                <div className="w-[40px] h-[40px] rounded-full overflow-hidden shrink-0 bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-sm font-['Poppins'] select-none">
                    {profile.avatar && profile.avatar !== '/assets/pngegg.png' ? (
                        <img
                            src={profile.avatar}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : null}
                    <span>{(profile.name || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex flex-col items-start p-0 w-[120px] h-[40px] justify-center">
                    <span className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-[#000000] dark:text-zinc-100 truncate w-[112px] block text-left">
                        {profile.name}
                    </span>
                    {profile.headline && (
                        <span className="font-['Poppins'] font-normal text-[10px] leading-[16px] text-[#6B7280] dark:text-gray-400 truncate w-[120px] block text-left">
                            {profile.headline}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
