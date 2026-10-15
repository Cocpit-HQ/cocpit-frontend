"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BusinessProfileData } from "../../types/business-profile.types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { businessProfileService } from "../../services/businessProfile.service";
import { FeedPost } from "@/features/feed/components/FeedPost";
import type { Post } from "@/types/entities";
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper";
import { useInView } from "@/hooks/use-in-view";
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
  const { activeProfile, userCompanies } = useActiveProfile();

  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
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
    staleTime: 0,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: "always",
    retry: false,
  });

  // Always sync latest posts when mounting the posts tab
  useEffect(() => {
    if (data.id) {
      refetch();
    }
  }, [data.id, refetch]);

  const { ref: sentinelRef, inView } = useInView({ threshold: 0, rootMargin: '200px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDeletePost = async (postId: string) => {
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
      queryClient.invalidateQueries({ queryKey: ["orgPosts", data.id] });
      queryClient.invalidateQueries({ queryKey: ["orgPostsFallback", data.id] });
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
    queryClient.invalidateQueries({ queryKey: ["orgPostsFallback", data.id] });
  };

  useEffect(() => {
    const handleSyncPosts = () => {
      queryClient.invalidateQueries({ queryKey: ["orgPosts"] });
      queryClient.invalidateQueries({ queryKey: ["orgPostsFallback"] });
      refetch();
    };
    const handlePostDeleted = (e: any) => {
      const deletedId = e.detail?.id;
      if (deletedId) {
        handleDeletePost(deletedId);
      }
    };
    window.addEventListener("postCreated", handleSyncPosts);
    window.addEventListener("postUpdated", handleSyncPosts);
    window.addEventListener("postDeleted", handlePostDeleted);
    return () => {
      window.removeEventListener("postCreated", handleSyncPosts);
      window.removeEventListener("postUpdated", handleSyncPosts);
      window.removeEventListener("postDeleted", handlePostDeleted);
    };
  }, [data.id, queryClient, refetch]);

  const allRawPosts = queryData?.pages.flatMap((page) => page.posts || page.data || page) || [];
  const seen = new Set();
  const rawPosts = allRawPosts.filter((p: any) => {
    const id = p.post_id || p.id || p._id;
    if (seen.has(id)) return false;
    seen.add(id);

    const vis = p.visibility || 'public';
    if (!isOwnProfile && vis === 'private') return false;

    return true;
  });

  const postsToRender: Post[] = rawPosts.map((p: any) => {
    const post = mapProfilePostToPost(p);
    return {
      ...post,
      isCompanyPost: true,
      authorSlug: post.authorSlug || data.slug || "",
      authorAvatar: post.authorAvatar || data.logoUrl || "/images/companyonboarding/companyprofileDefault.jpg",
      authorHeadline: post.authorHeadline || data.tagline || data.industry,
    };
  });

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
              {isOwnProfile || canManageOwnPosts
                ? "Share your thoughts, articles, or updates with your network."
                : `${data.name || "Company"} doesn’t have any posts yet.`}
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
                  sessionId="org-posts-tab"
                  className="w-full max-w-[442px] !mx-0 !ml-0"
                  initialShowComments={shouldShowComments} 
                  menuAccess={getPostMenuAccess({
                    isCompanyPost: true,
                    companyId: data.id,
                    createdByUserId: (post as any).createdByUserId,
                    currentUserId,
                    explicitPermissions: viewerPermissions,
                    userCompanies,
                    activeProfile,
                  })}
                  onDelete={handleDeletePost}
                  onToggleVisibility={handleToggleVisibilityPost}
                  onRepostWithThoughts={(postToQuote) => {
                    useUIStore.getState().setSharedPostData(postToQuote);
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      useUIStore.getState().setActiveModal('create-post');
                    } else {
                      router.push('/feed');
                    }
                  }}
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
