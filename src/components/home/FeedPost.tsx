"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, EyeOff, Trash2, Edit2, Eye } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { Post, Comment as CommentType } from '@/types/entities'
import CommentSection from './CommentSection'
import MobileCommentDrawer from './MobileCommentDrawer'
import { SharePostModal } from './SharePostModal'
import { PollCard } from './PollCard'
import { CreatePostModal } from './CreatePostModal'
import { updatePost, toggleLike } from '@/services/api/posts' // Import toggleLike
import { useFeed } from '@/context/FeedContext'

interface FeedPostProps extends Omit<Post, 'commentData'> {
  initialComments?: CommentType[]
  isDark?: boolean // Optional for compatibility
  onLike?: () => void
  onShare?: () => void
  isOwnPost?: boolean
  onDelete?: (id: string) => void
  onToggleVisibility?: (id: string) => void
  isLiked?: boolean; // Add isLiked to props
}

export default function FeedPost({
  id,
  author,
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
  isLiked: initialIsLiked = false // Default
}: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(typeof likes === 'string' ? parseInt(likes) : likes)
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [postComments, setPostComments] = useState<CommentType[]>(initialComments)
  const [showOptions, setShowOptions] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { updatePostInFeed } = useFeed();

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

  const commentsCount = postComments.length > 0 ? postComments.length : initialCommentsCount;

  return (
    <div id={`post-${id}`} className="bg-card border-border md:rounded-xl border overflow-hidden">
      <div className="p-4 md:p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex-shrink-0">
              <img src={avatarSrc} alt={author} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-foreground mb-0.5 text-sm md:text-base font-semibold">{author}</h3>
              {title && <p className="text-xs md:text-sm mb-1 text-muted-foreground">{title}</p>}
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{timeAgo} ago</p>
                {visibility === 'private' && <EyeOff className="w-3 h-3 text-muted-foreground" />}
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
                      <>
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
                        <button
                          onClick={handleToggleVisibility}
                          className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                        >
                          {visibility === 'private' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          <span>{visibility === 'private' ? 'Make Public' : 'Make Private'}</span>
                        </button>
                      </>
                    )}
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

        <p className="leading-relaxed mb-4 text-sm md:text-base text-foreground">{content}</p>
      </div>

      {(hasMultipleImages || imageSrc || videoSrc) && (
        <div
          className="w-full overflow-hidden bg-black/5 relative group flex justify-center items-center bg-black"
          style={aspectRatio && aspectRatio !== 'auto' ? { aspectRatio } : undefined}
          onMouseEnter={triggerBadgeVisibility}
          onTouchStart={triggerBadgeVisibility}
        >
          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              className={`w-full ${aspectRatio && aspectRatio !== 'auto' ? 'h-full' : 'max-h-[650px]'} object-contain`}
            />
          ) : hasMultipleImages ? (
            <div className="overflow-hidden h-full w-full" ref={emblaRef}>
              <div className="flex h-full">
                {validImages.map((src, index) => (
                  <div className="flex-[0_0_100%] min-w-0 relative h-full bg-black flex justify-center items-center" key={index}>
                    <img
                      src={src}
                      alt={`Slide ${index + 1}`}
                      className={`max-w-full max-h-[650px] object-contain`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <img
              src={contentImgSrc}
              alt="Post content"
              className={`max-w-full ${aspectRatio && aspectRatio !== 'auto' ? 'h-full' : 'h-auto max-h-[650px]'} object-contain`}
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
      {poll && (
        <div className="px-4 md:px-6 pb-2">
          <PollCard poll={poll} />
        </div>
      )}

      <div className="px-4 md:px-6 py-3 border-t border-border">
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
            <span>Like</span>
          </button>
          <button
            onClick={handleToggleCommentSection}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors flex-1 justify-center text-xs md:text-sm">
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
            <span>Comment</span>
          </button>
          <button
            onClick={() => {
              if (onShare) onShare()
              setIsShareModalOpen(true)
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors flex-1 justify-center text-xs md:text-sm">
            <Share2 className="w-4 h-4 md:w-5 md:h-5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {isCommentSectionOpen && (
        <CommentSection
          comments={postComments}
          onAddComment={handleAddComment}
        />
      )}

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
    </div>
  )
}
