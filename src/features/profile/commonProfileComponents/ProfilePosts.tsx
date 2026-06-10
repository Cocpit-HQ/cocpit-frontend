"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { PostCarousel } from "@/components/shared/PostCarousel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import { TaggedPeoplePopover } from "@/shared/commonComponents/TaggedPeoplePopover";
import { CommentModal } from "../components/CommentModal";
import { EditPostModal } from "@/shared/commonComponents/EditPostModal";
import { ProfileEmptyState } from "./ProfileEmptyState";
import { useUIStore } from "@/store/ui.store";
import { ProfilePostCardSkeleton } from "../components/skeletons/ProfilePostCardSkeleton";

import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper";
import type { Post } from "@/types/entities";
import { createRepost, toggleLike, toggleSavePost, updatePost } from "../services/profile.service";

const SavePostModal = dynamic(() => import('@/components/settings/SavePostModal').then(m => m.SavePostModal), { ssr: false });

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

const ProfilePostCard = ({
  post,
  isOwnPost,
  onDelete,
  onToggleVisibility,
  onUpdate,
}: {
  post: Post;
  isOwnPost?: boolean;
  onDelete?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  onUpdate?: (post: Post) => void;
}) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(Number(post.likes) || 0);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { setEditMode } = useUIStore();

  useEffect(() => {
    setLocalPost(post);
    setIsLiked(post.isLiked || false);
    setLikesCount(Number(post.likes) || 0);
    setIsSaved(post.is_saved || false);
  }, [post]);

  const _rawImage = localPost.imageSrc || (localPost.images && localPost.images.length > 0 ? localPost.images[0] : null);
  const image = _rawImage && _rawImage.trim() !== '' ? _rawImage : null;
  const videoSrc = (localPost.videoSrc && localPost.videoSrc.trim() !== '') ? localPost.videoSrc : null;
  const isArticlePost = localPost.category === 'Article' || localPost.post_type === 'article';
  const isPollPost = Boolean(localPost.poll);
  const articleExcerpt = localPost.content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
  const pollQuestion = articleExcerpt || localPost.title || "Untitled poll";
  const pollOptions = localPost.poll?.options?.slice(0, 4) || [];

  const handleLike = async () => {
    try {
      const res = await toggleLike(localPost.id);
      setIsLiked(res.liked);
      setLikesCount(res.likeCount);
    } catch (err) {
      toast.error("Failed to update like");
    }
  };

  const handleBookmark = async () => {
    if (!isSaved) {
      setIsSaveModalOpen(true);
      return;
    }

    try {
      const res = await toggleSavePost(localPost.id);
      setIsSaved(res.saved);
      toast.success(res.saved ? "Post saved" : "Post removed from saves");
    } catch (err) {
      toast.error("Failed to update save status");
    }
  };

  const handleRepost = async () => {
    try {
      await createRepost(localPost.id);
      setLocalPost(prev => ({
        ...prev,
        shares: (Number(prev.shares) || 0) + 1 + ""
      }));
      toast.success("Post reposted successfully!");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("You have already reposted this post.");
      } else {
        toast.error(err.response?.data?.message || "Failed to repost");
      }
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleTogglePrivacy = async () => {
    const newVisibility = localPost.visibility === 'private' ? 'public' : 'private';
    try {
      const updated = await updatePost(localPost.id, { visibility: newVisibility });
      const mergedPost = mergeProfilePostState(localPost, mapProfilePostToPost(updated));
      setLocalPost(mergedPost);
      onUpdate?.(mergedPost);
      onToggleVisibility?.(localPost.id);
      toast.success(`Post is now ${newVisibility}`);
    } catch (err) {
      toast.error("Failed to update privacy");
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest('[role="menu"]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[role="dialog"]') ||
      target.closest('[data-radix-popper-content-wrapper]')
    ) {
      return;
    }
    router.push(`/post/${localPost.id}`);
  };

  const handleCardNavigationClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const linkEl = target.closest("a");
    const isPostLink = linkEl && linkEl.getAttribute("href")?.includes("/post/");

    const isInteractive =
      target.closest("button") ||
      target.closest("a") ||
      target.closest('[role="menu"]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[role="dialog"]') ||
      target.closest('[data-radix-popper-content-wrapper]');

    if (isPostLink || !isInteractive) {
      sessionStorage.setItem("cocpit_profile_scroll_y", window.scrollY.toString());
      sessionStorage.setItem("cocpit_profile_scroll_source", "post");
      sessionStorage.setItem("cocpit_profile_scroll_path", window.location.pathname);

      if (typeof window !== "undefined") {
        try {
          const currentState = { ...window.history.state };
          currentState.cocpit_scroll_y = window.scrollY;
          currentState.cocpit_scroll_source = "post";
          currentState.cocpit_scroll_path = window.location.pathname;
          currentState.cocpit_popstate_occurred = true;
          window.history.replaceState(currentState, "", window.location.href);
        } catch (err) {
          console.error("Failed to update history state:", err);
        }
      }
    }
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div onClick={handleCardClick} onClickCapture={handleCardNavigationClick} className="cursor-pointer flex flex-col items-start py-4 w-[285.33px] h-[504px] bg-card border border-[#EEF2FF] dark:border-card-border-inner shadow-card-inner rounded-[24px] relative flex-shrink-0">
      {/* Header section */}
      <div className="w-full h-[40px] flex items-center justify-between px-4 z-10 mb-4">
        {/* Author Info */}
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
            <img
              src={localPost.authorAvatar || "/assets/profilephoto.png"}
              alt={localPost.author || "User"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center overflow-hidden min-w-0">
            <span className="text-[16px] leading-[24px] font-normal text-foreground truncate font-[family-name:var(--font-poppins)]">
              {localPost.author || "Anonymous"}
            </span>
            <Link href={`/post/${localPost.id}`} className="text-[10px] leading-[16px] text-[#6B7280] font-normal font-[family-name:var(--font-poppins)] truncate block w-full cursor-pointer" title={localPost.authorHeadline || localPost.title || ""}>
              {localPost.authorHeadline || localPost.title || ""}
            </Link>
            <div className="flex items-center gap-1.5 text-[10px] leading-[16px] text-[#6B7280] font-normal font-[family-name:var(--font-poppins)] mt-0.5">
              {localPost.location && (() => {
                const displayLoc = localPost.location.split(',')[0].trim();
                const truncatedLoc = displayLoc.length > 15 ? displayLoc.slice(0, 15) + '..' : displayLoc;
                return (
                  <>
                    <span title={localPost.location}>{truncatedLoc}</span>
                    <span className="w-1 h-1 rounded-full bg-[#DADADA] flex-none" />
                  </>
                );
              })()}
              <span className="flex-none">{localPost.timeAgo || "6 days ago"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 z-20">
          {localPost.tags && localPost.tags.length > 0 && (
            <TaggedPeoplePopover tags={localPost.tags} />
          )}

          <DropdownMenu onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "p-1 rounded-full transition-colors outline-none cursor-pointer",
                isMenuOpen ? "bg-[#EEF2FF] text-[#6366F1]" : "text-foreground"
              )}>
                <Icon icon="ph:dots-three-outline-vertical-light" className="w-[24px] h-[24px]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[180px] p-2 bg-card border border-[#EEF2FF] dark:border-card-border-inner rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg"
              align="end"
            >
              <div className="flex flex-col gap-1">
                {isOwnPost && (
                  <DropdownMenuItem
                    onClick={() => {
                      if (isArticlePost) {
                        router.push(`/article/edit/${localPost.id}`);
                      } else {
                        setEditMode(true, localPost.id);
                        setIsEditModalOpen(true);
                      }
                    }}
                    className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
                  >
                    <span className="text-[14px] font-[family-name:var(--font-poppins)]">Edit post</span>
                    <Icon icon="hugeicons:edit-03" className="w-6 h-6 text-black" style={{ strokeWidth: '1.5px' }} />
                  </DropdownMenuItem>
                )}

                {isOwnPost && (
                  <DropdownMenuItem
                    onClick={handleTogglePrivacy}
                    className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
                  >
                    <span className="text-[14px] font-[family-name:var(--font-poppins)]">
                      {localPost.visibility === 'private' ? 'Make public' : 'Make private'}
                    </span>
                    {localPost.visibility === 'private' ? (
                      <Icon icon="hugeicons:view" className="w-6 h-6 text-black" style={{ strokeWidth: '1.5px' }} />
                    ) : (
                      <Icon icon="hugeicons:view-off-slash" className="w-6 h-6 text-black" style={{ strokeWidth: '1.5px' }} />
                    )}
                  </DropdownMenuItem>
                )}

                {isOwnPost && onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(localPost.id)}
                    className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-red-50 focus:text-[#FF6B6B] text-[#FF6B6B] rounded-xl outline-none transition-colors"
                  >
                    <span className="text-[14px] font-[family-name:var(--font-poppins)]">Delete post</span>
                    <Icon icon="hugeicons:delete-02" className="w-6 h-6 text-[#FF6B6B]" style={{ strokeWidth: '1.5px' }} />
                  </DropdownMenuItem>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full flex flex-col gap-[8px] mb-2 px-4">
        {isArticlePost ? null : isPollPost ? (
          <Link
            href={`/post/${localPost.id}`}
            className="text-[12px] leading-[20px] text-foreground font-[family-name:var(--font-poppins)] line-clamp-2 min-h-[40px] cursor-pointer"
          >
            {pollQuestion}
          </Link>
        ) : (image || videoSrc || localPost.shared_post) ? (
          <Link
            href={`/post/${localPost.id}`}
            className="text-[12px] leading-[20px] text-foreground font-[family-name:var(--font-poppins)] truncate h-[20px] cursor-pointer"
          >
            {localPost.content}
          </Link>
        ) : null}
      </div>

      {/* Main Image / Shared / Poll / Article / Text block */}
      {localPost.shared_post ? (
        <div className="w-full h-[300px] mb-4 bg-muted relative overflow-hidden">
          <div className="w-full h-full p-3 bg-card overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100">
                <img src={localPost.shared_post.authorAvatar || "/assets/pngegg.png"} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-medium truncate">{localPost.shared_post.author}</span>
            </div>
            <p className="text-[10px] line-clamp-2 mb-2 flex-grow">{localPost.shared_post.content}</p>
            {(localPost.shared_post.images?.length || localPost.shared_post.imageSrc) && (
              <div className="h-[180px] w-full rounded-lg overflow-hidden">
                <img src={localPost.shared_post.imageSrc || localPost.shared_post.images?.[0] || ''} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      ) : isPollPost ? (
        <div className="w-full h-[300px] mb-4 bg-muted relative overflow-hidden">
          <Link href={`/post/${localPost.id}`} className="block w-full h-full p-4 bg-[#F8FAFF]">
            <div className="w-full h-full rounded-[20px] border border-[#E3E9FF] bg-white p-4 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6366F1]">
                  Poll
                </span>
                <span className="text-[10px] text-muted-foreground font-[family-name:var(--font-poppins)]">
                  {localPost.poll?.total_votes || 0} votes
                </span>
              </div>

              <div className="space-y-2.5">
                {pollOptions.map((option, index) => (
                  <div
                    key={option.option_id || `${option.option_text}-${index}`}
                    className="rounded-[14px] border border-[#E8ECFF] bg-[#F8FAFF] px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] leading-[18px] text-foreground font-[family-name:var(--font-poppins)] line-clamp-1">
                        {option.option_text}
                      </span>
                      <span className="text-[11px] leading-[16px] text-[#6366F1] font-medium font-[family-name:var(--font-poppins)] flex-shrink-0">
                        {option.vote_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {localPost.poll && localPost.poll.options.length > pollOptions.length && (
                <div className="mt-auto pt-3 text-[11px] leading-[16px] text-muted-foreground font-[family-name:var(--font-poppins)]">
                  +{localPost.poll.options.length - pollOptions.length} more option{localPost.poll.options.length - pollOptions.length === 1 ? "" : "s"}
                </div>
              )}
            </div>
          </Link>
        </div>
      ) : isArticlePost ? (
        <div className="w-full h-[300px] mb-4 bg-muted relative overflow-hidden">
          <Link href={`/post/${localPost.id}`} className="block w-full h-full relative">
            {image ? (
              <img
                src={image}
                alt={localPost.title || "Article cover"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#EEF2FF] to-[#DDE5FF] flex items-center justify-center px-6 text-center">
                <span className="text-[16px] leading-[24px] text-[#6366F1] font-semibold font-[family-name:var(--font-poppins)] line-clamp-3">
                  {localPost.title || "Untitled Article"}
                </span>
              </div>
            )}
          </Link>
        </div>
      ) : videoSrc ? (
        <div className="w-full h-[300px] mb-4 bg-muted relative overflow-hidden">
          <Link href={`/post/${localPost.id}`} className="block w-full h-full bg-black">
            <video
              src={videoSrc}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          </Link>
        </div>
      ) : image ? (
        <div className="w-full h-[300px] mb-4 bg-muted relative overflow-hidden">
          <div className="w-full h-full">
            {localPost.images && localPost.images.length > 1 ? (
              <PostCarousel images={localPost.images} />
            ) : (
              <img
                src={image}
                alt="Content"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      ) : (
        /* Text-only post: show full content inline */
        <Link href={`/post/${localPost.id}`} className="block w-full px-4 mb-3 overflow-hidden">
          <p
            className="text-[13px] leading-[22px] text-foreground font-[family-name:var(--font-poppins)] overflow-hidden whitespace-pre-wrap"
            style={{ display: '-webkit-box', WebkitLineClamp: 10, WebkitBoxOrient: 'vertical' }}
          >
            {(localPost.content || '').split(/(#\w+)/g).map((part, i) =>
              /^#\w+/.test(part)
                ? <span key={i} className="text-[#6366F1]">{part}</span>
                : part
            )}
          </p>
        </Link>
      )}

      {isArticlePost && !localPost.shared_post && (
        <div className="w-full px-4 mb-3">
          <Link href={`/post/${localPost.id}`} className="block">
            <h3 className="text-[14px] leading-[20px] text-foreground font-semibold font-[family-name:var(--font-poppins)] line-clamp-2">
              {localPost.title || "Untitled Article"}
            </h3>
          </Link>
        </div>
      )}

      {/* Liked by Section */}
      {likesCount > 0 && (
        <div className="w-full px-4 mb-4 flex items-center">
          <p className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)] truncate">
            {likesCount === 1 && isLiked ? (
              `${likesCount} like`
            ) : (
              <>
                Liked by <span>@{localPost.sampleLikerUsername || 'someone'}</span>
                {likesCount > 1 && (
                  <> and {likesCount - 1} {likesCount - 1 === 1 ? 'other' : 'others'}</>
                )}
              </>
            )}
          </p>
        </div>
      )}

      {/* Interaction Footer */}
      <div className="w-full h-[40px] px-4 py-2 mt-auto border-t border-transparent">
        <div className="flex items-center justify-between w-full h-[24px]">
          <div className="flex items-center gap-[16px]">
            <button onClick={handleLike} className="flex items-center gap-1 min-w-0 flex-shrink-0 cursor-pointer">
              <Icon icon={isLiked ? "solar:like-bold" : "solar:like-broken"} className={cn("w-5 h-5", isLiked ? "text-[#6366F1]" : "text-foreground")} />
              <span className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)]">{likesCount}</span>
            </button>
            <Link href={`/post/${localPost.id}?comments=true`} className="flex items-center gap-1 min-w-0 flex-shrink-0">
              <Icon icon="hugeicons:comment-01" className="w-5 h-5 text-foreground" />
              <span className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)]">{localPost.comments || 0}</span>
            </Link>
            <button onClick={handleRepost} className="flex items-center gap-1 min-w-0 flex-shrink-0 cursor-pointer">
              <Icon icon="hugeicons:repost" className="w-5 h-5 text-foreground" />
              <span className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)]">{localPost.shares || 0}</span>
            </button>
            <button onClick={handleShare} className="flex items-center min-w-0 flex-shrink-0 cursor-pointer">
              <Icon icon="fluent:share-16-regular" className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <button onClick={handleBookmark} className="flex-shrink-0 cursor-pointer">
            <Icon
              icon={isSaved ? "solar:bookmark-bold" : "solar:bookmark-linear"}
              className={cn("w-5 h-5", isSaved ? "text-[#6366F1]" : "text-foreground")}
            />
          </button>
        </div>
      </div>

      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postId={localPost.id}
        onCommentAdded={() => {
          setLocalPost(prev => ({
            ...prev,
            comments: (parseInt(prev.comments) || 0) + 1 + ""
          }));
        }}
      />

      {isEditModalOpen && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditMode(false, null);
          }}
          editPostId={localPost.id}
          onUpdate={(updated) => {
            const mergedPost = mergeProfilePostState(localPost, updated as any);
            setLocalPost(mergedPost);
            onUpdate?.(mergedPost);
          }}
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

      {isShareModalOpen && (
        <CocpitShareModel
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postId={localPost.id}
          onShare={() => {
            setLocalPost(prev => ({
              ...prev,
              shares: (Number(prev.shares) || 0) + 1 + ""
            }));
          }}
        />
      )}
    </div>
  );
};

interface ProfilePostsProps {
  posts: any[];
  isOwnProfile: boolean;
  isCompany?: boolean;
  profileSlug: string;
  userName?: string;
  onDeletePost?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  onUpdatePost?: (post: any) => void;
  onCreateClick?: () => void;
  isLoading?: boolean;
}

export function ProfilePosts({
  posts,
  isOwnProfile,
  isCompany = false,
  profileSlug,
  userName,
  onDeletePost,
  onToggleVisibility,
  onUpdatePost,
  onCreateClick,
  isLoading = false,
}: ProfilePostsProps) {
  const router = useRouter();

  return (
    <div
      className="w-full bg-transparent mt-[16px] transition-all duration-500 ease-in-out overflow-hidden"
      style={(posts.length > 0 || isLoading) ? { minHeight: '564px' } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-4 px-4 md:pl-10 md:pr-4">
        <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-[family-name:var(--font-poppins)]">Post</h2>
        {posts.length > 0 && (
          <button
            onClick={() => {
              sessionStorage.setItem("cocpit_profile_scroll_y", window.scrollY.toString());
              sessionStorage.setItem("cocpit_profile_scroll_source", "post");
              sessionStorage.setItem("cocpit_profile_scroll_path", window.location.pathname);

              if (typeof window !== "undefined") {
                try {
                  const currentState = { ...window.history.state };
                  currentState.cocpit_scroll_y = window.scrollY;
                  currentState.cocpit_scroll_source = "post";
                  currentState.cocpit_scroll_path = window.location.pathname;
                  currentState.cocpit_popstate_occurred = true;
                  window.history.replaceState(currentState, "", window.location.href);
                } catch (err) {
                  console.error("Failed to update history state:", err);
                }
              }
              router.push(`/profile/${profileSlug}/posts`);
            }}
            className="w-[78px] h-[36px] flex items-center justify-center px-4 py-2 border border-primary rounded-[24px] bg-card text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-primary whitespace-nowrap hover:bg-secondary transition-all duration-200 cursor-pointer"
          >
            See all
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="px-4 md:pl-10 md:pr-4 flex flex-row gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {[1, 2, 3].map((i) => (
            <ProfilePostCardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="px-4 md:pl-10 md:pr-4">
          <ProfileEmptyState
            type="post"
            isOwnProfile={isOwnProfile}
            userName={userName}
            onCreateClick={onCreateClick}
          />
        </div>
      ) : (
        <div className="px-4 md:pl-10 md:pr-4 flex flex-row md:flex-row gap-4 md:gap-[24px] overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {posts.slice(0, 3).map((post, index) => (
            <div
              key={`${post.id || 'post'}-${index}`}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both flex-shrink-0"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProfilePostCard
                post={post}
                isOwnPost={isOwnProfile && !isCompany}
                onDelete={onDeletePost}
                onToggleVisibility={onToggleVisibility}
                onUpdate={onUpdatePost}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
