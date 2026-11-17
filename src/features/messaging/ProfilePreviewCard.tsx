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
            className="box-border flex flex-row items-center justify-center px-3 py-2 gap-2.5 h-[54px] w-fit min-w-[178px] max-w-[288px] sm:max-w-[340px] rounded-[16px] border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-1)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] cursor-pointer transition-colors shrink-0 select-none"
            onClick={(e) => { e.stopPropagation(); router.push(profileUrl); }}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(profileUrl);
                }
            }}
            role="button"
            tabIndex={0}
            aria-label={`View ${profile.name}'s profile`}
        >
            <div className="flex flex-row items-center p-0 gap-2 h-9 w-full min-w-0">
                <Avatar
                    url={profile.avatar || undefined}
                    name={profile.name}
                    size="sm"
                    isCompany={profileType === "company"}
                    className="w-8 h-8 shrink-0"
                />
                <div className="flex flex-col items-start justify-center p-0 h-9 min-w-[112px] flex-1 overflow-hidden">
                    <span className="font-['DM_Sans'] ds-text-body-2 font-semibold text-base leading-6 text-[var(--ds-text-primary)] whitespace-nowrap truncate max-w-full text-left">
                        {profile.name}
                    </span>
                    {profile.headline && profile.headline !== "Cocpit Member" ? (
                        <span className="font-['DM_Sans'] ds-text-meta font-normal text-[10px] leading-3 text-[var(--ds-text-secondary)] w-0 min-w-full truncate text-left">
                            {profile.headline}
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
