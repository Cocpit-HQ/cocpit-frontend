'use client';

import React, { useMemo, useEffect } from 'react';
import FeedPost from './FeedPost';
import PostSkeleton from './PostSkeleton';
import CreatePost from './CreatePost';
import { useFeed } from '@/context/FeedContext';
import { useInView } from '@/hooks/use-in-view';
import { useActionModal } from '@/context/ActionModalContext';
import { StoryRail } from './StoryRail';
import { FeedTabs } from './FeedTabs';
import { PostType } from './CreatePostModal';
import { StoryGroup, StoryDetail } from '@/types/showcase';

interface FeedSectionProps {
    groups: StoryGroup[];
    storyLoading: boolean;
    setShowCreateStory: (show: boolean) => void;
    setMobileSelectedGroupId: (id: number) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const FeedSection = ({
    groups,
    storyLoading,
    setShowCreateStory,
    setMobileSelectedGroupId,
    activeTab,
    setActiveTab
}: FeedSectionProps) => {
    const { posts, currentUser, deletePost, togglePostVisibility, loadMorePosts, hasMore, loading: feedLoading } = useFeed();
    const { openModal } = useActionModal();

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
        <section className="lg:col-span-8">
            {/* Mobile Story Rail */}
            <div className="md:hidden border-b border-border">
                <StoryRail
                    groups={groups}
                    isLoading={storyLoading}
                    onCreateClick={() => setShowCreateStory(true)}
                    onStoryClick={(story) => {
                        const group = groups.find(g => g.stories.some(s => s.id === story.id));
                        if (group) {
                            setMobileSelectedGroupId(group.author.id || 0);
                        }
                    }}
                />
            </div>

            {/* Feed Tabs */}
            <div className="md:hidden mt-4">
                <FeedTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            {/* Create Post */}
            <div className="hidden md:block">
                <CreatePost onOpenModal={openModal as (type?: PostType) => void} />
            </div>

            {/* Posts */}
            <div className="space-y-2 md:space-y-3">
                {/* Skeletons appear when initial load is happening */}
                {feedLoading && posts.length === 0 &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <PostSkeleton key={i} />
                    ))}

                {sortedPosts.map((post, index) => (
                    <FeedPost
                        key={post.id}
                        {...post}
                        initialComments={post.commentData}
                        isOwnPost={post.author === currentUser.name}
                        onDelete={deletePost}
                        onToggleVisibility={togglePostVisibility}
                        priority={index < 4}
                    />
                ))}

                {/* Infinite Scroll Sentinel */}
                {hasMore && (
                    <div ref={loadMoreRef} className="py-4 flex justify-center">
                        {feedLoading && <div className="text-muted-foreground text-sm">Loading more...</div>}
                    </div>
                )}
            </div>
        </section>
    );
};
