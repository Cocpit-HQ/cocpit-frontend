"use client";

import React from "react";
import Image from "next/image";
import { CompanyProfileData, CompanyPost } from "../../../types/company-profile.types";
import { FeedPost } from "../../../../feed/components/FeedPost";
import { FeedPostProps } from "../../../../feed/types";
import { formatTimeAgo } from "@/lib/timeFormatter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { companyProfileService } from "../../../services/companyprofile.service";
import { deletePost as apiDeletePost } from "@/services/api/posts";
import { useToast } from "@/hooks/use-toast";

interface PostsSectionProps {
  data: CompanyProfileData;
  showAll?: boolean;
  isOwnProfile?: boolean;
  onSeeAllClick?: () => void;
}

/* ─── Posts Section ──────────────────────────────────────────────────────── */
export default function PostsSection({ data, showAll = false, isOwnProfile = false, onSeeAllClick }: PostsSectionProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: postsData, isLoading } = useQuery({
    queryKey: ["orgPostsPreview", data.id],
    queryFn: () => companyProfileService.getOrganizationPosts(data.id, { limit: 3 }),
  });

  const handleDeletePost = async (postId: string) => {
    try {
      await apiDeletePost(postId);
      toast({ title: "Post deleted successfully" });
      
      queryClient.setQueryData(["orgPostsPreview", data.id], (oldData: any) => {
        if (!oldData) return oldData;
        const postsArray = oldData.posts || oldData.data || oldData;
        if (Array.isArray(postsArray)) {
          const newPosts = postsArray.filter((p: any) => (p.post_id || p.id || p._id) !== postId);
          if (oldData.posts) return { ...oldData, posts: newPosts };
          if (oldData.data) return { ...oldData, data: newPosts };
          return newPosts;
        }
        return oldData;
      });
      queryClient.invalidateQueries({ queryKey: ["orgPosts", data.id] });
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast({ title: "Failed to delete post", variant: "destructive" });
    }
  };

  const allRawPosts = postsData?.posts || postsData?.data || data.posts || [];
  const seen = new Set();
  const rawPosts = allRawPosts.filter((p: any) => {
    const id = p.post_id || p.id || p._id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  // Filter out empty posts (e.g. shared posts missing data) before slicing
  const validPosts = rawPosts.filter((post: any) => {
    const content = post.content || "";
    const imageSrc = post.imageUrl || post.image_url || (post.media && post.media.length > 0 ? post.media[0].url : undefined);
    const hasContent = !!(content && content.trim() !== '');
    const hasMedia = !!imageSrc;
    const hasPoll = !!post.poll;
    const hasSharedPost = !!post.shared_post;
    const hasArticle = !!post.articleBody;
    return hasContent || hasMedia || hasPoll || hasSharedPost || hasArticle;
  });

  const displayPosts = showAll ? validPosts : validPosts.slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h2
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: "20px",
            lineHeight: "28px",
          }}
          className="text-black dark:text-white mb-2"
        >
          Posts
        </h2>
        <div className="text-zinc-500 text-sm">Loading posts...</div>
      </div>
    );
  }

  if (displayPosts.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {/* Section heading */}
        <h2
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: "20px",
            lineHeight: "28px",
          }}
          className="text-black dark:text-zinc-100"
        >
          Posts
        </h2>
        <div className="flex flex-col items-center justify-center py-12 px-4 w-full bg-white dark:bg-zinc-950 rounded-2xl">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Section heading */}
      <h2
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 600,
          fontSize: "20px",
          lineHeight: "28px",
        }}
        className="text-black dark:text-zinc-100"
      >
        Posts
      </h2>

      {/*
       * Frame 2609082: Two-column post row
       * flex-direction: row; align-items: flex-start; gap: 16px;
       * width: 920px; height: 645px;
       */}
      <div
        style={{ gap: "16px" }}
        className="flex flex-row items-stretch w-full overflow-x-auto scrollbar-hide pb-4 max-md:-mx-4 max-md:px-0 max-md:!w-[100vw]"
      >
        {displayPosts.map((post: any, index: number) => {
          const mapSharedPost = (sp: any): FeedPostProps => ({
            id: sp.post_id || sp.id || sp._id,
            author: sp.author?.full_name || sp.author_name || data.name,
            authorId: sp.author?.id || sp.author?.user_id || "",
            authorSlug: sp.author?.author_slug || "",
            authorAvatar: sp.author?.avatar_url || sp.author_avatar_url || "/images/companyonboarding/companyprofileDefault.jpg",
            authorHeadline: sp.author?.author_headline || "",
            location: sp.location || "",
            tags: sp.tags || [],
            isCompanyPost: sp.is_organization_post || false,
            timeAgo: (sp.created_at || sp.timestamp) ? formatTimeAgo(sp.created_at || sp.timestamp) : "Just now",
            content: sp.content || "",
            imageSrc: sp.image_url || sp.imageUrl || (sp.media && sp.media.length > 0 ? sp.media[0].url : undefined),
            images: sp.images || (sp.media ? sp.media.filter((m:any) => m.type==='image').map((m:any)=>m.url) : []),
            videoSrc: sp.videoSrc || (sp.media ? sp.media.filter((m:any) => m.type==='video').map((m:any)=>m.url)[0] : undefined),
            likes: sp.like_count || sp.likes_count || sp.likesCount || 0,
            comments: (sp.comment_count || sp.comments_count || sp.commentsCount || 0).toString(),
            shares: (sp.share_count || sp.shares_count || sp.sharesCount || 0).toString(),
            isLiked: sp.isLiked || sp.is_liked || false,
            is_commented: sp.isCommented || sp.is_commented || false,
            is_saved: sp.isSaved || sp.is_saved || false,
            isOwnPost: false,
            visibility: sp.visibility || 'public',
            poll: sp.poll,
            category: sp.category,
            title: sp.title,
            articleBody: sp.articleBody,
            isProfileView: true,
          });

          const feedPostData: FeedPostProps = {
            id: post.id || post._id || index.toString(),
            author: post.author?.full_name || post.authorName || data.name,
            authorId: post.author?.user_id || data.id || data._id || "",
            authorSlug: post.author?.author_slug || data.slug || "",
            authorAvatar: post.author?.avatar_url || post.authorAvatarUrl || data.logoUrl || "/images/companyonboarding/companyprofileDefault.jpg",
            authorHeadline: post.author?.author_headline || data.tagline || data.industry,
            location: post.location || data.location,
            tags: post.tags || [],
            isCompanyPost: true,
            timeAgo: (post.created_at || post.timestamp) ? formatTimeAgo(post.created_at || post.timestamp) : "Just now",
            content: post.content || "",
            imageSrc: post.image_url || post.imageUrl || (post.media && post.media.length > 0 ? post.media[0].url : undefined),
            images: post.images || (post.imageUrl ? [post.imageUrl] : (post.image_url ? [post.image_url] : (post.media ? post.media.filter((m: any) => m.type === 'image' || !m.type).map((m: any) => m.url) : []))),
            videoSrc: post.videoUrl || (post.media ? post.media.filter((m: any) => m.type === 'video').map((m: any) => m.url)[0] : undefined),
            poll: post.poll,
            shared_post: post.shared_post ? mapSharedPost(post.shared_post) : undefined,
            category: post.category,
            title: post.title,
            articleBody: post.articleBody,
            likes: post.like_count || post.likesCount || post.likes_count || 0,
            comments: (post.comment_count || post.commentsCount || post.comments_count || 0).toString(),
            shares: (post.share_count || post.sharesCount || post.shares_count || 0).toString(),
            isLiked: post.isLiked || false,
            is_commented: false,
            is_saved: false,
            isOwnPost: isOwnProfile,
            visibility: 'public',
            sampleLikerUsername: post.sampleLikerUsername || post.sample_liker_username || undefined,
            isProfileView: true,
            imageFit: 'cover',
            forceSquareMedia: true,
            onDelete: handleDeletePost,
          };

          return (
            <div key={feedPostData.id} className="min-w-[450px] max-w-[450px] shrink-0 overflow-hidden break-words h-full max-md:!min-w-[100vw] max-md:!max-w-[100vw] max-md:!w-[100vw]">
              <FeedPost {...feedPostData} />
            </div>
          );
        })}
      </div>

      {/* See all */}
      <div className="flex justify-center pt-1">
        <button
          style={{
            width: "53px",
            height: "20px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "20px",
            color: "#6B7280",
            textAlign: "center",
          }}
          className="hover:text-gray-900 dark:hover:text-zinc-200 transition-colors flex items-center justify-center flex-none"
          onClick={onSeeAllClick}
        >
          See all
        </button>
      </div>
    </div>
  );
}
