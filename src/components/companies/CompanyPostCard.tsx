"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Post } from '@/types/entities';
import { formatTimeAgo } from '@/lib/utils/timeFormatter';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CompanyPostCardProps {
    post: Post;
    onLike?: () => void;
    onDelete?: (id: string) => void;
    isOwner?: boolean;
}

export function CompanyPostCard({ post, onLike, onDelete, isOwner }: CompanyPostCardProps) {
    const firstImage = post.images?.[0];
    const hasMedia = !!firstImage;
    const mediaUrl = firstImage || post.videoSrc || null;
    const isVideo = !!post.videoSrc && !hasMedia;

    const router = useRouter();

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if selecting text
        if (window.getSelection()?.toString()) return;
        router.push(`/post/${post.id}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer"
        >
            {/* Media Cover */}
            <div className="relative aspect-video bg-muted overflow-hidden">
                {mediaUrl ? (
                    isVideo ? (
                        <video
                            src={mediaUrl}
                            className="w-full h-full object-cover"
                            preload="metadata"
                        />
                    ) : (
                        <img
                            src={mediaUrl}
                            alt="Post content"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground p-4 text-center text-sm">
                        {post.content ? (
                            <p className="line-clamp-4">{post.content}</p>
                        ) : (
                            <span className="italic">No content</span>
                        )}
                    </div>
                )}

                {/* Overlay Gradient for text readability if needed, or just type badge */}
                {post.category && (
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium">
                        {post.category}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{post.timeAgo} ago</span>

                    {isOwner && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted">
                                        <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => onDelete?.(post.id)}>
                                        Delete Post
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {/* Text Content (if media exists, clamp tightly; if no media, it was shown in cover area mostly, but show snippet here too) */}
                {mediaUrl && post.content && (
                    <p className="text-sm text-foreground/90 line-clamp-3 mb-4 flex-1">
                        {post.content}
                    </p>
                )}
                {!mediaUrl && (
                    <div className="flex-1"></div> // Spacer if content was in header
                )}

                {/* Interactions Footer */}
                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-muted-foreground">
                    <button
                        onClick={(e) => { e.stopPropagation(); onLike?.(); }}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs"
                    >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{post.likes}</span>
                    </button>

                    <Link
                        href={`/post/${post.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{post.comments}</span>
                    </Link>

                    <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs ml-auto"
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        {/* Share count often not available, or just icon */}
                    </button>
                </div>
            </div>
        </div>
    );
}
