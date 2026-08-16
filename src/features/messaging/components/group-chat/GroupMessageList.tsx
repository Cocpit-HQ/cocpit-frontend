import React, { useEffect, useRef, useLayoutEffect, useState, useMemo, forwardRef } from "react";
import { Message } from "@/types/messaging";
import SystemMessage from "./SystemMessage";
import { Loader2, ChevronDown } from "lucide-react";
import MessageBubble from "../ui/MessageBubble";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import { useVirtualizer } from "@tanstack/react-virtual";
import { formatTime } from "@/lib/mappers/messaging.mapper";


interface GroupMessageListProps {
    messages: Message[];
    currentUserId: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoadingMore?: boolean;
    onMessageClick?: (message: Message) => void;
    selectedMessageId?: string;
    editingMessageId?: string | null;
    onSaveEdit?: (messageId: string, text: string) => void;
    onCancelEdit?: () => void;
    onAction?: (action: string, message: Message) => void;
    onMediaClick?: (url: string, type: 'image' | 'video' | 'document', name?: string) => void;
    unreadCount?: number;
    onReply?: (message: Message) => void;
    onReaction?: (message: Message, emoji: string) => void;
}

const GroupMessageList = forwardRef<HTMLDivElement, GroupMessageListProps>(({ messages, currentUserId, onLoadMore, hasMore, isLoadingMore, onMessageClick, selectedMessageId, editingMessageId, onSaveEdit, onCancelEdit, onAction, onMediaClick, unreadCount = 0, onReply, onReaction }, ref) => {
    const localRef = useRef<HTMLDivElement>(null);
    const scrollRef = (ref as React.RefObject<HTMLDivElement>) || localRef;
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
    const lastScrollTopRef = useRef<number>(0);
    const shouldScrollToBottomRef = useRef<boolean>(true);

    const updateShouldScrollToBottom = (val: boolean) => {
        shouldScrollToBottomRef.current = val;
        setShouldScrollToBottom(val);
    };

    const prevScrollHeightRef = useRef<number>(0);
    const wasLoadingMoreRef = useRef<boolean>(false);
    const lastMessageIdRef = useRef<string | null>(null);

    const [initialUnread] = useState(unreadCount);
    const [hasScrolledToUnread, setHasScrolledToUnread] = useState(false);

    const firstUnreadMessageId = useMemo(() => {
        if (initialUnread <= 0 || messages.length === 0) return null;
        const unreadIdx = messages.length - initialUnread;
        if (unreadIdx >= 0 && unreadIdx < messages.length) {
            for (let i = unreadIdx; i < messages.length; i++) {
                const m = messages[i];
                const isMsgMe = m.sender === 'me' || (m.senderId && currentUserId && String(m.senderId) === String(currentUserId));
                if (!isMsgMe && m.type !== 'system') {
                    return m.id;
                }
            }
        }
        return null;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Skeletons list for pagination loading (older messages)
    const displayMessages = React.useMemo(() => {
        if (isLoadingMore) {
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

    // Virtualizer — same as MessageList
    const rowVirtualizer = useVirtualizer({
        count: displayMessages.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 60,
        overscan: 10,
        getItemKey: (index) => displayMessages[index]?.id || index,
    });

    // Track message state signature to immediately re-measure virtual rows on deletion/edits
    const messageStateSignature = React.useMemo(() => {
        return displayMessages
            .map((m) => `${m.id}:${m.is_deleted_for_everyone ? '1' : '0'}:${m.is_deleted_for_me ? '1' : '0'}:${m.text?.length || 0}`)
            .join('|');
    }, [displayMessages]);

    useEffect(() => {
        // Immediately force re-measurement of all virtual rows when deletion/edit states change
        rowVirtualizer.measure();
    }, [messageStateSignature, rowVirtualizer]);

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

    // Auto-scroll logic — same as MessageList
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
            rowVirtualizer.scrollToIndex(firstUnreadIndex, { align: "start" });
            setHasScrolledToUnread(true);
            updateShouldScrollToBottom(false);
        } else if ((shouldScrollToBottomRef.current || isNewMessageSent) && displayMessages.length > 0) {
            rowVirtualizer.scrollToIndex(displayMessages.length - 1, { align: "end" });
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
    }, [displayMessages, initialUnread, hasScrolledToUnread, rowVirtualizer, currentUserId]);

    // Scroll to bottom when virtualizer total size changes (media/entity loading)
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
            updateShouldScrollToBottom(false);
            prevScrollHeightRef.current = scrollHeight;
            onLoadMore();
        } else {
            if (isScrollingUp) {
                updateShouldScrollToBottom(false);
            } else {
                updateShouldScrollToBottom(isAtBottom);
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
    };

    const handleMediaLoad = () => {
        if (shouldScrollToBottomRef.current && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
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
            year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
        });
    };

    const { lastReadMessageId, lastSentMessageId } = useMemo(() => {
        let lastReadId: string | null = null;
        let lastSentId: string | null = null;

        for (let i = 0; i < displayMessages.length; i++) {
            const m = displayMessages[i];
            if ((m as any)?.isSkeleton || m.type === 'system') continue;

            const senderId = m.senderId;
            const isMe = m.sender === 'me' || (senderId && currentUserId && String(senderId) === String(currentUserId));
            if (isMe) {
                lastSentId = m.id;
                const isRead = (m.active_member_count !== undefined && m.seen_count !== undefined && m.active_member_count > 0 && m.seen_count >= m.active_member_count) || m.status === 'read' || Boolean(m.read_at);
                if (isRead) {
                    lastReadId = m.id;
                }
            }
        }

        return { lastReadMessageId: lastReadId, lastSentMessageId: lastSentId };
    }, [displayMessages, currentUserId]);

    return (
        <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide relative bg-background"
            >
                {hasMore && (
                    <div className="flex justify-center py-2">
                        {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <div className="h-4" />}
                    </div>
                )}

                {/* Virtualizer container — same structure as MessageList */}
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

                        // Skeleton row
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

                        // Date + unread dividers
                        const currentMsgDateStr = msg.created_at ? formatDateDivider(msg.created_at) : null;
                        const prevMsgDateStr = prev && !(prev as any).isSkeleton && prev.created_at ? formatDateDivider(prev.created_at) : null;
                        const showDateDivider = currentMsgDateStr && currentMsgDateStr !== prevMsgDateStr;

                        const isFirstUnread = Boolean(firstUnreadMessageId && msg.id === firstUnreadMessageId);

                        // Group-specific: sender-based grouping
                        const senderId = msg.senderId;
                        const isMe = msg.sender === 'me' || (senderId && currentUserId && String(senderId) === String(currentUserId));

                        const isPreviousSystem = prev?.type === 'system';
                        const previousSenderId = prev && !(prev as any).isSkeleton
                            ? (prev.senderId || ((prev.sender === 'me') ? currentUserId : `unknown-${virtualRow.index - 1}`))
                            : null;

                        const isMoreThanOneMinute = (date1?: string, date2?: string) => {
                            if (!date1 || !date2) return true;
                            return Math.abs(new Date(date1).getTime() - new Date(date2).getTime()) > 60000;
                        };

                        const nextMsgDateStr = next && !(next as any).isSkeleton && next.created_at
                            ? formatDateDivider(next.created_at)
                            : null;
                        const isDateBreakWithNext = currentMsgDateStr && nextMsgDateStr && currentMsgDateStr !== nextMsgDateStr;

                        const isFirstInGroup = virtualRow.index === 0 || isPreviousSystem || (prev as any)?.isSkeleton || previousSenderId !== senderId || !!showDateDivider || !!isFirstUnread;
                        const nextSenderId = next && !(next as any).isSkeleton
                            ? (next.senderId || ((next.sender === 'me') ? currentUserId : `unknown-${virtualRow.index + 1}`))
                            : null;
                        const isLastInGroup = !next || (next as any).isSkeleton || next.type === 'system' || nextSenderId !== senderId || isDateBreakWithNext;

                        // Group-specific: show sender name for others' first messages
                        const showSenderName = !isMe && isFirstInGroup;

                        const groupedMsg = { ...msg, isFirstInGroup, isLastInGroup };
                        const msgTimeDisplay = formatTime(msg.created_at || msg.time);
                        const nextTimeDisplay = next && !(next as any).isSkeleton ? formatTime(next.created_at || next.time) : null;
                        const isTimeChangedWithNext = msgTimeDisplay !== nextTimeDisplay;

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
                                {/* Date divider */}
                                {showDateDivider && !isFirstUnread && (
                                    <div className="flex items-center justify-center my-6 px-4 md:px-8 w-full">
                                        <span className="text-[11px] font-['Poppins'] text-muted-foreground lowercase first-letter:uppercase shrink-0">
                                            {currentMsgDateStr}
                                        </span>
                                    </div>
                                )}
                                {/* Unread divider */}
                                {isFirstUnread && (
                                    <div className="flex items-center justify-center my-6 px-4 md:px-8 w-full">
                                        <div className="h-[1px] bg-[var(--primary)]/40 flex-1" />
                                        <span className="text-[11px] font-bold text-[var(--primary)] mx-4 shrink-0 bg-[var(--primary)]/10 px-3 py-1 rounded-full">
                                            {initialUnread} Unread message{initialUnread !== 1 ? 's' : ''}
                                        </span>
                                        <div className="h-[1px] bg-[var(--primary)]/40 flex-1" />
                                    </div>
                                )}
                                {/* System message */}
                                {msg.type === 'system' ? (
                                    <SystemMessage message={msg} currentUserId={currentUserId} />
                                ) : (
                                    <MessageBubble
                                        message={groupedMsg}
                                        isEditing={editingMessageId === msg.id}
                                        onSaveEdit={(text) => onSaveEdit?.(msg.id, text)}
                                        onCancelEdit={onCancelEdit}
                                        onMessageClick={onMessageClick}
                                        isSelected={selectedMessageId === msg.id}
                                        onAction={onAction}
                                        showSenderName={showSenderName}
                                        showAvatar={groupedMsg.isLastInGroup}
                                        showTime={groupedMsg.isLastInGroup || isTimeChangedWithNext}
                                        statusLabel={statusLabel}
                                        isGroup={true}
                                        onMediaClick={onMediaClick}
                                        onMediaLoad={handleMediaLoad}
                                        onReply={onReply}
                                        onReplyClick={handleReplyClick}
                                        isHighlighted={highlightedMessageId === msg.id}
                                        onReaction={onReaction}
                                        currentUserId={currentUserId}
                                    />
                                )}
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
    );
});

GroupMessageList.displayName = "GroupMessageList";

export default GroupMessageList;
