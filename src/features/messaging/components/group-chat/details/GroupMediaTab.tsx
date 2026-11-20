"use client";

import React from "react";
import Image from "next/image";
import { Image as LucideImage } from "lucide-react";
import { Icon } from "@iconify/react";
import { SharedMediaItem } from "@/types/group-chat";

interface GroupMediaTabProps {
    media?: SharedMediaItem[];
    isLoading: boolean;
    onPreviewMedia: (item: SharedMediaItem, index: number) => void;
}

export const GroupMediaTab: React.FC<GroupMediaTabProps> = ({
    media,
    isLoading,
    onPreviewMedia
}) => {
    return (
        /* Frame 2608673: 16px below tabs, max-w-[618px], responsive height, gap 8px */
        <div className="mt-4 max-w-[618px] mx-auto w-full font-['DM_Sans'] pb-6">
            {isLoading ? (
                /* Skeleton showing 6 items matching Frame 2608673 */
                <div className="grid grid-cols-3 gap-2 max-w-[618px] mx-auto w-full">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div
                            key={n}
                            className="h-[202.66px] w-full rounded-[8px] bg-[var(--ds-surface-1)]/60 animate-pulse"
                        />
                    ))}
                </div>
            ) : media && media.length > 0 ? (
                /* Frame 2608673: 3 columns, gap 8px (horizontal and vertical), responsive height */
                <div className="grid grid-cols-3 gap-2 max-w-[618px] mx-auto w-full">
                    {media.map((item, idx) => {
                        const isVideo = Boolean(item.media_type === 'video' || item.url?.includes('.mp4'));
                        const uniqueKey = item.media_id ? `${item.media_id}-${idx}` : `media-${idx}`;

                        return (
                            /* Rectangle 14: 200px width (in 3 col), 202.66px height, rounded 8px */
                            <div
                                key={uniqueKey}
                                onClick={() => onPreviewMedia(item, idx)}
                                className="h-[202.66px] w-full rounded-[8px] overflow-hidden relative cursor-pointer group bg-[var(--ds-surface-1)] border border-[var(--ds-border)] transition-transform hover:opacity-95 flex items-center justify-center"
                            >
                                {isVideo ? (
                                    /* Video Media: Full view contain without cropping */
                                    <div className="w-full h-full relative bg-black flex items-center justify-center">
                                        <video
                                            src={item.url}
                                            preload="metadata"
                                            muted
                                            playsInline
                                            className="w-full h-full object-contain rounded-[8px]"
                                        />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                            <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white">
                                                <Icon icon="solar:play-bold" width={16} height={16} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Image Media: Full view contain without cropping */
                                    <div className="w-full h-full relative bg-[var(--ds-surface-1)] flex items-center justify-center p-0.5">
                                        <Image
                                            src={item.url}
                                            alt={item.filename || "Group media"}
                                            fill
                                            sizes="(max-width: 768px) 33vw, 200px"
                                            className="object-contain rounded-[8px] group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--ds-text-secondary)]">
                    <LucideImage className="w-10 h-10 mb-2 opacity-30 text-[var(--ds-text-secondary)]" />
                    <p className="text-sm font-medium text-[var(--ds-text-primary)]">No media shared yet</p>
                    <p className="text-xs text-[var(--ds-text-muted)] mt-1">
                        Photos and videos shared in this group will appear here
                    </p>
                </div>
            )}
        </div>
    );
};
