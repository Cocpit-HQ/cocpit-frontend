import React, { useEffect, useMemo, useState } from 'react';
import { useOrganizationPosts, useCompanyPermissions } from '@/components/organizations/hooks/use-company';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { OrganizationPostCard } from './OrganizationPostCard';
import { Post } from '@/types/entities';
import { formatTimeAgo } from '@/lib/timeFormatter';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useQueryClient } from '@tanstack/react-query';
import { Company } from '@/services/organization.service';
import { EditPostModal } from '@/shared/commonComponents/EditPostModal';

interface OrganizationPostsProps {
    companyId: string;
    company?: Company;
}

interface OrganizationMediaRecord {
    media_type?: string;
    url: string;
    master_url?: string | null;
    stream_hls_url?: string | null;
    hdr_manifest_url?: string | null;
    stream_thumbnail_url?: string | null;
    processing_status?: Post['videoProcessingStatus'];
    hdr_processing_status?: Post['videoHdrProcessingStatus'];
}

interface OrganizationPostRecord {
    post_id: string;
    author_id?: string | null;
    author_name?: string | null;
    author_avatar?: string | null;
    author_slug?: string;
    is_company_post?: boolean;
    created_at?: string | null;
    content?: string | null;
    media?: OrganizationMediaRecord[];
    like_count?: number;
    is_liked?: boolean;
    comment_count?: number;
    category_name?: string | null;
    visibility?: Post['visibility'];
    poll?: Post['poll'];
    shared_post?: OrganizationPostRecord | null;
}

export function OrganizationPosts({ companyId, company }: OrganizationPostsProps) {
    const { canDelete, canEdit } = useCompanyPermissions(company);
    const queryClient = useQueryClient();
    const [editingPostId, setEditingPostId] = useState<string | null>(null);

    const handleDelete = async (postId: string) => {
        try {
            await api.delete(`/post/${postId}`);
            toast.success("Post deleted");
            queryClient.invalidateQueries({ queryKey: ['company-posts', companyId] });
        } catch {
            toast.error("Failed to delete post");
        }
    };

    const handleEdit = (post: Post) => {
        setEditingPostId(post.id);
    };
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error
    } = useOrganizationPosts(companyId);

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

    // --- Feed State Restoration ---
    const scrollKey = `company_feed_scroll_${companyId}`;

    // Restore scroll on mount
    useEffect(() => {
        const savedPosition = sessionStorage.getItem(scrollKey);
        if (savedPosition && posts.length > 0) {
            // Small timeout to ensure layout is stable
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedPosition, 10));
            }, 50); // 50ms is usually enough for React to commit the list
        }
    }, [companyId, posts.length, scrollKey]); // Re-run if posts load from cache

    // Save scroll on unmount (or navigate away)
    useEffect(() => {
        const handleScroll = () => {
            // Debounce could be added, but simple for now
            sessionStorage.setItem(scrollKey, window.scrollY.toString());
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            // Save one last time on unmount to be sure
            sessionStorage.setItem(scrollKey, window.scrollY.toString());
        };
    }, [companyId, scrollKey]);
    // ------------------------------

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
                <OrganizationPostCard
                    key={post.id}
                    post={post}
                    isOwner={canDelete || canEdit}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
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

            {editingPostId && (
                <EditPostModal
                    isOpen={!!editingPostId}
                    onClose={() => setEditingPostId(null)}
                    editPostId={editingPostId}
                    onUpdate={() => {
                        queryClient.invalidateQueries({ queryKey: ['company-posts', companyId] });
                        setEditingPostId(null);
                    }}
                />
            )}
        </div>
    );
}

// Helper to map backend post to frontend Post entity
function mapBackendPostToPost(p: OrganizationPostRecord): Post {
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
        shares: '0', // Not in backend response yet
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
        shared_post: p.shared_post ? mapBackendPostToPost(p.shared_post) : null // Recursive for shared post? 
        // Note: Shared post structure from backend might differ slightly, but assuming similar enough or flat
    };
}

function isPostCategory(value: string | null | undefined): value is NonNullable<Post['category']> {
    return ['Personal', 'Professional', 'Achievement', 'Update', 'Hiring', 'Milestone', 'Insight', 'Article'].includes(value || '');
}
