import React, { useMemo } from 'react';
import { useCompanyPosts } from '@/hooks/useCompany';
import { CompanyPostCard } from '../CompanyPostCard';
import { Post } from '@/types/entities';
import { formatTimeAgo } from '@/lib/utils/timeFormatter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface HomeRecentPostsProps {
    companyId: string;
    onViewAll: () => void;
}

export function HomeRecentPosts({ companyId, onViewAll }: HomeRecentPostsProps) {
    const { data, isLoading, error } = useCompanyPosts(companyId);

    const posts = useMemo(() => {
        if (!data) return [];
        // Flatten pages and take first 3
        const allPosts = data.pages.flatMap(page => page.posts).map(p => mapBackendPostToPost(p));
        return allPosts.slice(0, 3);
    }, [data]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || posts.length === 0) {
        return null; // Don't show section if no posts or error
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Posts</h3>
                <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
                    View All <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
            <div className="flex overflow-x-auto pb-4 gap-4 snap-x md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
                {posts.map((post) => (
                    <div key={post.id} className="min-w-[85vw] md:min-w-0 snap-center">
                        <CompanyPostCard
                            post={post}
                            isOwner={false} // Read-only view for home tab usually
                            onDelete={() => { }}
                            onEdit={() => { }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Helper to map backend post to frontend Post entity (Duplicated from CompanyPosts to avoid export issues if not exported)
// ideally this should be a shared utility
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
        shares: '0',
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
        shared_post: p.shared_post ? mapBackendPostToPost(p.shared_post) : null
    };
}
