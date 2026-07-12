"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { CompanyProfileData } from "../../../types/company-profile.types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { companyProfileService } from "../../../services/companyprofile.service";
import { FeedPost } from "../../../../feed/components/FeedPost";
import { FeedPostProps } from "../../../../feed/types";
import { formatTimeAgo } from "@/lib/timeFormatter";
import { useInView } from "@/hooks/use-in-view";
import { deletePost as apiDeletePost } from "@/services/api/posts";
import { useToast } from "@/hooks/use-toast";
import { useUIStore } from "@/store/ui.store";

interface PostsTabProps {
  data: CompanyProfileData;
  isOwnProfile?: boolean;
}

type TabFilter = 'Posts' | 'Reposts' | 'Private posts';

export default function PostsTab({ data, isOwnProfile = false }: PostsTabProps) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { setActiveModal } = useUIStore();
  const [activeTab, setActiveTab] = useState<TabFilter>('Posts');

  const getBackendFilter = (tab: TabFilter) => {
    if (tab === 'Private posts') return 'Private post';
    if (tab === 'Posts') return 'Post';
    if (tab === 'Reposts') return 'Repost';
    return undefined;
  };

  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["orgPosts", data.id, activeTab],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as { cursorCreatedAt?: string; cursorPostId?: string } | undefined;
      const res = await companyProfileService.getOrganizationPosts(data.id, {
        limit: 10,
        cursorCreatedAt: cursor?.cursorCreatedAt,
        cursorPostId: cursor?.cursorPostId,
        filter: getBackendFilter(activeTab),
      });
      return res;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor || lastPage.next_cursor || null;
    },
    initialPageParam: undefined as { cursorCreatedAt?: string; cursorPostId?: string } | undefined,
  });

  const { ref: sentinelRef, inView } = useInView({ threshold: 0, rootMargin: '200px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDeletePost = async (postId: string) => {
    try {
      await apiDeletePost(postId);
      toast({ title: "Post deleted successfully" });
      
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
      console.error("Failed to delete post:", error);
      toast({ title: "Failed to delete post", variant: "destructive" });
    }
  };

  const handleToggleVisibilityPost = (postId: string) => {
    queryClient.setQueryData(["orgPosts", data.id, activeTab], (oldData: any) => {
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
    // Invalidate to make sure the other tabs get the latest data
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
    if (activeTab === 'Private posts' && vis !== 'private') return false;
    if (activeTab !== 'Private posts' && vis === 'private') return false;

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
    is_commented: p.isCommented || p.is_commented || false,
    is_saved: p.isSaved || p.is_saved || false,
    isOwnPost: isOwnProfile,
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

  const tabs: TabFilter[] = isOwnProfile ? ['Posts', 'Reposts', 'Private posts'] : ['Posts', 'Reposts'];

  return (
    <div className="flex flex-col w-[600px] max-w-full max-md:!max-w-none gap-6 max-md:!-mx-4 max-md:!w-auto">
      {/* Sub-tabs */}
      <div className="flex items-center gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-50 text-[#1A73E8] border border-blue-200'
                : 'text-zinc-500 hover:bg-zinc-100 border border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {status === "pending" ? (
        <div className="flex w-full max-w-[600px] justify-center py-10">
          <span className="text-zinc-500">Loading posts...</span>
        </div>
      ) : postsToRender.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 w-full max-w-[600px] bg-white dark:bg-zinc-950 rounded-2xl">
          <div className="relative w-64 h-48 mb-6">
            <Image
              src="/images/companyonboarding/EmptyViewOfPost.png"
              alt="No Posts"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <h3 className="font-poppins font-semibold text-lg text-black dark:text-white mb-1">
            No Posts
          </h3>
          <p className="font-poppins text-sm text-gray-500 dark:text-zinc-400 text-center mb-4">
            <span className="font-semibold text-black dark:text-white">{data.name}</span> hasn't posted anything yet
          </p>
          {isOwnProfile && (
            <button 
              onClick={() => setActiveModal('create-post')}
              className="h-10 px-6 bg-[#1A73E8] hover:bg-blue-700 text-white rounded-full font-semibold text-[14px] transition-colors cursor-pointer flex items-center justify-center"
            >
              Create post
            </button>
          )}
        </div>
      ) : (
        <>
          {postsToRender.map((post, index) => {
            const shouldShowComments = searchParams.get('commentPostId') === String(post.id);
            return (
              <FeedPost 
                key={post.id || index} 
                {...post} 
                initialShowComments={shouldShowComments} 
              />
            );
          })}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="py-2" />
        </>
      )}
    </div>
  );
}
