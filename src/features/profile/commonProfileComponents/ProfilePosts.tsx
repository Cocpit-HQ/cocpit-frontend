"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

const formatCompanyName = (name?: string): string => {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  if (words.length > 2) {
    return `${words[0]} ${words[1]}...`;
  }
  return name;
};
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { useSession } from "next-auth/react";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useSocial } from "@/context/SocialContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyProfileService } from "@/features/companyprofile/services/companyprofile.service";
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
import { createRepost, toggleLike, toggleSavePost, updatePost, deletePost } from "../services/profile.service";

const SavePostModal = dynamic(() => import('@/shared/commonComponents/SavePostModal').then(m => m.SavePostModal), { ssr: false });
const ReportModal = dynamic(() => import('@/components/shared/ReportModal').then(m => m.ReportModal), { ssr: false });

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
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [localPost, setLocalPost] = useState<Post>(post);
  
  const getInitialMainPost = (p: Post) => {
    const isRepost = !!p.shared_post && (!p.content || p.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;|\u200B|\u00A0|&#8203;|&#160;|&zwnj;/g, '').replace(/\s/g, '').trim() === '');
    return isRepost ? p.shared_post! : p;
  };
  
  const [isLiked, setIsLiked] = useState(getInitialMainPost(post).isLiked || false);
  const [likesCount, setLikesCount] = useState(Number(getInitialMainPost(post).likes) || 0);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { setEditMode } = useUIStore();
  const { activeProfile, isCompany } = useActiveProfile();
  const { data: session } = useSession();

  const [isReposted, setIsReposted] = useState(getInitialMainPost(post).isReposted || false);
  const [repostId, setRepostId] = useState<string | null>(getInitialMainPost(post).repostId || null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { followUser, unfollowUser, isFollowing, isFollowLoading, syncFollowStatus } = useSocial();
  const queryClient = useQueryClient();
  const authorUserId = post.authorId?.toString();
  const isAuthorFollowing = authorUserId ? isFollowing(authorUserId) : false;
  const isAuthorFollowLoading = authorUserId ? isFollowLoading(authorUserId) : false;

  const [isUndoRepostConfirmOpen, setIsUndoRepostConfirmOpen] = useState(false);
  
  const followCompanyMutation = useMutation({
    mutationFn: (orgId: string) => companyProfileService.followOrganization(orgId),
    onSuccess: (_, orgId) => {
      syncFollowStatus(orgId, true);
      queryClient.invalidateQueries({ queryKey: ["company_relationship", orgId] });
      queryClient.invalidateQueries({ queryKey: ["company_followers", orgId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    }
  });

  const unfollowCompanyMutation = useMutation({
    mutationFn: (orgId: string) => companyProfileService.unfollowOrganization(orgId),
    onSuccess: (_, orgId) => {
      syncFollowStatus(orgId, false);
      queryClient.invalidateQueries({ queryKey: ["company_relationship", orgId] });
      queryClient.invalidateQueries({ queryKey: ["company_followers", orgId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    }
  });

  const handleToggleFollowAuthor = () => {
    if (!authorUserId || isAuthorFollowLoading) return;

    if (localPost.isCompanyPost) {
      if (isAuthorFollowing) {
        unfollowCompanyMutation.mutate(authorUserId);
      } else {
        followCompanyMutation.mutate(authorUserId);
      }
    } else {
      if (isAuthorFollowing) {
        unfollowUser(authorUserId);
      } else {
        followUser(authorUserId);
      }
    }
  };

  const handleNotInterested = () => {
    setIsHidden(true);
    toast("Post hidden", {
      description: "We'll show fewer posts like this.",
      action: {
        label: "Undo",
        onClick: () => setIsHidden(false),
      },
    });
  };

  useEffect(() => {
    setLocalPost(post);
    const mPost = getInitialMainPost(post);
    setIsLiked(mPost.isLiked || false);
    setLikesCount(Number(mPost.likes) || 0);
    setIsSaved(post.is_saved || false);
    setIsReposted(mPost.isReposted || false);
    setRepostId(mPost.repostId || null);
  }, [post]);

  const isRepostWithoutThoughts = !!localPost.shared_post && (!localPost.content || localPost.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;|\u200B|\u00A0|&#8203;|&#160;|&zwnj;/g, '').replace(/\s/g, '').trim() === '');
  const mainPost = isRepostWithoutThoughts ? localPost.shared_post! : localPost;

  const _rawImage = mainPost?.imageSrc || (mainPost?.images && mainPost.images.length > 0 ? mainPost.images[0] : null);
  const image = _rawImage && _rawImage.trim() !== '' ? _rawImage : null;
  const videoSrc = (mainPost?.videoSrc && mainPost.videoSrc.trim() !== '') ? mainPost.videoSrc : null;
  const isArticlePost = mainPost?.category === 'Article' || mainPost?.post_type === 'article';
  const isPollPost = Boolean(mainPost?.poll);
  const articleExcerpt = mainPost?.content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
  const pollQuestion = mainPost?.title || articleExcerpt || "Untitled poll";
  const pollOptions = mainPost?.poll?.options?.slice(0, 4) || [];

  const handleLike = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    setIsLiked(!previousIsLiked);
    setLikesCount(prev => previousIsLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      const res = await toggleLike(mainPost.id);
      setIsLiked(res.liked);
      setLikesCount(res.likeCount);
    } catch (err) {
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      toast.error("Failed to update like");
    }
  };

  const handleBookmark = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isSaved) {
      setIsSaveModalOpen(true);
      return;
    }

    const previousIsSaved = isSaved;
    setIsSaved(false);

    try {
      const res = await toggleSavePost(mainPost.id);
      setIsSaved(res.saved);
      toast.success(res.saved ? "Post saved" : "Post removed from saves");
    } catch (err) {
      setIsSaved(previousIsSaved);
      toast.error("Failed to update save status");
    }
  };

  const handleRepost = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isReposted) {
      setIsUndoRepostConfirmOpen(true);
      return;
    }
    
    // Optimistic UI updates for Repost
    const previousIsReposted = isReposted;
    
    setIsReposted(true);
    
    try {
      const res = await createRepost(mainPost.id) as any;
      
      if (res.reposted !== false) {
        if (res && res.post_id) {
          setRepostId(res.post_id);
        }
        const updatedShares = ((Number(mainPost.shares) || 0) + 1).toString();
        setLocalPost(prev => {
          const isRepostWithoutThoughts = !!prev.shared_post && (!prev.content || prev.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;|\u200B|\u00A0|&#8203;|&#160;|&zwnj;/g, '').replace(/\s/g, '').trim() === '');
          const updated = { ...prev };
          if (isRepostWithoutThoughts) {
            updated.shared_post = { ...updated.shared_post!, shares: updatedShares, isReposted: true, repostId: res.post_id };
          } else {
            updated.shares = updatedShares;
            updated.isReposted = true;
            updated.repostId = res.post_id;
          }
          onUpdate?.(updated);
          return updated;
        });
        toast.success("Post reposted successfully!");
      }
    } catch (err: any) {
      setIsReposted(previousIsReposted);
      if (err?.response?.status === 409) {
        toast.error("You have already reposted this post.");
      } else {
        toast.error(err.response?.data?.message || "Failed to toggle repost");
      }
    }
  };

  const confirmUndoRepost = async () => {
    setIsUndoRepostConfirmOpen(false);
    
    const previousIsReposted = isReposted;
    setIsReposted(false);
    
    try {
      const res = await createRepost(mainPost.id) as any;
      
      if (res.reposted === false) {
        setRepostId(null);
        const updatedShares = Math.max(0, (Number(mainPost.shares) || 1) - 1).toString();
        setLocalPost(prev => {
          const isRepostWithoutThoughts = !!prev.shared_post && (!prev.content || prev.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;|\u200B|\u00A0|&#8203;|&#160;|&zwnj;/g, '').replace(/\s/g, '').trim() === '');
          const updated = { ...prev };
          if (isRepostWithoutThoughts) {
            updated.shared_post = { ...updated.shared_post!, shares: updatedShares, isReposted: false, repostId: null };
          } else {
            updated.shares = updatedShares;
            updated.isReposted = false;
            updated.repostId = null;
          }
          onUpdate?.(updated);
          return updated;
        });
        window.dispatchEvent(new CustomEvent('repostDeleted', { detail: { originalPostId: mainPost.id, repostId: repostId } }));
        toast.success("Repost removed");
      }
    } catch (err: any) {
      setIsReposted(previousIsReposted);
      toast.error(err.response?.data?.message || "Failed to remove repost");
    }
  };

  useEffect(() => {
    const handlePostCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newPost = customEvent.detail;
      if (newPost && newPost.shared_post?.id?.toString() === mainPost.id.toString()) {
        setIsReposted(true);
        setRepostId(newPost.id.toString());
        const updatedShares = ((Number(mainPost.shares) || 0) + 1).toString();
        setLocalPost(prev => {
          const isRepostWithoutThoughts = !!prev.shared_post && (!prev.content || prev.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;|\u200B|\u00A0|&#8203;|&#160;|&zwnj;/g, '').replace(/\s/g, '').trim() === '');
          const updated = { ...prev };
          if (isRepostWithoutThoughts) {
            updated.shared_post = { ...updated.shared_post!, shares: updatedShares, isReposted: true, repostId: newPost.id.toString() };
          } else {
            updated.shares = updatedShares;
            updated.isReposted = true;
            updated.repostId = newPost.id.toString();
          }
          onUpdate?.(updated);
          return updated;
        });
      }
    };

    const handleRepostDeleted = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { originalPostId } = customEvent.detail;
      if (originalPostId?.toString() === mainPost.id.toString() && isReposted) {
        setIsReposted(false);
        setRepostId(null);
        const updatedShares = Math.max(0, (Number(mainPost.shares) || 1) - 1).toString();
        setLocalPost(prev => {
          const isRepostWithoutThoughts = !!prev.shared_post && (!prev.content || prev.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;|\u200B|\u00A0|&#8203;|&#160;|&zwnj;/g, '').replace(/\s/g, '').trim() === '');
          const updated = { ...prev };
          if (isRepostWithoutThoughts) {
            updated.shared_post = { ...updated.shared_post!, shares: updatedShares, isReposted: false, repostId: null };
          } else {
            updated.shares = updatedShares;
            updated.isReposted = false;
            updated.repostId = null;
          }
          onUpdate?.(updated);
          return updated;
        });
      }
    };

    window.addEventListener('postCreated', handlePostCreated);
    window.addEventListener('repostDeleted', handleRepostDeleted);
    return () => {
      window.removeEventListener('postCreated', handlePostCreated);
      window.removeEventListener('repostDeleted', handleRepostDeleted);
    };
  }, [localPost.id, mainPost.id, isReposted, localPost.shares, onUpdate]);

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

  if (isHidden || !mainPost) return null;

  return (
    <div onClick={handleCardClick} onClickCapture={handleCardNavigationClick} className="cursor-pointer flex flex-col items-start py-4 w-[285.33px] h-[504px] bg-card border border-[#EEF2FF] dark:border-card-border-inner shadow-card-inner rounded-[24px] relative flex-shrink-0">
      
      {isRepostWithoutThoughts && (
        <div className="flex items-center gap-1 text-[#6B7280] text-[10px] font-poppins px-4 mb-2 select-none">
          <Icon icon="lucide:repeat" className="w-3 h-3 text-[#6B7280]" style={{ strokeWidth: '1.5px' }} />
          <span>{localPost.author} reposted</span>
        </div>
      )}

      {/* Header section */}
      <div className={`w-full h-[40px] flex items-center justify-between px-4 z-10 ${isRepostWithoutThoughts ? 'mb-2' : 'mb-4'}`}>
        {/* Author Info */}
        <div
          className="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            const authorLink = mainPost.isCompanyPost ? `/organization/${mainPost.authorSlug}` : `/profile/${mainPost.authorSlug || mainPost.authorId}`;
            router.push(authorLink);
          }}
        >
          <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-xs overflow-hidden flex-shrink-0 font-['Poppins'] select-none">
            {mainPost.authorAvatar && mainPost.authorAvatar !== '/assets/profilephoto.png' && mainPost.authorAvatar !== '/assets/pngegg.png' ? (
              <img
                src={mainPost.authorAvatar}
                alt={mainPost.author || "User"}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span>{(mainPost.author || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col justify-center overflow-hidden min-w-0">
            <span className="text-[16px] leading-[24px] font-normal text-foreground truncate font-[family-name:var(--font-poppins)]">
              {mainPost.isCompanyPost ? formatCompanyName(mainPost.author) : (mainPost.author || "Anonymous")}
            </span>
            <div className="text-[10px] leading-[16px] text-[#6B7280] font-normal font-[family-name:var(--font-poppins)] truncate block w-full" title={mainPost.authorHeadline || mainPost.title || ""}>
              {mainPost.authorHeadline || mainPost.title || ""}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] leading-[16px] text-[#6B7280] font-normal font-[family-name:var(--font-poppins)] mt-0.5">
              {mainPost.location && (() => {
                const displayLoc = mainPost.location.split(',')[0].trim();
                const truncatedLoc = displayLoc.length > 15 ? displayLoc.slice(0, 15) + '..' : displayLoc;
                return (
                  <>
                    <span title={mainPost.location}>{truncatedLoc}</span>
                    <span className="w-1 h-1 rounded-full bg-[#DADADA] flex-none" />
                  </>
                );
              })()}
              <span className="flex-none">{mainPost.timeAgo || localPost.timeAgo || "6 days ago"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 z-20">
          {mainPost.tags && mainPost.tags.length > 0 && (
            <TaggedPeoplePopover tags={mainPost.tags} postId={mainPost.id || localPost.id} />
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

                {!isOwnPost && (
                  <>
                    <DropdownMenuItem
                      onClick={handleToggleFollowAuthor}
                      disabled={!authorUserId || isAuthorFollowLoading || followCompanyMutation.isPending || unfollowCompanyMutation.isPending}
                      className="flex items-start justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
                    >
                      <span className="text-[14px] font-[family-name:var(--font-poppins)] break-words text-left pr-2">
                        {localPost.isCompanyPost
                          ? (isAuthorFollowing ? "Unfollow company" : "Follow company")
                          : (isAuthorFollowing ? "Unfollow user" : "Follow user")}
                      </span>
                      <img
                        src={localPost.authorAvatar || "/assets/pngegg.png"}
                        alt={localPost.author || "User"}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsReportModalOpen(true)}
                      className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
                    >
                      <span className="text-[14px] font-[family-name:var(--font-poppins)]">Report post</span>
                      <Icon icon="mdi:information-outline" className="w-6 h-6 text-black" style={{ strokeWidth: '1.5px' }} />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleNotInterested}
                      className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
                    >
                      <span className="text-[14px] font-[family-name:var(--font-poppins)]">Not interested</span>
                      <Icon icon="fluent:eye-off-16-regular" className="w-6 h-6 text-black" style={{ strokeWidth: '1.5px' }} />
                    </DropdownMenuItem>
                  </>
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
            href={`/post/${mainPost.id}`}
            className="text-[12px] leading-[20px] text-foreground font-[family-name:var(--font-poppins)] line-clamp-2 min-h-[40px] cursor-pointer"
          >
            {mainPost.content}
          </Link>
        ) : (image || videoSrc || (!isRepostWithoutThoughts && localPost.shared_post)) ? (
          <Link
            href={`/post/${mainPost.id}`}
            className="text-[12px] leading-[20px] text-foreground font-[family-name:var(--font-poppins)] truncate h-[20px] cursor-pointer"
          >
            {mainPost.content}
          </Link>
        ) : null}
      </div>

      {/* Main Image / Shared / Poll / Article / Text block */}
      {(!isRepostWithoutThoughts && localPost.shared_post) ? (
        <div className="w-full h-[300px] mb-4 relative overflow-hidden">
          <div className="w-full h-full p-3 bg-[#F8FAFF] dark:bg-[#131C2E]/30 border border-[#E3E9FF] dark:border-[#232F45] rounded-[16px] flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-[10px] overflow-hidden flex-shrink-0 font-['Poppins'] select-none">
                {localPost.shared_post.authorAvatar && localPost.shared_post.authorAvatar !== '/assets/pngegg.png' ? (
                  <img src={localPost.shared_post.authorAvatar} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span>{(localPost.shared_post.author || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="text-[10px] font-medium truncate font-[family-name:var(--font-poppins)] text-foreground">{localPost.shared_post.isCompanyPost ? formatCompanyName(localPost.shared_post.author) : localPost.shared_post.author}</span>
            </div>
            <p className="text-[10px] leading-[14px] text-foreground font-[family-name:var(--font-poppins)] line-clamp-2">{localPost.shared_post.content}</p>
            {localPost.shared_post.poll ? (
              <div className="mt-1 space-y-1.5 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-grow">
                {localPost.shared_post.poll.options?.slice(0, 3).map((option, index) => (
                  <div
                    key={option.option_id || index}
                    className="rounded-[10px] border border-[#E8ECFF] dark:border-[#232F45] bg-white dark:bg-[#1C2840] px-2.5 py-1.5 flex items-center justify-between"
                  >
                    <span className="text-[10px] text-foreground font-[family-name:var(--font-poppins)] truncate">
                      {option.option_text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (localPost.shared_post.images?.length || localPost.shared_post.imageSrc) ? (
              <div className="h-[180px] w-full rounded-lg overflow-hidden">
                <img src={localPost.shared_post.imageSrc || localPost.shared_post.images?.[0] || ''} className="w-full h-full object-cover" />
              </div>
            ) : null}
          </div>
        </div>
      ) : isPollPost ? (
        <div className="w-full h-[300px] mb-4 bg-muted relative overflow-hidden">
          <Link href={`/post/${mainPost.id}`} className="block w-full h-full p-4 bg-[#F8FAFF] dark:bg-transparent">
            <div className="w-full h-full rounded-[20px] border border-[#E3E9FF] dark:border-[#232F45] bg-white dark:bg-[#131C2E] p-4 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-[#EEF2FF] dark:bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6366F1] dark:text-indigo-400">
                  Poll
                </span>
                <span className="text-[10px] text-muted-foreground font-[family-name:var(--font-poppins)]">
                  {mainPost.poll?.total_votes || 0} votes
                </span>
              </div>

              {pollQuestion && (
                <div className="mb-3">
                  <p className="font-[family-name:var(--font-poppins)] font-medium text-[13px] leading-[18px] text-foreground line-clamp-2">
                    {pollQuestion}
                  </p>
                </div>
              )}

              <div className="space-y-2.5 overflow-y-auto min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {pollOptions.map((option, index) => (
                  <div
                    key={option.option_id || `${option.option_text}-${index}`}
                    className="rounded-[14px] border border-[#E8ECFF] dark:border-[#232F45] bg-[#F8FAFF] dark:bg-[#1C2840] px-3 py-2.5"
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

              {mainPost.poll && mainPost.poll.options.length > pollOptions.length && (
                <div className="mt-auto pt-3 text-[11px] leading-[16px] text-muted-foreground font-[family-name:var(--font-poppins)]">
                  +{mainPost.poll.options.length - pollOptions.length} more option{mainPost.poll.options.length - pollOptions.length === 1 ? "" : "s"}
                </div>
              )}
            </div>
          </Link>
        </div>
      ) : isArticlePost ? (
        <div className="w-full h-[300px] mb-4 bg-muted relative overflow-hidden group">
          <Link href={`/article/${mainPost.id}`} className="block w-full h-full cursor-pointer">
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
        <div className="w-full h-[300px] mb-4 relative overflow-hidden">
          {videoSrc ? (
            <Link href={`/post/${mainPost.id}`} className="block w-full h-full cursor-pointer bg-black">
              <video
                src={videoSrc}
                className="w-full h-full object-contain pointer-events-none"
                preload="metadata"
                muted
                loop
                playsInline
              />
            </Link>
          ) : null}
        </div>
      ) : image ? (
        <div className="w-full h-[300px] mb-4 bg-muted relative overflow-hidden">
          <Link href={`/post/${mainPost.id}`} className="block w-full h-full cursor-pointer">
            {localPost.images && localPost.images.length > 1 ? (
              <PostCarousel images={localPost.images} />
            ) : (
              <img
                src={image}
                alt="Content"
                className="w-full h-full object-cover"
              />
            )}
          </Link>
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
        <div className="w-full px-4 mb-4 flex items-center gap-2">
          {mainPost.likedUsers && mainPost.likedUsers.length > 0 && (() => {
            const viewerUsername = (isCompany ? activeProfile?.slug : ((activeProfile as any)?.account_name || (session?.user as any)?.username))?.toLowerCase();
            const filteredLikedUsers = mainPost.likedUsers.filter(u => u.username?.toLowerCase() !== viewerUsername);
            if (filteredLikedUsers.length === 0) return null;
            return (
              <div className="flex -space-x-1.5 overflow-hidden">
                {filteredLikedUsers.slice(0, 3).map((user, idx) => (
                  <div key={idx} className="inline-flex h-5 w-5 rounded-full ring-2 ring-background bg-[#EEF2FF] text-[#6366F1] items-center justify-center font-bold text-[10px] flex-shrink-0 overflow-hidden font-['Poppins'] select-none">
                    {user.avatar_url && user.avatar_url !== '/assets/pngegg.png' ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username || "user"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span>{(user.username || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
          <p className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)] truncate">
            {likesCount === 1 && isLiked ? (
              `${likesCount} like`
            ) : (
              <>
                Liked by <span className="font-semibold hover:underline cursor-pointer">@{mainPost.sampleLikerUsername || 'someone'}</span>
                {likesCount > 1 && (
                  <> and <span className="font-semibold hover:underline cursor-pointer">{likesCount - 1} {likesCount - 1 === 1 ? 'other' : 'others'}</span></>
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
              <Icon icon={isLiked ? "solar:like-bold" : "solar:like-broken"} className={cn("w-5 h-5", isLiked ? "text-primary" : "text-foreground")} />
              <span className={cn("text-[12px] leading-[16px] font-[family-name:var(--font-poppins)]", isLiked ? "text-primary" : "text-foreground")}>{likesCount}</span>
            </button>
            <Link href={`/post/${mainPost.id}?comments=true`} className="flex items-center gap-1 min-w-0 flex-shrink-0">
              <Icon icon="hugeicons:comment-01" className="w-5 h-5 text-foreground" />
              <span className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)]">{mainPost.comments || 0}</span>
            </Link>
            <button
              onClick={handleRepost}
              className="flex items-center gap-1 min-w-0 flex-shrink-0 cursor-pointer"
            >
              <Icon
                icon="hugeicons:repost"
                className={cn("w-5 h-5", isReposted ? "text-primary" : "text-foreground")}
              />
              <span className={cn("text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)]", isReposted ? "text-primary" : "text-foreground")}>
                {mainPost.shares || 0}
              </span>
            </button>
            <button onClick={handleShare} className="flex items-center min-w-0 flex-shrink-0 cursor-pointer">
              <Icon icon="fluent:share-16-regular" className="w-5 h-5 text-foreground" />
              {mainPost.externalShares !== undefined && Number(mainPost.externalShares) > 0 && (
                <span className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)] ml-1">
                  {mainPost.externalShares}
                </span>
              )}
            </button>
          </div>
          <button onClick={handleBookmark} className="flex-shrink-0 cursor-pointer">
            <Icon
              icon={isSaved ? "solar:bookmark-bold" : "solar:bookmark-linear"}
              className={cn("w-5 h-5", isSaved ? "text-[var(--ds-accent)]" : "text-foreground")}
            />
          </button>
        </div>
      </div>

      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postId={mainPost.id}
        onCommentAdded={() => {
          setLocalPost(prev => ({
            ...prev,
            comments: (parseInt(prev.comments) || 0) + 1 + ""
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
          onShare={(selectedIds) => {
            setLocalPost(prev => ({
              ...prev,
              externalShares: (Number(prev.externalShares) || 0) + selectedIds.length
            }));
          }}
        />
      )}

      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="POST"
          targetId={localPost.id}
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
