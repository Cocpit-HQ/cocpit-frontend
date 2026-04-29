import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileStatsProps {
    connectionsCount: number | null;
    profileViewsCount: number | string | null;
    postsCount: number | null;
    isUserFollowing: boolean;
    followersCount?: number;
    followingCount?: number;
}

export const ProfileStats = React.memo(function ProfileStats({
    connectionsCount,
    profileViewsCount,
    postsCount,
    isUserFollowing,
    followersCount,
    followingCount,
}: ProfileStatsProps) {
    // Logic for displaying connection count based on following status (from original code)
    const displayConnections = connectionsCount === null 
        ? null
        : isUserFollowing
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
                            <p className="text-xl mb-1 text-foreground">
                                {displayConnections === null ? (
                                    <Skeleton className="h-7 w-12 mx-auto" />
                                ) : (
                                    displayConnections
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">Connections</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-center">
                            <p className="text-xl mb-1 text-foreground">
                                {displayConnections === null ? (
                                    <Skeleton className="h-7 w-12 mx-auto" />
                                ) : (
                                    displayConnections
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">Connections</p>
                        </div>
                        <div className="text-center border-l border-r border-border">
                            <p className="text-xl mb-1 text-foreground">
                                {profileViewsCount === null ? (
                                    <Skeleton className="h-7 w-12 mx-auto" />
                                ) : (
                                    profileViewsCount
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">Profile Views</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl mb-1 text-foreground">
                                {postsCount === null ? (
                                    <Skeleton className="h-7 w-12 mx-auto" />
                                ) : (
                                    postsCount
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">Posts</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});
