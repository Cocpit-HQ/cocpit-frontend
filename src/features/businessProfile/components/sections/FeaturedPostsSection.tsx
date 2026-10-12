"use client";

import React, { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { EmptyPostsIcon } from "@/components/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { businessProfileService } from "../../services/businessProfile.service";
import { BusinessProfileData } from "../../types/business-profile.types";
import {
  FeaturedPostCard,
  FeaturedPostItem,
} from "../parts/FeaturedPostCard";
import {
  extractImageUrl,
  extractVideoUrl,
  isMediaPost,
} from "../../utils/postMediaUtils";
import { formatTimeAgo } from "@/lib/timeFormatter";
import {
  toggleLike,
  toggleSavePost,
  createRepost,
  deletePost as apiDeletePost,
} from "@/features/profile/services/profile.service";
import { toast } from "sonner";
import { CommentModal } from "@/features/profile/components/CommentModal";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";

const SavePostModal = dynamic(
  () => import("@/shared/commonComponents/SavePostModal").then((m) => m.SavePostModal),
  { ssr: false }
);

interface FeaturedPostsSectionProps {
  data: BusinessProfileData;
  isOwnProfile?: boolean;
  canManageCompany?: boolean;
  canManageOwnPosts?: boolean;
  onSeeAllClick?: () => void;
}

function normalizePost(p: any, defaultOrgName: string, defaultLogo?: string): FeaturedPostItem {
  return {
    id: p.post_id || p.id || p._id || "",
    authorName:
      p.author?.full_name ||
      p.author_name ||
      (typeof p.author === "string" ? p.author : defaultOrgName),
    authorAvatarUrl:
      p.author?.avatar_url ||
      p.author_avatar_url ||
      defaultLogo ||
      "/images/companyonboarding/companyprofileDefault.jpg",
    timestamp:
      p.created_at || p.timestamp
        ? formatTimeAgo(p.created_at || p.timestamp)
        : "Just now",
    content: p.content || p.text || "",
    imageUrl: extractImageUrl(p),
    videoUrl: extractVideoUrl(p),
    likesCount: p.like_count ?? p.likes_count ?? p.likesCount ?? 0,
    commentsCount: p.comment_count ?? p.comments_count ?? p.commentsCount ?? 0,
    repostsCount: p.repost_count ?? p.reposts_count ?? p.repostsCount ?? 0,
    sharesCount: p.share_count ?? p.shares_count ?? p.sharesCount ?? p.externalShares ?? 0,
    isLiked: Boolean(p.is_liked ?? p.isLiked),
    isSaved: Boolean(p.is_saved ?? p.isSaved ?? p.is_bookmarked ?? p.isBookmarked),
    isReposted: Boolean(p.is_reposted ?? p.isReposted),
    repostId: p.repost_id || p.repostId || null,
  };
}

export default function FeaturedPostsSection({
  data,
  isOwnProfile = false,
  canManageCompany = false,
  canManageOwnPosts = false,
  onSeeAllClick,
}: FeaturedPostsSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hasPreloadedPosts = Boolean(data.posts && data.posts.length > 0);

  // Fallback query only runs if data.posts is NOT already provided in memory
  const { data: fallbackData, isLoading } = useQuery({
    queryKey: ["orgPostsFallback", data.id],
    queryFn: async () => {
      return businessProfileService.getOrganizationPosts(data.id, { limit: 6 });
    },
    enabled: !hasPreloadedPosts && Boolean(data.id),
    staleTime: 1000 * 60 * 5,
  });

  const availablePosts: FeaturedPostItem[] = useMemo(() => {
    let rawList: any[] = [];

    if (hasPreloadedPosts) {
      rawList = data.posts || [];
    } else if (fallbackData) {
      if (Array.isArray(fallbackData?.posts)) rawList = fallbackData.posts;
      else if (Array.isArray(fallbackData?.data?.posts)) rawList = fallbackData.data.posts;
      else if (Array.isArray(fallbackData?.data)) rawList = fallbackData.data;
      else if (Array.isArray(fallbackData)) rawList = fallbackData;
    }

    return rawList
      .filter((p: any) => {
        if (!p) return false;
        const vis = p.visibility || "public";
        if (!isOwnProfile && vis === "private") return false;
        if (p.post_type === "article") return false;
        return true;
      })
      .map((p: any) => normalizePost(p, data.name, data.logoUrl));
  }, [hasPreloadedPosts, data.posts, fallbackData, isOwnProfile, data.name, data.logoUrl]);

  // Maintain local state to reflect immediate optimistic and API updates
  const [localPosts, setLocalPosts] = useState<FeaturedPostItem[]>(availablePosts);

  useEffect(() => {
    setLocalPosts(availablePosts);
  }, [availablePosts]);

  // Hoisted Single Modal States
  const [activeSavePostId, setActiveSavePostId] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeSharePostId, setActiveSharePostId] = useState<string | null>(null);
  const [undoRepostTarget, setUndoRepostTarget] = useState<{
    postId: string;
    repostId: string | null;
  } | null>(null);

  // --- Handlers aligned with Industry Standard React Query & Backend ---
  const handleLike = async (postId: string) => {
    const post = localPosts.find((p) => p.id === postId);
    if (!post) return;

    const previousIsLiked = post.isLiked;
    const previousLikesCount = post.likesCount;

    // Optimistic update
    setLocalPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !previousIsLiked,
              likesCount: previousIsLiked
                ? Math.max(0, (Number(previousLikesCount) || 1) - 1)
                : (Number(previousLikesCount) || 0) + 1,
            }
          : p
      )
    );

    try {
      const res = await toggleLike(postId);
      setLocalPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: res.liked,
                likesCount: res.likeCount,
              }
            : p
        )
      );
      // Invalidate query caches cleanly
      queryClient.invalidateQueries({ queryKey: ["companyProfile", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["orgPosts", data.id] });
    } catch {
      // Revert optimistic update
      setLocalPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: previousIsLiked, likesCount: previousLikesCount }
            : p
        )
      );
      toast.error("Failed to update like");
    }
  };

  const handleSave = async (postId: string, isSaved: boolean) => {
    // If unsaved -> Open single hoisted collection modal
    if (!isSaved) {
      setActiveSavePostId(postId);
      return;
    }

    // If already saved -> directly unsave
    const previousIsSaved = isSaved;
    setLocalPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isSaved: false } : p))
    );

    try {
      const res = await toggleSavePost(postId);
      setLocalPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isSaved: res.saved } : p))
      );
      toast.success(res.saved ? "Post saved" : "Post removed from saves");
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    } catch {
      setLocalPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isSaved: previousIsSaved } : p))
      );
      toast.error("Failed to update save status");
    }
  };

  const handleSaveModalSuccess = (saved: boolean) => {
    if (activeSavePostId) {
      setLocalPosts((prev) =>
        prev.map((p) => (p.id === activeSavePostId ? { ...p, isSaved: saved } : p))
      );
    }
    setActiveSavePostId(null);
  };

  const handleComment = (postId: string) => {
    setActiveCommentPostId(postId);
  };

  const handleRepost = async (
    postId: string,
    isReposted: boolean,
    repostId: string | null
  ) => {
    if (isReposted) {
      setUndoRepostTarget({ postId, repostId });
      return;
    }

    try {
      const res = (await createRepost(postId)) as any;
      setLocalPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isReposted: true,
                repostId: res?.post_id || null,
                repostsCount: (Number(p.repostsCount) || 0) + 1,
              }
            : p
        )
      );
      toast.success("Post reposted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to repost");
    }
  };

  const confirmUndoRepost = async () => {
    if (!undoRepostTarget) return;
    const { postId, repostId } = undoRepostTarget;
    setUndoRepostTarget(null);

    if (repostId) {
      try {
        await apiDeletePost(repostId);
        setLocalPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isReposted: false,
                  repostId: null,
                  repostsCount: Math.max(0, (Number(p.repostsCount) || 1) - 1),
                }
              : p
          )
        );
        toast.success("Repost removed successfully");
      } catch {
        toast.error("Failed to remove repost");
      }
    }
  };

  const handleShare = (postId: string) => {
    setActiveSharePostId(postId);
  };

  // Prioritize top 2 media posts; if 1, show media + 1 non-media; fallback to top 2
  const postsToRender = useMemo(() => {
    if (!localPosts || localPosts.length === 0) return [];

    const mediaPosts = localPosts.filter(isMediaPost);
    if (mediaPosts.length >= 2) {
      return mediaPosts.slice(0, 2);
    }
    if (mediaPosts.length === 1) {
      const nonMedia = localPosts.filter((p) => !isMediaPost(p));
      return nonMedia.length > 0 ? [mediaPosts[0], nonMedia[0]] : [mediaPosts[0]];
    }
    return localPosts.slice(0, 2);
  }, [localPosts]);

  // Loading skeleton only shows if there are no preloaded posts and fallback query is fetching
  if (isLoading && postsToRender.length === 0) {
    return (
      <div className="w-[800px] max-w-full pl-5 inline-flex flex-col justify-start items-center gap-5">
        <div className="self-stretch inline-flex justify-between items-center">
          <div className="h-6 w-36 bg-ds-surface-1 rounded animate-pulse" />
        </div>
        <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex-1 w-full inline-flex flex-col justify-start items-center gap-3 animate-pulse">
              <div className="self-stretch inline-flex justify-between items-center">
                <div className="flex justify-start items-center gap-2">
                  <div className="size-8 rounded-xl bg-ds-surface-1" />
                  <div className="inline-flex flex-col gap-1.5">
                    <div className="w-28 h-3.5 bg-ds-surface-1 rounded" />
                    <div className="w-20 h-2.5 bg-ds-surface-1 rounded" />
                  </div>
                </div>
                <div className="size-5 bg-ds-surface-1 rounded" />
              </div>
              <div className="self-stretch h-96 bg-ds-surface-1 rounded-lg" />
              <div className="self-stretch pt-2 inline-flex justify-between items-center">
                <div className="flex justify-start items-center gap-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="w-12 h-4 bg-ds-surface-1 rounded" />
                  ))}
                </div>
                <div className="size-5 bg-ds-surface-1 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If no posts exist at all
  if (postsToRender.length === 0) {
    return (
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
        {(isOwnProfile || canManageCompany || canManageOwnPosts) && (
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
    );
  }

  return (
    <div className="w-full max-w-[800px] px-5 flex flex-col items-center gap-5">
      {/* Frame 2609752: Header (width 780px, height 24px) */}
      <div className="self-stretch w-full flex justify-between items-center h-6">
        <h2 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
          Featured Posts
        </h2>
      </div>

      {/* Frame 2609753: 2 Cards Row (width 780px, gap 24px) */}
      <div className="self-stretch w-full flex flex-col sm:flex-row justify-start items-start gap-6">
        {postsToRender.map((post) => (
          <FeaturedPostCard
            key={post.id}
            post={post}
            orgName={data.name}
            orgLogo={data.logoUrl}
            orgTagline={data.tagline}
            onLike={handleLike}
            onSave={handleSave}
            onComment={handleComment}
            onRepost={handleRepost}
            onShare={handleShare}
          />
        ))}
      </div>

      {/* Frame 2609751 Order 2: See all CTA (DM Sans 12px Medium / 16px LH, #EC6229) */}
      <button
        type="button"
        onClick={onSeeAllClick}
        className="self-center text-center text-ds-accent text-xs font-medium font-['DM_Sans'] leading-4 hover:opacity-85 transition-opacity cursor-pointer select-none"
      >
        See all
      </button>

      {/* Hoisted Single Modal Instances (Only ONE instance of each modal in the DOM!) */}
      {activeSavePostId && (
        <SavePostModal
          isOpen={Boolean(activeSavePostId)}
          onClose={() => setActiveSavePostId(null)}
          postId={activeSavePostId}
          onSaved={handleSaveModalSuccess}
        />
      )}

      {activeCommentPostId && (
        <CommentModal
          isOpen={Boolean(activeCommentPostId)}
          onClose={() => setActiveCommentPostId(null)}
          postId={activeCommentPostId}
          onCommentAdded={() => {
            setLocalPosts((prev) =>
              prev.map((p) =>
                p.id === activeCommentPostId
                  ? { ...p, commentsCount: (Number(p.commentsCount) || 0) + 1 }
                  : p
              )
            );
          }}
        />
      )}

      {undoRepostTarget && (
        <DeleteConfirmationModal
          isOpen={Boolean(undoRepostTarget)}
          onClose={() => setUndoRepostTarget(null)}
          onConfirm={confirmUndoRepost}
          title="Delete Repost"
          description="Are you sure you want to delete this repost?"
        />
      )}

      {activeSharePostId && (
        <CocpitShareModel
          isOpen={Boolean(activeSharePostId)}
          onClose={() => setActiveSharePostId(null)}
          postId={activeSharePostId}
          onShare={(selectedIds) => {
            setLocalPosts((prev) =>
              prev.map((p) =>
                p.id === activeSharePostId
                  ? {
                      ...p,
                      sharesCount: (Number(p.sharesCount) || 0) + selectedIds.length,
                    }
                  : p
              )
            );
          }}
        />
      )}
    </div>
  );
}
