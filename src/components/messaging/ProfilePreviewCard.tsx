"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Building2, ExternalLink } from "lucide-react";

interface ProfilePreviewCardProps {
    profile: {
        name: string;
        avatar: string | null;
        headline?: string;
        location?: string;
        industry?: string;
        username?: string;
        slug?: string;
    };
    profileId: string;
    profileType: "user" | "company";
}

export function ProfilePreviewCard({ profile, profileId, profileType }: ProfilePreviewCardProps) {
    const router = useRouter();

    const profileUrl = profileType === "user"
        ? `/profile/${profile.username || profileId}`
        : `/organization/${profile.slug || profileId}`;

    const isCompany = profileType === "company";

    return (
        <div
            className="mt-1 mb-2 rounded-xl bg-background/60 backdrop-blur-sm border border-white/10 overflow-hidden max-w-[280px] cursor-pointer hover:bg-background/80 transition-all shadow-sm group"
            onClick={(e) => { e.stopPropagation(); router.push(profileUrl); }}
            role="button"
            tabIndex={0}
        >
            {/* Header - Avatar + Name (matches SharedPostCard) */}
            <div className="p-3 border-b border-white/10 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden ring-1 ring-white/20 shrink-0">
                    <img
                        src={profile.avatar || '/assets/pngegg.png'}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold truncate leading-none mb-0.5">{profile.name}</span>
                    <span className="text-xs text-muted-foreground leading-none">
                        {isCompany ? "Company Profile" : "User Profile"}
                    </span>
                </div>
            </div>

            {/* Profile Details */}
            <div className="p-3 space-y-1.5">
                {profile.headline && (
                    <p className="text-xs line-clamp-2 text-muted-foreground/90 font-medium">
                        {profile.headline}
                    </p>
                )}

                {(profile.location || (isCompany && profile.industry)) && (
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                        {profile.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{profile.location}</span>
                            </span>
                        )}
                        {isCompany && profile.industry && (
                            <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span className="truncate">{profile.industry}</span>
                            </span>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-1 text-[11px] text-primary/80 font-medium pt-0.5">
                    <ExternalLink className="w-3 h-3" />
                    <span>{isCompany ? "View Company" : "View Profile"}</span>
                </div>
            </div>
        </div>
    );
}
