"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { CompanyProfileData } from "../../../types/company-profile.types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { companyProfileService } from "../../../services/companyprofile.service";
import { FeedPost } from "../../../../feed/components/FeedPost";
import { FeedPostProps } from "../../../../feed/types";
import { formatTimeAgo } from "@/lib/timeFormatter";
import { useInView } from "@/hooks/use-in-view";

interface PostsTabProps {
  data: CompanyProfileData;
  isOwnProfile?: boolean;
}

export default function PostsTab({ data, isOwnProfile = false }: PostsTabProps) {
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["orgPosts", data.id],
    queryFn: async ({ pageParam = "" }) => {
      const res = await companyProfileService.getOrganizationPosts(data.id, {
        limit: 10,
        cursorPostId: pageParam as string,
      });
      return res;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor || lastPage.next_cursor || null;
    },
    initialPageParam: "",
  });

  const { ref: sentinelRef, inView } = useInView({ threshold: 0, rootMargin: '200px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allRawPosts = queryData?.pages.flatMap((page) => page.posts || page.data || page) || [];
  const seen = new Set();
  const rawPosts = allRawPosts.filter((p: any) => {
    const id = p.post_id || p.id || p._id;
    if (seen.has(id)) return false;
    seen.add(id);
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
  });

  const postsToRender: FeedPostProps[] = rawPosts.map(mapPost);

  if (status === "pending") {
    return (
      <div className="flex w-[600px] justify-center py-10">
        <span className="text-zinc-500">Loading posts...</span>
      </div>
    );
  }

  if (postsToRender.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 w-[600px] bg-white dark:bg-zinc-950 rounded-2xl">
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
          <button className="h-10 px-6 bg-[#1A73E8] hover:bg-blue-700 text-white rounded-full font-semibold text-[14px] transition-colors cursor-pointer flex items-center justify-center">
            Create post
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ width: "600px", gap: "24px" }}
      className="flex flex-col items-start"
    >
      {postsToRender.map((post, index) => (
        <FeedPost key={post.id || index} {...post} />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-2" />
    </div>
  );
}
