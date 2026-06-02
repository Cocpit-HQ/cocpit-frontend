import React, { useState, useRef, useEffect } from "react"
import { Icon } from "@iconify/react"
import { StoryDetail } from "../types/showcase"
import { showcaseService } from "../services/showcase.service"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { useStories } from '@/context/StoriesContext'
import { getStoryImageUrl, getStoryVideoUrl } from "@/lib/story-media"
import { formatTimeAgo } from "@/lib/utils"

type StoryModalProps = {
  story: StoryDetail
  onClose: () => void
  isDark?: boolean
  onStoryUpdate?: (story: StoryDetail) => void
  onStoryViewed?: (storyId: number) => void
  onNext?: () => void
  onPrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
  groupStories?: StoryDetail[]
}

export function StoryModal({ 
  story, 
  onClose, 
  onStoryViewed, 
  onNext, 
  onPrev,
  hasNext,
  hasPrev,
  groupStories
}: StoryModalProps) {
  const { groups, setSelectedStory } = useStories()
  const { activeProfile } = useActiveProfile()
  const { markStoryViewed } = useStories()

  // Prevent background scroll and page interactions while Showcase is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Use groupStories prop if passed, otherwise look up from context groups
  const activeStories = React.useMemo(() => {
    let list: StoryDetail[] = []
    if (groupStories && groupStories.length > 0) {
      list = groupStories
    } else {
      const foundGroup = groups?.find(g => g.stories.some(s => s.id === story.id))
      list = foundGroup ? foundGroup.stories : [story]
    }
    return [...list].sort(
      (a, b) => new Date(b.created_at || new Date()).getTime() - new Date(a.created_at || new Date()).getTime()
    )
  }, [story, groups, groupStories])

  const currentIndex = React.useMemo(() => {
    const idx = activeStories.findIndex(s => s.id === story.id)
    return idx !== -1 ? idx : 0
  }, [story.id, activeStories])

  const activeStory = story
  const isVideo = activeStory.media_type === 'video' || activeStory.isVideo

  // Media URLs
  const storyImageSrc = React.useMemo(() => getStoryImageUrl(activeStory), [activeStory])
  const storyVideoSrc = React.useMemo(() => getStoryVideoUrl(activeStory), [activeStory])

  // Story Timestamp
  const storyTimestamp = React.useMemo(() => {
    return formatTimeAgo(activeStory.created_at, activeStory.timeAgo)
  }, [activeStory.created_at, activeStory.timeAgo])

  // Find user groups sequence to enable continuous looping
  const activeGroupIndex = React.useMemo(() => {
    return groups?.findIndex(g => g.stories.some(s => s.id === story.id)) ?? -1
  }, [story.id, groups])

  const nextGroup = React.useMemo(() => {
    if (activeGroupIndex !== -1 && groups && activeGroupIndex < groups.length - 1) {
      return groups[activeGroupIndex + 1]
    }
    return null
  }, [activeGroupIndex, groups])

  const prevGroup = React.useMemo(() => {
    if (activeGroupIndex > 0 && groups) {
      return groups[activeGroupIndex - 1]
    }
    return null
  }, [activeGroupIndex, groups])

  // Playback & progress state
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(15) // default 15s for image
  const [isPlaying, setIsPlaying] = useState(true)
  // By default, story should be unmuted
  const [isMuted, setIsMuted] = useState(false)
  const [showPauseOverlay, setShowPauseOverlay] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Reset timer/playback state when changing story segments
  useEffect(() => {
    setCurrentTime(0)
    setDuration(isVideo ? 0 : 15)
    setIsPlaying(true)
  }, [activeStory.id, isVideo])

  // Sync isPlaying state with HTML5 Video element
  useEffect(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.play().catch(err => console.log("Video play interrupted", err))
    } else {
      videoRef.current.pause()
    }
  }, [isPlaying, activeStory.id])

  // Optimistically mark story as viewed
  useEffect(() => {
    if (!activeStory) return
    const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined
    
    markStoryViewed(activeStory.id)
    if (onStoryViewed) onStoryViewed(activeStory.id)
    
    showcaseService.viewStory(activeStory.id, companyId)
      .catch(err => console.error("Failed to register view", err))
  }, [activeStory?.id, activeProfile, markStoryViewed, onStoryViewed])

  const handleNext = React.useCallback(() => {
    if (onNext) {
      onNext()
    } else {
      if (currentIndex < activeStories.length - 1) {
        setSelectedStory({ ...activeStories[currentIndex + 1], author: activeStory.author })
      } else {
        // It's the last story segment of this user group
        if (nextGroup && nextGroup.stories.length > 0) {
          setSelectedStory({ ...nextGroup.stories[0], author: nextGroup.author })
        } else {
          onClose() // Absolute end reached -> close modal
        }
      }
    }
  }, [onNext, currentIndex, activeStories, nextGroup, activeStory.author, setSelectedStory, onClose])

  const handlePrev = React.useCallback(() => {
    if (onPrev) {
      onPrev()
    } else {
      if (currentIndex > 0) {
        setSelectedStory({ ...activeStories[currentIndex - 1], author: activeStory.author })
      } else {
        // It's the first story segment of this user group
        if (prevGroup && prevGroup.stories.length > 0) {
          setSelectedStory({ ...prevGroup.stories[prevGroup.stories.length - 1], author: prevGroup.author })
        }
      }
    }
  }, [onPrev, currentIndex, activeStories, prevGroup, activeStory.author, setSelectedStory])

  // Unified Auto-Advance and Progress Timer logic
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      if (isVideo) {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime)
          if (videoRef.current.duration) {
            setDuration(videoRef.current.duration)
          }
        }
      } else {
        setCurrentTime(prev => {
          const nextTime = prev + 0.1
          if (nextTime >= 15) {
            clearInterval(interval)
            handleNext()
            return 0
          }
          return nextTime
        })
      }
    }, 100)

    return () => clearInterval(interval)
  }, [activeStory.id, isVideo, isPlaying, handleNext])

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      setShowPauseOverlay(true)
      setTimeout(() => {
        setShowPauseOverlay(false)
      }, 600)
    }
  }

  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    setDuration(video.duration || 15)
  }

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    setCurrentTime(video.currentTime)
  }

  const handleVideoEnded = () => {
    handleNext()
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Chevron Navigation visibility parameters
  const isAbsoluteFirst = activeGroupIndex <= 0 && currentIndex === 0
  const isAbsoluteLast = (!groups || activeGroupIndex >= groups.length - 1) && currentIndex === activeStories.length - 1

  const showLeftButton = hasPrev !== undefined ? hasPrev : !isAbsoluteFirst
  const showRightButton = hasNext !== undefined ? hasNext : !isAbsoluteLast

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center select-none"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)'
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.2); }
        }
      `}</style>

      {/* Screen-level Close Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
        className="absolute z-50 text-[#FF5C5C] hover:opacity-80 active:scale-95 transition-all flex items-center justify-center p-0 cursor-pointer"
        style={{
          top: '40px',
          right: '40px',
          width: '24px',
          height: '24px',
          flex: 'none',
          order: 0,
          flexGrow: 0,
        }}
        aria-label="Close story viewer"
      >
        <Icon icon="lucide:x" style={{ width: '24px', height: '24px' }} />
      </button>

      {/* Center Wrapper: (48px left btn) + (100px gap) + (420px card) + (100px gap) + (48px right btn) = 716px width */}
      <div 
        className="flex flex-row justify-center items-center"
        style={{
          width: '716px',
          height: '620px',
          gap: '100px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Navigation Chevron */}
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="flex items-center justify-center text-white cursor-pointer hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all"
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '8px',
            gap: '10px',
            width: '48px',
            height: '48px',
            border: '1px solid #FFFFFF',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '100px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
            background: 'transparent',
            visibility: showLeftButton ? 'visible' : 'hidden'
          }}
          aria-label="Previous story"
        >
          <Icon icon="lucide:chevron-left" style={{ width: '24px', height: '24px' }} />
        </button>

        {/* Story Card */}
        <div
          onClick={togglePlayPause}
          className="relative overflow-hidden cursor-pointer"
          style={{
            width: '420px',
            height: '620px',
            borderRadius: '24px',
            background: '#000',
          }}
        >
          {/* Media Rendering */}
          {isVideo ? (
            <video
              ref={videoRef}
              src={storyVideoSrc}
              className="w-full h-full object-contain"
              playsInline
              autoPlay={isPlaying}
              muted={isMuted}
              onLoadedMetadata={handleVideoMetadata}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
            />
          ) : storyImageSrc ? (
            <img
              src={storyImageSrc}
              alt={activeStory.title || "Story"}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-2">
              <Icon icon="lucide:image" className="w-10 h-10" />
              <p className="text-sm">No media available</p>
            </div>
          )}

          {/* Top Gradient Overlay & Information */}
          <div 
            className="absolute top-0 left-0 z-30 pointer-events-none"
            style={{
              width: '420px',
              height: '102px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)'
            }}
          >
            {/* Timeline Segment Bars */}
            <div 
              style={{
                display: 'flex',
                gap: '8px',
                height: '4px',
                width: '100%'
              }}
            >
              {activeStories.map((s, index) => {
                let segmentWidth = "0%"
                if (index < currentIndex) {
                  segmentWidth = "100%"
                } else if (index === currentIndex) {
                  segmentWidth = `${progress}%`
                }

                return (
                  <div 
                    key={s.id} 
                    className="flex-1 rounded-full overflow-hidden"
                    style={{
                      height: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div 
                      style={{
                        height: '100%',
                        width: segmentWidth,
                        backgroundColor: '#FFFFFF',
                        transition: index === currentIndex && isPlaying ? 'width 0.2s linear' : 'none'
                      }}
                    />
                  </div>
                )
              })}
            </div>

            {/* Profile Row */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              <img 
                src={activeStory.author?.avatar || "/assets/pngegg.png"} 
                alt={activeStory.author?.name || "Profile"}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onError={(e) => {
                  e.currentTarget.src = "/assets/pngegg.png"
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span 
                  style={{
                    fontSize: '18px',
                    fontWeight: 500,
                    color: '#FFFFFF',
                    lineHeight: '1.2'
                  }}
                >
                  {activeStory.author?.name || "Cocpit"}
                </span>
                <span 
                  style={{
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#FFFFFF',
                    opacity: 0.8,
                    lineHeight: '1.2'
                  }}
                >
                  {storyTimestamp}
                </span>
              </div>
            </div>
          </div>

          {/* Central Play Feedback Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-30 pointer-events-none">
              <div 
                style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '8px',
                  gap: '10px',
                  width: '48px',
                  height: '48px',
                  border: '1px solid #FFFFFF',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: '100px',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  background: 'transparent'
                }}
              >
                <Icon icon="lucide:play" style={{ width: '24px', height: '24px', color: '#FFFFFF' }} className="ml-0.5 fill-white text-white" />
              </div>
            </div>
          )}

          {/* Pause Flash Overlay */}
          {showPauseOverlay && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/10 z-30 pointer-events-none"
              style={{
                animation: 'fadeOut 0.6s forwards'
              }}
            >
              <div 
                style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '8px',
                  gap: '10px',
                  width: '48px',
                  height: '48px',
                  border: '1px solid #FFFFFF',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: '100px',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  background: 'transparent'
                }}
              >
                <Icon icon="lucide:pause" style={{ width: '24px', height: '24px', color: '#FFFFFF' }} className="text-white" />
              </div>
            </div>
          )}

          {/* Video Speaker/Mute Button */}
          {isVideo && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
              className="absolute bottom-6 right-6 z-30 text-white hover:opacity-80 active:scale-95 transition-all drop-shadow-md p-1 bg-black/15 rounded-full"
              aria-label={isMuted ? "Unmute story video" : "Mute story video"}
            >
              <Icon icon={isMuted ? "lucide:volume-x" : "lucide:volume-2"} className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Right Navigation Chevron */}
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="flex items-center justify-center text-white cursor-pointer hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all"
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '8px',
            gap: '10px',
            width: '48px',
            height: '48px',
            border: '1px solid #FFFFFF',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '100px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
            background: 'transparent',
            visibility: showRightButton ? 'visible' : 'hidden'
          }}
          aria-label="Next story"
        >
          <Icon icon="lucide:chevron-right" style={{ width: '24px', height: '24px' }} />
        </button>
      </div>
    </div>
  )
}
