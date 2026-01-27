"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { PollAnalyticsModal } from './PollAnalyticsModal';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, EyeOff, Trash2, Edit2, Eye, BarChart2, ArrowUpRight } from 'lucide-react'

import useEmblaCarousel from 'embla-carousel-react'
import { Post, Comment as CommentType } from '@/types/entities'
import CommentSection from './CommentSection'
import MobileCommentDrawer from './MobileCommentDrawer'
import { SharePostModal } from './SharePostModal'
import { PollCard } from './PollCard'
import { CreatePostModal } from './CreatePostModal'
import { updatePost, toggleLike, voteInPoll, removeVote } from '@/services/api/posts' // Import toggleLike and voteInPoll
import { useFeed } from '@/context/FeedContext'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

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
}

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
  shared_post
}: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(typeof likes === 'string' ? parseInt(likes) : likes)
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [postComments, setPostComments] = useState<CommentType[]>(initialComments)
  const [showOptions, setShowOptions] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  // Poll State
  const [pollData, setPollData] = useState(poll);
  const [isVoting, setIsVoting] = useState(false);

  const { updatePostInFeed } = useFeed();
  const { data: session } = useSession();
  const isMe = session?.user?.id === authorId || isOwnPost; // Fallback to isOwnPost if needed

  // Carousel State
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showBadge, setShowBadge] = useState(false)
  const badgeTimeoutRef = useRef<NodeJS.Timeout | null>(null)



  // Helper to filter out invalid blob URLs from persisted posts
  const isValidUrl = (url: string | undefined | null) => {
    if (!url) return false;
    if (id === 'preview-id') return true; // Allow blob URLs in preview mode
    return !url.startsWith('blob:');
  };

  const validImages = images?.filter(isValidUrl) || [];
  const validImageSrc = isValidUrl(imageSrc) ? imageSrc : undefined;

  const contentImgSrc = validImageSrc || (validImages.length > 0 ? validImages[0] : null) || '/assets/pngegg.png'
  const avatarSrc = authorAvatar || '/assets/pngegg.png'
  const hasMultipleImages = validImages.length > 1

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

  const handleLike = async () => {
    // Optimistic Update
    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    if (onLike) onLike();

    try {
      const result = await toggleLike(id);
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

  const handleAddComment = (commentText: string) => {
    const newComment: CommentType = {
      id: Date.now(),
      author: {
        name: 'Current User', // This would come from auth context
        avatar: '/assets/pngegg.png',
      },
      text: commentText,
      timeAgo: 'Just now',
      likes: 0,
    };
    setPostComments([newComment, ...postComments]);
  };

  const handleToggleVisibility = async () => {
    const newVisibility = visibility === 'public' ? 'private' : 'public';

    // Optimistic update
    updatePostInFeed(id, { visibility: newVisibility });
    if (onToggleVisibility) onToggleVisibility(id); // For local state in ProfilePage if used

    try {
      await updatePost(id, { visibility: newVisibility });
    } catch (e) {
      console.error("Failed to toggle visibility", e);
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
      if (pollData.user_vote === optionId) {
        await removeVote(id);
      } else {
        await voteInPoll(id, optionId);
      }
    } catch (error) {
      console.error("Vote failed", error);
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
      if (sharedPollData.user_vote === optionId) {
        await removeVote(shared_post.id);
      } else {
        await voteInPoll(shared_post.id, optionId);
      }
    } catch (error) {
      console.error("Shared vote failed", error);
      setSharedPollData(previousPollData);
    } finally {
      setIsSharedVoting(false);
    }
  };

  const commentsCount = postComments.length > 0 ? postComments.length : initialCommentsCount;

  return (
    <div id={`post-${id}`} className="bg-card border-border md:rounded-xl border overflow-hidden flex flex-col h-full">
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-3">
            {isMe ? (
              <div className="block flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden cursor-default">
                  <img src={avatarSrc} alt={author} className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <Link href={`/profile/${authorId}`} className="block flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  <img src={avatarSrc} alt={author} className="w-full h-full object-cover" />
                </div>
              </Link>
            )}
            <div>
              {isMe ? (
                <h3 className="text-foreground mb-0.5 text-sm md:text-base font-semibold cursor-default">{author}</h3>
              ) : (
                <Link href={`/profile/${authorId}`} className="hover:underline block">
                  <h3 className="text-foreground mb-0.5 text-sm md:text-base font-semibold">{author}</h3>
                </Link>
              )}
              <div className="flex flex-col gap-0.5">
                {title && (
                  <p className="text-xs md:text-sm leading-tight text-muted-foreground">
                    {title}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-xs leading-tight text-muted-foreground">
                    {timeAgo} ago
                  </p>
                  {visibility === 'private' && (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </div>
          {isOwnPost && (
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="text-muted-foreground hover:text-foreground transition-colors p-2"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showOptions && (
                <>
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowOptions(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                    {!poll && (
                      <button
                        onClick={() => {
                          setIsEditModalOpen(true);
                          setShowOptions(false);
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
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
                        className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                      >
                        <BarChart2 className="w-4 h-4" />
                        <span>View Poll Analytics</span>
                      </button>
                    )}

                    <button
                      onClick={handleToggleVisibility}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                    >
                      {visibility === 'private' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      <span>{visibility === 'private' ? 'Make Public' : 'Make Private'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onDelete?.(id)
                        setShowOptions(false)
                      }}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      <div className="flex-1 flex flex-col justify-center w-full">
        {content && <p className="px-4 md:px-6 leading-relaxed mb-4 text-sm md:text-base text-foreground">{content}</p>}

        {(hasMultipleImages || imageSrc || videoSrc) && (
          <div
            className={`w-full overflow-hidden bg-black/5 relative group flex justify-center items-center bg-black ${isProfileView ? 'aspect-square' : ''}`}
            style={!isProfileView && aspectRatio && aspectRatio !== 'auto' ? { aspectRatio } : undefined}
            onMouseEnter={triggerBadgeVisibility}
            onTouchStart={triggerBadgeVisibility}
          >
            {videoSrc ? (
              <video
                src={videoSrc}
                controls
                className={`w-full ${isProfileView ? 'h-full object-cover' : (aspectRatio && aspectRatio !== 'auto' ? 'h-full' : 'max-h-[650px]')} ${!isProfileView ? 'object-contain' : ''}`}
              />
            ) : hasMultipleImages ? (
              <div className="overflow-hidden h-full w-full" ref={emblaRef}>
                <div className="flex h-full">
                  {validImages.map((src, index) => (
                    <div className="flex-[0_0_100%] min-w-0 relative h-full bg-black flex justify-center items-center" key={index}>
                      <img
                        src={src}
                        alt={`Slide ${index + 1}`}
                        className={`${isProfileView ? 'w-full h-full object-cover' : 'max-w-full max-h-[650px] object-contain'}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <img
                src={contentImgSrc}
                alt="Post content"
                className={`w-full ${isProfileView ? 'h-full object-cover' : (aspectRatio && aspectRatio !== 'auto' ? 'h-full' : 'h-auto max-h-[650px]')} ${!isProfileView ? 'object-contain' : ''}`}
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

        {/* Shared Post Section - Premium Glassmorphism UI */}
        {shared_post && (
          <div className="mx-4 md:mx-6 mb-5 relative group/shared">
            {(shared_post as any).isAvailable === false ? (
              <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-1">
                  <span className="text-2xl">🔒</span>
                </div>
                <p className="text-sm font-medium text-foreground">Content Unavailable</p>
                {(shared_post as any).author && (shared_post as any).author !== 'Unknown' && (
                  <Link href={`/profile/${(shared_post as any).authorId}`} className="text-sm text-primary hover:underline mt-1">
                    Post by {(shared_post as any).author}
                  </Link>
                )}
                {/* Specific Reason Message */}
                {(shared_post as any).unavailableReason === 'personal_connection' ? (
                  <div className="flex flex-col items-center mt-2">
                    <p className="text-xs text-muted-foreground">This is a Personal post.</p>
                    <p className="text-xs text-muted-foreground">Connect with the user to view it.</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">This post is Private.</p>
                )}
              </div>
            ) : (
              <Link href={`/post/${shared_post.id}`} className="block">
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-lg dark:hover:shadow-primary/5">

                  {/* Shared Post Header */}
                  <div className="p-4 flex items-center gap-3 border-b border-white/5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden ring-2 ring-white/10">
                      <img src={shared_post.authorAvatar || '/assets/pngegg.png'} alt={shared_post.author} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {shared_post.author}
                        <span className="text-xs font-normal text-muted-foreground">• Reposted</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{shared_post.timeAgo || 'Recently'}</span>
                    </div>

                    {/* Original Post Stats */}
                    <div className="ml-auto flex items-center gap-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{shared_post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{shared_post.comments}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shared Post Content */}
                  <div className="p-4">
                    {shared_post.content && (
                      <p className="text-sm md:text-base text-foreground/90 leading-relaxed mb-3 line-clamp-4">
                        {shared_post.content}
                      </p>
                    )}

                    {/* Shared Post Poll */}
                    {sharedPollData && (
                      <div className="mb-4" onClick={(e) => e.stopPropagation() /* Prevent navigating to post when voting */}>
                        <PollCard
                          poll={sharedPollData}
                          onVote={handleSharedVote}
                          isLoading={isSharedVoting}
                          votedOptionId={sharedPollData.user_vote}
                        />
                      </div>
                    )}

                    {/* Shared Media */}
                    {(shared_post.imageSrc || (shared_post.images && shared_post.images.length > 0)) && (
                      <div className="relative rounded-lg overflow-hidden mt-2 bg-black/5 aspect-video md:aspect-[2/1] group-hover/shared:scale-[1.01] transition-transform duration-500 ease-out">
                        <img
                          src={shared_post.imageSrc || shared_post.images![0]}
                          alt="Shared visual"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Multiple Images Indicator */}
                        {shared_post.images && shared_post.images.length > 1 && (
                          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                            +{shared_post.images.length - 1} photos
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hover Overlay "View Original" (Desktop) */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/shared:opacity-100 transition-opacity duration-300 pointer-events-none bg-black/5 dark:bg-white/5">
                    <div className="px-4 py-2 bg-background/80 backdrop-blur-md rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold text-foreground border border-white/10 transform translate-y-2 group-hover/shared:translate-y-0 transition-transform duration-300">
                      View Original <ArrowUpRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}

      </div>

      <div className="px-4 md:px-6 py-3 border-t border-border mt-auto">
        <div className="flex items-center justify-between text-xs md:text-sm mb-3 text-muted-foreground">
          <span>{likeCount} likes</span>
          <div className="flex gap-3">
            <span className="cursor-pointer" onClick={handleToggleCommentSection}>{commentsCount} comments</span>
            <span>{shares} shares</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 ${isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'} transition-colors flex-1 justify-center text-xs md:text-sm`}>
            <ThumbsUp className={`w-4 h-4 md:w-5 md:h-5 ${isLiked ? 'fill-current' : ''}`} />

          </button>
          <button
            onClick={handleToggleCommentSection}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors flex-1 justify-center text-xs md:text-sm">
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />

          </button>
          <button
            onClick={() => {
              if (onShare) onShare()
              setIsShareModalOpen(true)
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors flex-1 justify-center text-xs md:text-sm">
            <Share2 className="w-4 h-4 md:w-5 md:h-5" />

          </button>
        </div>
      </div>

      {
        isCommentSectionOpen && (
          <CommentSection
            comments={postComments}
            onAddComment={handleAddComment}
          />
        )
      }

      <MobileCommentDrawer
        open={isMobileDrawerOpen}
        onOpenChange={setIsMobileDrawerOpen}
        comments={postComments}
        onAddComment={handleAddComment}
      />

      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        postId={id.toString()}
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
    </div >
  )
}
