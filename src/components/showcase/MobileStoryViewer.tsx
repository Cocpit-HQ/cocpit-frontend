import React, { useState, useEffect, useRef, useMemo } from "react"
import { X, MoreVertical } from "lucide-react"
import { StoryDetail } from "@/types/showcase"
import { StoryInteractionPanel } from "./StoryInteractionPanel"

type MobileStoryViewerProps = {
  stories: StoryDetail[]
  initialStoryId: number
  onClose: () => void
  isDark: boolean
}

type UserGroup = {
    authorName: string
    stories: StoryDetail[]
}

export function MobileStoryViewer({ stories, initialStoryId, onClose, isDark }: MobileStoryViewerProps) {
  const [showInteraction, setShowInteraction] = useState(false)
  const [progress, setProgress] = useState(0)

  // Group stories by author
  const userGroups = useMemo(() => {
    const groups: UserGroup[] = []
    stories.forEach((story) => {
        const existing = groups.find(g => g.authorName === story.author.name)
        if (existing) {
            existing.stories.push(story)
        } else {
            groups.push({
                authorName: story.author.name,
                stories: [story]
            })
        }
    })
    return groups
  }, [stories])

  // Find initial indices
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)

  // Track if we initialized to prevent effect loop overriding manual nav
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return

    let uIdx = 0
    let sIdx = 0

    // Find where the initialStoryId belongs
    for (let i = 0; i < userGroups.length; i++) {
        const foundIndex = userGroups[i].stories.findIndex(s => s.id === initialStoryId)
        if (foundIndex !== -1) {
            uIdx = i
            sIdx = foundIndex
            break
        }
    }
    setCurrentUserIndex(uIdx)
    setCurrentStoryIndex(sIdx)
    initialized.current = true
  }, [initialStoryId, userGroups])

  const currentGroup = userGroups[currentUserIndex]
  const currentStory = currentGroup?.stories[currentStoryIndex]
  const isMyStory = currentStory?.author.name === "You"

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0)
  }, [currentUserIndex, currentStoryIndex])

  // Touch handling for gestures
  const touchStartY = useRef<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return

    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    const deltaX = e.changedTouches[0].clientX - touchStartX.current

    // Reset
    touchStartY.current = null
    touchStartX.current = null

    // Swipe Thresholds
    if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
      // Vertical Swipe
      if (deltaY > 0) {
        // Swipe Down -> Close
        onClose()
      } else {
        // Swipe Up -> Open Interaction
        setShowInteraction(true)
      }
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      // It's a tap
      const screenWidth = window.innerWidth
      const tapX = e.changedTouches[0].clientX

      // Tap Logic
      if (tapX < screenWidth * 0.3) {
        handlePrev()
      } else if (tapX > screenWidth * 0.7) {
        handleNext()
      }
    }
  }

  const handleNext = () => {
    if (!currentGroup) return

    if (currentStoryIndex < currentGroup.stories.length - 1) {
        // Next story in same group
        setCurrentStoryIndex(prev => prev + 1)
    } else if (currentUserIndex < userGroups.length - 1) {
        // Next user
        setCurrentUserIndex(prev => prev + 1)
        setCurrentStoryIndex(0)
    } else {
        // End of all stories
        onClose()
    }
  }

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
        // Prev story in same group
        setCurrentStoryIndex(prev => prev - 1)
    } else if (currentUserIndex > 0) {
        // Prev user
        const prevGroup = userGroups[currentUserIndex - 1]
        setCurrentUserIndex(prev => prev - 1)
        setCurrentStoryIndex(prevGroup.stories.length - 1)
    }
  }

  // Auto-advance simulation
  useEffect(() => {
    if (showInteraction || !currentStory) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext()
          return 0
        }
        return prev + 1
      })
    }, 50) // 5 seconds

    return () => clearInterval(interval)
  }, [currentIndexHash(currentUserIndex, currentStoryIndex), showInteraction])

  // Helper to force effect re-run only when indices change
  function currentIndexHash(u: number, s: number) {
      return `${u}-${s}`
  }

  if (!currentStory) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Interaction Panel */}
      <StoryInteractionPanel
        isOpen={showInteraction}
        onClose={() => setShowInteraction(false)}
        story={currentStory}
        isMyStory={isMyStory}
        isDark={isDark}
      />

      {/* Header / Progress */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex gap-1 mb-3">
          {currentGroup.stories.map((story, idx) => (
            <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-white/50 overflow-hidden">
              <img src={currentStory.author.avatar} alt={currentStory.author.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm flex items-center gap-2">
                {currentStory.author.name}
                <span className="text-white/60 font-normal text-xs">{currentStory.timeAgo}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 pointer-events-auto">
            <button onClick={(e) => { e.stopPropagation(); }} className="text-white">
               <MoreVertical className="w-5 h-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white">
               <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Transition Container */}
      {/* We key by authorName to trigger a full replace (simulate slide/flip if we had CSS animation) */}
      {/* For now we just key it to reset layout state */}
      <div key={currentGroup.authorName} className="flex-1 flex items-center justify-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <img
           src={currentStory.image}
           alt={currentStory.title}
           className="w-full h-full object-cover"
        />
        {/* Helper text for gestures */}
        {!showInteraction && (
            <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none">
                <div className="flex flex-col items-center gap-1 opacity-60 animate-bounce">
                    <div className="w-6 h-1 bg-white/50 rounded-full" />
                    <p className="text-white text-xs font-medium drop-shadow-md">Swipe up for details</p>
                </div>
            </div>
        )}
      </div>
    </div>
  )
}
