import React, { useState, useEffect, useRef } from "react"
import { X, MoreVertical } from "lucide-react"
import { StoryDetail } from "@/types/showcase"
import { StoryInteractionPanel } from "./StoryInteractionPanel"

type MobileStoryViewerProps = {
  stories: StoryDetail[]
  initialStoryId: number
  onClose: () => void
  isDark: boolean
}

export function MobileStoryViewer({ stories, initialStoryId, onClose, isDark }: MobileStoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showInteraction, setShowInteraction] = useState(false)
  const [progress, setProgress] = useState(0)

  // Initialize index
  useEffect(() => {
    const idx = stories.findIndex((s) => s.id === initialStoryId)
    if (idx !== -1) setCurrentIndex(idx)
  }, [initialStoryId, stories])

  const currentStory = stories[currentIndex]
  const isMyStory = currentStory?.author.name === "You"

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

      if (tapX < screenWidth * 0.3) {
        // Left Tap -> Prev
        handlePrev()
      } else if (tapX > screenWidth * 0.7) {
        // Right Tap -> Next
        handleNext()
      }
    }
  }

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setProgress(0)
    }
  }

  // Auto-advance simulation (simple)
  useEffect(() => {
    if (showInteraction) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext()
          return 0
        }
        return prev + 1
      })
    }, 50) // 5 seconds per story

    return () => clearInterval(interval)
  }, [currentIndex, showInteraction])

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
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-12 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex gap-1 mb-3">
          {stories.map((story, idx) => (
            <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
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
          <div className="flex items-center gap-4">
            <button onClick={(e) => { e.stopPropagation(); }} className="text-white">
               <MoreVertical className="w-5 h-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white">
               <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
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

      {/* Input Placeholder for "Others" (always visible at bottom if not my story?)
          Actually Instagram shows "Send message" input at bottom.
          But here we have the slide up behavior.
          The user said: "when viewing others stories ... comment section will be visible ... when story is slide down it will close"
          Wait, usually there is a quick reply input. But the requirement focuses on the slide up panel.
          I'll leave the main view clean and rely on slide-up for comments as requested.
      */}
    </div>
  )
}
