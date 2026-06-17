'use client';

import React, { useMemo, useEffect } from 'react';
import FeedPost from '@/features/feed/components/FeedPost';
import PostSkeleton from './PostSkeleton';
import { CreatePostCardSkeleton } from '@/features/feed/components/skeletons/CreatePostCardSkeleton';
import { FeedPostCardSkeleton } from '@/features/feed/components/skeletons/FeedPostCardSkeleton';
import { useFeed } from '@/hooks/use-feed';
import { useInView } from '@/hooks/use-in-view';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { StoryRail } from '@/features/home/components/StoryRail';
import { SuggestedPeopleStrip } from '@/features/home/components/SuggestedPeopleStrip';
import { FeedSortDropdown } from './FeedSortDropdown';
import { StoryDetail, StoryGroup } from '@/types/showcase';
import { ApplicantInsightCard, CompactJobRecommendation, JobMatchesCard } from './FeedInsights';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

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
    const { activeProfile, isCompany } = useActiveProfile();

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
        <section className="lg:col-span-8 max-w-[560px] w-full">
            {/* Desktop Showcase Rail */}
            {/* <div className="hidden md:block">
                {groups.every(g => !g.stories || g.stories.length === 0) && !storyLoading ? (
                    <SuggestedPeopleStrip />
                ) : (
                    <StoryRail
                        groups={groups}
                        isLoading={storyLoading}
                        activeAccount={activeAccount}
                        variant="desktop-showcase"
                        onCreateClick={() => setShowCreateStory(true)}
                        onStoryClick={(story) => setSelectedStory(story)}
                    />
                )}
            </div> */}

            <PullToRefresh onRefresh={resetSession}>
                {/* Mobile Story/Suggested Rail */}
                {/* <div className="md:hidden min-h-[120px] transition-all duration-500 overflow-hidden">
                    <div className="animate-in fade-in duration-500">
                        <StoryRail
                            groups={groups}
                            isLoading={storyLoading}
                            activeAccount={activeAccount}
                            onCreateClick={() => setShowCreateStory(true)}
                            onStoryClick={(story) => {
                                const group = groups.find(g => g.stories.some(s => s.id === story.id));
                                if (group) {
                                    setMobileSelectedGroupId(group.author.id || 0);
                                }
                            }}
                        />
                    </div>
                </div> */}

                {/* Sort Dropdown */}
                {/* <div className="flex justify-end mb-2 px-1 mt-1 md:mt-0">
                    <FeedSortDropdown activeTab={activeTab} setActiveTab={setActiveTab} />
                </div> */}

                {/* Posts */}
                <div className="md:space-y-6">
                    {/* Skeletons appear when initial load is happening */}
                    {feedLoading && posts.length === 0 && (
                        <div className="flex flex-col gap-6">
                            <CreatePostCardSkeleton />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <FeedPostCardSkeleton key={i} />
                            ))}
                        </div>
                    )}

                    <div className="space-y-6">
                        {sortedPosts.map((post, index) => {
                            return (
                                <div key={post.id}>
                                    <FeedPost
                                        {...post}
                                        sessionId={sessionId}
                                        initialComments={post.commentData}
                                        isOwnPost={
                                            post.isCompanyPost
                                                // Company post: only the matching active company account is the owner
                                                ? isCompany && !!activeProfile && post.authorId?.toString() === activeProfile.id?.toString()
                                                // Personal post: only the personal account is the owner (not when acting as company)
                                                : !isCompany && post.authorId?.toString() === currentUser?.id?.toString()
                                        }
                                        onDelete={deletePost}
                                        onToggleVisibility={togglePostVisibility}
                                        priority={index < 4}
                                    />
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
