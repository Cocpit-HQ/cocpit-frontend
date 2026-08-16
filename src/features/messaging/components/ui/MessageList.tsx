import React, { useEffect, useRef, useLayoutEffect, useState, useMemo, forwardRef } from "react"
import { Message } from "@/types/messaging"
import MessageBubble from "./MessageBubble"
import { Loader2, ChevronDown } from "lucide-react"
import MessageSkeleton from "../skeletons/MessageSkeleton"
import { formatTime } from "@/lib/mappers/messaging.mapper"

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
  chatAvatar?: string
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(({ messages, onLoadMore, hasMore, isLoadingMore, onAction, editingMessageId, onSaveEdit, onCancelEdit, selectedMessageId, onMessageClick, onMediaClick, unreadCount = 0, isOpponentOnline, isGroup, onReply, onReaction, currentUserId, conversationId, otherUserType, otherUserSlug, chatAvatar }, ref) => {
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
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      const firstUnreadIndex = Math.max(0, displayMessages.length - initialUnread);
      const el = document.getElementById(`msg-${displayMessages[firstUnreadIndex]?.id}`);
      if (el) {
        el.scrollIntoView({ block: "start" });
      }
      setHasScrolledToUnread(true);
      updateShouldScrollToBottom(false);
    } else if ((shouldScrollToBottomRef.current || isNewMessageSent) && displayMessages.length > 0) {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      
      const timer = setTimeout(() => {
        if (scrollRef.current && (shouldScrollToBottomRef.current || isNewMessageSent)) {
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
    currentUserId,
  ]);

  // Record scroll height before skeletons are prepended
  useLayoutEffect(() => {
    if (isLoadingMore && !wasLoadingMoreRef.current && scrollRef.current) {
      prevScrollHeightRef.current = scrollRef.current.scrollHeight
      wasLoadingMoreRef.current = true
    }
  }, [isLoadingMore, scrollRef]);

  // Adjust scroll position after prepending items to keep viewport stable
  useLayoutEffect(() => {
    if (wasLoadingMoreRef.current && !isLoadingMore && scrollRef.current) {
      const newScrollHeight = scrollRef.current.scrollHeight
      const diff = newScrollHeight - prevScrollHeightRef.current
      if (diff > 0) {
        scrollRef.current.scrollTop += diff
      }
      wasLoadingMoreRef.current = false
    }
  }, [isLoadingMore, displayMessages.length, scrollRef]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const currentScrollTop = target.scrollTop

    // 1. Detect scrolling UP vs DOWN
    const isScrollingUp = currentScrollTop < lastScrollTopRef.current
    lastScrollTopRef.current = currentScrollTop

    // 2. Infinite scroll trigger at TOP
    if (currentScrollTop < 50 && hasMore && !isLoadingMore) {
      onLoadMore?.()
    }

    // 3. User intentionality check for bottom stickiness
    const isNearBottom = target.scrollHeight - currentScrollTop - target.clientHeight < 100

    if (isNearBottom) {
      updateShouldScrollToBottom(true)
      setShowScrollButton(false)
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    } else {
      if (isScrollingUp) {
        updateShouldScrollToBottom(false)
        setShowScrollButton(true)
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
        scrollTimerRef.current = setTimeout(() => {
          setShowScrollButton(false)
        }, 3000)
      }
    }
  }

  const isMoreThanOneMinute = (date1?: string, date2?: string) => {
    if (!date1 || !date2) return true;
    return (
      Math.abs(
        new Date(date1).getTime() - new Date(date2).getTime(),
      ) > 60000
    );
  };

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

  const { lastReadMessageId, lastSentMessageId } = useMemo(() => {
    let lastReadId: string | null = null;
    let lastSentId: string | null = null;

    for (let i = 0; i < displayMessages.length; i++) {
      const m = displayMessages[i];
      if ((m as any)?.isSkeleton || m.type === 'system') continue;

      const isMe = m.sender === 'me' || (m.senderId && currentUserId && String(m.senderId) === String(currentUserId));
      if (isMe) {
        lastSentId = m.id;
        if (m.read_at) {
          lastReadId = m.id;
        }
      }
    }

    return { lastReadMessageId: lastReadId, lastSentMessageId: lastSentId };
  }, [displayMessages, currentUserId]);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide relative bg-background"
      >
      {hasMore && (
        <div className="flex justify-center py-2">
          {isLoadingMore ? null : <div className="h-4" />}
        </div>
      )}

          <div className="flex flex-col w-full min-h-full justify-end">
            {displayMessages.map((msg, index) => {
              const prev = displayMessages[index - 1];
              const next = displayMessages[index + 1];

              if ((msg as any)?.isSkeleton) {
                return (
                  <div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className="w-full"
                  >
                    <MessageSkeleton
                      sender={(msg as any).sender}
                      type={(msg as any).type}
                    />
                  </div>
                );
              }

              const currentMsgDateStr = msg.created_at
                ? formatDateDivider(msg.created_at)
                : null;
              const prevMsgDateStr = prev && !(prev as any).isSkeleton && prev.created_at
                ? formatDateDivider(prev.created_at)
                : null;
              const nextMsgDateStr = next && !(next as any).isSkeleton && next.created_at
                ? formatDateDivider(next.created_at)
                : null;

              const showDateDivider =
                currentMsgDateStr && currentMsgDateStr !== prevMsgDateStr;
              const isDateBreakWithNext =
                currentMsgDateStr && nextMsgDateStr && currentMsgDateStr !== nextMsgDateStr;

              // Grouping logic: continuous messages from the same sender remain in one sequence
              const isSameSenderMember = prev && !(prev as any).isSkeleton && 
                prev.sender === msg.sender && 
                ((prev.senderMemberName && msg.senderMemberName) ? (prev.senderMemberName === msg.senderMemberName) : (prev.senderId === msg.senderId));
              const isFirstInGroup =
                !prev || (prev as any).isSkeleton || !isSameSenderMember || showDateDivider;

              const isSameNextMember = next && !(next as any).isSkeleton && 
                next.sender === msg.sender && 
                ((next.senderMemberName && msg.senderMemberName) ? (next.senderMemberName === msg.senderMemberName) : (next.senderId === msg.senderId));
              const isLastInGroup =
                !next || (next as any).isSkeleton || !isSameNextMember || isDateBreakWithNext;

              const isFirstUnread =
                initialUnread > 0 &&
                index === displayMessages.length - initialUnread;

              const groupedMsg = { ...msg, isFirstInGroup, isLastInGroup };
              const msgTimeDisplay = formatTime(msg.created_at || msg.time);
              const nextTimeDisplay = next && !(next as any).isSkeleton ? formatTime(next.created_at || next.time) : null;
              const isTimeChangedWithNext = msgTimeDisplay !== nextTimeDisplay;

              const isMe = msg.sender === 'me' || (msg.senderId && currentUserId && String(msg.senderId) === String(currentUserId));
              const statusLabel: 'Seen' | 'Delivered' | null = isMe
                ? (msg.id === lastReadMessageId
                    ? 'Seen'
                    : (msg.id === lastSentMessageId && msg.id !== lastReadMessageId)
                    ? 'Delivered'
                    : null)
                : null;

              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className="w-full"
                >
                  {showDateDivider && !isFirstUnread && (
                    <div className="flex items-center justify-center my-6 px-4 md:px-8 w-full">
                      <span className="text-[11px] font-['Poppins'] text-muted-foreground lowercase first-letter:uppercase shrink-0">
                        {currentMsgDateStr}
                      </span>
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
                    showTime={groupedMsg.isLastInGroup || isTimeChangedWithNext} // Show time when minute changes or last in group
                    statusLabel={statusLabel}
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
                    chatAvatar={chatAvatar}
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
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }
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
