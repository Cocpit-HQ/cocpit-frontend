import React, { useEffect, useRef, useLayoutEffect, useState, forwardRef } from "react"
import { Message } from "@/types/messaging"
import MessageBubble from "./MessageBubble"
import { Loader2, ChevronDown } from "lucide-react"
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
  unreadCount?: number
  isOpponentOnline?: boolean
  isGroup?: boolean
  onReply?: (message: Message) => void
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(({ messages, onLoadMore, hasMore, isLoadingMore, onAction, editingMessageId, onSaveEdit, onCancelEdit, selectedMessageId, onMessageClick, onMediaClick, unreadCount = 0, isOpponentOnline, isGroup, onReply }, ref) => {
  const localRef = useRef<HTMLDivElement>(null)
  const scrollRef = (ref as React.RefObject<HTMLDivElement>) || localRef
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const [prevScrollHeight, setPrevScrollHeight] = useState(0)
  
  // Freeze the initial unread count so it doesn't disappear when marked as read
  const [initialUnread] = useState(unreadCount)
  const [hasScrolledToUnread, setHasScrolledToUnread] = useState(false)

  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleReplyClick = (messageId: string) => {
    const index = messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      rowVirtualizer.scrollToIndex(index, { align: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 1000);
    }
  };

  const handleScrollButtonMouseEnter = () => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
  };

  const handleScrollButtonMouseLeave = () => {
    scrollTimerRef.current = setTimeout(() => {
      setShowScrollButton(false);
    }, 2000);
  };

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 60, // approximate height of MessageBubble
    overscan: 10,
  });

  // Auto-scroll logic
  useEffect(() => {
    if (!scrollRef.current) return;

    if (initialUnread > 0 && !hasScrolledToUnread && messages.length > 0) {
      // Scroll to the first unread message
      const firstUnreadIndex = Math.max(0, messages.length - initialUnread);
      rowVirtualizer.scrollToIndex(firstUnreadIndex, { align: 'start' });
      setHasScrolledToUnread(true);
      setShouldScrollToBottom(false);
    } else if (shouldScrollToBottom && messages.length > 0) {
      rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
  }, [messages.length, shouldScrollToBottom, initialUnread, hasScrolledToUnread, rowVirtualizer])

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
      if (!isAtBottom) {
        setShowScrollButton(true);
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(() => {
          setShowScrollButton(false);
        }, 2000);
      } else {
        setShowScrollButton(false);
      }
    }
  }

  const formatDateDivider = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
    });
  };

  return (
    <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 scrollbar-hide relative bg-background"
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

          const isMoreThanOneMinute = (date1?: string, date2?: string) => {
            if (!date1 || !date2) return true;
            return Math.abs(new Date(date1).getTime() - new Date(date2).getTime()) > 60000;
          };

          const isTimeBreakWithPrev = prev ? isMoreThanOneMinute(msg.created_at, prev.created_at) : false;
          const isTimeBreakWithNext = next ? isMoreThanOneMinute(msg.created_at, next.created_at) : false;

          // Simple grouping logic based on sender AND time difference
          const isFirstInGroup = !prev || prev.sender !== msg.sender || isTimeBreakWithPrev;
          const isLastInGroup = !next || next.sender !== msg.sender || isTimeBreakWithNext;
          
          const currentMsgDateStr = msg.created_at ? formatDateDivider(msg.created_at) : null;
          const prevMsgDateStr = prev?.created_at ? formatDateDivider(prev.created_at) : null;
          const showDateDivider = currentMsgDateStr && currentMsgDateStr !== prevMsgDateStr;
          
          const isFirstUnread = initialUnread > 0 && virtualRow.index === messages.length - initialUnread;
          
          const groupedMsg = { ...msg, isFirstInGroup, isLastInGroup };

          return (
            <div
              key={msg.id}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {showDateDivider && !isFirstUnread && (
                <div className="flex items-center justify-center my-6 px-4 md:px-8 w-full">
                  <div className="h-[1px] bg-border flex-1" />
                  <span className="text-[11px] font-['Poppins'] text-muted-foreground mx-4 lowercase first-letter:uppercase shrink-0">
                    {currentMsgDateStr}
                  </span>
                  <div className="h-[1px] bg-border flex-1" />
                </div>
              )}
              {isFirstUnread && (
                <div className="flex items-center justify-center my-6 px-4 md:px-8 w-full">
                  <div className="h-[1px] bg-[#4F46E5]/40 flex-1" />
                  <span className="text-[11px] font-bold text-[#4F46E5] mx-4 shrink-0 bg-[#4F46E5]/10 px-3 py-1 rounded-full">
                    {initialUnread} Unread message{initialUnread !== 1 ? 's' : ''}
                  </span>
                  <div className="h-[1px] bg-[#4F46E5]/40 flex-1" />
                </div>
              )}
              <MessageBubble
                message={groupedMsg}
                onAction={onAction}
                isSelected={selectedMessageId === msg.id}
                isEditing={editingMessageId === msg.id}
                onSaveEdit={(text) => onSaveEdit?.(msg.id, text)}
                onCancelEdit={onCancelEdit}
                showAvatar={groupedMsg.isLastInGroup} // Show avatar on LAST message in group only
                showTime={groupedMsg.isLastInGroup || msg.time !== next?.time} // Show time when time changes or last in group
                onMessageClick={onMessageClick}
                onMediaClick={onMediaClick}
                isOpponentOnline={isOpponentOnline}
                isGroup={isGroup}
                onReply={onReply}
                onReplyClick={handleReplyClick}
                isHighlighted={highlightedMessageId === msg.id}
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
      
      {showScrollButton && !shouldScrollToBottom && (
        <button
          className="absolute bottom-4 right-4 md:right-8 bg-white border border-border shadow-lg text-primary p-2 rounded-full z-50 hover:bg-muted transition-all"
          onClick={() => {
            rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
          }}
          onMouseEnter={handleScrollButtonMouseEnter}
          onMouseLeave={handleScrollButtonMouseLeave}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}
    </div>
  )
})

MessageList.displayName = "MessageList"

export default MessageList
