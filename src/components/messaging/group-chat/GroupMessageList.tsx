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
}

const GroupMessageList = forwardRef<HTMLDivElement, GroupMessageListProps>(({ messages, currentUserId, onLoadMore, hasMore, isLoadingMore, onMessageClick, selectedMessageId, editingMessageId, onSaveEdit, onCancelEdit, onAction, onMediaClick }, ref) => {
    const localRef = useRef<HTMLDivElement>(null);
    const scrollRef = (ref as React.RefObject<HTMLDivElement>) || localRef;
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
    const [prevScrollHeight, setPrevScrollHeight] = useState(0);

    // Auto-scroll to bottom logic
    useEffect(() => {
        if (shouldScrollToBottom && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, shouldScrollToBottom, scrollRef]);

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

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 scrollbar-hide scroll-smooth"
        >
            {hasMore && (
                <div className="flex justify-center py-2">
                    {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <div className="h-4" />}
                </div>
            )}

            <div className="space-y-4">
                {messages.map((msg, index) => {
                    if (msg.type === 'system') {
                        return <SystemMessage key={msg.id || index} message={msg} currentUserId={currentUserId} />;
                    }

                    const senderId = msg.senderId;
                    const isMe = msg.sender === 'me' || (senderId && currentUserId && String(senderId) === String(currentUserId));

                    const previousMsg = messages[index - 1];
                    const isPreviousSystem = previousMsg?.type === 'system';
                    const previousSenderId = previousMsg ? (previousMsg.senderId || ((previousMsg.sender === 'me') ? currentUserId : `unknown-${index - 1}`)) : null;

                    // Show name if:
                    // 1. It's not me
                    // 2. AND (First message OR Previous was system OR Previous sender is different)
                    const showSenderName = !isMe && (index === 0 || isPreviousSystem || previousSenderId !== senderId);

                    return (
                        <MessageBubble
                            key={msg.id || index}
                            message={msg}
                            isEditing={editingMessageId === msg.id}
                            onSaveEdit={(text) => onSaveEdit?.(msg.id, text)}
                            onCancelEdit={onCancelEdit}
                            isSelected={selectedMessageId === msg.id}
                            onMessageClick={onMessageClick}
                            onAction={onAction}
                            showSenderName={showSenderName}
                            onMediaClick={onMediaClick}
                            onMediaLoad={handleMediaLoad}
                        />
                    );
                })}
            </div>
        </div>
    );
});

GroupMessageList.displayName = "GroupMessageList";

export default GroupMessageList;
