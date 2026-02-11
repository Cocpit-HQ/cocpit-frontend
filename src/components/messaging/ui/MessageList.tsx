import React, { useEffect, useRef, useLayoutEffect, useState, forwardRef } from "react"
import { Message } from "@/types/messaging"
import MessageBubble from "./MessageBubble"
import { Loader2 } from "lucide-react"

interface MessageListProps {
  messages: Message[]
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  onAction?: (action: string, message: Message) => void
  editingMessageId?: string | null
  onSaveEdit?: (messageId: string, text: string) => void
  onCancelEdit?: () => void
  selectedMessageId?: string | null
  onMessageClick?: (message: Message) => void
  onMediaClick?: (url: string, type: 'image' | 'video' | 'document', name?: string) => void
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(({ messages, onLoadMore, hasMore, isLoadingMore, onAction, editingMessageId, onSaveEdit, onCancelEdit, selectedMessageId, onMessageClick, onMediaClick }, ref) => {
  const localRef = useRef<HTMLDivElement>(null)
  const scrollRef = (ref as React.RefObject<HTMLDivElement>) || localRef
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const [prevScrollHeight, setPrevScrollHeight] = useState(0)

  // Auto-scroll to bottom logic
  useEffect(() => {
    if (shouldScrollToBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, shouldScrollToBottom, scrollRef])

  // Handle scroll retention when loading more
  useLayoutEffect(() => {
    if (isLoadingMore && scrollRef.current) {
      setPrevScrollHeight(scrollRef.current.scrollHeight)
      setShouldScrollToBottom(false)
    } else if (!isLoadingMore && prevScrollHeight > 0 && scrollRef.current) {
      const newScrollHeight = scrollRef.current.scrollHeight
      const diff = newScrollHeight - prevScrollHeight
      if (diff > 0) {
        scrollRef.current.scrollTop = diff
      }
      setPrevScrollHeight(0)
    }
  }, [isLoadingMore, prevScrollHeight, scrollRef]) // Dependency on isLoadingMore transition

  // Check if we should auto-scroll for next update
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50

    if (scrollTop === 0 && hasMore && !isLoadingMore && onLoadMore) {
      setShouldScrollToBottom(false)
      setPrevScrollHeight(scrollHeight) // Capture height *before* loading triggers
      onLoadMore()
    } else {
      setShouldScrollToBottom(isAtBottom)
    }
  }

  // Detect when we receive new *latest* messages to set scroll to bottom
  useEffect(() => {
    // If we are not loading more, and we have new messages that are chronologically newer
    // we might want to auto scroll.
    // For simplicity, if we are at bottom, stay at bottom.
  }, [messages])


  // Handle media load to ensure we stay at bottom if already there
  const handleMediaLoad = () => {
    if (shouldScrollToBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide"
    >
      {hasMore && (
        <div className="flex justify-center py-2">
          {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <div className="h-4" />}
        </div>
      )}

      {messages.map((msg, index) => {
        const prev = messages[index - 1]
        const next = messages[index + 1]

        // Simple grouping logic based on sender
        const isFirstInGroup = !prev || prev.sender !== msg.sender
        const isLastInGroup = !next || next.sender !== msg.sender
        const groupedMsg = { ...msg, isFirstInGroup, isLastInGroup }

        return (
          <MessageBubble
            key={msg.id}
            message={groupedMsg}
            onAction={onAction}
            isEditing={editingMessageId === msg.id}
            onSaveEdit={(text) => onSaveEdit?.(msg.id, text)}
            onCancelEdit={onCancelEdit}
            isSelected={selectedMessageId === msg.id}
            onMessageClick={onMessageClick}
            onMediaClick={onMediaClick}
            onMediaLoad={handleMediaLoad}
          />
        )
      })}
      {/* Remove empty div ref, usage handled by container scrollTop */}
    </div>
  )
})

MessageList.displayName = "MessageList"

export default MessageList
