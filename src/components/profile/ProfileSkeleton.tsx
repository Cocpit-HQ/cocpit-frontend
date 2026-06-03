"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfilePostCardSkeleton } from "@/features/profile/components/skeletons/ProfilePostCardSkeleton";

export function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto py-6 md:py-8 pb-20 md:pb-12 px-4 md:px-0">
                <div className="flex flex-col gap-6 md:gap-8">
                    <div className="w-full">
                        {/* Header Card Skeleton */}
                        <div className="rounded-xl overflow-hidden border mb-4 relative bg-card border-border min-h-[300px]">
                            <Skeleton className="h-36 w-full" /> {/* Cover */}
                            <div className="px-6 pb-6 relative">
                                <Skeleton className="w-32 h-32 rounded-full absolute -top-16 border-4 border-background" />
                                <div className="pt-20 space-y-4">
                                    <Skeleton className="h-8 w-1/2" /> {/* Name */}
                                    <Skeleton className="h-4 w-1/3" /> {/* Headline */}
                                    <div className="flex gap-2">
                                        <Skeleton className="h-4 w-20" /> {/* Location */}
                                        <Skeleton className="h-4 w-24" /> {/* Connections */}
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <Skeleton className="h-10 w-28 rounded-lg" />
                                        <Skeleton className="h-10 w-28 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Skeleton */}
                        <div className="rounded-xl border p-4 mb-6 bg-card border-border grid grid-cols-3 gap-4">
                            <div className="flex flex-col items-center">
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                            <div className="flex flex-col items-center">
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                            <div className="flex flex-col items-center">
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>

                        {/* About Skeleton */}
                        <div className="rounded-xl border p-6 mb-4 bg-card border-border space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>

                        {/* Experience Skeleton */}
                        <div className="rounded-xl border p-6 mb-4 bg-card border-border space-y-6">
                            <Skeleton className="h-6 w-32" />
                            {[1, 2].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="w-12 h-12 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-1/2" />
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-4 w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Education Skeleton */}
                        <div className="rounded-xl border p-6 mb-4 bg-card border-border space-y-6">
                            <Skeleton className="h-6 w-32" />
                            {[1, 2].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="w-12 h-12 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-1/2" />
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-4 w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Skills Section Skeleton */}
                        <div className="rounded-xl border p-6 mb-4 bg-card border-border space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-8 w-20 rounded-full" />
                                <Skeleton className="h-8 w-24 rounded-full" />
                                <Skeleton className="h-8 w-16 rounded-full" />
                                <Skeleton className="h-8 w-28 rounded-full" />
                                <Skeleton className="h-8 w-22 rounded-full" />
                            </div>
                        </div>

                        {/* Post Section Skeleton */}
                        <div className="rounded-xl border p-6 mb-4 bg-card border-border space-y-4">
                            <Skeleton className="h-6 w-32 mb-2" />
                            <div className="flex flex-row gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {[1, 2, 3].map((i) => (
                                    <ProfilePostCardSkeleton key={i} />
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
