'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

import { useScrollRestoration } from '@/hooks/use-scroll-restoration';

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
    const router = useRouter();
    const { posts, sessionId, currentUser, togglePostVisibility, loadMorePosts, resetSession, hasMore, loading: feedLoading, isError } = useFeed();
    const { activeProfile, isCompany, userCompanies } = useActiveProfile();

    // Restore page scroll position when returning to feed after viewing a post or repost
    useScrollRestoration(!feedLoading && posts.length > 0);
    const { pendingPosts, cancelUpload } = usePostUpload();
    const editingPostId = useUIStore(state => state.editingPostId);
    const editingPostData = useUIStore(state => state.editingPostData);
    const setEditMode = useUIStore(state => state.setEditMode);
    const storeSharedPostData = useUIStore(state => state.sharedPostData);
    const [repostingPostData, setRepostingPostData] = useState<any | null>(null);
    // Purpose of Bug Fix: Combine local repost state with UI store sharedPostData for post detail page redirect
    const activeRepostData = repostingPostData || storeSharedPostData;

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
        if (inView && hasMore && !feedLoading && !isError) {
            loadMorePosts();
        }
    }, [inView, hasMore, feedLoading, isError, loadMorePosts]);

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
                        router.push('/article/create');
                    }}
                    onPostCreated={() => {
                        resetSession();
                        setRepostingPostData(null);
                        useUIStore.getState().setSharedPostData(null);
                    }}
                    editPostId={editingPostId}
                    editPostData={editingPostData}
                    onClearEdit={() => {
                        setEditMode(false, null, null);
                    }}
                    repostData={activeRepostData}
                    onClearRepost={() => {
                        setRepostingPostData(null);
                        useUIStore.getState().setSharedPostData(null);
                    }}
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
                                        onToggleVisibility={togglePostVisibility}
                                        priority={index < 4}
                                        onEdit={(post) => {
                                            setEditMode(true, post.id, post);
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
