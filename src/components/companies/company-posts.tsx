import React, { useEffect, useMemo } from 'react';
import { useCompanyPosts } from '@/hooks/useCompany';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { CompanyPostCard } from './CompanyPostCard';
import { Post, Comment } from '@/types/entities';
import { formatTimeAgo } from '@/lib/utils/timeFormatter';

interface CompanyPostsProps {
    companyId: string;
}

export function CompanyPosts({ companyId }: CompanyPostsProps) {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error
    } = useCompanyPosts(companyId);

    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    const posts = useMemo(() => {
        if (!data) return [];
        return data.pages.flatMap(page => page.posts).map(p => mapBackendPostToPost(p));
    }, [data]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <p>Failed to load posts.</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
                No posts yet.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
                <CompanyPostCard
                    key={post.id}
                    post={post}
                    isOwner={false} // TODO: Permission check
                // onDelete={...} // TODO: Implement delete
                />
            ))}

            {/* Loading Indicator */}
            {isFetchingNextPage && (
                <div className="col-span-full flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}

            {/* Infinite Scroll Trigger */}
            <div ref={ref} className="h-2 w-full col-span-full" />
        </div>
    );
}

// Helper to map backend post to frontend Post entity
function mapBackendPostToPost(p: any): Post {
    return {
        id: p.post_id,
        authorId: p.author_id,
        author: p.author_name,
        authorAvatar: p.author_avatar,
        authorSlug: p.author_slug,
        isCompanyPost: p.is_company_post,
        timeAgo: formatTimeAgo(p.created_at),
        content: p.content,
        imageSrc: p.media && p.media.length > 0 ? p.media[0].url : undefined,
        images: p.media ? p.media.map((m: any) => m.url) : [],
        videoSrc: p.media && p.media.some((m: any) => m.media_type === 'video') ? p.media.find((m: any) => m.media_type === 'video').url : undefined,
        likes: p.like_count || 0,
        isLiked: p.is_liked,
        comments: (p.comment_count || 0).toString(),
        shares: '0', // Not in backend response yet
        commentData: [],
        category: p.category_name,
        visibility: p.visibility,
        poll: p.poll ? {
            poll_id: p.poll.poll_id,
            options: p.poll.options,
            total_votes: p.poll.total_votes,
            duration: p.poll.duration,
            user_vote: p.poll.user_vote,
            is_active: p.poll.is_active
        } : null,
        shared_post: p.shared_post ? mapBackendPostToPost(p.shared_post) : null // Recursive for shared post? 
        // Note: Shared post structure from backend might differ slightly, but assuming similar enough or flat
    };
}
