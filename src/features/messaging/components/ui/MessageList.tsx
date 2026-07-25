import React, { useEffect, useRef, useLayoutEffect, useState, forwardRef } from "react"
import { Message } from "@/types/messaging"
import MessageBubble from "./MessageBubble"
import { Loader2, ChevronDown } from "lucide-react"
import { useVirtualizer } from '@tanstack/react-virtual';
import MessageSkeleton from "../skeletons/MessageSkeleton"

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
  onReaction?: (message: Message, emoji: string) => void
  currentUserId?: string
  conversationId?: string
  otherUserType?: "COMPANY" | "USER"
  otherUserSlug?: string
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(({ messages, onLoadMore, hasMore, isLoadingMore, onAction, editingMessageId, onSaveEdit, onCancelEdit, selectedMessageId, onMessageClick, onMediaClick, unreadCount = 0, isOpponentOnline, isGroup, onReply, onReaction, currentUserId, conversationId, otherUserType, otherUserSlug }, ref) => {
  const localRef = useRef<HTMLDivElement>(null)
  const scrollRef = (ref as React.RefObject<HTMLDivElement>) || localRef
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const lastScrollTopRef = useRef<number>(0)
  const shouldScrollToBottomRef = useRef<boolean>(true)

  const updateShouldScrollToBottom = (val: boolean) => {
    shouldScrollToBottomRef.current = val
    setShouldScrollToBottom(val)
  }
  
  const prevScrollHeightRef = useRef<number>(0)
  const wasLoadingMoreRef = useRef<boolean>(false)
  const lastMessageIdRef = useRef<string | null>(null)
  
  // Freeze the initial unread count so it doesn't disappear when marked as read
  const [initialUnread] = useState(unreadCount)
  const [hasScrolledToUnread, setHasScrolledToUnread] = useState(false)

  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Skeletons list for pagination loading (older messages)
  const displayMessages = React.useMemo(() => {
    if (isLoadingMore) {
      // Prepend 50 skeleton items (matching page size limit)
      const skeletons = Array.from({ length: 50 }, (_, i) => ({
        id: `skeleton-${i}`,
        isSkeleton: true,
        sender: i % 2 === 0 ? 'me' : 'them',
        type: i % 3 === 0 ? 'media' : 'text',
      } as unknown as Message));
      return [...skeletons, ...messages];
    }
    return messages;
  }, [messages, isLoadingMore]);

  const handleReplyClick = (messageId: string) => {
    const index = displayMessages.findIndex(m => m.id === messageId);
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
    count: displayMessages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 60, // approximate height of MessageBubble
    overscan: 10,
  });

  // Auto-scroll logic
  useEffect(() => {
    if (!scrollRef.current) return;

    const lastMessage = displayMessages[displayMessages.length - 1];
    const isNewMessageSent = !!(
      lastMessage &&
      lastMessage.id !== lastMessageIdRef.current &&
      !lastMessage.id.startsWith('skeleton-') &&
      (lastMessage.sender === 'me' || lastMessage.senderId === currentUserId)
    );

    if (initialUnread > 0 && !hasScrolledToUnread && displayMessages.length > 0) {
      // Scroll to the first unread message
      const firstUnreadIndex = Math.max(0, displayMessages.length - initialUnread);
      rowVirtualizer.scrollToIndex(firstUnreadIndex, { align: "start" });
      setHasScrolledToUnread(true);
      updateShouldScrollToBottom(false);
    } else if ((shouldScrollToBottomRef.current || isNewMessageSent) && displayMessages.length > 0) {
      rowVirtualizer.scrollToIndex(displayMessages.length - 1, { align: "end" });
      
      // Fallback: React Virtualizer sometimes underestimates sizes on first render.
      // A slight delay ensures we truly hit the bottom after layout calculations.
      const timer = setTimeout(() => {
        if (scrollRef.current && (shouldScrollToBottomRef.current || isNewMessageSent)) {
          rowVirtualizer.scrollToIndex(displayMessages.length - 1, { align: "end" });
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 150);
      return () => clearTimeout(timer);
    }

    if (lastMessage) {
      lastMessageIdRef.current = lastMessage.id;
    }
  }, [
    displayMessages,
    initialUnread,
    hasScrolledToUnread,
    rowVirtualizer,
    currentUserId,
  ]);

  // Record scroll height before skeletons are prepended
  useLayoutEffect(() => {
    if (isLoadingMore && !wasLoadingMoreRef.current && scrollRef.current) {
      prevScrollHeightRef.current = scrollRef.current.scrollHeight
      wasLoadingMoreRef.current = true
    }
  }, [isLoadingMore, scrollRef]);

  // Record scroll height before real messages are prepended (skeletons replaced)
  useLayoutEffect(() => {
    if (!isLoadingMore && wasLoadingMoreRef.current && scrollRef.current) {
      prevScrollHeightRef.current = scrollRef.current.scrollHeight
      wasLoadingMoreRef.current = false
    }
  }, [isLoadingMore, scrollRef]);

  // Perform scroll adjustment when displayMessages changes to retain scroll position
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current > 0 && scrollRef.current) {
      const newScrollHeight = scrollRef.current.scrollHeight
      const diff = newScrollHeight - prevScrollHeightRef.current
      if (diff > 0) {
        scrollRef.current.scrollTop = scrollRef.current.scrollTop + diff
        prevScrollHeightRef.current = 0
      }
    }
  }, [displayMessages, scrollRef]);

  // Scroll to bottom when virtualizer total size changes (e.g. dynamic height changes from media or entity preview loading)
  const totalSize = rowVirtualizer.getTotalSize();
  useEffect(() => {
    if (shouldScrollToBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [totalSize]);

  // Check if we should auto-scroll for next update
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    const isScrollingUp = scrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = scrollTop;

    const isAtBottom = scrollHeight - scrollTop - clientHeight < 15;

    if (scrollTop === 0 && hasMore && !isLoadingMore && onLoadMore) {
      updateShouldScrollToBottom(false)
      prevScrollHeightRef.current = scrollHeight
      onLoadMore()
    } else {
      if (isScrollingUp) {
        updateShouldScrollToBottom(false)
      } else {
        updateShouldScrollToBottom(isAtBottom)
      }

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
      year:
        date.getFullYear() === today.getFullYear() ? undefined : "numeric",
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
          {isLoadingMore ? null : <div className="h-4" />}
        </div>
      )}

          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const msg = displayMessages[virtualRow.index];
              const prev = displayMessages[virtualRow.index - 1];
              const next = displayMessages[virtualRow.index + 1];

              if ((msg as any)?.isSkeleton) {
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
                    <MessageSkeleton
                      sender={(msg as any).sender}
                      type={(msg as any).type}
                    />
                  </div>
                );
              }

            const isMoreThanOneMinute = (date1?: string, date2?: string) => {
              if (!date1 || !date2) return true;
              return (
                Math.abs(
                  new Date(date1).getTime() - new Date(date2).getTime(),
                ) > 60000
              );
            };

              const isTimeBreakWithPrev = prev && !(prev as any).isSkeleton
                ? isMoreThanOneMinute(msg.created_at, prev.created_at)
                : false;
              const isTimeBreakWithNext = next && !(next as any).isSkeleton
                ? isMoreThanOneMinute(msg.created_at, next.created_at)
                : false;

              // Simple grouping logic based on sender, senderMemberName/senderId, AND time difference
              const isSameSenderMember = prev && !(prev as any).isSkeleton && 
                prev.sender === msg.sender && 
                ((prev.senderMemberName && msg.senderMemberName) ? (prev.senderMemberName === msg.senderMemberName) : (prev.senderId === msg.senderId));
              const isFirstInGroup =
                !prev || (prev as any).isSkeleton || !isSameSenderMember || isTimeBreakWithPrev;
              const isSameNextMember = next && !(next as any).isSkeleton && 
                next.sender === msg.sender && 
                ((next.senderMemberName && msg.senderMemberName) ? (next.senderMemberName === msg.senderMemberName) : (next.senderId === msg.senderId));
              const isLastInGroup =
                !next || (next as any).isSkeleton || !isSameNextMember || isTimeBreakWithNext;

              const currentMsgDateStr = msg.created_at
                ? formatDateDivider(msg.created_at)
                : null;
              const prevMsgDateStr = prev && !(prev as any).isSkeleton && prev.created_at
                ? formatDateDivider(prev.created_at)
                : null;
              const showDateDivider =
                currentMsgDateStr && currentMsgDateStr !== prevMsgDateStr;

              const isFirstUnread =
                initialUnread > 0 &&
                virtualRow.index === displayMessages.length - initialUnread;

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
                  <div className="h-[1px] bg-[var(--primary)]/40 flex-1" />
                  <span className="text-[11px] font-bold text-[var(--primary)] mx-4 shrink-0 bg-[var(--primary)]/10 px-3 py-1 rounded-full">
                    {initialUnread} Unread message{initialUnread !== 1 ? 's' : ''}
                  </span>
                  <div className="h-[1px] bg-[var(--primary)]/40 flex-1" />
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
                onReaction={onReaction}
                currentUserId={currentUserId}
                conversationId={conversationId}
                otherUserType={otherUserType}
                otherUserSlug={otherUserSlug}
                onMediaLoad={() => {
                  if (shouldScrollToBottomRef.current && scrollRef.current) {
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
            rowVirtualizer.scrollToIndex(displayMessages.length - 1, { align: 'end' });
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

export default MessageList;
