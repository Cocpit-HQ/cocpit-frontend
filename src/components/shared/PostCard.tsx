"use client"

import React from 'react';
import Link from 'next/link';
import { Post } from '@/types/entities';
import { PostOptionsMenu } from '@/components/home/PostOptionsMenu';
import DOMPurify from 'dompurify';


interface PostCardProps {
    post: any; // Using any to handle both Entity Post and Backend Saved Post
    href?: string;
    onDelete?: (id: string) => void;
    isOwnPost?: boolean;
    companyId?: string;
}

export default function PostCard({ post, href, onDelete, isOwnPost, companyId }: PostCardProps) {
    // Support both backend (post_id, image_url, media[]) and frontend (id, imageSrc, images[])
    const id = post.post_id || post.id;
    const content = post.content || '';

    // Refined image detection
    const image = post.image_url ||
        post.imageSrc ||
        (post.media && post.media.length > 0 ? post.media[0].url : null) ||
        (post.images && post.images.length > 0 ? (typeof post.images[0] === 'string' ? post.images[0] : post.images[0].url) : null);

    // Also check shared_post
    const sharedImage = post.shared_post?.imageSrc ||
        (post.shared_post?.media && post.shared_post.media.length > 0 ? post.shared_post.media[0].url : null) ||
        (post.shared_post?.images && post.shared_post.images.length > 0 ? (typeof post.shared_post.images[0] === 'string' ? post.shared_post.images[0] : post.shared_post.images[0].url) : null);
    const displayImage = image || sharedImage;

    const sanitizedContent = typeof window !== 'undefined' ? DOMPurify.sanitize(content) : content;

    return (
        <div className="relative group h-full">
            <Link href={href || `/post/${id}`} className="block w-full h-full">
                <div className="aspect-square bg-card border border-border rounded-xl overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                    {displayImage ? (
                        <img
                            src={displayImage}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted/20 flex items-center justify-center p-6 bg-gradient-to-br from-card to-muted/30">
                            <div
                                className="text-xs md:text-sm text-foreground/80 text-center line-clamp-[8] leading-relaxed font-light italic"
                                dangerouslySetInnerHTML={{ __html: sanitizedContent || (displayImage ? '' : 'No content available') }}
                            />
                        </div>
                    )}

                    {/* Overlay for text readability - only show if there's an image or bottom text */}
                    {(displayImage || sanitizedContent) && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />
                    )}

                    <div className="absolute bottom-0 left-0 p-4 w-full flex flex-col justify-end min-h-[40%]">
                        {sanitizedContent && displayImage && (
                            <div
                                className="text-white text-xs md:text-sm font-medium line-clamp-3 leading-snug mb-2 group-hover:line-clamp-none transition-all duration-300"
                                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                            />
                        )}
                        <div className="flex items-center justify-between mt-auto">
                            {post.author_name && (
                                <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold">
                                    {post.author_name}
                                </p>
                            )}
                            {/* Optional: Add a small icon to indicate post type (image/text/poll) */}
                        </div>
                    </div>
                </div>
            </Link>

            {isOwnPost && (
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PostOptionsMenu
                        postId={id.toString()}
                        isOwnPost={isOwnPost}
                        onDelete={onDelete}
                        className="bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60"
                        postType={post.poll ? 'poll' : (displayImage ? 'image' : 'text')}
                        visibility={post.visibility || 'public'}
                        companyId={companyId}
                    />
                </div>
            )}
        </div>
    );
}
