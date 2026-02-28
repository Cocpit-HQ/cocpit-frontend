
"use client";

import React from "react";

interface ProfileStatsProps {
    connectionsCount: number;
    profileViewsCount: number | string;
    postsCount: number;
    isUserFollowing: boolean;
    followersCount?: number;
    followingCount?: number;
}

export function ProfileStats({
    connectionsCount,
    profileViewsCount,
    postsCount,
    isUserFollowing,
    followersCount,
    followingCount,
}: ProfileStatsProps) {
    // Logic for displaying connection count based on following status (from original code)
    const displayConnections = isUserFollowing
        ? (connectionsCount > 500 ? "501+" : connectionsCount)
        : (connectionsCount >= 500 ? "500+" : connectionsCount);

    return (
        <div className="rounded-xl border p-4 mb-6 bg-card border-border">
            <div className="grid grid-cols-3 gap-4">
                {followersCount !== undefined ? (
                    <>
                        <div className="text-center">
                            <p className="text-xl mb-1 text-foreground">{followersCount}</p>
                            <p className="text-xs text-muted-foreground">Followers</p>
                        </div>
                        <div className="text-center border-l border-r border-border">
                            <p className="text-xl mb-1 text-foreground">{followingCount ?? 0}</p>
                            <p className="text-xs text-muted-foreground">Following</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl mb-1 text-foreground">{displayConnections}</p>
                            <p className="text-xs text-muted-foreground">Connections</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-center">
                            <p className="text-xl mb-1 text-foreground">{displayConnections}</p>
                            <p className="text-xs text-muted-foreground">Connections</p>
                        </div>
                        <div className="text-center border-l border-r border-border">
                            <p className="text-xl mb-1 text-foreground">{profileViewsCount}</p>
                            <p className="text-xs text-muted-foreground">Profile Views</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl mb-1 text-foreground">{postsCount}</p>
                            <p className="text-xs text-muted-foreground">Posts</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
