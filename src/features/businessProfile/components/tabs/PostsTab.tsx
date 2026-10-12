"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BusinessProfileData } from "../../types/business-profile.types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { businessProfileService } from "../../services/businessProfile.service";
import { FeedPost } from "@/features/feed/components/FeedPost";
import { FeedPostProps } from "@/features/feed/types";
import { formatTimeAgo } from "@/lib/timeFormatter";
import { useInView } from "@/hooks/use-in-view";
import { deletePost as apiDeletePost } from "@/services/api/posts";
import { useToast } from "@/hooks/use-toast";
import { useUIStore } from "@/store/ui.store";
import { getPostMenuAccess } from "@/features/feed/utils/postMenuAccess";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Plus } from "lucide-react";
import { EmptyPostsIcon } from "@/components/icons";
import { FeedPostCardSkeleton } from "@/features/feed/components/skeletons/FeedPostCardSkeleton";

interface PostsTabProps {
  data: BusinessProfileData;
  isOwnProfile?: boolean;
  currentUserId?: string;
  canManageOwnPosts?: boolean;
  viewerPermissions?: string[];
}

export default function PostsTab({ data, isOwnProfile = false, currentUserId, canManageOwnPosts, viewerPermissions }: PostsTabProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { setActiveModal } = useUIStore();
  const { activeProfile } = useActiveProfile();

  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["orgPosts", data.id],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as { cursorCreatedAt?: string; cursorPostId?: string } | undefined;
      const res = await businessProfileService.getOrganizationPosts(data.id, {
        limit: 10,
        cursorCreatedAt: cursor?.cursorCreatedAt,
        cursorPostId: cursor?.cursorPostId,
      });
      return res;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor || lastPage.next_cursor || null;
    },
    initialPageParam: undefined as { cursorCreatedAt?: string; cursorPostId?: string } | undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: false,
  });

  const { ref: sentinelRef, inView } = useInView({ threshold: 0, rootMargin: '200px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDeletePost = async (postId: string) => {
    // The actual API call and toast are handled by FeedPost -> usePostOptions -> useFeed.
    // We just need to refresh our local query cache to remove the deleted post from the UI immediately.
    try {
      queryClient.setQueryData(["orgPosts", data.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => {
            const postsArray = page.posts || page.data || page;
            if (Array.isArray(postsArray)) {
              const newPosts = postsArray.filter((p: any) => String(p.post_id || p.id || p._id) !== String(postId));
              if (page.posts) return { ...page, posts: newPosts };
              if (page.data) return { ...page, data: newPosts };
              return newPosts;
            }
            return page;
          }),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["orgPostsPreview", data.id] });
      queryClient.invalidateQueries({ queryKey: ["orgPosts", data.id] });
      queryClient.invalidateQueries({ queryKey: ["orgProfile"] });
    } catch (error) {
      console.error("Failed to update cache after deleting post:", error);
    }
  };

  const handleToggleVisibilityPost = (postId: string) => {
    queryClient.setQueryData(["orgPosts", data.id], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => {
          const postsArray = page.posts || page.data || page;
          if (Array.isArray(postsArray)) {
            const newPosts = postsArray.map((p: any) => {
              if (String(p.post_id || p.id || p._id) === String(postId)) {
                return { ...p, visibility: p.visibility === 'private' ? 'public' : 'private' };
              }
              return p;
            });
            if (page.posts) return { ...page, posts: newPosts };
            if (page.data) return { ...page, data: newPosts };
            return newPosts;
          }
          return page;
        }),
      };
    });
    queryClient.invalidateQueries({ queryKey: ["orgPosts", data.id] });
    queryClient.invalidateQueries({ queryKey: ["orgPostsPreview", data.id] });
  };

  const allRawPosts = queryData?.pages.flatMap((page) => page.posts || page.data || page) || [];
  const seen = new Set();
  const rawPosts = allRawPosts.filter((p: any) => {
    const id = p.post_id || p.id || p._id;
    if (seen.has(id)) return false;
    seen.add(id);

    const vis = p.visibility || 'public';
    if (!isOwnProfile && vis === 'private') return false;
    if (p.post_type === 'article') return false;

    return true;
  });

  const mapPost = (p: any): FeedPostProps => ({
    id: p.post_id || p.id || p._id,
    author: p.author?.full_name || data.name,
    authorId: p.author?.id || (data as any)._id || data.id,
    authorSlug: data.slug || "",
    authorAvatar: data.logoUrl || p.author?.avatar_url || "/images/companyonboarding/companyprofileDefault.jpg",
    authorHeadline: data.tagline || data.industry,
    location: p.location || data.location,
    tags: p.tags || [],
    isCompanyPost: true,
    timeAgo: (p.created_at || p.timestamp) ? formatTimeAgo(p.created_at || p.timestamp) : "Just now",
    content: p.content || "",
    imageSrc: p.image_url || p.imageUrl || (p.media && p.media.length > 0 ? p.media[0].url : undefined),
    images: p.images || (p.media ? p.media.filter((m:any) => m.type==='image').map((m:any)=>m.url) : []),
    videoSrc: p.videoSrc || (p.media ? p.media.filter((m:any) => m.type==='video').map((m:any)=>m.url)[0] : undefined),
    likes: p.like_count || p.likes_count || p.likesCount || 0,
    comments: (p.comment_count || p.comments_count || p.commentsCount || 0).toString(),
    shares: (p.share_count || p.shares_count || p.sharesCount || 0).toString(),
    isLiked: p.isLiked || p.is_liked || false,
    isReposted: p.isReposted || p.is_reposted || false,
    repostId: p.repostId || p.repost_id || null,
    is_commented: p.isCommented || p.is_commented || false,
    is_saved: p.isSaved || p.is_saved || false,
    menuAccess: getPostMenuAccess({
      isCompanyPost: true,
      companyId: data.id,
      createdByUserId: p.created_by_user_id,
      currentUserId,
      explicitPermissions: viewerPermissions,
      activeProfile,
    }),
    visibility: p.visibility || 'public',
    poll: p.poll,
    shared_post: p.shared_post ? mapPost(p.shared_post) : undefined,
    category: p.category,
    title: p.title,
    articleBody: p.articleBody,
    sampleLikerUsername: p.sample_liker_username || undefined,
    isProfileView: true,
    onDelete: handleDeletePost,
    onToggleVisibility: handleToggleVisibilityPost,
  });

  const postsToRender: FeedPostProps[] = rawPosts.map(mapPost);

  return (
    <div className="w-full max-w-[800px] pl-5 flex flex-col justify-start items-start gap-2.5 pb-12">
      {status === "pending" ? (
        <div className="w-full max-w-[442px] flex flex-col justify-start items-center gap-5">
          <div className="w-full">
            <FeedPostCardSkeleton className="!mx-0 !ml-0" />
            <div className="w-full max-w-[442px] h-0 border-b border-[var(--ds-border)] mt-5" />
          </div>
          <div className="w-full">
            <FeedPostCardSkeleton className="!mx-0 !ml-0" />
            <div className="w-full max-w-[442px] h-0 border-b border-[var(--ds-border)] mt-5" />
          </div>
        </div>
      ) : postsToRender.length === 0 ? (
        <div className="w-full max-w-[800px] px-5 py-10 flex flex-col justify-center items-center gap-4">
          {/* Icon Circle */}
          <div className="p-3 bg-ds-surface-1 rounded-full flex items-center justify-center">
            <EmptyPostsIcon className="w-8 h-8 text-ds-text-secondary shrink-0" size={32} />
          </div>

          {/* Title & Description */}
          <div className="self-stretch flex flex-col justify-start items-center gap-1.5">
            <div className="text-center text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
              No posts yet
            </div>
            <div className="w-80 max-w-full text-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
              Share your thoughts, articles, or updates with your network.
            </div>
          </div>

          {/* Create Post Action Button */}
          {(canManageOwnPosts || isOwnProfile) && (
            <button
              type="button"
              onClick={() => {
                router.push("/feed");
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="px-3 py-1.5 rounded-[100px] border border-ds-border inline-flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 hover:bg-ds-surface-1 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-ds-text-primary shrink-0" />
              <span>Create post</span>
            </button>
          )}
        </div>
      ) : (
        <div className="w-full max-w-[442px] flex flex-col justify-start items-center gap-5">
          {postsToRender.map((post, index) => {
            const shouldShowComments = searchParams.get('commentPostId') === String(post.id);
            return (
              <React.Fragment key={post.id || index}>
                <FeedPost 
                  {...post} 
                  isProfileView={true}
                  className="w-full max-w-[442px] !mx-0 !ml-0"
                  initialShowComments={shouldShowComments} 
                />
                <div className="w-full max-w-[442px] h-0 border-b border-[var(--ds-border)]" />
              </React.Fragment>
            );
          })}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="py-2 w-full" />
        </div>
      )}
    </div>
  );
}
