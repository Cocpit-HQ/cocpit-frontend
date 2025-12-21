"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { Post, Comment as CommentType } from '@/types/entities'
import CommentSection from './CommentSection'
import MobileCommentDrawer from './MobileCommentDrawer'

interface FeedPostProps extends Omit<Post, 'id' | 'commentData'> {
  initialComments?: CommentType[]
  isDark?: boolean
  onLike?: () => void
  onShare?: () => void
}

export default function FeedPost({ 
  author, 
  title, 
  timeAgo = '1h', 
  content, 
  imageSrc,
  images,
  videoSrc,
  aspectRatio,
  likes = '0', 
  comments: initialCommentsCount = '0', 
  shares = '0',
  initialComments = [],
  isDark = false,
  onLike,
  onShare
}: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [postComments, setPostComments] = useState<CommentType[]>(initialComments)
  
  // Carousel State
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showBadge, setShowBadge] = useState(false)
  const badgeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const imgSrc = imageSrc || (images && images.length > 0 ? images[0] : null) || '/assets/pngegg.png'
  const hasMultipleImages = images && images.length > 1

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

  const handleLike = () => {
    setIsLiked(!isLiked)
    if (onLike) onLike()
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

  const commentsCount = postComments.length > 0 ? postComments.length : initialCommentsCount;

  return (
    <div className={`${isDark ? 'bg-[#242b3d] border-[#2d3548]' : 'bg-white border-gray-200'} md:rounded-xl border overflow-hidden`}>
      <div className="p-4 md:p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex-shrink-0">
              <img src={imgSrc} alt={author} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} mb-0.5 text-sm md:text-base font-semibold`}>{author}</h3>
              {title && <p className={`text-xs md:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>}
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{timeAgo} ago</p>
            </div>
          </div>
          <button className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <p className={`leading-relaxed mb-4 text-sm md:text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{content}</p>
      </div>

      {(hasMultipleImages || imageSrc || videoSrc) && (
        <div
          className="w-full overflow-hidden bg-black/5 relative group"
          style={aspectRatio && aspectRatio !== 'auto' ? { aspectRatio } : undefined}
          onMouseEnter={triggerBadgeVisibility}
          onTouchStart={triggerBadgeVisibility}
        >
          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              className={`w-full ${aspectRatio && aspectRatio !== 'auto' ? 'h-full' : 'h-auto'} object-contain bg-black`}
            />
          ) : hasMultipleImages ? (
            <div className="overflow-hidden h-full" ref={emblaRef}>
              <div className="flex h-full">
                {images?.map((src, index) => (
                  <div className="flex-[0_0_100%] min-w-0 relative h-full bg-black" key={index}>
                    <img
                      src={src}
                      alt={`Slide ${index + 1}`}
                      className={`w-full h-full object-contain`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <img
              src={imgSrc}
              alt="Post content"
              className={`w-full ${aspectRatio && aspectRatio !== 'auto' ? 'h-full' : 'h-auto'} object-contain bg-black`}
            />
          )}

          {/* Slide Counter Badge */}
          {hasMultipleImages && (
            <div
              className={`absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full transition-opacity duration-300 ${showBadge ? 'opacity-100' : 'opacity-0'}`}
            >
              {currentSlide + 1}/{images?.length}
            </div>
          )}
        </div>
      )}

      <div className={`px-4 md:px-6 py-3 border-t ${isDark ? 'border-[#2d3548]' : 'border-gray-200'}`}>
        <div className={`flex items-center justify-between text-xs md:text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <span>{likes} likes</span>
          <div className="flex gap-3">
            <span className="cursor-pointer" onClick={handleToggleCommentSection}>{commentsCount} comments</span>
            <span>{shares} shares</span>
          </div>
        </div>

        <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-[#2d3548]' : 'border-gray-200'}`}>
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 ${isLiked ? 'text-blue-500' : (isDark ? 'text-gray-400 hover:text-[#5B7CFF]' : 'text-gray-600 hover:text-[#5B7CFF]')} transition-colors flex-1 justify-center text-xs md:text-sm`}>
            <ThumbsUp className={`w-4 h-4 md:w-5 md:h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>Like</span>
          </button>
          <button 
            onClick={handleToggleCommentSection}
            className={`flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-[#5B7CFF]' : 'text-gray-600 hover:text-[#5B7CFF]'} transition-colors flex-1 justify-center text-xs md:text-sm`}>
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
            <span>Comment</span>
          </button>
          <button 
            onClick={onShare}
            className={`flex items-center gap-2 ${isDark ? 'text-gray-400 hover:text-[#5B7CFF]' : 'text-gray-600 hover:text-[#5B7CFF]'} transition-colors flex-1 justify-center text-xs md:text-sm`}>
            <Share2 className="w-4 h-4 md:w-5 md:h-5" />
            <span>Share</span>
          </button>
        </div>
      </div>
      
      {isCommentSectionOpen && (
        <CommentSection 
          comments={postComments}
          isDark={isDark}
          onAddComment={handleAddComment} 
        />
      )}

      <MobileCommentDrawer
        open={isMobileDrawerOpen}
        onOpenChange={setIsMobileDrawerOpen}
        comments={postComments}
        isDark={isDark}
        onAddComment={handleAddComment}
      />
    </div>
  )
}
