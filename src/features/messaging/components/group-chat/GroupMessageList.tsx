import React, { useEffect, useRef, useLayoutEffect, useState, forwardRef } from "react";
import { Message } from "@/types/messaging";
import SystemMessage from "./SystemMessage";
import { Loader2 } from "lucide-react";
import MessageBubble from "../ui/MessageBubble";


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
}

const GroupMessageList = forwardRef<HTMLDivElement, GroupMessageListProps>(({ messages, currentUserId, onLoadMore, hasMore, isLoadingMore, onMessageClick, selectedMessageId, editingMessageId, onSaveEdit, onCancelEdit, onAction, onMediaClick, unreadCount = 0 }, ref) => {
    const localRef = useRef<HTMLDivElement>(null);
    const scrollRef = (ref as React.RefObject<HTMLDivElement>) || localRef;
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
    const [prevScrollHeight, setPrevScrollHeight] = useState(0);

    const [initialUnread] = useState(unreadCount);
    const [hasScrolledToUnread, setHasScrolledToUnread] = useState(false);

    // Auto-scroll logic
    useEffect(() => {
        if (!scrollRef.current) return;

        if (initialUnread > 0 && !hasScrolledToUnread && messages.length > 0) {
            // Because GroupMessageList doesn't use virtualizer, we have to rely on standard DOM scrolling.
            // Wait for render, then scroll to the specific element.
            setTimeout(() => {
                const unreadElement = document.getElementById('unread-divider');
                if (unreadElement && scrollRef.current) {
                    scrollRef.current.scrollTop = unreadElement.offsetTop - 50;
                    setHasScrolledToUnread(true);
                    setShouldScrollToBottom(false);
                }
            }, 100);
        } else if (shouldScrollToBottom) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, shouldScrollToBottom, initialUnread, hasScrolledToUnread, scrollRef]);

    // Handle scroll retention when loading more
    useLayoutEffect(() => {
        if (isLoadingMore && scrollRef.current) {
            setPrevScrollHeight(scrollRef.current.scrollHeight);
            setShouldScrollToBottom(false);
        } else if (!isLoadingMore && prevScrollHeight > 0 && scrollRef.current) {
            const newScrollHeight = scrollRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeight;
            if (diff > 0) {
                scrollRef.current.scrollTop = diff;
            }
            setPrevScrollHeight(0);
        }
    }, [isLoadingMore, prevScrollHeight, scrollRef]);

    // Check if we should auto-scroll for next update
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

        if (scrollTop < 50 && hasMore && !isLoadingMore && onLoadMore) {
            setShouldScrollToBottom(false);
            setPrevScrollHeight(scrollHeight);
            onLoadMore();
        } else {
            setShouldScrollToBottom(isAtBottom);
        }
    };

    const handleMediaLoad = () => {
        if (shouldScrollToBottom && scrollRef.current) {
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
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 scrollbar-hide scroll-smooth relative bg-background"
        >
            {hasMore && (
                <div className="flex justify-center py-2">
                    {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <div className="h-4" />}
                </div>
            )}

            <div className="space-y-1">
                {messages.map((msg, index) => {
                    const previousMsg = messages[index - 1];

                    const currentMsgDateStr = msg.created_at ? formatDateDivider(msg.created_at) : null;
                    const prevMsgDateStr = previousMsg?.created_at ? formatDateDivider(previousMsg.created_at) : null;
                    const showDateDivider = currentMsgDateStr && currentMsgDateStr !== prevMsgDateStr;

                    const isFirstUnread = initialUnread > 0 && index === messages.length - initialUnread;

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
                            <div className="h-[1px] bg-[#4F46E5]/40 flex-1" />
                            <span className="text-[11px] font-bold text-[#4F46E5] mx-4 shrink-0 bg-[#4F46E5]/10 px-3 py-1 rounded-full">
                                {initialUnread} Unread message{initialUnread !== 1 ? 's' : ''}
                            </span>
                            <div className="h-[1px] bg-[#4F46E5]/40 flex-1" />
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
                    const previousSenderId = previousMsg ? (previousMsg.senderId || ((previousMsg.sender === 'me') ? currentUserId : `unknown-${index - 1}`)) : null;

                    const isMoreThanOneMinute = (date1?: string, date2?: string) => {
                        if (!date1 || !date2) return true;
                        return Math.abs(new Date(date1).getTime() - new Date(date2).getTime()) > 60000;
                    };

                    const isTimeBreakWithPrev = previousMsg ? isMoreThanOneMinute(msg.created_at, previousMsg.created_at) : false;
                    const nextMsg = messages[index + 1];
                    const isTimeBreakWithNext = nextMsg ? isMoreThanOneMinute(msg.created_at, nextMsg.created_at) : false;

                    const isFirstInGroup = index === 0 || isPreviousSystem || previousSenderId !== senderId || isTimeBreakWithPrev || !!showDateDivider || !!isFirstUnread;
                    const nextSenderId = nextMsg ? (nextMsg.senderId || ((nextMsg.sender === 'me') ? currentUserId : `unknown-${index + 1}`)) : null;
                    const isLastInGroup = !nextMsg || nextMsg.type === 'system' || nextSenderId !== senderId || isTimeBreakWithNext;

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
                            />
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
});

GroupMessageList.displayName = "GroupMessageList";

export default GroupMessageList;
