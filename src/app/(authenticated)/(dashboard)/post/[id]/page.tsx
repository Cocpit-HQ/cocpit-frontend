"use client";

import React, { useEffect, useState, use } from "react";
import { getPostById } from "@/services/api/posts";
import { FeedPost } from "@/features/feed/components/FeedPost";
import { mapBackendPostToFrontend } from "@/lib/mappers/feed.mapper";
import { Post } from "@/types/entities";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { getPostMenuAccess } from "@/features/feed/utils/postMenuAccess";
import { ChevronLeft, X } from "lucide-react";
import api from "@/lib/axios";
import { useUIStore } from "@/store/ui.store";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SinglePostPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showComments = searchParams.get("comments") === "true" || !!searchParams.get("commentId");
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userCompanies, activeProfile } = useActiveProfile();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPost = async () => {
      try {
        const backendPost = await getPostById(id);
        const mappedPost = mapBackendPostToFrontend(backendPost);
        if (mappedPost.is_community_article && mappedPost.communityId) {
          router.replace(`/channels/${mappedPost.communityId}/article/${mappedPost.id}`);
          return;
        }
                const isArticle = mappedPost.post_type === 'article' || mappedPost.category === 'Article'
                if (isArticle) {
                    router.replace(`/article/${mappedPost.id}`)
                    return
                }
        setPost(mappedPost);
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          console.error("Failed to load post:", err);
        }
        setError("Failed to load post. It may have been deleted.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, router]);

  // Fire impression when the post finishes loading on the detail page.
  useEffect(() => {
    if (!post) return;
    api.post(`/dashboard/post/${id}/impression`).catch(() => {
      // silent fail
    });
  }, [id, post]);

  // Listen for real-time post updates and deletions to reflect changes instantly on the detail page
  useEffect(() => {
    const handlePostUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      if (detail && (detail.id?.toString() === id?.toString() || detail.postId?.toString() === id?.toString())) {
        if (detail.updatedPost) {
          setPost(detail.updatedPost);
        } else {
          setPost((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              content: 'content' in detail ? detail.content : prev.content,
              location: 'location' in detail ? detail.location : prev.location,
              visibility: 'visibility' in detail ? detail.visibility : prev.visibility,
              images: 'images' in detail ? detail.images : prev.images,
              imageSrc: 'imageSrc' in detail ? detail.imageSrc : prev.imageSrc,
              videoSrc: 'videoSrc' in detail ? detail.videoSrc : prev.videoSrc,
              post_type: 'post_type' in detail ? detail.post_type : prev.post_type,
              type: 'type' in detail ? detail.type : prev.type,
              imageDimensions: 'imageDimensions' in detail ? detail.imageDimensions : prev.imageDimensions,
            };
          });
        }
      }
    };

    const handlePostDeleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      if (detail && detail.id?.toString() === id?.toString()) {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          const savedPath = typeof window !== "undefined" ? sessionStorage.getItem("cocpit_scroll_path") : null;
          router.push(savedPath || "/feed");
        }
      }
    };

    window.addEventListener("postUpdated", handlePostUpdated);
    window.addEventListener("postDeleted", handlePostDeleted);

    return () => {
      window.removeEventListener("postUpdated", handlePostUpdated);
      window.removeEventListener("postDeleted", handlePostDeleted);
    };
  }, [id, router]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      const savedPath = typeof window !== "undefined" ? sessionStorage.getItem("cocpit_scroll_path") : null;
      router.push(savedPath || "/feed");
    }
  };

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      const savedPath = typeof window !== "undefined" ? sessionStorage.getItem("cocpit_scroll_path") : null;
      router.push(savedPath || "/feed");
    }
  };

  const menuAccess = getPostMenuAccess({
    isCompanyPost: post?.isCompanyPost,
    companyId: post?.author_org_id,
    createdByUserId: post?.createdByUserId,
    currentUserId: session?.user?.id,
    userCompanies,
    activeProfile,
  });

  return (
    <div className="min-h-screen bg-ds-bg text-ds-text-primary flex flex-col items-center pb-16 select-none relative">
      {/* Post detail navigation header: Back button (top: 40px, left: 40px) and Cancel icon (top: 40px, right: 40px) */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="absolute left-4 sm:left-10 top-4 sm:top-10 flex items-center gap-2 h-6 rounded-[6px] text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent z-10"
      >
        <ChevronLeft className="w-5 h-5 text-ds-text-primary group-hover:text-ds-text-secondary transition-colors shrink-0" />
        <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px]">Back</span>
      </button>

      <button
        type="button"
        onClick={handleClose}
        aria-label="Close post"
        className="absolute right-4 sm:right-10 top-4 sm:top-10 flex items-center justify-center w-5 h-5 text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* ── Main Post View Container (Figma top: 60px) ── */}
      <div className="w-full max-w-[442px] px-4 sm:px-0 mx-auto pt-[60px] sm:pt-[60px]">
        {loading ? (
          <div className="w-full bg-ds-bg rounded-[8px] p-6 flex flex-col gap-4 animate-pulse">
            {/* Author header skeleton */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ds-surface-2 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="w-32 h-3.5 bg-ds-surface-2 rounded" />
                <div className="w-24 h-2.5 bg-ds-surface-2 rounded" />
              </div>
            </div>
            {/* Post body skeleton */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="w-full h-3 bg-ds-surface-2 rounded" />
              <div className="w-4/5 h-3 bg-ds-surface-2 rounded" />
              <div className="w-2/3 h-3 bg-ds-surface-2 rounded" />
            </div>
            {/* Media skeleton */}
            <div className="w-full h-[320px] bg-ds-surface-2 rounded-[8px]" />
            {/* Action bar skeleton */}
            <div className="flex items-center gap-4 pt-2">
              <div className="w-6 h-6 bg-ds-surface-2 rounded" />
              <div className="w-6 h-6 bg-ds-surface-2 rounded" />
              <div className="w-6 h-6 bg-ds-surface-2 rounded" />
            </div>
          </div>
        ) : error ? (
          <div className="w-full bg-ds-bg rounded-[8px] p-8 text-center flex flex-col items-center justify-center gap-4">
            <p className="font-['DM_Sans'] text-ds-text-secondary text-[14px]">{error}</p>
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-ds-surface-2 hover:bg-ds-border text-ds-text-primary rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer border border-ds-border"
            >
              Go Back
            </button>
          </div>
        ) : post ? (
          <FeedPost
            {...post}
            menuAccess={menuAccess}
            isFullContent={true}
            initialShowComments={showComments}
            onEdit={(postToEdit) => {
              useUIStore.getState().setEditMode(true, id, postToEdit || post);
            }}
            // Purpose of Bug Fix: Enable Repost with Thoughts on post detail page to populate quoted post into UI store and navigate to feed composer
            onRepostWithThoughts={(postToQuote) => {
              useUIStore.getState().setSharedPostData(postToQuote);
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                useUIStore.getState().setActiveModal('create-post');
              }
              router.push('/feed');
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
