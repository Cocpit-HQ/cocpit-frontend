"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  EyeOff,
  Trash2,
  Edit2,
  Eye,
  BarChart2,
  Link2,
  Bookmark,
  Flag,
  Star,
  Globe,
  Loader2,
  Plus,
  ArrowLeft,
  Grid,
  LayoutGrid,
  Folder,
  Image as ImageIcon,
  Video,
  FileText,
  BarChart3
} from 'lucide-react'
import Image from "next/image"
import dayjs from 'dayjs'
import DOMPurify from 'dompurify'
import relativeTime from 'dayjs/plugin/relativeTime'

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime)

import useEmblaCarousel from 'embla-carousel-react'
import { toast } from 'sonner'
import { Comment as CommentType, Post, PollOption } from '@/types/entities'
import { formatTimeAgo } from '@/lib/timeFormatter'
import { PollCard } from './PollCard'
import { updatePost, toggleLike, voteInPoll, removeVote, addComment, deleteComment, getComments, deletePost } from '@/services/api/posts'
import { SaveButton } from './SaveButton'
import { useFeed } from '@/hooks/use-feed'
import { useFeedUIStore } from '@/store/feed.store'

// Lazy-load heavy modal/drawer components (only loaded when user interacts)
const CommentSection = dynamic(() => import('./CommentSection'), { ssr: false })
const MobileCommentDrawer = dynamic(() => import('./MobileCommentDrawer'), { ssr: false })
const PollAnalyticsModal = dynamic(
  () => import('./PollAnalyticsModal').then(mod => mod.PollAnalyticsModal),
  { ssr: false }
)
const UniversalShareModal = dynamic(
  () => import('../share/UniversalShareModal').then(mod => mod.UniversalShareModal),
  { ssr: false }
)
const CreatePostModal = dynamic(
  () => import('./CreatePostModal').then(mod => mod.CreatePostModal),
  { ssr: false }
)
const SavePostModal = dynamic(
  () => import('@/components/settings/SavePostModal').then(mod => mod.SavePostModal),
  { ssr: false }
)
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { BroadcastBanner } from './BroadcastBanner'
import { ReportModal } from '../shared/ReportModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HashtagTextRenderer } from '@/components/ui/HashtagTextRenderer'

interface FeedPostProps extends Omit<Post, 'commentData'> {
  initialComments?: CommentType[]
  isDark?: boolean // Optional for compatibility
  onLike?: () => void
  onShare?: () => void
  isOwnPost?: boolean
  onDelete?: (id: string) => void
  onToggleVisibility?: (id: string) => void
  isLiked?: boolean; // Add isLiked to props
  isProfileView?: boolean;
  priority?: boolean;
  authorSlug?: string;
  isCompanyPost?: boolean;
  is_saved?: boolean;
  is_commented?: boolean;
  onSaveChange?: (isSaved: boolean) => void;
  isFullContent?: boolean;
  is_broadcast?: boolean;
  broadcastOrgName?: string;
}

import { usePostImpression } from '@/hooks/usePostImpression'

export default function FeedPost({
  id,
  author,
  authorId, // Now available via Post interface
  authorAvatar,
  title,
  timeAgo = '1h',
  content,
  imageSrc,
  images,
  videoSrc,
  aspectRatio,
  likes = 0, // Default to 0 number
  comments: initialCommentsCount = '0',
  shares = '0',
  initialComments = [],
  onLike,
  onShare,
  isOwnPost,
  onDelete,
  onToggleVisibility,
  visibility = 'public',
  poll,
  isLiked: initialIsLiked = false, // Default
  isProfileView = false,
  shared_post,
  priority = false,
  category,
  authorSlug,
  isCompanyPost,
  is_saved,
  is_commented: initialIsCommented = false,
  onSaveChange,
  isFullContent = false,
  is_broadcast = false,
  broadcastOrgName,
}: FeedPostProps) {

  const impressionRef = usePostImpression(id.toString());
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isCommented, setIsCommented] = useState(initialIsCommented)
  const [isSaved, setIsSaved] = useState(is_saved)
  const [likeCount, setLikeCount] = useState(typeof likes === 'string' ? parseInt(likes) : likes)

  const { expandedPosts, setExpandedPost, expandedComments, setExpandedComment, imageAspectRatios, setImageAspectRatio } = useFeedUIStore();
  const isExpanded = expandedPosts[id.toString()] || false;
  const setIsExpanded = (val: boolean) => setExpandedPost(id.toString(), val);

  // Sync state with props
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setIsCommented(initialIsCommented);
    setIsSaved(is_saved);
  }, [initialIsLiked, initialIsCommented, is_saved]);

  useEffect(() => {
    setLikeCount(typeof likes === 'string' ? parseInt(likes) : likes);
  }, [likes]);
  const isCommentSectionOpen = expandedComments[id.toString()] || false;
  const setIsCommentSectionOpen = (val: boolean) => setExpandedComment(id.toString(), val);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)

  const [postComments, setPostComments] = useState<CommentType[]>(initialComments)
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const [showOptions, setShowOptions] = useState(false)
  const [optionsPos, setOptionsPos] = useState<{ top: number; right: number } | null>(null);
  const optionsBtnRef = useRef<HTMLButtonElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Poll State
  const [pollData, setPollData] = useState(poll);
  const [isVoting, setIsVoting] = useState(false);

  const { updatePostInFeed } = useFeed();
  const { data: session } = useSession();
  const { isCompany, activeProfile } = useActiveProfile();
  const isMe = session?.user?.id === authorId || isOwnPost; // Fallback to isOwnPost if needed

  // Carousel State
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showBadge, setShowBadge] = useState(false)
  const badgeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchParams = useSearchParams();

  // Dynamic aspect ratio for images (when backend doesn't provide it)
  const storedRatio = imageAspectRatios[id.toString()];
  const [dynamicAspectRatio, setDynamicAspectRatio] = useState<number | undefined>(
    aspectRatio && aspectRatio !== 'auto' ? parseFloat(aspectRatio.toString()) : storedRatio
  );

  const videoRef = useRef<HTMLVideoElement>(null);

  // Video Autoplay Observer
  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch((error) => {
              // Auto-play might be blocked (e.g., if not muted or user hasn't interacted)
              console.log("Autoplay prevented:", error);
            });
          } else {
            videoRef.current?.pause();
          }
        });
      },
      {
        threshold: 0.6, // Trigger when 60% of the video is visible
      }
    );

    observer.observe(videoRef.current);

    return () => {
      observer.disconnect();
    };
  }, [videoSrc]);

  const snapAspectRatio = (ratio: number) => {
    const targets = [1, 0.8, 16 / 9];
    return targets.reduce((prev, curr) =>
      Math.abs(curr - ratio) < Math.abs(prev - ratio) ? curr : prev
    );
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (!aspectRatio || aspectRatio === 'auto') {
      const img = event.currentTarget;
      const ratio = img.naturalWidth / img.naturalHeight;
      const snapped = snapAspectRatio(ratio);
      setDynamicAspectRatio(snapped);
      setImageAspectRatio(id.toString(), snapped);
    }
  };

  const handleVideoLoad = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!aspectRatio || aspectRatio === 'auto') {
      const video = event.currentTarget;
      const ratio = video.videoWidth / video.videoHeight;
      if (ratio && !isNaN(ratio)) {
        const snapped = snapAspectRatio(ratio);
        setDynamicAspectRatio(snapped);
        setImageAspectRatio(id.toString(), snapped);
      }
    }
  };

  const finalAspectRatio = dynamicAspectRatio ? `${dynamicAspectRatio}/1` : undefined;

  // Constrain vertical videos (taller than 4:5) to avoid taking up too much screen space
  const isVerticalVideo = videoSrc && dynamicAspectRatio && dynamicAspectRatio < 0.8;



  // Helper to filter out invalid blob URLs from persisted posts
  const isValidImageUrl = (url: string | undefined | null) => {
    if (!url) return false;
    // Don't pass video URLs to Next.js Image optimization
    const isVideo = url.toLowerCase().match(/\.(mp4|webm|mov)(\?|#|$)/);
    if (isVideo) return false;

    // Allow everything else (blob URLs or real URLs) to render as images
    return true;
  };

  const validImages = images?.filter(isValidImageUrl) || [];
  const validImageSrc = isValidImageUrl(imageSrc) ? imageSrc : undefined;

  const contentImgSrc = validImageSrc || (validImages.length > 0 ? validImages[0] : null) || '/assets/pngegg.png'
  const avatarSrc = authorAvatar || '/assets/pngegg.png'
  const hasMultipleImages = validImages.length > 1

  const isTextOnlyPost = !validImageSrc && validImages.length === 0 && !videoSrc && !pollData && !shared_post;

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCurrentSlide(emblaApi.selectedScrollSnap())
    triggerBadgeVisibility()
  }, [emblaApi])

  const triggerBadgeVisibility = useCallback(() => {
    setShowBadge(true)
    if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current)
    badgeTimeoutRef.current = setTimeout(() => {
      setShowBadge(false)
    }, 2000)
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    emblaApi.on('scroll', triggerBadgeVisibility)
    return () => {
      if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current)
    }
  }, [emblaApi, onSelect, triggerBadgeVisibility])

  // --- COMMENT LOGIC ---
  const fetchPostComments = useCallback(async () => {
    // Always fetch to get latest like states - removed commentsLoaded check
    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      const data = await getComments(id, companyId);
      // Map properties to match CommentType
      // Backend: comment_id, content, created_at, author_id, full_name, avatar_url, headline, like_count, is_liked
      // Frontend: id, text, timeAgo, likes, author { name, avatar }, authorId
      const mappedComments: CommentType[] = data.map((c: any) => ({
        id: c.comment_id,
        text: c.content,
        timeAgo: formatTimeAgo(c.created_at),
        created_at: c.created_at, // Added for sorting
        like_count: c.like_count || 0, // From backend
        is_liked: c.is_liked || false, // From backend
        is_pinned: c.is_pinned || false, // From backend
        pinned_at: c.pinned_at || null, // From backend
        pinned_by: c.pinned_by || null, // From backend
        authorId: c.author_id,
        parent_id: c.parent_id || null, // Added for reply threading
        author: {
          name: c.full_name || 'User',
          avatar: c.avatar_url || '/assets/pngegg.png',
          account_name: c.account_name,
          authorSlug: c.author_slug,
          isCompanyPost: c.is_company_post
        }
      }));
      setPostComments(mappedComments);
      setCommentsLoaded(true);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  }, [id]); // Removed commentsLoaded from dependencies

  useEffect(() => {
    if (isCommentSectionOpen || isMobileDrawerOpen) {
      fetchPostComments();
    }
  }, [isCommentSectionOpen, isMobileDrawerOpen, fetchPostComments]);

  // Restore comment section/drawer state from URL back navigation
  useEffect(() => {
    const openPostId = searchParams.get('openPost');
    if (openPostId === id.toString()) {
      setIsCommentSectionOpen(true);
      setIsMobileDrawerOpen(true);
      // fetchPostComments is already triggered by the effect above
    }
  }, [searchParams, id]);


  const handleLike = async () => {
    // Optimistic Update
    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    if (onLike) onLike();

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      const result = await toggleLike(id, companyId);
      // Sync with server response to be sure
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      // Revert
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  }

  const handleToggleCommentSection = () => {
    // Check if device is mobile (width < 768px matches tailwind 'md')
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    if (isMobile) {
      setIsMobileDrawerOpen(true)
    } else {
      setIsCommentSectionOpen(!isCommentSectionOpen)
    }
  }

  const handleAddComment = async (commentText: string, replyToId?: string | number) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to comment");
      return;
    }

    const tempId = Date.now();

    // Optimistically promote parent_id if replying to a reply
    const optimisticParentId = replyToId
      ? (postComments.find(c => c.id === replyToId)?.parent_id || replyToId)
      : null;

    const tempComment: CommentType = {
      id: tempId,
      authorId: isCompany ? (activeProfile?.id || '') : session.user.id.toString(),
      author: {
        name: isCompany ? (activeProfile?.name || 'Company') : (session.user.name || 'You'),
        avatar: isCompany ? (activeProfile?.avatar_url || '/assets/pngegg.png') : (session.user.image || '/assets/pngegg.png'),
      },
      text: commentText,
      timeAgo: 'Just now',
      created_at: new Date().toISOString(),
      like_count: 0,
      is_liked: false,
      parent_id: optimisticParentId
    };

    // Optimistic update
    setPostComments([tempComment, ...postComments]);
    setIsCommented(true);

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      const response = await addComment(id, commentText, replyToId, companyId);
      const newComment = response.comment;

      // Update with real data, including the promoted parent_id
      setPostComments(prev => prev.map(c =>
        c.id === tempId ? {
          ...c,
          id: newComment.comment_id,
          parent_id: newComment.parent_id,
          timeAgo: 'Just now'
        } : c
      ));

    } catch (err) {
      console.error("Failed to post comment", err);
      toast.error("Failed to post comment");
      // Revert
      setPostComments(prev => prev.filter(c => c.id !== tempId));
    }
  };

  const handleDeleteComment = async (commentId: string | number) => {
    // Optimistic delete
    const previousComments = [...postComments];
    setPostComments(prev => prev.filter(c => c.id !== commentId));

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      await deleteComment(commentId.toString(), companyId);
      toast.success("Comment deleted");
    } catch (err) {
      console.error("Failed to delete comment", err);
      toast.error("Failed to delete comment");
      // Revert
      setPostComments(previousComments);
    }
  }

  const handleToggleVisibility = async () => {
    const newVisibility = visibility === 'public' ? 'private' : 'public';

    // Optimistic update
    updatePostInFeed(id, { visibility: newVisibility });
    if (onToggleVisibility) onToggleVisibility(id); // For local state in ProfilePage if used

    try {
      await updatePost(id, { visibility: newVisibility });
      toast.info(`Post is now ${newVisibility}`);
    } catch (e) {
      console.error("Failed to toggle visibility", e);
      toast.error("Failed to update visibility");
      // Revert
      updatePostInFeed(id, { visibility: visibility });
    }
    setShowOptions(false);
  }

  const handleVote = async (optionId: string) => {
    if (!pollData || isVoting) return;

    setIsVoting(true);
    const previousPollData = { ...pollData };

    // Optimistic update
    setPollData(prev => {
      if (!prev) return null;

      const previousVoteId = prev.user_vote;

      // Toggle Logic: If clicking same option, remove vote
      const isRemoving = previousVoteId === optionId;
      const isSwitching = !!previousVoteId && !isRemoving;

      return {
        ...prev,
        // If removing, decrement. If switching, same. If new, increment.
        total_votes: isRemoving ? prev.total_votes - 1 : (isSwitching ? prev.total_votes : prev.total_votes + 1),
        options: prev.options.map(opt => {
          // Increment new option (only if not removing)
          if (opt.option_id === optionId && !isRemoving) {
            return { ...opt, vote_count: opt.vote_count + 1 };
          }
          // Decrement old option (if switching OR removing)
          if (opt.option_id === previousVoteId) {
            return { ...opt, vote_count: Math.max(0, opt.vote_count - 1) };
          }
          return opt;
        }),
        user_vote: isRemoving ? null : optionId
      };
    });

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      if (pollData.user_vote === optionId) {
        await removeVote(id, companyId);
      } else {
        await voteInPoll(id, optionId, companyId);
      }
    } catch (error) {
      console.error("Vote failed", error);
      toast.error("Failed to record vote");
      setPollData(previousPollData); // Revert
    } finally {
      setIsVoting(false);
    }
  };

  // Shared Poll State
  const [sharedPollData, setSharedPollData] = useState(shared_post?.poll);
  const [isSharedVoting, setIsSharedVoting] = useState(false);

  // Sync shared poll state
  useEffect(() => {
    setSharedPollData(shared_post?.poll);
  }, [shared_post?.poll]);

  const handleSharedVote = async (optionId: string) => {
    if (!sharedPollData || isSharedVoting || !shared_post) return;

    setIsSharedVoting(true);
    const previousPollData = { ...sharedPollData };

    // Optimistic update
    setSharedPollData(prev => {
      if (!prev) return null;

      const previousVoteId = prev.user_vote;
      const isRemoving = previousVoteId === optionId;
      const isSwitching = !!previousVoteId && !isRemoving;

      return {
        ...prev,
        total_votes: isRemoving ? prev.total_votes - 1 : (isSwitching ? prev.total_votes : prev.total_votes + 1),
        options: prev.options.map(opt => {
          if (opt.option_id === optionId && !isRemoving) {
            return { ...opt, vote_count: opt.vote_count + 1 };
          }
          if (opt.option_id === previousVoteId) {
            return { ...opt, vote_count: Math.max(0, opt.vote_count - 1) };
          }
          return opt;
        }),
        user_vote: isRemoving ? null : optionId
      };
    });

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      if (sharedPollData.user_vote === optionId) {
        await removeVote(shared_post.id, companyId);
      } else {
        await voteInPoll(shared_post.id, optionId, companyId);
      }
    } catch (error) {
      console.error("Shared vote failed", error);
      toast.error("Failed to record vote on shared post");
      setSharedPollData(previousPollData);
    } finally {
      setIsSharedVoting(false);
    }
  };

  const commentsCount = commentsLoaded ? postComments.length : (typeof initialCommentsCount === 'string' ? parseInt(initialCommentsCount) : initialCommentsCount);

  return (
    <div id={`post-${id}`} ref={impressionRef as any} className="bg-card border-border md:rounded-lg md:border overflow-hidden flex flex-col h-full shadow-sm mb-2">
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-2">
          <div className="flex gap-3">
            {isMe || (!isCompanyPost && !authorId) ? (
              <div className="block flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden cursor-default">
                  <img src={avatarSrc} alt={author} className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <Link
                href={isCompanyPost ? `/organization/${authorSlug}` : `/profile/${authorSlug || authorId}`}
                className="block flex-shrink-0"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  <img src={avatarSrc} alt={author} className="w-full h-full object-cover" />
                </div>
              </Link>
            )}
            <div>
              {isMe || (!isCompanyPost && !authorId) ? (
                <h3 className="text-foreground text-sm font-semibold cursor-default leading-tight">{author}</h3>
              ) : (
                <Link
                  href={isCompanyPost ? `/organization/${authorSlug}` : `/profile/${authorSlug || authorId}`}
                  className="hover:underline block"
                >
                  <h3 className="text-foreground text-sm font-semibold leading-tight">{author}</h3>
                </Link>
              )}
              <div className="flex flex-col">
                {title && (
                  <p className="text-[12px] leading-tight text-muted-foreground line-clamp-1">
                    {title}
                  </p>
                )}
                <div className="flex items-center gap-1">
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    {timeAgo} •
                  </p>
                  {visibility === 'private' ? (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <Globe className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <button
                ref={optionsBtnRef}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!showOptions) {
                    const rect = optionsBtnRef.current?.getBoundingClientRect();
                    if (rect) {
                      setOptionsPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                    }
                  }
                  setShowOptions(!showOptions);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showOptions && optionsPos && typeof document !== 'undefined' && createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[199]"
                    onClick={() => setShowOptions(false)}
                  />
                  <div
                    className="fixed w-48 bg-card border border-border rounded-lg shadow-lg z-[200] overflow-hidden"
                    style={{ top: optionsPos.top, right: optionsPos.right }}
                  >
                    {/* Non-Owner Options: Save, Favorite, Copy, About, Report */}
                    {!isOwnPost && (
                      <>


                        <button
                          onClick={() => {
                            console.log("Add to favorites", id);
                            setShowOptions(false);
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                        >
                          <Star className="w-4 h-4" />
                          <span>Add to favorites</span>
                        </button>

                        <button
                          onClick={() => {
                            console.log("Copy link", id);
                            if (typeof window !== 'undefined') {
                              navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
                              toast.success("Link copied!");
                            }
                            setShowOptions(false);
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                        >
                          <Link2 className="w-4 h-4" />
                          <span>Copy link</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsReportModalOpen(true);
                            setShowOptions(false);
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                          <span>Report</span>
                        </button>
                      </>
                    )}

                    {/* Owner Options: Edit, Analytics, Privacy, Delete */}
                    {isOwnPost && (
                      <>
                        {!poll && (
                          <button
                            onClick={() => {
                              setIsEditModalOpen(true);
                              setShowOptions(false);
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit Post</span>
                          </button>
                        )}

                        {poll && (
                          <button
                            onClick={() => {
                              setIsAnalyticsModalOpen(true);
                              setShowOptions(false);
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                          >
                            <BarChart2 className="w-4 h-4" />
                            <span>View Poll Analytics</span>
                          </button>
                        )}

                        <button
                          onClick={handleToggleVisibility}
                          disabled={!!(shared_post && (shared_post as any).isAvailable === false && visibility === 'private')}
                          className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-b border-border ${shared_post && (shared_post as any).isAvailable === false && visibility === 'private'
                            ? 'text-muted-foreground cursor-not-allowed opacity-50'
                            : 'text-foreground hover:bg-muted'
                            }`}
                          title={shared_post && (shared_post as any).isAvailable === false && visibility === 'private' ? "Cannot make public while original post is restricted" : ""}
                        >
                          {visibility === 'private' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          <span>{visibility === 'private' ? 'Make Public' : 'Make Private'}</span>
                        </button>
                        <button
                          onClick={() => {
                            onDelete?.(id)
                            setShowOptions(false)
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </>,
                document.body
              )}
            </div>
          </div >
        </div >
      </div >

      <div className="flex-1 flex flex-col justify-center w-full">
        {/* Broadcast banner — rendered above content for org announcements */}
        {is_broadcast && broadcastOrgName && (
          <BroadcastBanner orgName={broadcastOrgName} />
        )}
        {content && (
          <div className="px-4 mb-3">
            <div>
              <div className={`leading-normal text-sm text-foreground/90 whitespace-pre-wrap ${!isFullContent && !isExpanded ? 'line-clamp-5' : ''}`}>
                <HashtagTextRenderer content={content} />
              </div>
              {!isFullContent && (content.length > 300 || content.split('\n').length > 4) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsExpanded(!isExpanded);
                  }}
                  className="text-xs text-primary hover:text-primary/80 mt-1 font-semibold focus:outline-none transition-colors"
                >
                  {isExpanded ? '...show less' : '...see more'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Shared Post Section - Premium Glassmorphism UI (Prioritized above media) */}
        {shared_post && (
          <div className={`${isProfileView ? 'mx-2 mb-3' : 'mx-4 md:mx-6 mb-5'} relative group/shared`}>
            {(shared_post as any).isAvailable === false ? (
              <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-1 text-2xl">
                  {(shared_post as any).unavailableReason === 'deleted' ? '🗑️' : '🔒'}
                </div>
                <p className="text-sm font-medium text-foreground">
                  {(shared_post as any).unavailableReason === 'deleted' ? 'Post Deleted' : 'Content Unavailable'}
                </p>
                {/* Specific Reason Message */}
                {(shared_post as any).unavailableReason === 'deleted' ? (
                  <p className="text-xs text-muted-foreground mt-2">This post has been deleted by the original author.</p>
                ) : (shared_post as any).unavailableReason === 'personal_connection' ? (
                  <div className="flex flex-col items-center mt-2">
                    <p className="text-xs text-muted-foreground">This is a Personal post.</p>
                    <p className="text-xs text-muted-foreground">Connect with the author to view it.</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">This post is Private or restricted.</p>
                )}

                {(shared_post as any).author && (shared_post as any).author !== 'Unknown' && (
                  <Link href={`/profile/${(shared_post as any).authorSlug || (shared_post as any).authorId}`} className="text-sm text-primary hover:underline mt-2">
                    View {(shared_post as any).author}&apos;s Profile
                  </Link>
                )}
              </div>
            ) : shared_post.isJob ? (
              <Link href={`/jobs/${shared_post.jobId}`} className="block" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-md overflow-hidden transition-all duration-300 hover:bg-primary/10 hover:border-primary/40 hover:shadow-md p-4 flex gap-4 items-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-lg bg-white overflow-hidden flex items-center justify-center border border-border/50 shadow-sm">
                    {shared_post.jobLogo ? (
                      <img src={shared_post.jobLogo} alt={shared_post.jobCompany || "Company logo"} className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">{shared_post.jobCompany?.charAt(0) || "J"}</span>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-foreground truncate">{shared_post.jobTitle}</h4>
                    <p className="text-sm text-foreground/90 truncate font-medium">{shared_post.jobCompany}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {shared_post.jobLocation}
                      {shared_post.jobWorkMode ? ` (${shared_post.jobWorkMode})` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 ml-4 hidden sm:block">
                    <div className="px-4 py-1.5 rounded-full border border-primary text-primary text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm">
                      View job
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <Link href={`/post/${shared_post.id}`} className="block">
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-lg dark:hover:shadow-primary/5">

                  {/* Shared Post Header */}
                  <div className="p-3 flex items-center gap-2 md:gap-3 border-b border-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden ring-2 ring-white/10">
                      <img src={shared_post.authorAvatar || '/assets/pngegg.png'} alt={shared_post.author} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {shared_post.author}
                        <span className="text-[10px] font-normal text-muted-foreground">• Original</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">{shared_post.timeAgo || 'Recently'}</span>
                    </div>

                    {/* Original Post Stats */}
                    <div className="ml-auto flex items-center gap-2">
                      <div className={`flex items-center gap-1 ${shared_post.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}>
                        <ThumbsUp className={`w-3 h-3 ${shared_post.isLiked ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-medium">{shared_post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-500">
                        <MessageCircle className="w-3 h-3" />
                        <span className="text-[10px] font-medium">{shared_post.comments}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    {shared_post.content && (
                      <p className="text-sm text-foreground/90 leading-tight mb-2 line-clamp-4">
                        {shared_post.content}
                      </p>
                    )}

                    {/* Shared Post Poll */}
                    {sharedPollData && (
                      <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                        <PollCard
                          poll={sharedPollData}
                          onVote={handleSharedVote}
                          isLoading={isSharedVoting}
                          votedOptionId={sharedPollData.user_vote}
                        />
                      </div>
                    )}

                    {/* Shared Post Media Preview */}
                    {shared_post.videoSrc ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-white/5 bg-black/20">
                        <video
                          src={shared_post.videoSrc}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/shared:bg-transparent transition-colors">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                          </div>
                        </div>
                      </div>
                    ) : shared_post.imageSrc ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-white/5 bg-black/5">
                        <Image
                          src={shared_post.imageSrc}
                          alt="Shared post content"
                          fill
                          className="object-cover"
                        />
                        {shared_post.images && shared_post.images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm z-10">
                            +{shared_post.images.length - 1} more
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Media content (Now shown after shared post) */}
        {(validImages.length > 0 || !!videoSrc) && (
          <div
            className={`w-full overflow-hidden bg-gray-100 dark:bg-zinc-900 relative group flex flex-col justify-center ${isProfileView ? 'aspect-square' : (isVerticalVideo ? '' : (finalAspectRatio ? '' : 'min-h-[300px] md:min-h-[400px]'))}`}
            style={
              !isProfileView
                ? (isVerticalVideo ? { height: '550px' } : (finalAspectRatio ? { aspectRatio: finalAspectRatio, maxHeight: '700px' } : undefined))
                : undefined
            }
            onMouseEnter={triggerBadgeVisibility}
            onTouchStart={triggerBadgeVisibility}
          >
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                muted // Required for autoplay in most browsers
                playsInline
                preload="metadata"
                onLoadedMetadata={handleVideoLoad}
                className={`w-full h-full bg-black ${isVerticalVideo ? 'object-contain' : 'object-cover'}`}
              />
            ) : hasMultipleImages ? (
              <div className="absolute inset-0 overflow-hidden" ref={emblaRef}>
                <div className="flex h-full">
                  {validImages.map((src, index) => (
                    <div className="flex-[0_0_100%] min-w-0 relative h-full flex justify-center items-center bg-gray-100 dark:bg-zinc-900" key={index}>
                      <Image
                        src={src}
                        alt={`Slide ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={priority && index === 0}
                        sizes="(max-width: 768px) 100vw, 600px"
                        onLoad={(event) => {
                          // Only set ratio based on the first image to prevent jumping during slide
                          if (index === 0) handleImageLoad(event);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Image
                src={contentImgSrc}
                alt="Post content"
                fill
                className="object-cover"
                priority={priority}
                sizes="(max-width: 768px) 100vw, 600px"
                onLoad={handleImageLoad}
              />
            )}
            {/* Slide Counter Badge */}
            {hasMultipleImages && (
              <div
                className={`absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full transition-opacity duration-300 ${showBadge ? 'opacity-100' : 'opacity-0'}`}
              >
                {currentSlide + 1}/{validImages.length}
              </div>
            )}
          </div>
        )}

        {/* Poll Section - Rendered below media */}
        {pollData && (
          <div className="px-4 md:px-6 pb-2">
            <PollCard
              poll={pollData}
              onVote={handleVote}
              isLoading={isVoting}
              votedOptionId={pollData.user_vote}
            />
          </div>
        )}

      </div>

      <div className="px-4 py-1 border-t border-border/40 mt-auto">
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={handleLike}
            className={`flex items-center justify-center gap-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:bg-muted/50'} transition-all duration-200 flex-1 py-1.5 rounded-md`}
          >
            <ThumbsUp className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} />
            {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
          </button>

          <button
            onClick={handleToggleCommentSection}
            className={`flex items-center justify-center gap-2 ${isCommentSectionOpen || isMobileDrawerOpen || isCommented ? 'text-green-500' : 'text-muted-foreground hover:bg-muted/50'} transition-all duration-200 flex-1 py-1.5 rounded-md`}
          >
            <MessageCircle className="w-4 h-4" fill={isCommented ? "currentColor" : "none"} />
            {(typeof commentsCount === 'number' ? commentsCount : parseInt(commentsCount || '0')) > 0 && (
              <span className="text-xs font-medium">{commentsCount}</span>
            )}
          </button>

          <button
            onClick={() => {
              if (onShare) onShare()
              setIsShareModalOpen(true)
            }}
            className="flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition-all duration-200 flex-1 py-1.5 rounded-md"
          >
            <Share2 className="w-4 h-4" />
            {parseInt(shares || '0') > 0 && <span className="text-xs font-medium">{shares}</span>}
          </button>

          <SaveButton
            postId={id.toString()}
            initialIsSaved={isSaved}
            onSaveChange={(val) => setIsSaved(val)}
            onToggle={() => setIsSaveModalOpen(true)}
          />
        </div>
      </div>

      {
        isCommentSectionOpen && (
          <CommentSection
            comments={postComments}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            currentUserId={session?.user?.id?.toString()}
            isPostOwner={isOwnPost}
            postId={id}
          />
        )
      }

      <MobileCommentDrawer
        open={isMobileDrawerOpen}
        onOpenChange={setIsMobileDrawerOpen}
        comments={postComments}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        currentUserId={session?.user?.id?.toString()}
        isPostOwner={isOwnPost}
        postId={id}
      />

      <UniversalShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        entityId={id.toString()}
        entityType="post"
        postCategory={category}
      />

      <CreatePostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editPostId={id}
        onUpdate={(updatedPost) => updatePostInFeed(id, updatedPost)}
      />

      <PollAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        postId={id}
      />

      <SavePostModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        postId={id.toString()}
        onSaved={(newSavedState) => {
          setIsSaved(newSavedState);
          if (onSaveChange) onSaveChange(newSavedState);
        }}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="POST"
        targetId={id}
      />
    </div >
  )
}
