"use client"
import { cn } from "@/lib/utils"
import { Icon } from "@iconify/react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { useSession } from "next-auth/react"

import { PostCarousel } from "@/components/shared/PostCarousel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { useAuth } from "@/hooks/use-auth"
import { useFeed } from "@/hooks/use-feed"
import { useIsMobile } from "@/hooks/use-mobile"
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper"
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel"
import { TaggedPeoplePopover } from "@/shared/commonComponents/TaggedPeoplePopover"
import type { Education, Experience, Post, Project } from "@/types/entities"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { LivingResume } from "../commonProfileComponents/LivingResume"
import { ProfileSkeleton } from "../commonProfileComponents/ProfileSkeleton"
import { ViewAvatarModal } from "../commonProfileComponents/ViewAvatarModal"
import AddEducationForm from "../components/AddEducationForm"
import AddExperienceForm, { type SavedRole } from "../components/AddExperienceForm"
import AddProjectForm from "../components/AddProjectForm"
import { CommentModal } from "../components/CommentModal"
import { CompanyRoleModal } from "../components/CompanyRoleModal"
import { ContactInfoModal } from "../components/ContactInfoModal"
import { EditAvatarModal } from "../components/EditAvatarModal"
import { EditPostModal } from "@/shared/commonComponents/EditPostModal"
import { FollowListModal } from "../components/FollowListModal"
import { SkillModal } from "../components/SkillModal"
import { deletePost as apiDeletePost, createRepost, getFollowing, getProfileStats, getUserPosts, toggleLike, toggleSavePost, updatePost } from "../services/profile.service"
import { ProfileIdentity } from "../types/profile.types"
import { useUIStore } from "@/store/ui.store"

import { ProfileAbout } from "../commonProfileComponents/ProfileAbout"
import { ProfileEducation } from "../commonProfileComponents/ProfileEducation"
import { ProfileExperience } from "../commonProfileComponents/ProfileExperience"
import { ProfileProjects } from "../commonProfileComponents/ProfileProjects"
import { ProfileHeader } from "../commonProfileComponents/ProfileHeader"
import { ProfilePosts } from "../commonProfileComponents/ProfilePosts"
import { ProfileSkills } from "../commonProfileComponents/ProfileSkills"

import { useAvatarMutations, useEducationMutations, useExperienceMutations, useMyProfile, useProfileMutation, useSkillMutations, useProjectMutations } from "@/hooks/use-my-profile"
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { EditProfileModal } from "../components/EditProfileModal"
import { useProfileScore } from "@/features/profile-score/hooks/useProfileScore"
import { ProfileScoreCard } from "@/features/profile-score/components/ProfileScoreCard"
const SavePostModal = dynamic(() => import('@/features/settings/components/SavePostModal').then(m => m.SavePostModal), { ssr: false });

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
}

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

const ProfilePostCard = ({ post, isOwnPost, onDelete, onToggleVisibility, onUpdate }: { post: Post, isOwnPost?: boolean, onDelete?: (id: string) => void, onToggleVisibility?: (id: string) => void, onUpdate?: (post: Post) => void }) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(Number(post.likes) || 0);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { setEditMode } = useUIStore();
  const { activeProfile, isCompany } = useActiveProfile();
  const { data: session } = useSession();

  const [isReposted, setIsReposted] = useState(post.isReposted || false);
  const [repostId, setRepostId] = useState<string | null>(post.repostId || null);
  const [isUndoRepostConfirmOpen, setIsUndoRepostConfirmOpen] = useState(false);

  useEffect(() => {
    setLocalPost(post);
    setIsLiked(post.isLiked || false);
    setLikesCount(Number(post.likes) || 0);
    setIsSaved(post.is_saved || false);
    setIsReposted(post.isReposted || false);
    setRepostId(post.repostId || null);
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
    if (isReposted) {
      setIsUndoRepostConfirmOpen(true);
    } else {
      try {
        const res = await createRepost(localPost.id) as any;
        setIsReposted(true);
        if (res && res.post_id) {
          setRepostId(res.post_id);
        }
        setLocalPost(prev => ({
          ...prev,
          shares: (Number(prev.shares) || 0) + 1 + ""
        }));
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
      setLocalPost(prev => ({
        ...prev,
        shares: Math.max(0, (Number(prev.shares) || 0) - 1) + ""
      }));
      window.dispatchEvent(new CustomEvent('repostDeleted', { detail: { originalPostId: localPost.id, repostId: targetRepostId } }));
      apiDeletePost(targetRepostId).catch((err) => {
        console.error("Background delete failed:", err);
      });
      toast.success("Repost removed successfully");
    }
  };

  useEffect(() => {
    const handlePostCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newPost = customEvent.detail;
      if (newPost && newPost.shared_post?.id?.toString() === localPost.id.toString()) {
        setIsReposted(true);
        setRepostId(newPost.id.toString());
        const updatedShares = (Number(localPost.shares) || 0) + 1 + "";
        setLocalPost(prev => {
          const updated = {
            ...prev,
            isReposted: true,
            repostId: newPost.id.toString(),
            shares: updatedShares
          };
          onUpdate?.(updated);
          return updated;
        });
      }
    };

    const handleRepostDeleted = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { originalPostId } = customEvent.detail;
      if (originalPostId?.toString() === localPost.id.toString() && isReposted) {
        setIsReposted(false);
        setRepostId(null);
        const updatedShares = Math.max(0, (Number(localPost.shares) || 0) - 1) + "";
        setLocalPost(prev => {
          const updated = {
            ...prev,
            isReposted: false,
            repostId: null,
            shares: updatedShares
          };
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
  }, [localPost.id, isReposted, localPost.shares, onUpdate]);

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

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col items-start py-4 w-[285.33px] h-[504px] bg-card border border-[#EEF2FF] dark:border-card-border-inner shadow-card-inner rounded-[24px] relative flex-shrink-0">
      {/* Header section (Frame 2608569) */}
      <div className="w-full h-[40px] flex items-center justify-between px-4 z-10 mb-4">
        {/* Author Info (Frame 2608571) */}
        <div
          className="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            const authorLink = localPost.isCompanyPost ? `/organization/${localPost.authorSlug}` : `/profile/${localPost.authorSlug || localPost.authorId}`;
            router.push(authorLink);
          }}
        >
          {/* Avatar (Ellipse 10) */}
          <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-xs overflow-hidden flex-shrink-0 font-['Poppins'] select-none">
            {localPost.authorAvatar && localPost.authorAvatar !== '/assets/profilephoto.png' && localPost.authorAvatar !== '/assets/pngegg.png' ? (
              <img
                src={localPost.authorAvatar}
                alt={localPost.author || "User"}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}
            <span>{(localPost.author || 'U').charAt(0).toUpperCase()}</span>
          </div>
          {/* Text Info (Frame 2608568) */}
          <div className="flex flex-col justify-center overflow-hidden min-w-0">
            <span className="text-[16px] leading-[24px] font-normal text-foreground truncate font-[family-name:var(--font-poppins)]">
              {localPost.author || "Anonymous"}
            </span>
            <div className="text-[10px] leading-[16px] text-[#6B7280] font-normal font-[family-name:var(--font-poppins)] truncate block w-full" title={localPost.authorHeadline || localPost.title || ""}>
              {localPost.authorHeadline || localPost.title || ""}
            </div>
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
                "p-1 rounded-full transition-colors outline-none",
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

                {isOwnPost && (
                  <DropdownMenuItem
                    onClick={() => onDelete?.(localPost.id)}
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

      {/* Content Section (Frame 2608605) */}
      <div className="w-full flex flex-col gap-[8px] mb-2 px-4">
        {/* Text Content (Frame 2608573) */}
        {isArticlePost ? (
          null
        ) : isPollPost ? (
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
        <div className="w-full h-[300px] mb-4 relative overflow-hidden">
          <div className="w-full h-full p-3 bg-[#F8FAFF] dark:bg-[#131C2E]/30 border border-[#E3E9FF] dark:border-[#232F45] rounded-[16px] flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-[10px] overflow-hidden flex-shrink-0 font-['Poppins'] select-none">
                {localPost.shared_post.authorAvatar && localPost.shared_post.authorAvatar !== '/assets/pngegg.png' ? (
                  <img src={localPost.shared_post.authorAvatar} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : null}
                <span>{(localPost.shared_post.author || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-[10px] font-medium truncate font-[family-name:var(--font-poppins)] text-foreground">{localPost.shared_post.author}</span>
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
          <Link href={`/post/${localPost.id}`} className="block w-full h-full cursor-pointer">
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

      {/* Liked by Section (Frame 2608573) */}
      {likesCount > 0 && (
        <div className="w-full px-4 mb-4 flex items-center gap-2">
          {localPost.likedUsers && localPost.likedUsers.length > 0 && (() => {
            const viewerUsername = (isCompany ? activeProfile?.slug : ((activeProfile as any)?.account_name || (session?.user as any)?.username))?.toLowerCase();
            const filteredLikedUsers = localPost.likedUsers.filter(u => u.username?.toLowerCase() !== viewerUsername);
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
                    ) : null}
                    <span>{(user.username || 'U').charAt(0).toUpperCase()}</span>
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
                Liked by <span className="font-semibold hover:underline cursor-pointer">@{localPost.sampleLikerUsername || 'someone'}</span>
                {likesCount > 1 && (
                  <> and <span className="font-semibold hover:underline cursor-pointer">{likesCount - 1} {likesCount - 1 === 1 ? 'other' : 'others'}</span></>
                )}
              </>
            )}
          </p>
        </div>
      )}

      {/* Interaction Footer (Frame 2608574) */}
      <div className="w-full h-[40px] px-4 py-2 mt-auto border-t border-transparent">
        {/* Frame 2608620 */}
        <div className="flex items-center justify-between w-full h-[24px]">
          <div className="flex items-center gap-[16px]">
            <button onClick={handleLike} className="flex items-center gap-1 min-w-0 flex-shrink-0">
              <Icon icon={isLiked ? "solar:like-bold" : "solar:like-broken"} className={cn("w-5 h-5", isLiked ? "text-[#6366F1]" : "text-foreground")} />
              <span className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)]">{likesCount}</span>
            </button>
            <Link href={`/post/${localPost.id}?comments=true`} className="flex items-center gap-1 min-w-0 flex-shrink-0">
              <Icon icon="hugeicons:comment-01" className="w-5 h-5 text-foreground" />
              <span className="text-[12px] leading-[16px] text-foreground font-[family-name:var(--font-poppins)]">{localPost.comments || 0}</span>
            </Link>
            <button
              disabled={!!localPost.shared_post}
              onClick={handleRepost}
              className={cn("flex items-center gap-1 min-w-0 flex-shrink-0", !!localPost.shared_post && "opacity-50 cursor-not-allowed")}
            >
              <Icon
                icon="hugeicons:repost"
                className={cn("w-5 h-5", isReposted ? "text-[#6366F1]" : "text-foreground")}
              />
              <span className={cn("text-[12px] leading-[16px] font-[family-name:var(--font-poppins)]", isReposted ? "text-[#6366F1]" : "text-foreground")}>
                {localPost.shares || 0}
              </span>
            </button>
            <button onClick={handleShare} className="flex items-center min-w-0 flex-shrink-0">
              <Icon icon="fluent:share-16-regular" className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <button onClick={handleBookmark} className="flex-shrink-0">
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

export default function ProfilePage() {
  const router = useRouter()
  const { setActiveModal } = useUIStore()
  const { data: session, update: updateSession } = useSession()

  // New TanStack Query Hook
  const { data: profileData, isLoading } = useMyProfile();

  // Profile Score is now embedded in profileData
  const profileScoreData = profileData?.profile_score;

  // Mutation Hooks
  const expMutations = useExperienceMutations();
  const eduMutations = useEducationMutations();
  const skillMutations = useSkillMutations();
  const avatarMutations = useAvatarMutations();
  const updateProfileMutation = useProfileMutation();
  const projMutations = useProjectMutations();

  // Live profile stats (includes company follows in following_count)
  const { data: profileStats } = useQuery({
    queryKey: ['profileStats', profileData?.user?.id],
    queryFn: () => getProfileStats(profileData!.user.id),
    enabled: !!profileData?.user?.id,
    staleTime: Infinity,
    refetchOnMount: false,
  });


  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isExperienceExpanded, setIsExperienceExpanded] = useState(false);
  const [isEducationExpanded, setIsEducationExpanded] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isAddExperienceModalOpen, setIsAddExperienceModalOpen] = useState(false);
  const [isAddEducationModalOpen, setIsAddEducationModalOpen] = useState(false);
  const [isViewAvatarOpen, setIsViewAvatarOpen] = useState(false);
  const [isEditAvatarOpen, setIsEditAvatarOpen] = useState(false);
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [isFollowListModalOpen, setIsFollowListModalOpen] = useState(false);
  const [activeFollowTab, setActiveFollowTab] = useState<"followers" | "following" | "connections">("followers");
  const [isSavingExperience, setIsSavingExperience] = useState(false);

  const [editingExperiences, setEditingExperiences] = useState<Experience[] | null>(null);
  const [editingExperienceSelectedId, setEditingExperienceSelectedId] = useState<string | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);

  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleUpdateProfile = useCallback(async (data: any) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      setIsEditProfileModalOpen(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    }
  }, [updateProfileMutation]);

  const [selectedRole, setSelectedRole] = useState<import("@/types/user").CompanyRole | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleRoleClick = useCallback((role: import("@/types/user").CompanyRole) => {
    setSelectedRole(role);
    setIsRoleModalOpen(true);
  }, []);

  const { togglePostVisibility } = useFeed(false);
  const { isCompany } = useActiveProfile();
  const [previewPosts, setPreviewPosts] = useState<Post[]>([]);

  // Scroll Restoration Logic
  const hasRestoredScroll = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (typeof window !== "undefined" && !(window as any).__cocpit_popstate_registered) {
      (window as any).__cocpit_popstate_registered = true;
      window.addEventListener("popstate", () => {
        sessionStorage.setItem("cocpit_popstate_occurred", "true");
      }, { capture: true });
    }

    if (typeof window !== "undefined" && !(window as any).__cocpit_history_patched) {
      (window as any).__cocpit_history_patched = true;

      const handleRouteScroll = (url: string | URL | null | undefined) => {
        if (!url) return;
        const urlStr = url.toString();
        if (!urlStr.includes("/post/")) return;

        const isComments = urlStr.includes("comments=true");

        // Disconnect any existing observer
        if ((window as any).__cocpit_scroll_observer) {
          try {
            (window as any).__cocpit_scroll_observer.disconnect();
          } catch (e) { }
        }

        let observerTimeout: NodeJS.Timeout;

        const cleanup = () => {
          observer.disconnect();
          clearTimeout(observerTimeout);
          window.removeEventListener("wheel", handleUserInteraction);
          window.removeEventListener("touchmove", handleUserInteraction);
          window.removeEventListener("keydown", handleUserInteraction);
        };

        const handleUserInteraction = () => {
          cleanup();
        };

        const observer = new MutationObserver(() => {
          if (window.location.pathname.includes("/post/")) {
            const hasPostDetails = document.querySelector(".feed-card-shell");
            if (hasPostDetails) {
              if (isComments) {
                window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
              } else {
                window.scrollTo({ top: 0, behavior: "instant" });
                cleanup();
              }
            }
          }
        });

        (window as any).__cocpit_scroll_observer = observer;

        window.addEventListener("wheel", handleUserInteraction, { passive: true });
        window.addEventListener("touchmove", handleUserInteraction, { passive: true });
        window.addEventListener("keydown", handleUserInteraction, { passive: true });

        // Run once immediately in case the elements are already rendered
        if (window.location.pathname.includes("/post/")) {
          const hasPostDetails = document.querySelector(".feed-card-shell");
          if (hasPostDetails) {
            if (isComments) {
              window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
            } else {
              window.scrollTo({ top: 0, behavior: "instant" });
              cleanup();
              return;
            }
          }
        }

        observer.observe(document.body, { childList: true, subtree: true });

        observerTimeout = setTimeout(cleanup, 2500);
      };

      const originalPushState = window.history.pushState;
      window.history.pushState = function (state, unused, url) {
        originalPushState.apply(this, [state, unused, url]);
        try {
          handleRouteScroll(url);
        } catch (e) {
          console.error(e);
        }
      };

      const originalReplaceState = window.history.replaceState;
      window.history.replaceState = function (state, unused, url) {
        originalReplaceState.apply(this, [state, unused, url]);
        try {
          handleRouteScroll(url);
        } catch (e) {
          console.error(e);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (hasRestoredScroll.current) return;

    const historyState = typeof window !== "undefined" ? window.history.state : null;

    const savedPath = historyState?.cocpit_scroll_path || sessionStorage.getItem("cocpit_profile_scroll_path");
    const savedScrollY = historyState?.cocpit_scroll_y !== undefined ? historyState.cocpit_scroll_y.toString() : sessionStorage.getItem("cocpit_profile_scroll_y");
    const savedSource = historyState?.cocpit_scroll_source || sessionStorage.getItem("cocpit_profile_scroll_source");
    const popstateOccurred = (historyState?.cocpit_popstate_occurred ? "true" : "") || sessionStorage.getItem("cocpit_popstate_occurred");

    const isTargetPage = savedPath === window.location.pathname && savedSource === "post" && popstateOccurred === "true" && savedScrollY;

    const clearScrollData = () => {
      sessionStorage.removeItem("cocpit_profile_scroll_path");
      sessionStorage.removeItem("cocpit_profile_scroll_y");
      sessionStorage.removeItem("cocpit_profile_scroll_source");
      sessionStorage.removeItem("cocpit_popstate_occurred");

      if (typeof window !== "undefined") {
        try {
          const currentState = { ...window.history.state };
          delete currentState.cocpit_scroll_y;
          delete currentState.cocpit_scroll_source;
          delete currentState.cocpit_scroll_path;
          delete currentState.cocpit_popstate_occurred;
          window.history.replaceState(currentState, "", window.location.href);
        } catch (e) { }
      }
    };

    if (isTargetPage) {
      const targetScroll = parseInt(savedScrollY, 10);
      if (!isNaN(targetScroll)) {
        // Disconnect any existing observer
        if ((window as any).__cocpit_profile_restore_observer) {
          try {
            (window as any).__cocpit_profile_restore_observer.disconnect();
          } catch (e) { }
        }

        const cleanup = () => {
          observer.disconnect();
          window.removeEventListener("wheel", handleUserInteraction);
          window.removeEventListener("touchmove", handleUserInteraction);
          window.removeEventListener("keydown", handleUserInteraction);
        };

        const handleUserInteraction = () => {
          // If user interacts manually, cancel auto-scrolling
          hasRestoredScroll.current = true;
          clearScrollData();
          cleanup();
        };

        const observer = new MutationObserver(() => {
          window.scrollTo(0, targetScroll);
          const currentScroll = window.scrollY;

          // Once the page height expands enough and scroll succeeds, finish and cleanup
          if (Math.abs(currentScroll - targetScroll) < 5) {
            hasRestoredScroll.current = true;
            clearScrollData();
            cleanup();
          }
        });

        (window as any).__cocpit_profile_restore_observer = observer;

        window.addEventListener("wheel", handleUserInteraction, { passive: true });
        window.addEventListener("touchmove", handleUserInteraction, { passive: true });
        window.addEventListener("keydown", handleUserInteraction, { passive: true });

        // Run once immediately
        window.scrollTo(0, targetScroll);
        if (Math.abs(window.scrollY - targetScroll) < 5) {
          hasRestoredScroll.current = true;
          clearScrollData();
          cleanup();
          return;
        }

        observer.observe(document.body, { childList: true, subtree: true, attributes: true });

        return () => {
          // Clean up on component unmount
          cleanup();
        };
      }
    } else {
      window.scrollTo(0, 0);
      hasRestoredScroll.current = true;
      clearScrollData();
    }
  }, []);
  const [isPostsExpanded, setIsPostsExpanded] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const { logout } = useAuth();

  const experiences = useMemo(() => profileData?.experiences || [], [profileData]);

  // Flat list sorted descending by start_date — used for display, LivingResume, SkillProofPill, and cross-session validation
  const flatExperiences = useMemo(
    () =>
      experiences
        .flatMap((g) => g.experiences)
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()),
    [experiences]
  );
  const educations = useMemo(() => profileData?.educations || [], [profileData]);
  const skills = useMemo(() => profileData?.skills || [], [profileData]);
  const projects = useMemo(() => profileData?.projects || [], [profileData]);

  // Merge company_roles into user object for ProfileHeader
  const user = useMemo(() => profileData?.user ? {
    ...profileData.user,
    company_roles: profileData.company_roles || [],
  } : null, [profileData]);

  // Update cover image when profile loads
  useEffect(() => {
    if (profileData?.user?.cover_image) {
      setCoverImage(profileData.user.cover_image);
    }
  }, [profileData]);

  // Sync stale NextAuth session with fresh profile data
  useEffect(() => {
    if (profileData?.user && session?.user) {
      if (
        (profileData.user.avatar && session.user.image !== profileData.user.avatar) ||
        (profileData.user.name && session.user.name !== profileData.user.name)
      ) {
        updateSession({
          name: profileData.user.name,
          image: profileData.user.avatar,
        });
      }
    }
  }, [profileData?.user?.avatar, profileData?.user?.name, session?.user?.image, session?.user?.name, updateSession]);

  const [postsLoading, setPostsLoading] = useState(true);

  // Keep posts separate for now as it uses different pagination logic
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setPostsLoading(true);
        const response = await getUserPosts({ limit: 4 });
        const mappedPosts = response.posts.map(mapProfilePostToPost);
        // Only show public posts on the profile preview
        const publicOnly = mappedPosts.filter(p => p.visibility !== 'private');
        setPreviewPosts(publicOnly);
      } catch (error) {
        console.error("Failed to fetch profile posts", error);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchPosts();

    const handlePostCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newPost = customEvent.detail;
      // Only show personal posts on personal profile
      if (!newPost.isCompanyPost) {
        setPreviewPosts((prev) => {
          if (prev.some(p => p.id === newPost.id)) return prev;
          return [newPost, ...prev].slice(0, 4);
        });
      }
    };

    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, []);

  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const handleDeletePost = useCallback((id: string) => {
    setPostToDelete(id);
  }, []);

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    const id = postToDelete;
    setIsDeletingPost(true);
    const previousPosts = [...previewPosts];
    try {
      await apiDeletePost(id);
      setPreviewPosts((prev) => prev.filter((post) => post.id !== id));
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error("Failed to delete post", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeletingPost(false);
      setPostToDelete(null);
    }
  };

  const handleToggleVisibility = useCallback((id: string) => {
    setPreviewPosts(prev => prev.filter(post => post.id !== id));
    togglePostVisibility(id);
  }, [togglePostVisibility]);

  const handleUpdatePreviewPost = useCallback((updatedPost: Post) => {
    setPreviewPosts(prev =>
      prev.map(post =>
        post.id === updatedPost.id ? mergeProfilePostState(post, updatedPost) : post
      )
    );
  }, []);

  const handleAvatarUpload = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    await avatarMutations.upload.mutateAsync(formData);
  }, [avatarMutations.upload]);

  const handleAvatarDelete = useCallback(async () => {
    await avatarMutations.remove.mutateAsync();
  }, [avatarMutations.remove]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push("/");
  }, [logout, router]);

  const [isSavingSkills, setIsSavingSkills] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleSaveSkills = useCallback(async (newSkills: string[]) => {
    setIsSavingSkills(true);
    try {
      const normalizedNewSkills = newSkills.map(s => s.trim()).filter(s => s !== "");

      // Deduplicate new skills case-insensitively
      const uniqueNewSkills: string[] = [];
      for (const skill of normalizedNewSkills) {
        if (!uniqueNewSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
          uniqueNewSkills.push(skill);
        }
      }

      if (uniqueNewSkills.length < 3) {
        toast.error("You must have a minimum of 3 skills on your profile.");
        setIsSavingSkills(false);
        return;
      }

      // Use the new bulk sync endpoint
      await skillMutations.sync.mutateAsync({ skills: uniqueNewSkills });

      setIsAddSkillModalOpen(false);
      toast.success("Skills updated successfully");
    } catch (error: any) {
      console.error("Failed to save skills", error);
      toast.error(error.response?.data?.message || "Failed to save skills. Please try again.");
    } finally {
      setIsSavingSkills(false);
    }
  }, [skillMutations.sync]);

  const handleDeleteSkill = useCallback((skillName: string) => {
    const skill = skills.find(s => s.name === skillName);
    if (skill) {
      if (skills.length <= 3) {
        toast.error("You must have a minimum of 3 skills on your profile.");
        return;
      }
      skillMutations.remove.mutate(skill.skill_id);
    }
  }, [skills, skillMutations.remove]);

  const handleSaveExperience = async (roles: SavedRole[], deletedIds: string[] = []) => {
    setIsSavingExperience(true)
    // Maps a stable entity id (experience_id for existing roles, generated tempId for new
    // ones) back to the role's position in `roles` — used to translate backend validation
    // errors (keyed by entityId) back to the correct form card. Declared outside the try
    // block so the catch block below can still read it.
    const idToRoleIndex: Record<string, number> = {}
    try {
      const operations: any[] = []

      // ── Handle Explicit Deletions ─────────────────────
      for (const id of deletedIds) {
        operations.push({ type: 'DELETE', id })
      }

      const updateMap = new Map<string, any>()
      const createOps: any[] = []

      console.log("[Batch Save] Constructing operations for batch update...", { roles, deletedIds });

      roles.forEach((role, index) => {
        // Prepare the base data for the operation
        const data = {
          title: role.title,
          company_name: role.company_name,
          location: role.location,
          work_type: role.work_type,
          work_mode: role.work_mode,
          start_date: role.start_date,
          end_date: role.end_date,
          is_current: role.is_current,
          description: role.description ?? null,
          org_id: role.org_id || null, // Ensure empty string becomes null
        }

        if (role.experience_id) {
          // ── Editing an existing role ─────────────────────
          idToRoleIndex[role.experience_id] = index
          // Only queue an UPDATE if the form actually reports this role as changed —
          // untouched roles are left alone rather than resent as a full overwrite.
          if (role._dirty) {
            const existing = updateMap.get(role.experience_id) || {}
            updateMap.set(role.experience_id, { ...existing, ...data })
          }
        } else {
          // ── Adding a new role ────────────────────────────
          // Generate a tempId for optimistic cache mapping
          const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${index}`
          idToRoleIndex[tempId] = index
          createOps.push({
            type: 'CREATE',
            tempId,
            data
          })
        }

        // ── Handle atomic role termination ───────────────
        // If this role was set to end a previous one, add an extra update operation
        if (role.shouldEndPreviousRole && role.experienceIdToEnd) {
          // Defensive backstop: the form's own validation should already block this,
          // but re-check chronology here in case the role's start date was edited
          // after the "end current role" checkbox was auto-checked.
          const targetExp = flatExperiences.find(e => e.experience_id === role.experienceIdToEnd)
          if (targetExp && new Date(role.start_date) < new Date(targetExp.start_date)) {
            const message = `Cannot end "${targetExp.title}" — its start date is after the new role's start date.`
            toast.error(message)
            throw new Error(message)
          }
          console.log(`[Batch Save] Queuing termination for role ID: ${role.experienceIdToEnd}`);
          const existing = updateMap.get(role.experienceIdToEnd) || {}
          updateMap.set(role.experienceIdToEnd, {
            ...existing,
            is_current: false,
            end_date: role.start_date
          })
        }
      })

      // Finalize operations array from map
      for (const [id, data] of updateMap.entries()) {
        operations.push({ type: 'UPDATE', id, data })
      }
      operations.push(...createOps)

      if (operations.length === 0) {
        // Nothing actually changed — avoid an unnecessary round trip / version bump.
        setIsAddExperienceModalOpen(false)
        setEditingExperiences(null)
        setEditingExperienceSelectedId(null)
        return
      }

      console.log("[Batch Save] Executing batch update with operations:", operations);

      // Execute the unified atomic batch update
      const result = await expMutations.batchUpdate.mutateAsync({
        operations,
        version: profileData?.user?.version ?? 0
      })

      console.log("[Batch Save] Batch update successful:", result);

      setIsAddExperienceModalOpen(false)
      setEditingExperiences(null)
      setEditingExperienceSelectedId(null)
      // Success toast is handled by the useExperienceMutations.batchUpdate hook
    } catch (err: any) {
      // Error toast is handled by the useExperienceMutations.batchUpdate hook
      console.error("Failed to save experience batch:", err)

      // Translate backend entityId-keyed validation errors into role-index-keyed ones —
      // this is the one place that knows how `roles` positions map to the ids/tempIds just
      // generated above, so AddExperienceForm doesn't need to (and can't reliably) re-derive it.
      if (err.response?.status === 422 && Array.isArray(err.response?.data?.errors)) {
        const roleFieldErrors: Record<number, Record<string, string>> = {}
        const globalMessages: string[] = []
        for (const e of err.response.data.errors) {
          const roleIndex = e.entityId !== undefined ? idToRoleIndex[e.entityId] : undefined
          const field = e.path?.endsWith('.end_date') ? 'endDate' : 'startDate'
          if (roleIndex !== undefined) {
            roleFieldErrors[roleIndex] = { ...(roleFieldErrors[roleIndex] || {}), [field]: e.message }
          } else {
            globalMessages.push(e.message)
          }
        }
        err.roleFieldErrors = roleFieldErrors
        err.globalMessages = globalMessages
      }

      throw err
    } finally {
      setIsSavingExperience(false)
    }
  }

  const handleDeleteExperience = async (idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];

    if (ids.length === 0) return;

    if (ids.length === 1) {
      await expMutations.remove.mutateAsync(ids[0]);
    } else {
      await expMutations.batchUpdate.mutateAsync({
        requestId: crypto.randomUUID(),
        operations: ids.map(id => ({ type: 'DELETE', id })),
        version: profileData?.user?.version ?? 0
      });
    }
    setIsAddExperienceModalOpen(false);
    setEditingExperiences(null);
    setEditingExperienceSelectedId(null);
  }

  const handleSaveEducation = async (data: Partial<Education>) => {
    if (editingEducation) {
      await eduMutations.update.mutateAsync({
        id: editingEducation.education_id,
        payload: {
          school_name: data.school_name,
          degree: data.degree,
          field_of_study: data.field_of_study,
          start_date: data.start_date,
          end_date: data.end_date,
          description: data.description,
          location: data.location,
        }
      });
    } else {
      const payload: any = {
        school_name: data.school_name!,
        degree: data.degree!,
        field_of_study: data.field_of_study!,
        start_date: data.start_date!,
        description: data.description!,
        location: data.location,
      };
      if (data.end_date) payload.end_date = data.end_date;
      await eduMutations.add.mutateAsync(payload);
    }
    setIsAddEducationModalOpen(false);
    setEditingEducation(null);
  };

  const handleDeleteEducation = async (id: string) => {
    await eduMutations.remove.mutateAsync(id);
    setIsAddEducationModalOpen(false);
    setEditingEducation(null);
  }

  const handleSaveProject = async (data: Project) => {
    try {
      if (editingProject) {
        await projMutations.update.mutateAsync({ id: editingProject.project_id, payload: data });
        toast.success("Project updated successfully");
      } else {
        await projMutations.add.mutateAsync(data);
        toast.success("Project added successfully");
      }
      setIsAddProjectModalOpen(false);
      setEditingProject(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save project");
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await projMutations.remove.mutateAsync(id);
      toast.success("Project removed successfully");
      setIsAddProjectModalOpen(false);
      setEditingProject(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete project");
    }
  };

  const profileIdentity: ProfileIdentity = {
    openTo: (user?.open_to as any) || "Full-time",
    availability: (user?.availability as any) || "Immediately",
    workPreference: (user?.work_preference as any) || "Hybrid",
  };

  const latestEducation = user?.latest_education || educations[0] || null;
  const latestExperience = flatExperiences[0] || null;

  const scrollToEducation = () => {
    document.getElementById("education-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToExperience = () => {
    document.getElementById("experience-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToProjects = () => {
    document.getElementById("projects-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const openFollowList = (tab: "followers" | "following" | "connections") => {
    setActiveFollowTab(tab);
    setIsFollowListModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-card">
      <div className="w-full md:max-w-[998px] mx-auto pt-0 md:pt-8 pb-[100px] md:pb-12 px-0 md:px-4 xl:px-0">
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div id="profile-card" className="overflow-hidden relative bg-card md:rounded-[24px] rounded-none border-none outline-none pb-8 md:pb-0">

            <ProfileHeader
              user={user}
              isOwnProfile={true}
              coverImage={coverImage}
              setCoverImage={setCoverImage}
              profileStats={profileStats}
              latestExperience={latestExperience}
              latestEducation={latestEducation}
              onAvatarClick={() => isMobile ? setIsEditAvatarOpen(true) : setIsViewAvatarOpen(true)}
              onEditAvatarClick={() => setIsEditAvatarOpen(true)}
              onContactInfoClick={() => setIsContactInfoModalOpen(true)}
              onEditProfileClick={() => setIsEditProfileModalOpen(true)}
              onShareProfileClick={() => setIsShareModalOpen(true)}
              onFollowListClick={openFollowList}
              onLogout={handleLogout}
              onRoleClick={handleRoleClick}
              scrollToExperience={scrollToExperience}
              scrollToEducation={scrollToEducation}
            />

            {/* Profile Score Card — only shown on own profile when score < 100% */}
            {profileScoreData && (
              <ProfileScoreCard
                score={profileScoreData.score}
                breakdown={profileScoreData.breakdown}
                hasExperience={(profileData?.experiences?.length ?? 0) > 0}
                hasEducation={(profileData?.educations?.length ?? 0) > 0}
                hasProjects={(profileData?.projects?.length ?? 0) > 0}
                hasAvatar={!!profileData?.user?.avatar}
                hasCoverImage={!!profileData?.user?.cover_image}
                onActionClick={(action) => {
                  switch (action) {
                    case 'edit-profile':
                      setIsEditProfileModalOpen(true);
                      break;
                    case 'add-skills':
                      setIsAddSkillModalOpen(true);
                      break;
                    case 'add-experience':
                      if (experiences.length > 0) {
                        // User already has experience — open edit modal for the first (most recent) entry
                        // so they can fill in the missing field (e.g. description)
                        setEditingExperiences(experiences[0].experiences);
                        setEditingExperienceSelectedId(experiences[0].experiences[0]?.experience_id || null);
                      } else {
                        // No experience yet — open blank Add modal
                        setEditingExperiences(null);
                        setEditingExperienceSelectedId(null);
                      }
                      setIsAddExperienceModalOpen(true);
                      break;
                    case 'add-project':
                      if (projects.length > 0) {
                        // User already has a project — open edit modal on the first (most recent) one
                        setEditingProject(projects[0]);
                      } else {
                        setEditingProject(null);
                      }
                      setIsAddProjectModalOpen(true);
                      break;
                    case 'add-education':
                      if (educations.length > 0) {
                        // User already has education — open edit modal for the first entry
                        setEditingEducation(educations[0]);
                      } else {
                        setEditingEducation(null);
                      }
                      setIsAddEducationModalOpen(true);
                      break;
                    case 'add-avatar':
                      setIsEditAvatarOpen(true);
                      break;
                    case 'add-cover':
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      break;
                  }
                }}
              />
            )}

            <ProfileAbout
              aboutText={user?.about}
              isOwnProfile={true}
            />

            <LivingResume
              experiences={flatExperiences}
              skills={skills.map(s => s.name)}
              resumeName={profileData?.resume?.originalName}
              resumeUrl={profileData?.resume?.url}
              isOwnProfile={true}
            />

            <ProfilePosts
              posts={previewPosts}
              isOwnProfile={true}
              isCompany={isCompany}
              profileSlug={user?.account_name || user?.id || ""}
              userName={user?.name || ""}
              onDeletePost={handleDeletePost}
              onToggleVisibility={handleToggleVisibility}
              onUpdatePost={handleUpdatePreviewPost}
              onCreateClick={() => setActiveModal('create-post')}
              isLoading={postsLoading}
            />

            <ProfileSkills
              skills={skills}
              experiences={flatExperiences}
              posts={previewPosts}
              isOwnProfile={true}
              onAddSkillClick={() => setIsAddSkillModalOpen(true)}
              onDeleteSkill={handleDeleteSkill}
            />

            <ProfileExperience
              experiences={experiences}
              isOwnProfile={true}
              onAddExperienceClick={() => { 
                setEditingExperiences(null); 
                setEditingExperienceSelectedId(null);
                setIsAddExperienceModalOpen(true); 
              }}
              onEditExperienceClick={(exps, selectedExp) => {
                setEditingExperiences(exps);
                setEditingExperienceSelectedId(selectedExp?.experience_id || null);
                setIsAddExperienceModalOpen(true);
              }}
            />

            <ProfileEducation
              educations={educations}
              isOwnProfile={true}
              onAddEducationClick={() => { setEditingEducation(null); setIsAddEducationModalOpen(true); }}
              onEditEducationClick={(edu) => {
                setEditingEducation(edu);
                setIsAddEducationModalOpen(true);
              }}
            />

            <ProfileProjects
              projects={projects}
              isOwnProfile={true}
              onAddProjectClick={() => {
                setEditingProject(null);
                setIsAddProjectModalOpen(true);
              }}
              onEditProjectClick={(proj) => {
                setEditingProject(proj);
                setIsAddProjectModalOpen(true);
              }}
              onMediaClick={(mediaItem) => {
                let url = mediaItem.fileUrl || mediaItem.url;
                if (url) {
                  if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                  }
                  window.open(url, "_blank");
                }
              }}
            />

          </div>
        )}
      </div>

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        user={user}
        onSave={handleUpdateProfile}
      />

      <SkillModal
        isOpen={isAddSkillModalOpen}
        onClose={() => setIsAddSkillModalOpen(false)}
        initialSkills={skills?.map(s => s.name) || []}
        onSave={handleSaveSkills}
        loading={isSavingSkills}
      />

      <Dialog open={isAddExperienceModalOpen} onOpenChange={setIsAddExperienceModalOpen}>
        <DialogContent className="p-0 shadow-none max-w-none sm:max-w-[800px] h-[100dvh] sm:h-auto w-full sm:rounded-[24px] outline-none data-[state=open]:duration-300 data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0 [&>button]:hidden">
          <DialogTitle className="sr-only">Add Experience</DialogTitle>
          <DialogDescription className="sr-only">Fill in the details to add or edit experience records on your profile.</DialogDescription>
          <AddExperienceForm
            onSave={handleSaveExperience}
            onCancel={() => {
              setIsAddExperienceModalOpen(false);
              setEditingExperiences(null);
              setEditingExperienceSelectedId(null);
            }}
            initialExperiences={editingExperiences || undefined}
            initialActiveRoleId={editingExperienceSelectedId}
            onDelete={(ids) => {
              handleDeleteExperience(ids);
            }}
            companyName={editingExperiences?.[0]?.company_name}
            isSaving={isSavingExperience}
            existingExperiences={flatExperiences}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddEducationModalOpen} onOpenChange={setIsAddEducationModalOpen}>
        <DialogContent className="p-0 shadow-none max-w-none sm:max-w-[800px] h-[100dvh] sm:h-auto w-full sm:rounded-[24px] outline-none data-[state=open]:duration-300 data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0 [&>button]:hidden">
          <DialogTitle className="sr-only">Add Education</DialogTitle>
          <DialogDescription className="sr-only">Fill in the details to add a new education record to your profile.</DialogDescription>
          <AddEducationForm
            onSave={handleSaveEducation}
            onCancel={() => setIsAddEducationModalOpen(false)}
            initialData={editingEducation}
            existingEducations={educations}
            onDelete={() => editingEducation && handleDeleteEducation(editingEducation.education_id)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddProjectModalOpen} onOpenChange={setIsAddProjectModalOpen}>
        <DialogContent className="p-0 shadow-none max-w-none sm:max-w-[800px] h-[100dvh] sm:h-auto sm:max-h-[88vh] flex flex-col overflow-hidden w-full sm:rounded-[24px] outline-none data-[state=open]:duration-300 data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0 [&>button]:hidden">
          <DialogTitle className="sr-only">Add Project</DialogTitle>
          <DialogDescription className="sr-only">Fill in the details to add a new project record to your profile.</DialogDescription>
          <AddProjectForm
            onSave={handleSaveProject}
            onCancel={() => setIsAddProjectModalOpen(false)}
            initialData={editingProject}
            onDelete={(id) => handleDeleteProject(id)}
          />
        </DialogContent>
      </Dialog>

      <ViewAvatarModal
        isOpen={isViewAvatarOpen}
        onClose={() => setIsViewAvatarOpen(false)}
        avatarUrl={user?.avatar || null}
      />

      <EditAvatarModal
        isOpen={isEditAvatarOpen}
        onClose={() => setIsEditAvatarOpen(false)}
        currentAvatarUrl={user?.avatar || null}
        onUpload={handleAvatarUpload}
        onDelete={handleAvatarDelete}
        portalContainerId="profile-card"
      />

      <FollowListModal
        isOpen={isFollowListModalOpen}
        onClose={() => setIsFollowListModalOpen(false)}
        initialTab={activeFollowTab}
        userId={user?.id || ""}
      />

      <ContactInfoModal
        isOpen={isContactInfoModalOpen}
        onClose={() => setIsContactInfoModalOpen(false)}
        user={user}
        isOwnProfile={true}
      />

      <CompanyRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        role={selectedRole}
        isOwnProfile={true}
      />

      <CocpitShareModel
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        profileId={user?.id}
        onShare={(selectedIds) => {
          console.log("Shared profile with:", selectedIds);
          setIsShareModalOpen(false);
        }}
      />

      <DeleteConfirmationModal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={confirmDeletePost}
        isDeleting={isDeletingPost}
      />
    </div>
  )
}
