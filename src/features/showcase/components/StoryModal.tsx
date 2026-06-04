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
      (a, b) => new Date(a.created_at || new Date()).getTime() - new Date(b.created_at || new Date()).getTime()
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
  const [activeOverlay, setActiveOverlay] = useState<"play" | "pause" | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const isInitialOpenRef = useRef(true)

  // Redirect to first unseen story (or oldest story if all seen) on initial open/mount
  useEffect(() => {
    if (isInitialOpenRef.current && activeStories.length > 0) {
      isInitialOpenRef.current = false
      const firstUnseenIdx = activeStories.findIndex(s => !s.is_seen)
      const startStoryIdx = firstUnseenIdx !== -1 ? firstUnseenIdx : 0
      const startStory = activeStories[startStoryIdx]
      if (startStory && startStory.id !== story.id) {
        setSelectedStory({ ...startStory, author: activeStory.author || startStory.author })
      }
    }
  }, [activeStories, story.id, activeStory.author, setSelectedStory])

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
    
    showcaseService.markShowcaseSeen(activeStory.id, companyId)
      .then(() => {
        markStoryViewed(activeStory.id)
        if (onStoryViewed) onStoryViewed(activeStory.id)
      })
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
          const nextSorted = [...nextGroup.stories].sort(
            (a, b) => new Date(a.created_at || new Date()).getTime() - new Date(b.created_at || new Date()).getTime()
          )
          const firstUnseenIdx = nextSorted.findIndex(s => !s.is_seen)
          const startStory = firstUnseenIdx !== -1 ? nextSorted[firstUnseenIdx] : nextSorted[0]
          setSelectedStory({ ...startStory, author: nextGroup.author })
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
          const prevSorted = [...prevGroup.stories].sort(
            (a, b) => new Date(a.created_at || new Date()).getTime() - new Date(b.created_at || new Date()).getTime()
          )
          setSelectedStory({ ...prevSorted[prevSorted.length - 1], author: prevGroup.author })
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
      setActiveOverlay("pause")
      setTimeout(() => {
        setActiveOverlay(null)
      }, 600)
    } else {
      setIsPlaying(true)
      setActiveOverlay("play")
      setTimeout(() => {
        setActiveOverlay(null)
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
      className="fixed inset-0 z-50 flex items-center justify-center select-none bg-black/80 backdrop-blur-sm"
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
        className="absolute top-10 right-10 z-50 text-[#FF5C5C] hover:opacity-80 active:scale-95 transition-all flex items-center justify-center p-0 cursor-pointer w-6 h-6 shrink-0 order-0 grow-0"
        aria-label="Close story viewer"
      >
        <Icon icon="lucide:x" width="24" height="24" />
      </button>

      {/* Center Wrapper: (48px left btn) + (100px gap) + (420px card) + (100px gap) + (48px right btn) = 716px width */}
      <div 
        className="flex flex-row justify-center items-center w-[716px] h-[620px] gap-[100px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Navigation Chevron */}
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className={`flex items-center justify-center text-white cursor-pointer hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all box-border flex flex-row p-2 gap-2.5 w-12 h-12 border border-white backdrop-blur-md rounded-[100px] shrink-0 grow-0 order-0 bg-transparent ${showLeftButton ? 'visible' : 'invisible'}`}
          aria-label="Previous story"
        >
          <Icon icon="lucide:chevron-left" width="24" height="24" />
        </button>

        {/* Story Card */}
        <div
          onClick={togglePlayPause}
          className="relative overflow-hidden cursor-pointer w-[420px] h-[620px] rounded-[24px] bg-black"
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
            className="absolute top-0 left-0 z-30 pointer-events-none w-[420px] h-[102px] p-4 flex flex-col gap-2 bg-gradient-to-b from-black/50 to-transparent"
          >
            {/* Timeline Segment Bars */}
            <div className="flex gap-2 h-1 w-full">
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
                    className="flex-1 rounded-full overflow-hidden h-1 bg-white/30"
                  >
                    <div 
                      className="h-full bg-white"
                      style={{
                        width: segmentWidth,
                        transition: index === currentIndex && isPlaying ? 'width 0.2s linear' : 'none'
                      }}
                    />
                  </div>
                )
              })}
            </div>

            {/* Profile Row */}
            <div className="flex items-center gap-2 mt-1">
              <img 
                src={activeStory.author?.avatar || "/assets/pngegg.png"} 
                alt={activeStory.author?.name || "Profile"}
                className="w-10 h-10 rounded-full object-cover border border-white/20"
                onError={(e) => {
                  e.currentTarget.src = "/assets/pngegg.png"
                }}
              />
              <div className="flex flex-col">
                <span className="text-lg font-medium text-white leading-tight">
                  {activeStory.author?.name || "Cocpit"}
                </span>
                <span className="text-xs font-normal text-white/80 leading-tight">
                  {storyTimestamp}
                </span>
              </div>
            </div>
          </div>

          {/* Central Play/Pause Flash Overlay */}
          {activeOverlay && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/10 z-30 pointer-events-none"
              style={{
                animation: 'fadeOut 0.6s forwards'
              }}
            >
              <div 
                className="box-border flex flex-row items-center justify-center p-2 gap-2.5 w-12 h-12 border border-white backdrop-blur-md rounded-[100px] shrink-0 grow-0 order-0 bg-transparent"
              >
                <Icon 
                  icon={activeOverlay === "play" ? "lucide:play" : "lucide:pause"} 
                  width="24"
                  height="24"
                  className={activeOverlay === "play" ? "ml-0.5 text-white" : "text-white"} 
                />
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
          className={`flex items-center justify-center text-white cursor-pointer hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all box-border flex flex-row p-2 gap-2.5 w-12 h-12 border border-white backdrop-blur-md rounded-[100px] shrink-0 grow-0 order-0 bg-transparent ${showRightButton ? 'visible' : 'invisible'}`}
          aria-label="Next story"
        >
          <Icon icon="lucide:chevron-right" width="24" height="24" />
        </button>
      </div>
    </div>
  )
}
