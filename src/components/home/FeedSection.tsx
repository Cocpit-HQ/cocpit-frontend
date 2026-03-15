'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import FeedPost from './FeedPost';
import PostSkeleton from './PostSkeleton';
import { useFeed } from '@/hooks/use-feed';
import { useInView } from '@/hooks/use-in-view';
import { useActionModal } from '@/context/ActionModalContext';
import { StoryRail } from './StoryRail';
import { FeedSortDropdown } from './FeedSortDropdown';
import { PostType } from './CreatePostModal';
import { StoryGroup } from '@/types/showcase';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

// Lazy-load CreatePost (hidden on mobile, only visible on desktop)
const CreatePost = dynamic(() => import('./CreatePost'), { ssr: false });

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

    const listRef = useRef<HTMLDivElement>(null);

    // Initialize the window virtualizer
    const virtualizer = useWindowVirtualizer({
        count: sortedPosts.length,
        estimateSize: () => 350, // estimated height of a post
        overscan: 5, // pre-render 5 posts outside of viewport
        scrollMargin: listRef.current?.offsetTop ?? 0,
    });

    return (
        <section className="lg:col-span-8 max-w-[560px] mx-auto w-full">
            {/* Mobile Story/Suggested Rail */}
            <div className="md:hidden min-h-[120px] transition-all duration-500 overflow-hidden">
                <div className="animate-in fade-in duration-500">
                    <StoryRail
                        groups={groups}
                        isLoading={storyLoading}
                        currentUser={currentUser}
                        onCreateClick={() => setShowCreateStory(true)}
                        onStoryClick={(story) => {
                            const group = groups.find(g => g.stories.some(s => s.id === story.id));
                            if (group) {
                                setMobileSelectedGroupId(group.author.id || 0);
                            }
                        }}
                    />
                </div>
            </div>

            {/* Create Post */}
            <div className="hidden md:block">
                <CreatePost onOpenModal={openModal as (type?: PostType) => void} />
            </div>

            {/* Sort Dropdown */}
            <div className="flex justify-end mb-2 px-1 mt-1 md:mt-0">
                <FeedSortDropdown activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            {/* Posts */}
            <div className="md:space-y-2">
                {/* Skeletons appear when initial load is happening */}
                {feedLoading && posts.length === 0 &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <PostSkeleton key={i} />
                    ))}

                <div
                    ref={listRef}
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                        const post = sortedPosts[virtualItem.index];
                        return (
                            <div
                                key={virtualItem.key}
                                data-index={virtualItem.index}
                                ref={virtualizer.measureElement}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                                    paddingBottom: '8px', // spacing between posts (equivalent to space-y-2)
                                }}
                            >
                                <FeedPost
                                    {...post}
                                    initialComments={post.commentData}
                                    isOwnPost={post.author === currentUser.name}
                                    onDelete={deletePost}
                                    onToggleVisibility={togglePostVisibility}
                                    priority={virtualItem.index < 4}
                                />
                            </div>
                        );
                    })}
                </div>

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
