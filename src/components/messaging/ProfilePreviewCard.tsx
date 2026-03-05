"use client";

import React from "react";
import Link from "next/link";
import Avatar from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";

interface ProfilePreviewCardProps {
    profile: {
        name: string;
        avatar: string | null;
        headline?: string;
    };
    profileId: string;
    profileType: "user" | "company";
}

export function ProfilePreviewCard({ profile, profileId, profileType }: ProfilePreviewCardProps) {
    const profileUrl = profileType === "user" ? `/profile/${profileId}` : `/organization/${profileId}`;

    return (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card shadow-sm max-w-[280px]">
            <div className="flex items-center gap-3">
                <Avatar
                    url={profile.avatar || undefined}
                    name={profile.name}
                    size="lg"
                />
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate text-foreground">
                        {profile.name}
                    </h4>
                    {profile.headline && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {profile.headline}
                        </p>
                    )}
                </div>
            </div>

            <Link href={profileUrl} className="w-full">
                <Button variant="outline" size="sm" className="w-full text-xs h-8">
                    View Profile
                </Button>
            </Link>
        </div>
    );
}
