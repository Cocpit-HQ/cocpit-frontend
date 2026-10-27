import React, { useMemo } from 'react';
import { useOrganizationPosts } from '@/components/organizations/hooks/use-company';
import { OrganizationPostCard } from '../OrganizationPostCard';
import { Post } from '@/types/entities';
import { formatTimeAgo } from '@/lib/timeFormatter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface HomeRecentPostsProps {
    companyId: string;
    onViewAll: () => void;
}

interface RecentPostMedia {
    media_type?: string;
    url: string;
    master_url?: string | null;
    stream_hls_url?: string | null;
    hdr_manifest_url?: string | null;
    stream_thumbnail_url?: string | null;
    processing_status?: Post['videoProcessingStatus'];
    hdr_processing_status?: Post['videoHdrProcessingStatus'];
}

interface RecentPostRecord {
    post_id: string;
    author_id?: string | null;
    author_name?: string | null;
    author_avatar?: string | null;
    author_slug?: string;
    is_company_post?: boolean;
    created_at?: string | null;
    content?: string | null;
    media?: RecentPostMedia[];
    like_count?: number;
    is_liked?: boolean;
    comment_count?: number;
    category_name?: string | null;
    visibility?: Post['visibility'];
    poll?: Post['poll'];
    shared_post?: RecentPostRecord | null;
}

export function HomeRecentPosts({ companyId, onViewAll }: HomeRecentPostsProps) {
    const { data, isLoading, error } = useOrganizationPosts(companyId);

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
                        <OrganizationPostCard
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

// Helper to map backend post to frontend Post entity (Duplicated from OrganizationPosts to avoid export issues if not exported)
// ideally this should be a shared utility
function mapBackendPostToPost(p: RecentPostRecord): Post {
    const mediaItems = p.media || [];
    const videoMedia = mediaItems.find((item) => item.media_type === 'video');
    const imageMedia = mediaItems.filter((item) => item.media_type === 'image');
    return {
        id: p.post_id || '',
        authorId: p.author_id || '',
        author: p.author_name || 'Unknown',
        authorAvatar: p.author_avatar || undefined,
        authorSlug: p.author_slug,
        isCompanyPost: p.is_company_post,
        timeAgo: formatTimeAgo(p.created_at || new Date().toISOString()),
        content: p.content || '',
        imageSrc: imageMedia[0]?.url,
        images: imageMedia.map((item) => item.url),
        videoSrc: videoMedia?.master_url || videoMedia?.url,
        videoHlsSrc: videoMedia?.stream_hls_url || undefined,
        videoHdrSrc: videoMedia?.hdr_manifest_url || undefined,
        videoPosterSrc: videoMedia?.stream_thumbnail_url || undefined,
        videoProcessingStatus: videoMedia?.processing_status,
        videoHdrProcessingStatus: videoMedia?.hdr_processing_status || undefined,
        likes: p.like_count || 0,
        isLiked: p.is_liked,
        comments: (p.comment_count || 0).toString(),
        shares: '0',
        commentData: [],
        category: isPostCategory(p.category_name) ? p.category_name : undefined,
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

function isPostCategory(value: string | null | undefined): value is NonNullable<Post['category']> {
    return ['Personal', 'Professional', 'Achievement', 'Update', 'Hiring', 'Milestone', 'Insight', 'Article'].includes(value || '');
}
