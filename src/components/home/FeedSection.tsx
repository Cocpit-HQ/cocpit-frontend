'use client';

import React, { useMemo, useEffect, useState } from 'react';
import FeedPost from '@/features/feed/components/FeedPost';
{/* ===== OLD COMPOSER (commented out — replaced by FeedComposerInline) =====
import FeedComposer from '@/features/feed/components/FeedComposer';
===== END OLD COMPOSER ===== */}
import FeedComposerInline from '@/features/feed/components/FeedComposerInline';
import PostSkeleton from './PostSkeleton';
import { CreatePostCardSkeleton } from '@/features/feed/components/skeletons/CreatePostCardSkeleton';
import { FeedPostCardSkeleton } from '@/features/feed/components/skeletons/FeedPostCardSkeleton';
import { useFeed } from '@/hooks/use-feed';
import { useInView } from '@/hooks/use-in-view';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useUIStore } from '@/store/ui.store';
import { getPostMenuAccess } from '@/features/feed/utils/postMenuAccess';
import { StoryDetail, StoryGroup } from '@/types/showcase';
import { ApplicantInsightCard, CompactJobRecommendation, JobMatchesCard } from './FeedInsights';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import dynamic from 'next/dynamic';
import { usePostUpload } from '@/context/PostUploadContext';
import { PostUploadProgressStrip } from '@/features/feed/components/PostUploadProgressStrip';

// Removed CreatePostModal

interface FeedSectionProps {
    groups: StoryGroup[];
    storyLoading: boolean;
    setShowCreateStory: (show: boolean) => void;
    setMobileSelectedGroupId: (id: string | number) => void;
    setSelectedStory: (story: StoryDetail | null) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const FeedSection = ({
    groups,
    storyLoading,
    setShowCreateStory,
    setMobileSelectedGroupId,
    setSelectedStory,
    activeTab,
    setActiveTab
}: FeedSectionProps) => {
    const { posts, sessionId, currentUser, deletePost, togglePostVisibility, loadMorePosts, resetSession, hasMore, loading: feedLoading } = useFeed();
    const { activeProfile, isCompany, userCompanies } = useActiveProfile();
    const { pendingPosts, cancelUpload } = usePostUpload();
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editingPostData, setEditingPostData] = useState<any | null>(null);
    const [repostingPostData, setRepostingPostData] = useState<any | null>(null);

    const activeAccount = useMemo(() => (
        isCompany && activeProfile
            ? { name: activeProfile.name, image: activeProfile.avatar_url }
            : currentUser
    ), [isCompany, activeProfile, currentUser]);

    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    useEffect(() => {
        if (inView && hasMore && !feedLoading) {
            loadMorePosts();
        }
    }, [inView, hasMore, feedLoading, loadMorePosts]);

    const sortedPosts = useMemo(() => {
        const sorted = [...posts];
        if (activeTab === 'top') {
            sorted.sort((a, b) => b.likes - a.likes);
        }
        return sorted;
    }, [posts, activeTab]);

    return (
        <section className="lg:col-span-8 max-w-[560px] w-full flex flex-col items-center">
            <PullToRefresh onRefresh={resetSession}>
                {/* ===== OLD COMPOSER (commented out) =====
                <FeedComposer onOpenComposer={() => setIsCreateModalOpen(true)} />
                ===== END OLD COMPOSER ===== */}
                <FeedComposerInline 
                    onOpenArticle={() => {
                        const { setArticleMode } = useUIStore.getState();
                        setArticleMode(true);
                        // Using window.history or router to ensure we're at /feed is handled by the state change in HomePage.
                    }}
                    onPostCreated={() => {
                        resetSession();
                        setRepostingPostData(null);
                    }}
                    editPostId={editingPostId}
                    editPostData={editingPostData}
                    onClearEdit={() => {
                        setEditingPostId(null);
                        setEditingPostData(null);
                    }}
                    repostData={repostingPostData}
                    onClearRepost={() => setRepostingPostData(null)}
                />

                {/* Mobile Progress Strip (Hidden on Desktop) */}
                <div className="w-full flex flex-col md:hidden px-4 pt-2">
                    {pendingPosts.map(post => (
                        <PostUploadProgressStrip
                            key={post.id}
                            progress={post.progress}
                            phase={post.status as any}
                            onCancel={() => cancelUpload(post.id)}
                        />
                    ))}
                </div>

                {/* Posts */}
                <div className="w-full mt-[12px] flex flex-col">
                    {/* Skeletons appear when initial load is happening */}
                    {feedLoading && posts.length === 0 && (
                        <div className="flex flex-col gap-6 w-full max-w-[442px] mx-auto">
                            <CreatePostCardSkeleton />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <FeedPostCardSkeleton key={i} />
                            ))}
                        </div>
                    )}

                    <div className="w-full flex flex-col">
                        {sortedPosts.map((post, index) => {
                            return (
                                <div key={post.id} className="w-full">
                                    <FeedPost
                                        {...post}
                                        sessionId={sessionId}
                                        initialComments={post.commentData}
                                        menuAccess={getPostMenuAccess({
                                            isCompanyPost: post.isCompanyPost,
                                            companyId: post.authorId,
                                            createdByUserId: (post as any).createdByUserId,
                                            currentUserId: currentUser?.id,
                                            userCompanies,
                                            activeProfile,
                                        })}
                                        onDelete={deletePost}
                                        onToggleVisibility={togglePostVisibility}
                                        priority={index < 4}
                                        onEdit={(post) => {
                                            setEditingPostId(post.id);
                                            setEditingPostData(post);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        onRepostWithThoughts={(post) => {
                                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                                useUIStore.getState().setSharedPostData(post);
                                                useUIStore.getState().setActiveModal('create-post');
                                            } else {
                                                setRepostingPostData(post);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }
                                        }}
                                    />

                                    {/* 
                                    {index === 0 && (
                                        <div className="mt-6">
                                            <ApplicantInsightCard />
                                        </div>
                                    )}
                                    {index === 1 && (
                                        <div className="mt-6">
                                            <JobMatchesCard />
                                        </div>
                                    )}
                                    {index === 2 && (
                                        <div className="mt-6">
                                            <CompactJobRecommendation />
                                        </div>
                                    )}
                                    */}
                                </div>
                            );
                        })}
                    </div>

                    {hasMore && (
                        <div ref={loadMoreRef} className="py-4 flex justify-center w-full">
                            {feedLoading && <FeedPostCardSkeleton />}
                        </div>
                    )}
                </div>
            </PullToRefresh>
        </section>
    );
};

export default FeedSection;
