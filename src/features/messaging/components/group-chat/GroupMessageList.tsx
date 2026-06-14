import React, { useEffect, useRef, useLayoutEffect, useState, forwardRef } from "react";
import { Message } from "@/types/messaging";
import SystemMessage from "./SystemMessage";
import { Loader2, ChevronDown } from "lucide-react";
import MessageBubble from "../ui/MessageBubble";
import MessageSkeleton from "../skeletons/MessageSkeleton";


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

    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            // Because GroupMessageList doesn't use virtualizer, we have to rely on standard DOM scrolling.
            // Wait for render, then scroll to the specific element.
            setTimeout(() => {
                const unreadElement = document.getElementById('unread-divider');
                if (unreadElement && scrollRef.current) {
                    scrollRef.current.scrollTop = unreadElement.offsetTop - 50;
                    setHasScrolledToUnread(true);
                    updateShouldScrollToBottom(false);
                }
            }, 100);
        } else if ((shouldScrollToBottomRef.current || isNewMessageSent) && displayMessages.length > 0) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }

        if (lastMessage) {
            lastMessageIdRef.current = lastMessage.id;
        }
    }, [displayMessages, initialUnread, hasScrolledToUnread, scrollRef, currentUserId]);

    // Record scroll height before skeletons are prepended
    useLayoutEffect(() => {
        if (isLoadingMore && !wasLoadingMoreRef.current && scrollRef.current) {
            prevScrollHeightRef.current = scrollRef.current.scrollHeight;
            wasLoadingMoreRef.current = true;
        }
    }, [isLoadingMore, scrollRef]);

    // Record scroll height before real messages are prepended (skeletons replaced)
    useLayoutEffect(() => {
        if (!isLoadingMore && wasLoadingMoreRef.current && scrollRef.current) {
            prevScrollHeightRef.current = scrollRef.current.scrollHeight;
            wasLoadingMoreRef.current = false;
        }
    }, [isLoadingMore, scrollRef]);

    // Perform scroll adjustment when displayMessages changes to retain scroll position
    useLayoutEffect(() => {
        if (prevScrollHeightRef.current > 0 && scrollRef.current) {
            const newScrollHeight = scrollRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeightRef.current;
            if (diff > 0) {
                scrollRef.current.scrollTop = scrollRef.current.scrollTop + diff;
                prevScrollHeightRef.current = 0;
            }
        }
    }, [displayMessages, scrollRef]);

    // Check if we should auto-scroll for next update
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        
        const isScrollingUp = scrollTop < lastScrollTopRef.current;
        lastScrollTopRef.current = scrollTop;

        const isAtBottom = scrollHeight - scrollTop - clientHeight < 15;

        if (scrollTop < 50 && hasMore && !isLoadingMore && onLoadMore) {
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

            <div className="space-y-1">
                {displayMessages.map((msg, index) => {
                    if ((msg as any).isSkeleton) {
                        return (
                            <MessageSkeleton
                                key={msg.id}
                                sender={(msg as any).sender}
                                type={(msg as any).type}
                            />
                        );
                    }

                    const previousMsg = displayMessages[index - 1];

                    const currentMsgDateStr = msg.created_at ? formatDateDivider(msg.created_at) : null;
                    const prevMsgDateStr = previousMsg && !(previousMsg as any).isSkeleton && previousMsg.created_at ? formatDateDivider(previousMsg.created_at) : null;
                    const showDateDivider = currentMsgDateStr && currentMsgDateStr !== prevMsgDateStr;

                    const isFirstUnread = initialUnread > 0 && index === displayMessages.length - initialUnread;

                    const renderDateDivider = showDateDivider && !isFirstUnread && (
                        <div className="flex items-center justify-center my-6 px-4 md:px-8 w-full">
                            <div className="h-[1px] bg-border flex-1" />
                            <span className="text-[11px] font-['Poppins'] text-muted-foreground mx-4 lowercase first-letter:uppercase shrink-0">
                                {currentMsgDateStr}
                            </span>
                            <div className="h-[1px] bg-border flex-1" />
                        </div>
                    );

                    const renderUnreadDivider = isFirstUnread && (
                        <div id="unread-divider" className="flex items-center justify-center my-6 px-4 md:px-8 w-full">
                            <div className="h-[1px] bg-[var(--primary)]/40 flex-1" />
                            <span className="text-[11px] font-bold text-[var(--primary)] mx-4 shrink-0 bg-[var(--primary)]/10 px-3 py-1 rounded-full">
                                {initialUnread} Unread message{initialUnread !== 1 ? 's' : ''}
                            </span>
                            <div className="h-[1px] bg-[var(--primary)]/40 flex-1" />
                        </div>
                    );

                    if (msg.type === 'system') {
                        return (
                            <React.Fragment key={msg.id || index}>
                                {renderDateDivider}
                                {renderUnreadDivider}
                                <SystemMessage message={msg} currentUserId={currentUserId} />
                            </React.Fragment>
                        );
                    }

                    const senderId = msg.senderId;
                    const isMe = msg.sender === 'me' || (senderId && currentUserId && String(senderId) === String(currentUserId));

                    const isPreviousSystem = previousMsg?.type === 'system';
                    const previousSenderId = previousMsg && !(previousMsg as any).isSkeleton ? (previousMsg.senderId || ((previousMsg.sender === 'me') ? currentUserId : `unknown-${index - 1}`)) : null;

                    const isMoreThanOneMinute = (date1?: string, date2?: string) => {
                        if (!date1 || !date2) return true;
                        return Math.abs(new Date(date1).getTime() - new Date(date2).getTime()) > 60000;
                    };

                    const isTimeBreakWithPrev = previousMsg && !(previousMsg as any).isSkeleton ? isMoreThanOneMinute(msg.created_at, previousMsg.created_at) : false;
                    const nextMsg = displayMessages[index + 1];
                    const isTimeBreakWithNext = nextMsg && !(nextMsg as any).isSkeleton ? isMoreThanOneMinute(msg.created_at, nextMsg.created_at) : false;

                    const isFirstInGroup = index === 0 || isPreviousSystem || (previousMsg as any)?.isSkeleton || previousSenderId !== senderId || isTimeBreakWithPrev || !!showDateDivider || !!isFirstUnread;
                    const nextSenderId = nextMsg && !(nextMsg as any).isSkeleton ? (nextMsg.senderId || ((nextMsg.sender === 'me') ? currentUserId : `unknown-${index + 1}`)) : null;
                    const isLastInGroup = !nextMsg || (nextMsg as any).isSkeleton || nextMsg.type === 'system' || nextSenderId !== senderId || isTimeBreakWithNext;

                    const showSenderName = !isMe && isFirstInGroup;
                    const showAvatar = isFirstInGroup;

                    const groupedMsg = { ...msg, isFirstInGroup, isLastInGroup };

                    return (
                        <React.Fragment key={msg.id || index}>
                            {renderDateDivider}
                            {renderUnreadDivider}
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
                                showTime={groupedMsg.isLastInGroup || msg.time !== nextMsg?.time}
                                isGroup={true}
                                onMediaClick={onMediaClick}
                                onMediaLoad={handleMediaLoad}
                                onReply={onReply}
                                onReplyClick={handleReplyClick}
                                isHighlighted={highlightedMessageId === msg.id}
                                onReaction={onReaction}
                                currentUserId={currentUserId}
                            />
                        </React.Fragment>
                    );
                })}
            </div>
            </div>
            
            {showScrollButton && !shouldScrollToBottom && (
                <button
                    className="absolute bottom-4 right-4 md:right-8 bg-white border border-border shadow-lg text-primary p-2 rounded-full z-50 hover:bg-muted transition-all"
                    onClick={() => {
                        if (scrollRef.current) {
                            scrollRef.current.scrollTo({
                                top: scrollRef.current.scrollHeight,
                                behavior: 'smooth'
                            });
                        }
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
