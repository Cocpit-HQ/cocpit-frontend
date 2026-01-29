
"use client";

import React from "react";
import { MessageCircle, UserPlus, UserCheck, CheckCircle } from "lucide-react";
import { ProfileIdentityChips } from "@/components/profile/ProfileIdentityChips";
import { User } from "@/types/user";

interface ProfileHeaderProps {
    user: User;
    isOwnProfile: boolean;
    isUserFollowing: boolean;
    isFollowLoading: boolean;
    onFollowToggle: () => void;
    onMessage: () => void;
    onAvatarClick: () => void;
}

export function ProfileHeader({
    user,
    isOwnProfile,
    isUserFollowing,
    isFollowLoading,
    onFollowToggle,
    onMessage,
    onAvatarClick,
}: ProfileHeaderProps) {
    return (
        <div className="rounded-xl overflow-hidden border mb-4 relative bg-card border-border">
            <div className="h-36 bg-gradient-to-r from-[#4169E1] via-[#A855F7] to-[#EC4899] relative"></div>

            <div className="px-6 pb-6">
                <div className="flex items-start justify-between -mt-14 mb-4">
                    <div
                        className="w-32 h-32 rounded-full border-4 border-background bg-card overflow-hidden flex-shrink-0 relative cursor-pointer"
                        onClick={onAvatarClick}
                    >
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {!isOwnProfile && (
                        <div className="mt-16 flex gap-2">
                            <button
                                onClick={onMessage}
                                className="bg-background hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Message
                            </button>
                            <button
                                onClick={onFollowToggle}
                                disabled={isFollowLoading}
                                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${isUserFollowing
                                        ? "bg-muted text-foreground hover:bg-muted/80"
                                        : "bg-primary text-primary-foreground hover:opacity-90"
                                    } ${isFollowLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                {isUserFollowing ? (
                                    <>
                                        <UserCheck className="w-4 h-4" />
                                        Following
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        Follow
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl text-foreground">{user.name}</h1>
                        <CheckCircle className="w-5 h-5 text-primary fill-primary/10" />
                        {user.connectionStatus !== "none" && (
                            <span className="text-sm text-muted-foreground">
                                · {user.connectionStatus === "connected" ? "1st" : "2nd"}
                            </span>
                        )}
                    </div>

                    <p className="text-base mb-2 text-foreground">{user.headline}</p>

                    <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
                        <span>{user.location}</span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                        {user.mutualConnections} mutual connections
                    </p>

                    {/* Identity Chips - Read Only */}
                    {user.identity && (
                        <ProfileIdentityChips initialIdentity={user.identity} readOnly />
                    )}
                </div>
            </div>
        </div>
    );
}
