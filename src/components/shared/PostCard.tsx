"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { PostOptionsMenu } from '@/components/home/PostOptionsMenu';
import { PostMenuAccess } from '@/features/feed/utils/postMenuAccess';
import DOMPurify from 'dompurify';
import { usePostImpression } from '@/hooks/usePostImpression';
import { Briefcase, AlertTriangle } from 'lucide-react';
import { AppealModal } from './AppealModal';


interface PostCardProps {
    post: any; // Using any to handle both Entity Post and Backend Saved Post
    href?: string;
    onDelete?: (id: string) => void;
    isOwnPost?: boolean;
    menuAccess?: PostMenuAccess;
    companyId?: string;
}

export default function PostCard({ post, href, onDelete, isOwnPost, menuAccess, companyId }: PostCardProps) {
    const impressionRef = usePostImpression(post.post_id || post.id);
    const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
    // Support both backend (post_id, image_url, media[]) and frontend (id, imageSrc, images[])
    const id = post.post_id || post.id;
    const isPoll = Boolean(post.poll);
    const content = isPoll ? (post.title || post.content || '') : (post.content || '');

    // Refined image detection
    const image = post.image_url ||
        post.imageSrc ||
        (post.media && post.media.find((item: { media_type?: string; url?: string }) => item.media_type === 'image')?.url) ||
        (post.images && post.images.length > 0 ? (typeof post.images[0] === 'string' ? post.images[0] : post.images[0].url) : null);
    const video = post.video_url ||
        post.videoSrc ||
        (post.media && post.media.find((item: { media_type?: string; url?: string }) => item.media_type === 'video')?.url) ||
        null;

    // Also check shared_post
    const sharedImage = post.shared_post?.imageSrc ||
        (post.shared_post?.media && post.shared_post.media.length > 0 ? post.shared_post.media[0].url : null) ||
        (post.shared_post?.images && post.shared_post.images.length > 0 ? (typeof post.shared_post.images[0] === 'string' ? post.shared_post.images[0] : post.shared_post.images[0].url) : null);
    
    // Check if it's a shared job
    const isSharedJob = post.shared_post?.shared_entity_type === 'job' || post.shared_post?.job_id || post.shared_post?.isJob;

    const displayImage = image || (!isSharedJob ? sharedImage : null);
    const displayVideo = !displayImage ? video : null;

    const sanitizedContent = typeof window !== 'undefined' ? DOMPurify.sanitize(content) : content;

    return (
        <div ref={impressionRef as any} className="relative group h-full">
            {post.is_unlisted && isOwnPost && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 rounded-xl p-4 text-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
                    <h3 className="text-white font-semibold mb-2">Post Removed</h3>
                    <p className="text-white/80 text-xs mb-4">This post was removed by moderators for violating our guidelines.</p>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            setIsAppealModalOpen(true);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Appeal Decision
                    </button>
                </div>
            )}
            
            <Link href={href || `/post/${id}`} className="block w-full h-full" onClick={(e) => post.is_unlisted && e.preventDefault()}>
                <div className="aspect-square bg-card border border-border rounded-xl overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                    {displayImage ? (
                        <img
                            src={displayImage}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : displayVideo ? (
                        <video
                            src={displayVideo}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                        />
                    ) : isSharedJob ? (
                        <div className="w-full h-full bg-primary/10 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-card to-primary/5">
                            <Briefcase className="w-12 h-12 text-primary/70 mb-3" />
                            <div className="text-sm font-semibold text-foreground text-center line-clamp-2">
                                {post.shared_post?.title || post.shared_post?.jobTitle || "Job Opportunity"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 truncate">
                                {post.shared_post?.company_name || post.shared_post?.jobCompany}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full bg-muted/20 flex items-center justify-center p-6 bg-gradient-to-br from-card to-muted/30">
                            <div
                                className="text-xs md:text-sm text-foreground/80 text-center line-clamp-[8] leading-relaxed font-light italic"
                                dangerouslySetInnerHTML={{ __html: sanitizedContent || (displayImage ? '' : 'No content available') }}
                            />
                        </div>
                    )}

                    {/* Overlay for text readability - only show if there's an image or bottom text */}
                    {(displayImage || displayVideo || (!isSharedJob && sanitizedContent)) && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />
                    )}

                    <div className="absolute bottom-0 left-0 p-4 w-full flex flex-col justify-end min-h-[40%]">
                        {!isSharedJob && sanitizedContent && (displayImage || displayVideo) && (
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

            {!post.is_unlisted && (
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PostOptionsMenu
                        postId={id.toString()}
                        isOwnPost={isOwnPost}
                        onDelete={onDelete}
                        className="bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60"
                        postType={post.poll ? 'poll' : (displayVideo ? 'video' : (displayImage ? 'image' : (isSharedJob ? 'article' : 'text')))}
                        visibility={post.visibility || 'public'}
                        companyId={companyId}
                    />
                </div>
            )}

            {isAppealModalOpen && (
                <AppealModal
                    isOpen={isAppealModalOpen}
                    onOpenChange={setIsAppealModalOpen}
                    postId={id.toString()}
                />
            )}
        </div>
    );
}
