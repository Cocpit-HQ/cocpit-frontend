import React, { useEffect, useRef, useLayoutEffect, useState, useMemo, forwardRef } from "react";
import { Message } from "@/types/messaging";
import SystemMessage from "./SystemMessage";
import { Loader2, ChevronDown, AtSign } from "lucide-react";
import MessageBubble from "../ui/MessageBubble";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import { formatTime } from "@/lib/mappers/messaging.mapper";

const BROADCAST_MENTION_REGEX = /(?:@\[?(?:everyone|all)\]?(?:\([^)]+\))?|(?<![a-zA-Z0-9._%+-])@(?:everyone|every\s+one|all)\b|\b@?(?:everyone|every\s+one|all)\b)/i;
const STRUCTURED_MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

interface GroupMessageListProps {
    messages: Message[];
    currentUserId: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoadingMore?: boolean;
    onMessageClick?: (message: Message) => void;
    selectedMessageId?: string;
    selectedMessageIds?: string[];
    editingMessageId?: string | null;
    onSaveEdit?: (messageId: string, text: string) => void;
    onCancelEdit?: () => void;
    onAction?: (action: string, message: Message) => void;
    onMediaClick?: (url: string, type: 'image' | 'video' | 'document', name?: string) => void;
    unreadCount?: number;
    onReply?: (message: Message) => void;
    onReaction?: (message: Message, emoji: string) => void;
    pinnedMessageId?: string | null;
    conversationId?: string;
    groupMembers?: any[];
    highlightedMessageId?: string | null;
}

const GroupMessageList = forwardRef<HTMLDivElement, GroupMessageListProps>(({
    messages,
    currentUserId,
    onLoadMore,
    hasMore,
    isLoadingMore,
    onMessageClick,
    selectedMessageId,
    selectedMessageIds,
    editingMessageId,
    onSaveEdit,
    onCancelEdit,
    onAction,
    onMediaClick,
    unreadCount = 0,
    onReply,
    onReaction,
    pinnedMessageId,
    conversationId,
    groupMembers,
    highlightedMessageId: propHighlightedMessageId,
}, ref) => {
    const localRef = useRef<HTMLDivElement>(null);
    const scrollRef = (ref as React.RefObject<HTMLDivElement>) || localRef;
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
    const lastScrollTopRef = useRef<number>(0);
    const shouldScrollToBottomRef = useRef<boolean>(true);

    const selectedIdSet = useMemo(() => {
        if (selectedMessageIds && selectedMessageIds.length > 0) {
            return new Set(selectedMessageIds);
        }
        if (selectedMessageId) {
            return new Set([selectedMessageId]);
        }
        return new Set<string>();
    }, [selectedMessageIds, selectedMessageId]);

    const updateShouldScrollToBottom = (val: boolean) => {
        shouldScrollToBottomRef.current = val;
        setShouldScrollToBottom(val);
    };

    const prevScrollHeightRef = useRef<number>(0);
    const wasLoadingMoreRef = useRef<boolean>(false);
    const lastMessageIdRef = useRef<string | null>(null);
    const prevMessageCountRef = useRef<number>(0);
    const isReactingRef = useRef<boolean>(false);

    const handleReaction = (message: Message, emoji: string) => {
        isReactingRef.current = true;
        updateShouldScrollToBottom(false);
        onReaction?.(message, emoji);
    };

    // Freeze the initial unread count so it doesn't disappear when marked as read
    const [initialUnread, setInitialUnread] = useState(unreadCount);
    const [hasScrolledToUnread, setHasScrolledToUnread] = useState(false);

    // Track conversation changes and read message boundaries (WhatsApp style: only unread mentions trigger the @ button)
    const lastConversationIdRef = useRef<string | undefined>(conversationId);
    const hasInitializedRef = useRef<boolean>(false);
    const readMessageIdsRef = useRef<Set<string>>(new Set());
    const firstKnownMessageIdRef = useRef<string | null>(null);

    const [seenMentionIds, setSeenMentionIds] = useState<Set<string>>(() => new Set());
    const [offscreenMentionIds, setOffscreenMentionIds] = useState<string[]>([]);

    if (lastConversationIdRef.current !== conversationId) {
        lastConversationIdRef.current = conversationId;
        hasInitializedRef.current = false;
        readMessageIdsRef.current.clear();
        firstKnownMessageIdRef.current = null;
        prevMessageCountRef.current = 0;
        setInitialUnread(unreadCount);
        setSeenMentionIds(new Set());
        setOffscreenMentionIds([]);
    }

    // Initialize read history boundaries once messages are loaded
    if (messages.length > 0) {
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
            firstKnownMessageIdRef.current = messages[0]?.id || null;

            if (initialUnread <= 0) {
                // Opened with 0 unread messages: ALL existing messages are already read
                for (let i = 0; i < messages.length; i++) {
                    readMessageIdsRef.current.add(messages[i].id);
                }
            } else {
                // Opened with initialUnread > 0: only messages before the unread window are read
                const unreadStartIndex = Math.max(0, messages.length - initialUnread);
                for (let i = 0; i < unreadStartIndex; i++) {
                    readMessageIdsRef.current.add(messages[i].id);
                }
            }
        } else if (firstKnownMessageIdRef.current) {
            // Check if older messages were prepended by pagination
            const previousFirstIdx = messages.findIndex(m => m.id === firstKnownMessageIdRef.current);
            if (previousFirstIdx > 0) {
                // Messages from 0 up to previousFirstIdx are older paginated history -> mark as read
                for (let i = 0; i < previousFirstIdx; i++) {
                    readMessageIdsRef.current.add(messages[i].id);
                }
                firstKnownMessageIdRef.current = messages[0]?.id || null;
            }
        }
    }

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

    const [localHighlightedMessageId, setLocalHighlightedMessageId] = useState<string | null>(null);
    const effectiveHighlightedMessageId = propHighlightedMessageId || localHighlightedMessageId;
    const [showScrollButton, setShowScrollButton] = useState(false);
    const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollThrottleRafRef = useRef<number | null>(null);

    // Cancel animation frame on unmount
    useEffect(() => {
        return () => {
            if (scrollThrottleRafRef.current) {
                cancelAnimationFrame(scrollThrottleRafRef.current);
            }
        };
    }, []);

    // Unread @ Mention detection and jump functionality (WhatsApp style)
    const currentMember = useMemo(() => {
        return groupMembers?.find(m => String(m.user_id || m.id) === String(currentUserId));
    }, [groupMembers, currentUserId]);

    const isMessageMentioningMe = (msg: Message): boolean => {
        const isMe = msg.sender === 'me' || (msg.senderId && currentUserId && String(msg.senderId) === String(currentUserId));
        if (isMe || msg.type === 'system') return false;

        const text = msg.text || msg.text_content || '';

        // 1. Broadcast mention: @everyone or @all (plain text, structured tag @[Everyone](...), or word boundary)
        if (BROADCAST_MENTION_REGEX.test(text)) return true;
        if ((msg as any).is_everyone_mention || (msg as any).mention_all) return true;

        // 2. Mentioned users array (individual or broadcast everyone)
        if (msg.mentioned_users && msg.mentioned_users.length > 0) {
            const isMentionedInArray = msg.mentioned_users.some(u => {
                const uId = String(u.user_id || (u as any).id || '').toLowerCase();
                const uAccount = String(u.account_name || '').toLowerCase();
                const uName = String(u.full_name || '').toLowerCase();

                // Check broadcast in mentioned_users
                if (uId === 'everyone' || uId === 'all' || uAccount === 'everyone' || uAccount === 'all' || uName === 'everyone' || uName === 'all') {
                    return true;
                }

                if (String(u.user_id) === String(currentUserId)) return true;
                if (currentMember?.account_name && u.account_name && u.account_name.toLowerCase() === currentMember.account_name.toLowerCase()) return true;
                if (currentMember?.full_name && u.full_name && u.full_name.toLowerCase() === currentMember.full_name.toLowerCase()) return true;
                return false;
            });
            if (isMentionedInArray) return true;
        }

        // 3. Structured markdown mention: @[Full Name](user:id) or @[Full Name](id)
        STRUCTURED_MENTION_REGEX.lastIndex = 0;
        let match;
        while ((match = STRUCTURED_MENTION_REGEX.exec(text)) !== null) {
            const displayName = match[1].toLowerCase();
            const rawId = match[2];
            const cleanId = rawId.replace(/^(user|org|company):/i, '');

            // Broadcast structured match
            if (displayName === 'everyone' || displayName === 'all' || cleanId.toLowerCase() === 'everyone' || cleanId.toLowerCase() === 'all') {
                return true;
            }

            if (String(cleanId) === String(currentUserId)) return true;
            if (currentMember?.account_name && cleanId.toLowerCase() === currentMember.account_name.toLowerCase()) return true;
        }

        // 4. Plain @handle in text
        if (currentMember?.account_name) {
            const handleRegex = new RegExp(`@${currentMember.account_name}\\b`, 'i');
            if (handleRegex.test(text)) return true;
        }

        return false;
    };

    const candidateMentions = useMemo(() => {
        return messages.filter(m => {
            // Must NOT be an already-read historical message
            if (readMessageIdsRef.current.has(m.id)) return false;
            // Must NOT have been already seen/read during this session
            if (seenMentionIds.has(m.id)) return false;
            // Must mention me or @everyone
            return isMessageMentioningMe(m);
        });
    }, [messages, currentUserId, currentMember, seenMentionIds]);

    const updateOffscreenMentions = () => {
        if (!scrollRef.current) return;
        if (candidateMentions.length === 0) {
            if (offscreenMentionIds.length > 0) setOffscreenMentionIds([]);
            return;
        }
        const container = scrollRef.current;
        const containerRect = container.getBoundingClientRect();

        const offscreen: string[] = [];
        const newlySeen: string[] = [];

        for (const m of candidateMentions) {
            if (seenMentionIds.has(m.id) || readMessageIdsRef.current.has(m.id)) continue;

            const el = document.getElementById(`msg-${m.id}`);
            if (!el) {
                offscreen.push(m.id);
            } else {
                const elRect = el.getBoundingClientRect();
                const isVisible = elRect.bottom > containerRect.top + 20 && elRect.top < containerRect.bottom - 20;
                if (isVisible) {
                    newlySeen.push(m.id);
                } else {
                    offscreen.push(m.id);
                }
            }
        }

        if (newlySeen.length > 0) {
            newlySeen.forEach(id => {
                readMessageIdsRef.current.add(id);
            });
            setSeenMentionIds(prev => {
                const next = new Set(prev);
                newlySeen.forEach(id => next.add(id));
                return next;
            });
        }

        setOffscreenMentionIds(offscreen);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            updateOffscreenMentions();
        }, 150);
        return () => clearTimeout(timer);
    }, [candidateMentions, messages.length]);

    const handleJumpToNextMention = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (offscreenMentionIds.length === 0) return;

        const targetId = offscreenMentionIds[0];
        const el = document.getElementById(`msg-${targetId}`);

        if (el && scrollRef.current) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        setLocalHighlightedMessageId(targetId);
        setTimeout(() => {
            setLocalHighlightedMessageId(prev => (prev === targetId ? null : prev));
        }, 2500);

        readMessageIdsRef.current.add(targetId);
        setSeenMentionIds(prev => new Set(prev).add(targetId));
        setOffscreenMentionIds(prev => prev.filter(id => id !== targetId));
    };

    // Skeletons list for pagination loading (older messages)
    const displayMessages = useMemo(() => {
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

    const handleReplyClick = (messageId: string) => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setLocalHighlightedMessageId(messageId);
            setTimeout(() => setLocalHighlightedMessageId(null), 1000);
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

        if (isReactingRef.current) {
            isReactingRef.current = false;
            return;
        }

        const lastMessage = displayMessages[displayMessages.length - 1];
        const isNewMessageSent = !!(
            lastMessage &&
            lastMessage.id !== lastMessageIdRef.current &&
            !lastMessage.id.startsWith('skeleton-') &&
            (lastMessage.sender === 'me' || lastMessage.senderId === currentUserId)
        );
        const isNewMessageAdded = displayMessages.length > prevMessageCountRef.current;
        prevMessageCountRef.current = displayMessages.length;

        if (initialUnread > 0 && !hasScrolledToUnread && displayMessages.length > 0) {
            const targetId = firstUnreadMessageId || displayMessages[Math.max(0, displayMessages.length - initialUnread)]?.id;
            const el = targetId ? document.getElementById(`msg-${targetId}`) : null;
            if (el) {
                el.scrollIntoView({ block: "start" });
            }
            setHasScrolledToUnread(true);
            updateShouldScrollToBottom(false);
        } else if ((isNewMessageSent || (shouldScrollToBottomRef.current && isNewMessageAdded)) && displayMessages.length > 0) {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }

            const timer = setTimeout(() => {
                if (scrollRef.current && (isNewMessageSent || (shouldScrollToBottomRef.current && isNewMessageAdded))) {
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
        firstUnreadMessageId,
    ]);

    // Record scroll height before skeletons are prepended
    useLayoutEffect(() => {
        if (isLoadingMore && !wasLoadingMoreRef.current && scrollRef.current) {
            prevScrollHeightRef.current = scrollRef.current.scrollHeight;
            wasLoadingMoreRef.current = true;
        }
    }, [isLoadingMore, scrollRef]);

    // Adjust scroll position after prepending items to keep viewport stable
    useLayoutEffect(() => {
        if (wasLoadingMoreRef.current && !isLoadingMore && scrollRef.current) {
            const newScrollHeight = scrollRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeightRef.current;
            if (diff > 0) {
                scrollRef.current.scrollTop += diff;
            }
            wasLoadingMoreRef.current = false;
        }
    }, [isLoadingMore, displayMessages.length, scrollRef]);

    // Keep last message visible when container resizes (e.g. input expands up to 12 lines)
    useEffect(() => {
        const el = scrollRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;

        const observer = new ResizeObserver(() => {
            if (isReactingRef.current) return;
            if (shouldScrollToBottomRef.current) {
                el.scrollTop = el.scrollHeight;
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const currentScrollTop = target.scrollTop;

        // 1. Detect scrolling UP vs DOWN
        const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
        lastScrollTopRef.current = currentScrollTop;

        // Update offscreen mentions list as user scrolls (throttled with RAF to prevent layout thrashing)
        if (candidateMentions.length > 0) {
            if (!scrollThrottleRafRef.current) {
                scrollThrottleRafRef.current = requestAnimationFrame(() => {
                    updateOffscreenMentions();
                    scrollThrottleRafRef.current = null;
                });
            }
        }

        // 2. Infinite scroll trigger at TOP
        if (currentScrollTop < 50 && hasMore && !isLoadingMore) {
            onLoadMore?.();
        }

        // 3. User intentionality check for bottom stickiness
        const isNearBottom = target.scrollHeight - currentScrollTop - target.clientHeight < 100;

        if (isNearBottom) {
            updateShouldScrollToBottom(true);
            setShowScrollButton(false);
            if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        } else {
            updateShouldScrollToBottom(false);
            if (isScrollingUp) {
                setShowScrollButton(true);
                if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
                scrollTimerRef.current = setTimeout(() => {
                    setShowScrollButton(false);
                }, 3000);
            }
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
        <div className="flex flex-col flex-1 h-full min-h-0 relative">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide relative bg-[var(--ds-bg)]"
            >
                {hasMore && (
                    <div className="flex justify-center py-2">
                        {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin text-[var(--ds-text-secondary)]" /> : <div className="h-4" />}
                    </div>
                )}

                <div className="flex flex-col w-full min-h-full justify-end">
                    {displayMessages.map((msg, index) => {
                        const prev = displayMessages[index - 1];
                        const next = displayMessages[index + 1];

                        // Skeleton row
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

                        // Date + unread dividers
                        const currentMsgDateStr = msg.created_at ? formatDateDivider(msg.created_at) : null;
                        const prevMsgDateStr = prev && !(prev as any).isSkeleton && prev.created_at ? formatDateDivider(prev.created_at) : null;
                        const nextMsgDateStr = next && !(next as any).isSkeleton && next.created_at ? formatDateDivider(next.created_at) : null;

                        const showDateDivider = currentMsgDateStr && currentMsgDateStr !== prevMsgDateStr;
                        const isDateBreakWithNext = currentMsgDateStr && nextMsgDateStr && currentMsgDateStr !== nextMsgDateStr;

                        const isFirstUnread = Boolean(firstUnreadMessageId && msg.id === firstUnreadMessageId);

                        // Group-specific: sender-based grouping
                        const senderId = msg.senderId;
                        const isMe = msg.sender === 'me' || (senderId && currentUserId && String(senderId) === String(currentUserId));

                        const isPreviousSystem = prev?.type === 'system';
                        const previousSenderId = prev && !(prev as any).isSkeleton
                            ? (prev.senderId || ((prev.sender === 'me') ? currentUserId : `unknown-${index - 1}`))
                            : null;

                        const isFirstInGroup = index === 0 || isPreviousSystem || (prev as any)?.isSkeleton || previousSenderId !== senderId || !!showDateDivider || !!isFirstUnread;
                        const nextSenderId = next && !(next as any).isSkeleton
                            ? (next.senderId || ((next.sender === 'me') ? currentUserId : `unknown-${index + 1}`))
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
                                id={`msg-${msg.id}`}
                                className="w-full"
                            >
                                {/* Date divider */}
                                {showDateDivider && !isFirstUnread && (
                                    <div className="flex items-center justify-center my-6 px-4 md:px-8 w-full">
                                        <span className="justify-center text-[var(--ds-text-secondary)] text-[10px] font-normal font-['DM_Sans'] leading-3 shrink-0 lowercase first-letter:uppercase">
                                            {currentMsgDateStr}
                                        </span>
                                    </div>
                                )}
                                {/* Unread divider */}
                                {isFirstUnread && (
                                    <div className="flex items-center justify-center my-6 px-4 md:px-8 w-full">
                                        <div className="h-[1px] bg-[var(--ds-accent)]/40 flex-1" />
                                        <span className="text-[10px] font-medium font-['DM_Sans'] text-[var(--ds-accent)] mx-3 shrink-0 bg-[var(--ds-accent)]/10 px-2.5 py-0.5 rounded-full">
                                            {initialUnread} Unread message{initialUnread !== 1 ? 's' : ''}
                                        </span>
                                        <div className="h-[1px] bg-[var(--ds-accent)]/40 flex-1" />
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
                                        isSelected={selectedIdSet.has(msg.id)}
                                        hasSelection={selectedIdSet.size > 0}
                                        onAction={onAction}
                                        showSenderName={showSenderName}
                                        showAvatar={groupedMsg.isLastInGroup}
                                        showTime={groupedMsg.isLastInGroup || isTimeChangedWithNext}
                                        statusLabel={statusLabel}
                                        isGroup={true}
                                        onMediaClick={onMediaClick}
                                        onMediaLoad={() => {
                                            if (shouldScrollToBottomRef.current && scrollRef.current) {
                                                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                                            }
                                        }}
                                        onReply={onReply}
                                        onReplyClick={handleReplyClick}
                                        isHighlighted={effectiveHighlightedMessageId === msg.id}
                                        onReaction={handleReaction}
                                        currentUserId={currentUserId}
                                        conversationId={conversationId}
                                        isPinned={Boolean(pinnedMessageId && String(msg.id) === String(pinnedMessageId))}
                                        groupMembers={groupMembers}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating Action Buttons: @ Mention Jump Button + Scroll to Bottom Button */}
            <div className="absolute bottom-4 right-4 md:right-8 flex flex-col items-center gap-2.5 z-50 pointer-events-none">
                {/* 1. @ Mention Redirect Button (WhatsApp style, matching Figma Frame 2610153 & Frame 2609902) */}
                {offscreenMentionIds.length > 0 && (
                    <button
                        type="button"
                        onClick={handleJumpToNextMention}
                        className="pointer-events-auto relative w-10 h-10 rounded-full bg-[var(--ds-surface-1)] border border-[var(--ds-border)] shadow-lg flex items-center justify-center text-white hover:bg-[var(--ds-surface-2)] transition-all cursor-pointer group animate-in fade-in zoom-in-95 duration-200"
                        aria-label={`Jump to mention (${offscreenMentionIds.length} unread)`}
                        title={`Jump to unread mention (${offscreenMentionIds.length} remaining)`}
                    >
                        {/* Frame 2610153: @ text in DM Sans 16px/21px #FFFFFF */}
                        <span className="font-['DM_Sans'] font-normal text-[16px] leading-[21px] text-white text-center select-none flex items-center justify-center">
                            @
                        </span>
                        {/* Frame 2609902: 14x14px badge at left: 28px, top: 0px */}
                        <div className="absolute left-[28px] top-0 h-[14px] min-w-[14px] px-1 bg-[var(--ds-accent)] rounded-[7px] flex items-center justify-center shadow-md">
                            <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-center text-white select-none">
                                {offscreenMentionIds.length > 99 ? '99+' : offscreenMentionIds.length}
                            </span>
                        </div>
                    </button>
                )}

                {/* 2. Scroll to bottom down arrow button (matching Figma Frame 2610152: 40x40, rounded 999px, 20x20 arrow) */}
                {showScrollButton && !shouldScrollToBottom && (
                    <button
                        type="button"
                        className="pointer-events-auto w-10 h-10 rounded-full bg-[var(--ds-surface-1)] border border-[var(--ds-border)] shadow-lg flex items-center justify-center text-[var(--ds-text-primary)] hover:text-[var(--ds-accent)] hover:bg-[var(--ds-surface-2)] transition-all cursor-pointer"
                        onClick={() => {
                            if (scrollRef.current) {
                                scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
                            }
                        }}
                        onMouseEnter={handleScrollButtonMouseEnter}
                        onMouseLeave={handleScrollButtonMouseLeave}
                        aria-label="Scroll to bottom"
                        title="Scroll to bottom"
                    >
                        <ChevronDown className="w-5 h-5 text-[var(--ds-text-primary)]" />
                    </button>
                )}
            </div>
        </div>
    );
});

GroupMessageList.displayName = "GroupMessageList";

export default GroupMessageList;
