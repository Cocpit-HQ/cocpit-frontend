"use client";

import React from "react";
import Image from "next/image";
import { FileText } from "lucide-react";
import { Icon } from "@iconify/react";
import { SharedPostItem } from "@/types/group-chat";

interface GroupPostsTabProps {
    posts?: SharedPostItem[];
    isLoading: boolean;
    onPostClick: (postId: string) => void;
}

export const GroupPostsTab: React.FC<GroupPostsTabProps> = ({
    posts,
    isLoading,
    onPostClick
}) => {
    return (
        /* Frame 2610097: 16px below tabs, max-w-[618px], responsive height, gap 8px */
        <div className="mt-4 max-w-[618px] mx-auto w-full font-['DM_Sans'] pb-6">
            {isLoading ? (
                /* Skeleton showing 6 items matching Frame 2610097 */
                <div className="grid grid-cols-3 gap-2 max-w-[618px] mx-auto w-full">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div
                            key={n}
                            className="h-[202.66px] w-full rounded-[8px] bg-[var(--ds-surface-1)]/60 animate-pulse"
                        />
                    ))}
                </div>
            ) : posts && posts.length > 0 ? (
                /* Frame 2610097: 3 columns, gap 8px (horizontal and vertical), responsive height */
                <div className="grid grid-cols-3 gap-2 max-w-[618px] mx-auto w-full">
                    {posts.map((post, index) => {
                        const firstMedia = post.media && post.media.length > 0 ? post.media[0] : null;
                        const isVideo = Boolean(firstMedia && (firstMedia.media_type === 'video' || firstMedia.url?.includes('.mp4')));
                        const isPoll = Boolean(post.post_type === 'poll' || post.poll);
                        const uniqueKey = post.message_id ? `${post.post_id}-${post.message_id}` : `${post.post_id}-${index}`;

                        return (
                            /* Rectangle 14: 200px width (in 3 col), 202.66px height, rounded 8px */
                            <div
                                key={uniqueKey}
                                onClick={() => onPostClick(post.post_id)}
                                className="h-[202.66px] w-full rounded-[8px] overflow-hidden relative cursor-pointer group bg-[var(--ds-bg)] border border-[var(--ds-border)] transition-transform hover:opacity-95"
                            >
                                {isVideo && firstMedia ? (
                                    /* Video Post: Show video only filling the square */
                                    <div className="w-full h-full relative bg-black flex items-center justify-center">
                                        <video
                                            src={firstMedia.url}
                                            preload="metadata"
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover rounded-[8px]"
                                        />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                            <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white">
                                                <Icon icon="solar:play-bold" width={16} height={16} />
                                            </div>
                                        </div>
                                    </div>
                                ) : firstMedia ? (
                                    /* Image Post / Media with content: Show ONLY first image filling the square */
                                    <div className="w-full h-full relative bg-zinc-900">
                                        <Image
                                            src={firstMedia.url}
                                            alt="Shared post"
                                            fill
                                            sizes="(max-width: 768px) 33vw, 200px"
                                            className="object-cover rounded-[8px] group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ) : isPoll ? (
                                    /* Poll Post: Question + option pills matching Figma row 2, col 2 */
                                    <div className="w-full h-full p-3 rounded-[8px] bg-[var(--ds-bg)] flex flex-col justify-between overflow-hidden">
                                        <p className="font-['DM_Sans'] font-medium text-[13px] leading-[18px] text-[var(--ds-text-primary)] line-clamp-2">
                                            {post.poll?.question || post.title || post.caption || "What skill would you like to learn?"}
                                        </p>
                                        <div className="flex flex-col gap-1.5 mt-2">
                                            {(post.poll?.options && post.poll.options.length > 0
                                                ? post.poll.options
                                                : [
                                                    { option_text: "AI & Technology" },
                                                    { option_text: "Leadership" },
                                                    { option_text: "Public Speaking" }
                                                ]
                                            ).slice(0, 3).map((opt, i) => (
                                                <div
                                                    key={i}
                                                    className="h-[30px] px-3 flex items-center border border-[var(--ds-border)] rounded-full text-[11px] leading-[14px] text-[var(--ds-text-secondary)] truncate bg-[var(--ds-surface-1)]/30"
                                                >
                                                    <span className="truncate">{opt.option_text || opt.text || `Option ${i + 1}`}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* Text Post: Clean typography matching Figma row 2, col 1 */
                                    <div className="w-full h-full p-3 rounded-[8px] bg-[var(--ds-bg)] flex flex-col justify-start overflow-hidden">
                                        <p className="font-['DM_Sans'] font-normal text-[11px] leading-[16px] text-[var(--ds-text-primary)] line-clamp-[9] whitespace-pre-wrap break-words">
                                            {post.caption || post.title || "Shared post"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--ds-text-secondary)]">
                    <FileText className="w-10 h-10 mb-2 opacity-30 text-[var(--ds-text-secondary)]" />
                    <p className="text-sm font-medium text-[var(--ds-text-primary)]">No posts shared yet</p>
                    <p className="text-xs text-[var(--ds-text-muted)] mt-1">
                        Posts shared in this group will appear here
                    </p>
                </div>
            )}
        </div>
    );
};
