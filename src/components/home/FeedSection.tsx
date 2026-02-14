'use client';

import React, { useMemo, useEffect } from 'react';
import FeedPost from './FeedPost';
import PostSkeleton from './PostSkeleton';
import CreatePost from './CreatePost';
import { useFeed } from '@/context/FeedContext';
import { useInView } from '@/hooks/use-in-view';
import { useActionModal } from '@/context/ActionModalContext';
import { StoryRail } from './StoryRail';
import { SuggestedPeopleRail } from './SuggestedPeopleRail';
import { FeedSortDropdown } from './FeedSortDropdown';
import { PostType } from './CreatePostModal';
import { StoryGroup, StoryDetail } from '@/types/showcase';
import { getUserById } from '@/services/api/user';

interface FeedSectionProps {
    groups: StoryGroup[];
    storyLoading: boolean;
    setShowCreateStory: (show: boolean) => void;
    setMobileSelectedGroupId: (id: string | number) => void;
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
    const [userMetadata, setUserMetadata] = React.useState<{ created_at: string; following_count: number } | null>(null);

    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    useEffect(() => {
        const fetchUserMetadata = async () => {
            if (!currentUser.id) return;
            try {
                const profile = await getUserById(currentUser.id);
                setUserMetadata({
                    created_at: profile.user.created_at,
                    following_count: profile.user.following_count
                });
            } catch (error) {
                console.error("Failed to fetch user metadata for suggested people logic", error);
            }
        };
        fetchUserMetadata();
    }, [currentUser.id]);

    useEffect(() => {
        if (inView && hasMore && !feedLoading) {
            loadMorePosts();
        }
    }, [inView, hasMore, feedLoading, loadMorePosts]);

    const showSuggested = React.useMemo(() => {
        if (storyLoading || !userMetadata) return false;

        const followingCount = userMetadata.following_count;
        const storiesExist = groups.length > 0 && groups.some(g => g.stories.length > 0);

        // Rule 1 & 2: No following OR following but no stories
        if (followingCount === 0 || !storiesExist) return true;

        // Rule 3: Stories exist
        return false;
    }, [groups, storyLoading, userMetadata]);

    const sortedPosts = useMemo(() => {
        const sorted = [...posts];
        if (activeTab === 'top') {
            sorted.sort((a, b) => b.likes - a.likes);
        }
        return sorted;
    }, [posts, activeTab]);

    return (
        <section className="lg:col-span-8">
            {/* Mobile Story/Suggested Rail */}
            <div className="md:hidden border-b border-border min-h-[120px] transition-all duration-500 overflow-hidden">
                {!showSuggested ? (
                    <div className="animate-in fade-in duration-500">
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
                ) : (
                    <div className="animate-in fade-in duration-500">
                        <SuggestedPeopleRail
                            onFollowSuccess={() => {
                                // Re-fetch metadata or simply toggle back if following_count updates
                                // For now, we rely on the next refresh or we could optimistically update
                                setUserMetadata(prev => prev ? { ...prev, following_count: prev.following_count + 1 } : null);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Create Post */}
            <div className="hidden md:block">
                <CreatePost onOpenModal={openModal as (type?: PostType) => void} />
            </div>

            {/* Sort Dropdown */}
            <div className="flex justify-end mb-4 px-1 mt-4 md:mt-0">
                <FeedSortDropdown activeTab={activeTab} setActiveTab={setActiveTab} />
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
