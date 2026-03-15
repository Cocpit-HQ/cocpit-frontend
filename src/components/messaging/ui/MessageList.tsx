import React, { useEffect, useRef, useLayoutEffect, useState, forwardRef } from "react"
import { Message } from "@/types/messaging"
import MessageBubble from "./MessageBubble"
import { Loader2 } from "lucide-react"
import { useVirtualizer } from '@tanstack/react-virtual';

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

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 60, // approximate height of MessageBubble
    overscan: 10,
  });

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
  }, [isLoadingMore, prevScrollHeight, scrollRef])

  // Check if we should auto-scroll for next update
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50

    if (scrollTop === 0 && hasMore && !isLoadingMore && onLoadMore) {
      setShouldScrollToBottom(false)
      setPrevScrollHeight(scrollHeight)
      onLoadMore()
    } else {
      setShouldScrollToBottom(isAtBottom)
    }
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide relative"
    >
      {hasMore && (
        <div className="flex justify-center py-2">
          {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <div className="h-4" />}
        </div>
      )}

      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const msg = messages[virtualRow.index];
          const prev = messages[virtualRow.index - 1];
          const next = messages[virtualRow.index + 1];

          // Simple grouping logic based on sender
          const isFirstInGroup = !prev || prev.sender !== msg.sender;
          const isLastInGroup = !next || next.sender !== msg.sender;
          const groupedMsg = { ...msg, isFirstInGroup, isLastInGroup };

          return (
            <div
              key={msg.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <MessageBubble
                message={groupedMsg}
                onAction={onAction}
                isEditing={editingMessageId === msg.id}
                onSaveEdit={(text) => onSaveEdit?.(msg.id, text)}
                onCancelEdit={onCancelEdit}
                isSelected={selectedMessageId === msg.id}
                onMessageClick={onMessageClick}
                onMediaClick={onMediaClick}
                onMediaLoad={() => {
                  if (shouldScrollToBottom && scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  )
})

MessageList.displayName = "MessageList"

export default MessageList
