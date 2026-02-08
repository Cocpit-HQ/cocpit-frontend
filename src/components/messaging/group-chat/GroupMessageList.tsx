import React, { useEffect, useRef, useLayoutEffect, useState, forwardRef } from "react";
import { Message } from "@/types/messaging";
import SystemMessage from "./SystemMessage";
import { Loader2 } from "lucide-react";
import { Check, CheckCheck } from "lucide-react";


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
}

const GroupMessageItem = ({
    msg,
    index,
    messages,
    currentUserId,
    onMessageClick,
    selectedMessageId,
    isEditing,
    onSaveEdit,
    onCancelEdit
}: {
    msg: Message,
    index: number,
    messages: Message[],
    currentUserId: string,
    onMessageClick?: (message: Message) => void,
    selectedMessageId?: string,
    isEditing?: boolean,
    onSaveEdit?: (messageId: string, text: string) => void,
    onCancelEdit?: () => void
}) => {
    const isSystem = msg.type === 'system';

    if (isSystem) {
        return <SystemMessage key={msg.id || index} message={msg} currentUserId={currentUserId} />;
    }

    // specific group chat logic
    const senderId = msg.senderId;
    const isMe = msg.sender === 'me' || (senderId && currentUserId && String(senderId) === String(currentUserId));

    const previousMsg = messages[index - 1];
    const isPreviousSystem = previousMsg?.type === 'system';
    const previousSenderId = previousMsg ? (previousMsg.senderId || ((previousMsg.sender === 'me') ? currentUserId : `unknown-${index - 1}`)) : null;

    // Show name if:
    // 1. It's not me
    // 2. AND (First message OR Previous was system OR Previous sender is different)
    const showSenderName = !isMe && (index === 0 || isPreviousSystem || previousSenderId !== senderId);

    const isSelected = selectedMessageId === msg.id;

    // Editing State
    const [editText, setEditText] = useState(msg.text || msg.text_content || "");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing) {
            setEditText(msg.text || msg.text_content || "");
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
                    // Initial resize
                    textareaRef.current.style.height = "auto";
                    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
                }
            }, 0);
        }
    }, [isEditing, msg]);

    // Auto-resize on text change
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [editText]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSaveEdit?.(msg.id, editText);
        } else if (e.key === 'Escape') {
            onCancelEdit?.();
        }
    };

    return (
        <div
            className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group relative`}
            onClick={() => !msg.is_deleted_for_everyone && onMessageClick && onMessageClick(msg)}
        >
            <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%] md:max-w-[60%] ${msg.is_deleted_for_everyone ? "cursor-default" : "cursor-pointer"}`}>
                {showSenderName && (
                    <span className="text-xs text-muted-foreground mb-1 ml-1 font-medium">
                        {msg.senderName || "Deleted User"}
                    </span>
                )}
                <div
                    className={`px-3 py-2 md:px-4 md:py-2.5 relative break-words w-full transition-colors ${isSelected ? "bg-primary/20 ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                        } ${msg.is_deleted_for_everyone
                            ? `italic text-sm py-2 px-4 shadow-none rounded-3xl ${isMe ? "bg-primary text-primary-foreground/75" : "bg-muted text-muted-foreground"}`
                            : isMe
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                : "bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border shadow-sm"
                        }`}
                >
                    {isEditing ? (
                        <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                            <textarea
                                ref={textareaRef}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-transparent outline-none resize-none p-0 text-inherit leading-snug overflow-hidden"
                                rows={1}
                            />
                        </div>
                    ) : (
                        <>
                            <span className="leading-snug block text-sm md:text-base">
                                {msg.is_deleted_for_everyone ? "This message was deleted" : (msg.text || msg.text_content)}
                                {msg.is_edited && !msg.is_deleted_for_everyone && <span className="text-[10px] opacity-60 ml-1 italic">(edited)</span>}
                            </span>

                            {/* Metadata: Time + Ticks */}
                            <div className={`flex items-center gap-1 justify-end mt-1 ${msg.is_deleted_for_everyone ? (isMe ? "text-primary-foreground/60" : "text-muted-foreground") : (isMe ? "text-primary-foreground/70" : "text-muted-foreground/70")}`}>
                                <span className="text-[10px]">
                                    {msg.created_at
                                        ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : msg.time
                                    }
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const GroupMessageList = forwardRef<HTMLDivElement, GroupMessageListProps>(({ messages, currentUserId, onLoadMore, hasMore, isLoadingMore, onMessageClick, selectedMessageId, editingMessageId, onSaveEdit, onCancelEdit }, ref) => {
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

        if (scrollTop === 0 && hasMore && !isLoadingMore && onLoadMore) {
            setShouldScrollToBottom(false);
            setPrevScrollHeight(scrollHeight);
            onLoadMore();
        } else {
            setShouldScrollToBottom(isAtBottom);
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
                {messages.map((msg, index) => (
                    <GroupMessageItem
                        key={msg.id || index}
                        msg={msg}
                        index={index}
                        messages={messages}
                        currentUserId={currentUserId}
                        onMessageClick={onMessageClick}
                        selectedMessageId={selectedMessageId}
                        isEditing={editingMessageId === msg.id}
                        onSaveEdit={onSaveEdit}
                        onCancelEdit={onCancelEdit}
                    />
                ))}
            </div>
        </div>
    );
});



GroupMessageList.displayName = "GroupMessageList";

export default GroupMessageList;
