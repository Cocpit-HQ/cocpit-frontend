"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import {
  LikeIcon,
  LikeFilledIcon,
  CommentIcon,
  RepostIcon,
  ShareIcon,
  SaveIcon,
  SaveFilledIcon,
  MenuIcon,
  BusinessBuildingIcon,
} from "@/components/icons";
import { CommentModal } from "../CommentModal";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import { LikesModal } from "@/shared/commonComponents/LikesModal";
import dynamic from "next/dynamic";

const SavePostModal = dynamic(
  () => import("@/shared/commonComponents/SavePostModal").then((m) => m.SavePostModal),
  { ssr: false }
);
import { useUIStore } from "@/store/ui.store";
import { useSession } from "next-auth/react";
import { LikeBar } from "@/features/feed/components/parts/LikeBar";
import {
  createRepost,
  deletePost as apiDeletePost,
  toggleLike,
  toggleSavePost,
  updatePost,
} from "../../services/profile.service";
import type { Post } from "@/types/entities";
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper";
import { saveScrollPosition } from "@/hooks/use-scroll-restoration";
import { RichTextRenderer } from "@/features/feed/components/parts/RichTextRenderer";

const mergeProfilePostState = (current: Post, incoming: Post): Post => ({
  ...current,
  ...incoming,
  author: incoming.author || current.author,
  authorId: incoming.authorId || current.authorId,
  authorAvatar: incoming.authorAvatar || current.authorAvatar,
  title: incoming.title || current.title,
  timeAgo: incoming.timeAgo || current.timeAgo,
  category: incoming.category || current.category,
  location: incoming.location ?? current.location,
  tags: incoming.tags ?? current.tags,
  shared_post: incoming.shared_post ?? current.shared_post,
});

interface ProfilePostCardProps {
  post: Post;
  isOwnPost?: boolean;
  onDelete?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  onUpdate?: (post: Post) => void;
}

export const ProfilePostCard: React.FC<ProfilePostCardProps> = ({
  post,
  isOwnPost,
  onDelete,
  onToggleVisibility,
  onUpdate,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setEditMode } = useUIStore();
  const { data: session } = useSession();
  const viewerUsername = (session?.user as any)?.username;

  const [localPost, setLocalPost] = useState(post);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(Number(post.likes) || 0);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  const [isReposted, setIsReposted] = useState(post.isReposted || false);
  const [repostId, setRepostId] = useState<string | null>(post.repostId || null);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isUndoRepostConfirmOpen, setIsUndoRepostConfirmOpen] = useState(false);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setLocalPost(post);
    setIsLiked(post.isLiked || false);
    setLikesCount(Number(post.likes) || 0);
    setIsSaved(post.is_saved || false);
    setIsReposted(post.isReposted || false);
    setRepostId(post.repostId || null);
    setAvatarError(false);
  }, [post]);

  useEffect(() => {
    const handlePostUpdated = (e: any) => {
      const updated = e.detail;
      if (updated && (updated.id === localPost.id || updated.id?.toString() === localPost.id?.toString())) {
        const merged = mergeProfilePostState(localPost, updated);
        setLocalPost(merged);
        onUpdate?.(merged);
      }
    };
    const handlePostDeleted = (e: any) => {
      const deletedId = e.detail?.id;
      if (deletedId && (deletedId === localPost.id || deletedId?.toString() === localPost.id?.toString())) {
        onDelete?.(localPost.id);
      }
    };
    window.addEventListener("postUpdated", handlePostUpdated);
    window.addEventListener("postDeleted", handlePostDeleted);
    return () => {
      window.removeEventListener("postUpdated", handlePostUpdated);
      window.removeEventListener("postDeleted", handlePostDeleted);
    };
  }, [localPost, onUpdate, onDelete]);

  const rawImage =
    localPost.imageSrc || (localPost.images && localPost.images.length > 0 ? localPost.images[0] : null);
  const image = rawImage && rawImage.trim() !== "" ? rawImage : null;
  const videoSrc = localPost.videoSrc && localPost.videoSrc.trim() !== "" ? localPost.videoSrc : null;
  const isArticlePost = localPost.category === "Article" || localPost.post_type === "article";
  const isPollPost = Boolean(localPost.poll);

  const sampleLikerUsername =
    localPost.sampleLikerUsername ||
    (localPost.likedUsers && localPost.likedUsers.length > 0
      ? localPost.likedUsers[0].username
      : null);
  const likedUsers = localPost.likedUsers || [];

  const handleLike = async () => {
    try {
      const res = await toggleLike(localPost.id);
      setIsLiked(res.liked);
      setLikesCount(res.likeCount);
      queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch {
      toast.error("Failed to update like");
    }
  };

  const handleBookmark = async () => {
    if (!isSaved) {
      setIsSaveModalOpen(true);
      return;
    }

    const previousIsSaved = isSaved;
    setIsSaved(false);

    try {
      const res = await toggleSavePost(localPost.id);
      setIsSaved(res.saved);
      toast.success(res.saved ? "Post saved" : "Post removed from saves");
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved_folders"] });
    } catch {
      setIsSaved(previousIsSaved);
      toast.error("Failed to update save status");
    }
  };

  const handleRepost = async () => {
    if (isReposted) {
      setIsUndoRepostConfirmOpen(true);
    } else {
      try {
        const res = (await createRepost(localPost.id)) as any;
        setIsReposted(true);
        if (res && res.post_id) {
          setRepostId(res.post_id);
        }
        setLocalPost((prev) => ({
          ...prev,
          shares: (Number(prev.shares) || 0) + 1 + "",
        }));
        queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
        queryClient.invalidateQueries({ queryKey: ["feed"] });
        toast.success("Post reposted successfully!");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to repost");
      }
    }
  };

  const confirmUndoRepost = () => {
    setIsUndoRepostConfirmOpen(false);
    if (repostId) {
      const targetRepostId = repostId;
      setIsReposted(false);
      setRepostId(null);
      setLocalPost((prev) => ({
        ...prev,
        shares: Math.max(0, (Number(prev.shares) || 0) - 1) + "",
      }));
      window.dispatchEvent(
        new CustomEvent("repostDeleted", {
          detail: { originalPostId: localPost.id, repostId: targetRepostId },
        })
      );
      apiDeletePost(targetRepostId).catch((err) => {
        console.error("Background delete failed:", err);
      });
      toast.success("Repost removed successfully");
    }
  };

  const handleTogglePrivacy = async () => {
    const newVisibility = localPost.visibility === "private" ? "public" : "private";
    try {
      const updated = await updatePost(localPost.id, { visibility: newVisibility });
      const mergedPost = mergeProfilePostState(localPost, mapProfilePostToPost(updated));
      setLocalPost(mergedPost);
      onUpdate?.(mergedPost);
      onToggleVisibility?.(localPost.id);
      toast.success(`Post is now ${newVisibility}`);
    } catch {
      toast.error("Failed to update privacy");
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('[role="button"]') ||
      target.closest('[role="menu"]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[role="dialog"]') ||
      target.closest('[data-radix-popper-content-wrapper]') ||
      target.closest('.prevent-card-click')
    ) {
      return;
    }
    const targetPostId = (
      localPost.shared_post && (!localPost.content || !localPost.content.trim())
        ? (localPost.shared_post.id || localPost.id)
        : localPost.id
    );
    if (targetPostId && targetPostId !== 'preview') {
      saveScrollPosition("profile", targetPostId.toString());
      if (isArticlePost) {
        router.push(`/article/${targetPostId}`);
      } else {
        router.push(`/post/${targetPostId}`);
      }
    }
  };

  const authorLink = localPost.isCompanyPost
    ? `/organization/${localPost.authorSlug}`
    : `/profile/${localPost.authorSlug || localPost.authorId}`;

  return (
    <div
      id={`post-${localPost.id}`}
      data-post-id={localPost.id}
      onClick={handleCardClick}
      className="w-full flex flex-col items-start gap-3 select-none cursor-pointer"
    >
      {/* Post Header */}
      <div className="w-full h-9 flex flex-row justify-between items-center gap-2">
        {/* Author Details */}
        <div
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(authorLink);
          }}
          className="flex flex-row items-center gap-2 cursor-pointer group flex-1 min-w-0 prevent-card-click"
        >
          {/* Avatar (32x32px) */}
          <div className={`w-8 h-8 ${localPost.isCompanyPost ? 'rounded-[8px]' : 'rounded-full'} overflow-hidden bg-[var(--ds-surface-1)] border border-[var(--ds-border)] flex items-center justify-center flex-shrink-0`}>
            {localPost.authorAvatar && localPost.authorAvatar !== "/images/companyonboarding/companyprofileDefault.jpg" && !avatarError ? (
              <img
                src={localPost.authorAvatar}
                alt={localPost.author || "Author"}
                className={`w-full h-full object-cover ${localPost.isCompanyPost ? 'rounded-[8px]' : 'rounded-full'}`}
                onError={() => setAvatarError(true)}
              />
            ) : localPost.isCompanyPost ? (
              <BusinessBuildingIcon className="w-full h-full p-1 text-ds-text-primary" />
            ) : (
              <span className="text-[var(--ds-text-primary)] text-xs font-semibold font-['DM_Sans']">
                {(localPost.author || "U").charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Author Name + Role */}
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 truncate max-w-[280px]">
              {localPost.author || "Anonymous"}
            </span>
            {localPost.authorHeadline && (
              <span className="text-[var(--ds-text-secondary)] text-[10px] font-normal font-['DM_Sans'] leading-3 truncate max-w-[280px]">
                {localPost.authorHeadline}
              </span>
            )}
          </div>
        </div>

        {/* Post Options Menu */}
        <DropdownMenu onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer outline-none"
            >
              <MenuIcon className="w-5 h-5 text-[var(--ds-text-primary)]" fill="currentColor" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[99px] h-[80px] min-w-0 p-3 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-[8px] flex flex-col justify-start items-start gap-4 overflow-hidden shadow-2xl z-50 outline-none"
            align="end"
            sideOffset={4}
          >
            {isOwnPost && (
              <DropdownMenuItem
                onClick={() => {
                  if (isArticlePost) {
                    saveScrollPosition("profile", localPost.id.toString());
                    router.push(`/article/edit/${localPost.id}`);
                  } else {
                    saveScrollPosition("profile", localPost.id.toString());
                    setEditMode(true, localPost.id.toString(), localPost);
                  }
                }}
                className="!p-0 !m-0 !w-[59px] !h-[20px] flex-none order-0 flex-grow-0 whitespace-nowrap justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-[14px] font-normal font-['DM_Sans'] leading-[20px] cursor-pointer outline-none transition-colors border-none"
              >
                Edit post
              </DropdownMenuItem>
            )}

            {isOwnPost && (
              <DropdownMenuItem
                onClick={() => onDelete?.(localPost.id)}
                className="!p-0 !m-0 !w-[75px] !h-[20px] flex-none order-1 flex-grow-0 whitespace-nowrap justify-start text-[var(--ds-error)] hover:!opacity-80 focus:!opacity-80 data-[highlighted]:!opacity-80 hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-[14px] font-normal font-['DM_Sans'] leading-[20px] cursor-pointer outline-none transition-opacity border-none"
              >
                Delete post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post Text Description (if any) */}
      {localPost.content && !isArticlePost && !isPollPost && (
        <div className="w-full text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4 line-clamp-2">
          <RichTextRenderer 
            content={localPost.content} 
            mentionedUsers={localPost.mentioned_users} 
            disableLinks={true}
          />
        </div>
      )}

      {/* Post Media (1:1 Aspect Ratio) */}
      <div className="w-full aspect-square relative rounded-lg overflow-hidden bg-[var(--ds-surface-1)] border border-[var(--ds-border)]">
        {image ? (
          <img
            src={image}
            alt={localPost.title || "Post media"}
            className="w-full h-full object-cover"
          />
        ) : videoSrc ? (
          <video
            src={videoSrc}
            controls
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center p-6 text-center bg-[var(--ds-surface-1)]">
            <span className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans']">
              {localPost.title || localPost.content || "Post Content"}
            </span>
          </div>
        )}

        {/* Liked By Overlay (Bottom Left: 12px left, 12px bottom) */}
        <LikeBar
          likeCount={likesCount}
          isLiked={isLiked}
          sampleLikerUsername={sampleLikerUsername || undefined}
          likedUsers={likedUsers}
          viewerUsername={viewerUsername}
          onShowLikes={() => setIsLikesModalOpen(true)}
          variant="overlay"
        />
      </div>

      {/* Like / Comment / Repost / Share / Bookmark Row (Frame 2609512: 442x28px) */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="w-full pt-2 flex flex-row justify-between items-center prevent-card-click"
      >
        <div className="flex flex-row items-center gap-3">
          {/* Like */}
          <button
            type="button"
            onClick={handleLike}
            className="flex flex-row items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
          >
            {isLiked ? (
              <LikeFilledIcon className="w-5 h-5 text-[var(--ds-accent)]" fill="currentColor" />
            ) : (
              <LikeIcon className="w-5 h-5 text-[var(--ds-text-primary)]" fill="currentColor" />
            )}
            <span className="text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4">
              {likesCount}
            </span>
          </button>

          {/* Comment */}
          <button
            type="button"
            onClick={() => setIsCommentModalOpen(true)}
            className="flex flex-row items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <CommentIcon className="w-5 h-5 text-[var(--ds-text-primary)]" fill="currentColor" />
            <span className="text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4">
              {localPost.comments || 0}
            </span>
          </button>

          {/* Repost */}
          <button
            type="button"
            onClick={handleRepost}
            className="flex flex-row items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <RepostIcon
              className={`w-5 h-5 ${isReposted ? "text-[var(--ds-accent)]" : "text-[var(--ds-text-primary)]"}`}
              fill="currentColor"
            />
            <span className="text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4">
              {localPost.shares || 0}
            </span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex flex-row items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <ShareIcon className="w-5 h-5 text-[var(--ds-text-primary)]" fill="currentColor" />
          </button>
        </div>

        {/* Bookmark */}
        <button
          type="button"
          onClick={handleBookmark}
          className="cursor-pointer hover:opacity-85 transition-opacity"
        >
          {isSaved ? (
            <SaveFilledIcon className="w-5 h-5 text-[var(--ds-accent)]" fill="currentColor" />
          ) : (
            <SaveIcon className="w-5 h-5 text-[var(--ds-text-primary)]" fill="currentColor" />
          )}
        </button>
      </div>

      {/* Modals */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postId={localPost.id}
        onCommentAdded={() => {
          setLocalPost((prev) => ({
            ...prev,
            comments: (parseInt(prev.comments || "0") || 0) + 1 + "",
          }));
        }}
      />

      {isUndoRepostConfirmOpen && (
        <DeleteConfirmationModal
          isOpen={isUndoRepostConfirmOpen}
          onClose={() => setIsUndoRepostConfirmOpen(false)}
          onConfirm={confirmUndoRepost}
          title="Delete Repost"
          description="Are you sure you want to delete this repost?"
        />
      )}


      {isShareModalOpen && (
        <CocpitShareModel
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postId={localPost.id}
          onShare={(selectedIds) => {
            setLocalPost((prev) => ({
              ...prev,
              externalShares: (Number(prev.externalShares) || 0) + selectedIds.length,
            }));
          }}
        />
      )}

      {isLikesModalOpen && (
        <LikesModal
          isOpen={isLikesModalOpen}
          onClose={() => setIsLikesModalOpen(false)}
          postId={localPost.id}
        />
      )}

      {isSaveModalOpen && (
        <SavePostModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          postId={localPost.id}
          onSaved={(saved) => {
            setIsSaved(saved);
            setIsSaveModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ProfilePostCard;
