"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Post } from '@/types/entities';
import { formatTimeAgo } from '@/lib/timeFormatter';
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
    onEdit?: (post: Post) => void;
    isOwner?: boolean;
}

export function CompanyPostCard({ post, onLike, onDelete, onEdit, isOwner }: CompanyPostCardProps) {
    const firstImage = post.images?.[0];
    const hasMedia = !!firstImage;
    const mediaUrl = firstImage || post.videoSrc || null;
    const isVideo = !!post.videoSrc && !hasMedia;

    const router = useRouter();

    const stripHtml = (html: string) => {
        if (!html) return "";
        return html.replace(/<[^>]*>?/gm, '');
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if selecting text
        if (window.getSelection()?.toString()) return;
        router.push(`/post/${post.id}`);
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Update': return 'bg-blue-500/90 text-white';
            case 'Hiring': return 'bg-green-500/90 text-white';
            case 'Milestone': return 'bg-purple-500/90 text-white';
            case 'Insight': return 'bg-amber-500/90 text-white';
            case 'Article': return 'bg-indigo-500/90 text-white';
            default: return 'bg-primary/90 text-primary-foreground';
        }
    };

    const cleanContent = stripHtml(post.content);

    return (
        <div
            onClick={handleCardClick}
            className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex flex-col h-full cursor-pointer relative"
        >
            {/* Hover "View Details" Overlay - Visible only on hover */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none flex items-center justify-center">
                <div className="bg-background/90 text-foreground px-4 py-2 rounded-full font-medium text-sm shadow-sm transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    View Details
                </div>
            </div>

            {/* Media Cover - 16:9 Aspect Ratio */}
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
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    )
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 text-muted-foreground p-6 text-center">
                        <div className="p-3 rounded-full bg-muted/50 mb-3">
                            <MessageCircle className="w-6 h-6 opacity-50" />
                        </div>
                    </div>
                )}

                {/* Category Badge */}
                {post.category && (
                    <div className={`absolute top-3 right-3 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold shadow-sm z-20 ${getCategoryColor(post.category)}`}>
                        {post.category}
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="p-5 flex flex-col flex-1 relative z-20 bg-card">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        {post.timeAgo} ago
                    </span>

                    {isOwner && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted rounded-full">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEdit?.(post)}>
                                        Edit Post
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => onDelete?.(post.id)}>
                                        Delete Post
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {/* Text Content */}
                <div className="mb-4 flex-1">
                    {cleanContent ? (
                        <>
                            <p className="text-sm text-foreground/90 line-clamp-3 leading-relaxed">
                                {cleanContent}
                            </p>
                            {cleanContent.length > 100 && (
                                <span className="text-xs text-primary font-medium mt-1 inline-block hover:underline">
                                    Read more
                                </span>
                            )}
                        </>
                    ) : (
                        <p className="text-sm italic text-muted-foreground">No description</p>
                    )}
                </div>

                {/* Interactions Footer */}
                <div className="pt-3 border-t border-border/50 flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                        <ThumbsUp className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-primary text-primary' : ''}`} />
                        <span>{post.likes}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{post.comments}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium ml-auto">
                        <span className="text-[10px] uppercase tracking-wide opacity-70">
                            {post.visibility || 'Public'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
