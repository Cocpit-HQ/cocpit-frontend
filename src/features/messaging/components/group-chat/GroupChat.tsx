"use client"

import React, { useState, useEffect, useRef } from "react";
import { useGroupChat } from "./groupChat.context";
import GroupHeader from "./GroupHeader";
import GroupMessageList from "./GroupMessageList";
import UnifiedMessageInput from "../ui/UnifiedMessageInput";
import GroupDetails from "./GroupDetails";
import AddMemberModal from "./AddMemberModal";
import { Loader2 } from "lucide-react";
import { useQueryClient, useQuery, useMutation, useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import { sendMessage as sendGroupMessage } from "@/services/api/group-chat";
import { editMessage, deleteMessage, addOrUpdateReaction, clearReaction } from "@/services/api/messaging";
import { Message } from "@/types/messaging";
import { formatTimeAgo, isPostUrl, isJobUrl, mapBackendMessageToMessage } from "@/lib/mappers/messaging.mapper";
import { useSocket } from "@/context/SocketContext";
import { TypingPayload } from "@/types/socket";
import MessageInfoModal from "../../MessageInfoModal";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import MediaPreviewModal from "../ui/MediaPreviewModal";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import ChatSkeleton from "../ui/ChatSkeleton";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useSocial } from "@/context/SocialContext";
import { cn } from "@/lib/utils";
import { getMessageCopyText } from "@/features/messaging/utils/messageCopy";

interface GroupChatProps {
    groupId: string;
    currentUser: { id?: string; user_id?: string;[key: string]: any }; // Fallback since user object structure varies
    messages?: Message[]; // Pass messages optionally if managed by parent
    onBack?: () => void;
    unreadCount?: number;
    isMuted?: boolean;
}

export default function GroupChat({ groupId, currentUser, messages = [], onBack, unreadCount = 0, isMuted = false }: GroupChatProps) {
    const { activeGroup, isLoading, error, inviteMember, isInactive, leaveGroup } = useGroupChat();
    const { activeProfile } = useActiveProfile();
    const { toast } = useToast();
    const [activeView, setActiveView] = useState<'chat' | 'info' | 'edit'>('chat');
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const queryClient = useQueryClient();
    const { socket, setActiveConversationId } = useSocket();
    const { isBlocked } = useSocial();
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isMessageSelected, setIsMessageSelected] = useState(false);
    const [isMessageInfoOpen, setIsMessageInfoOpen] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [previewMedia, setPreviewMedia] = useState<{ url: string, type: 'image' | 'video' | 'document', name?: string } | null>(null);
    const [replyingTo, setReplyingTo] = useState<{
        messageId: string;
        senderName: string;
        content: string;
        isMe?: boolean;
        mediaType?: 'image' | 'video' | 'document' | string | null;
        mediaName?: string | null;
        mediaUrl?: string | null;
    } | null>(null);
    const [leaveAction, setLeaveAction] = useState<'left' | 'removed' | null>(null);

    const handleMediaClick = (url: string, type: 'image' | 'video' | 'document', name?: string) => {
        setPreviewMedia({ url, type, name });
    };

    const handleDeleteForMe = React.useCallback(async (targetMsg: Message) => {
        const msgId = targetMsg.id;
        // Optimistic Update
        queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
            if (!old) return undefined;
            return {
                ...old,
                pages: old.pages.map(page => page.map(m => {
                    if (m.id === msgId) {
                        return {
                            ...m,
                            text: "This message was deleted for you.",
                            is_deleted_for_me: true
                        };
                    }
                    return m;
                }))
            };
        });

        try {
            await deleteMessage(msgId, false);
            toast({ description: "Message deleted successfully" });
        } catch (e: any) {
            console.error("Failed to delete for me", e);
            const errorMsg = e?.response?.data?.message || e?.message || "Failed to delete message";
            toast({ title: "Error", description: errorMsg, variant: "destructive" });
            queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
        }
    }, [groupId, queryClient, toast]);

    const handleDeleteForEveryone = React.useCallback(async (targetMsg: Message) => {
        const msgId = targetMsg.id;

        // Immediately clear selection
        setSelectedMessage(null);
        setIsMessageSelected(false);

        // Optimistic Update
        queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
            if (!old) return undefined;
            return {
                ...old,
                pages: old.pages.map(page => page.map(m => {
                    if (m.id === msgId) {
                        return {
                            ...m,
                            text: "This message was deleted for everyone.",
                            text_content: "This message was deleted for everyone.",
                            sharedPost: null,
                            sharedProfile: null,
                            sharedProfileId: undefined,
                            sharedPostId: undefined,
                            entityType: undefined,
                            entityId: undefined,
                            media: [],
                            reactions: [],
                            is_deleted: true,
                            is_deleted_for_everyone: true
                        };
                    }
                    return m;
                }))
            };
        });

        try {
            await deleteMessage(msgId, true);
            toast({ description: "Message deleted for everyone" });
        } catch (e: any) {
            console.error("Failed to delete for everyone", e);
            const errorMsg = e?.response?.data?.message || e?.message || "Failed to delete message for everyone";
            toast({ title: "Error", description: errorMsg, variant: "destructive" });
            queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
        }
    }, [groupId, queryClient, toast]);

    const handleMessageAction = React.useCallback((action: string, msg?: Message) => {
        const targetMsg = msg || selectedMessage;
        if (!targetMsg) return;

        if (action === 'info') {
            setIsMessageInfoOpen(true);
        } else if (action === 'copy') {
            if (targetMsg) {
                navigator.clipboard.writeText(getMessageCopyText(targetMsg));
            }
            setSelectedMessage(null);
            setIsMessageSelected(false);
        } else if (action === 'edit') {
            setEditingMessageId(targetMsg.id);
            setSelectedMessage(null);
            setIsMessageSelected(false);
        } else if (action === 'delete_for_me') {
            handleDeleteForMe(targetMsg);
            setSelectedMessage(null);
            setIsMessageSelected(false);
        } else if (action === 'delete_for_everyone') {
            handleDeleteForEveryone(targetMsg);
            setSelectedMessage(null);
            setIsMessageSelected(false);
        } else if (action === 'close') {
            setSelectedMessage(null);
            setIsMessageSelected(false);
        }
    }, [selectedMessage, handleDeleteForMe, handleDeleteForEveryone]);

    const handleMessageClick = React.useCallback((message: Message) => {
        if (selectedMessage?.id === message.id) {
            setSelectedMessage(null); // Toggle off
            setIsMessageSelected(false);
        } else {
            setSelectedMessage(message);
            setIsMessageSelected(true);
        }
    }, [selectedMessage]);

    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

    const editMessageMutation = useMutation({
        mutationFn: async ({ messageId, text }: { messageId: string, text: string }) => {
            return editMessage(messageId, text);
        },
        onSuccess: (_, variables) => {
            setEditingMessageId(null);
            queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    pages: old.pages.map(page => page.map(m => {
                        if (m.id === variables.messageId) {
                            return {
                                ...m,
                                text: variables.text,
                                text_content: variables.text,
                                is_edited: true,
                            };
                        }
                        return m;
                    }))
                };
            });
        },
        onError: (error) => {
            console.error("Failed to edit message:", error);
            toast({
                title: "Error",
                description: "Failed to edit message",
                variant: "destructive"
            });
        }
    });

    const handleSaveEdit = (messageId: string, text: string) => {
        editMessageMutation.mutate({ messageId, text });
    };

    const [typingMap, setTypingMap] = useState<Map<string, string>>(new Map());
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTypingRef = useRef<number>(0);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isMessagesLoading
    } = useInfiniteQuery({
        queryKey: ['messages', groupId],
        queryFn: async ({ pageParam }) => {
            const { getMessages } = await import("@/services/api/messaging");
            const { mapBackendMessageToMessage } = await import("@/lib/mappers/messaging.mapper");
            const backendMessages = await getMessages(groupId, 50, pageParam);
            return backendMessages.map(m => mapBackendMessageToMessage(m, currentUser.id || currentUser.user_id, activeProfile?.type === "COMPANY" ? activeProfile.id : undefined));
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.length < 50) return undefined;
            return lastPage[0]?.created_at;
        },
        initialPageParam: null as string | null,
        enabled: !!groupId,
        staleTime: 0,
    });

    const fetchedMessages = React.useMemo(() => {
        if (!data) return [];
        const allMsgs = [...data.pages].reverse().flatMap(page => page);

        // Collect IDs and text content of confirmed (non-temp) messages
        const realMessageIds = new Set<string>();
        const realTexts = new Set<string>();
        allMsgs.forEach(m => {
            if (m && m.id && !m.id.startsWith('temp-')) {
                realMessageIds.add(m.id);
                if (m.text) realTexts.add(m.text.trim());
            }
        });

        const seenIds = new Set<string>();
        return allMsgs.filter(m => {
            if (!m || !m.id) return false;
            if (seenIds.has(m.id)) return false;
            // If it's an optimistic placeholder and a confirmed message with same text is already loaded, filter it out
            if (m.id.startsWith('temp-') && m.text && realTexts.has(m.text.trim())) {
                return false;
            }
            seenIds.add(m.id);
            return true;
        });
    }, [data]);

    useEffect(() => {
        setActiveView('chat')
    }, [groupId]);

    useEffect(() => {
        if (!socket) return;

        // Reset typing state when group changes
        setTypingMap(new Map());

        // Inform context of active conversation to suppress notifications
        setActiveConversationId(groupId);

        // Join the conversation room (standardized with ChatWindow)
        socket.emit('joinConversation', { conversationId: groupId });

        // Explicitly join group room
        socket.emit('joinGroup', { groupId: groupId });

        const handleNewMessage = (message: any) => {
            // Filter
            if (message.conversation_id !== groupId && message.group_id !== groupId) return;

            const myId = currentUser.id || currentUser.user_id;
            const isMe = String(message.sender_id || message.senderId) === String(myId);
            const senderMember = activeGroup?.members?.find((m: any) => String(m.user_id) === String(message.sender_id || message.senderId));
            const isSenderBlocked = message.sender_id && !isMe && (
                message.is_unavailable === true ||
                message.is_blocked === true ||
                message.isBlocked === true ||
                Boolean(senderMember?.is_blocked_by_other) ||
                Boolean(senderMember?.is_blocked) ||
                Boolean(senderMember?.is_unavailable) ||
                isBlocked(message.sender_id)
            );

            const uiMessage = mapBackendMessageToMessage(message, myId, activeProfile?.type === "COMPANY" ? activeProfile.id : undefined);
            if (isSenderBlocked) {
                uiMessage.is_unavailable = true;
                uiMessage.isBlocked = true;
                uiMessage.senderName = "Unknown user";
                uiMessage.senderAvatar = undefined;
            }

            // Clear typing indicator for the sender
            setTypingMap(prev => {
                const next = new Map(prev);
                next.delete(message.sender_id);
                return next;
            });

            queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
                if (!old) return undefined;

                // Check if real ID already exists in any page
                const existsPage = old.pages.findIndex(page => page.some(m => m.id === uiMessage.id));

                if (existsPage !== -1) {
                    // Update existing message
                    const newPages = [...old.pages];
                    newPages[existsPage] = newPages[existsPage].map(m => {
                        if (m.id === uiMessage.id) {
                            return {
                                ...m,
                                ...uiMessage,
                                media: uiMessage.media && uiMessage.media.length > 0 ? uiMessage.media : m.media,
                                sharedPost: uiMessage.sharedPost || m.sharedPost,
                                sharedProfile: uiMessage.sharedProfile || m.sharedProfile,
                                sharedProfileId: uiMessage.sharedProfileId || m.sharedProfileId,
                                sharedProfileType: uiMessage.sharedProfileType || m.sharedProfileType,
                                entityType: uiMessage.entityType || m.entityType,
                                entityId: uiMessage.entityId || m.entityId,
                                replied_msg_id: uiMessage.replied_msg_id || m.replied_msg_id,
                                repliedMessage: uiMessage.repliedMessage || m.repliedMessage,
                            };
                        }
                        return m;
                    });
                    return { ...old, pages: newPages };
                }

                const newPages = [...old.pages];

                // Handle optimistic update replacement for own messages in FIRST page
                if (isMe) {
                    const firstPage = newPages[0];
                    const optimisticMatch = firstPage.find(m =>
                        m.id.startsWith('temp-') &&
                        (m.text === uiMessage.text || (m.text_content && m.text_content === uiMessage.text))
                    );
                    if (optimisticMatch) {
                        newPages[0] = firstPage.map(m => m.id === optimisticMatch.id ? uiMessage : m);
                        return { ...old, pages: newPages };
                    }
                }

                // Append to first page (most recent)
                newPages[0] = [...newPages[0], uiMessage];
                return { ...old, pages: newPages };
            });

            // Update last message in specific conversation without refetching all conversation lists? 
            // Or just invalidate to be safe.
            // queryClient.invalidateQueries({ queryKey: ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'] }); // Handled by MessagingPage via socket or manual update

            // We could also mark as read if focused, just like ChatWindow
        };

        const handleTyping = (payload: TypingPayload) => {
            // Check if matches this group
            if (payload.conversationId === groupId && payload.isGroup) {
                // Ignore self (though backend shouldn't send it to self usually)
                const myId = currentUser.id || currentUser.user_id;
                if (payload.senderId && payload.senderId !== myId) {
                    if (payload.username) {
                        setTypingMap(prev => new Map(prev).set(payload.senderId!, payload.username!));
                    }
                }
            }
        };

        const handleStopTyping = (payload: TypingPayload) => {
            if (payload.conversationId === groupId && payload.isGroup) {
                if (payload.senderId) {
                    setTypingMap(prev => {
                        const next = new Map(prev);
                        next.delete(payload.senderId!);
                        return next;
                    });
                }
            }
        };

        const handleMessageDeleted = (payload: { messageId: string; conversationId: string; deleteType?: string }) => {
            if (payload.conversationId !== groupId) return;
            const isDeleteForMe = payload.deleteType === 'me';

            queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    pages: old.pages.map(page => page.map(m => {
                        if (m.id === payload.messageId) {
                            if (isDeleteForMe) {
                                return {
                                    ...m,
                                    text: "This message was deleted for you.",
                                    text_content: "This message was deleted for you.",
                                    sharedPost: null,
                                    sharedProfile: null,
                                    media: [],
                                    reactions: [],
                                    is_deleted: true,
                                    is_deleted_for_me: true
                                };
                            }
                            return {
                                ...m,
                                text: "This message was deleted for everyone.",
                                text_content: "This message was deleted for everyone.",
                                sharedPost: null,
                                sharedProfile: null,
                                sharedProfileId: undefined,
                                sharedPostId: undefined,
                                shared_post_id: undefined,
                                entityType: undefined,
                                entityId: undefined,
                                media: [],
                                reactions: [],
                                is_deleted: true,
                                is_deleted_for_everyone: true
                            };
                        }
                        return m;
                    }))
                };
            });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        };

        const handleMemberLeft = (payload: any) => {
            const myId = currentUser.id || currentUser.user_id;
            if (payload.groupId === groupId && String(payload.userId) === String(myId)) {
                setLeaveAction(payload.action_type || 'left');
            }
        };

        const handleRemovedFromGroup = (payload: any) => {
            if (payload.groupId === groupId) {
                setLeaveAction(payload.action_type || 'removed');
            }
        };

        const handleBlockOrDeactivate = (payload?: any) => {
            if (payload && (payload.blocker_id || payload.target_id || payload.userId || payload.user_id)) {
                const myId = currentUser.id || currentUser.user_id;
                const blockedId = String(payload.blocker_id) === String(myId)
                    ? String(payload.target_id || payload.userId || payload.user_id)
                    : String(payload.blocker_id || payload.target_id || payload.userId || payload.user_id);
                const isBlockedEvent = payload.is_blocked !== false;
                
                // Optimistically update group details cache
                queryClient.setQueryData(['group-details', groupId], (oldGroup: any) => {
                    if (!oldGroup || !oldGroup.members) return oldGroup;
                    return {
                        ...oldGroup,
                        members: oldGroup.members.map((m: any) => {
                            if (String(m.user_id) === blockedId) {
                                return {
                                    ...m,
                                    is_blocked: isBlockedEvent,
                                    is_blocked_by_other: isBlockedEvent,
                                    is_unavailable: isBlockedEvent,
                                    full_name: isBlockedEvent ? 'Unknown user' : m.full_name,
                                    avatar_url: isBlockedEvent ? null : m.avatar_url
                                };
                            }
                            return m;
                        })
                    };
                });
            }

            queryClient.resetQueries({ queryKey: ['messages', groupId], exact: false });
            queryClient.resetQueries({ queryKey: ['groupDetails', groupId], exact: false });
            queryClient.resetQueries({ queryKey: ['group-details', groupId], exact: false });
            queryClient.resetQueries({ queryKey: ['sharedPost'], exact: false });
            queryClient.resetQueries({ queryKey: ['profilePreview'], exact: false });
            queryClient.resetQueries({ queryKey: ['entityPreview'], exact: false });
            queryClient.resetQueries({ queryKey: ['jobContext'], exact: false });
            queryClient.refetchQueries({ queryKey: ['messages', groupId], type: 'all' });
            queryClient.refetchQueries({ queryKey: ['groupDetails', groupId], type: 'all' });
            queryClient.refetchQueries({ queryKey: ['group-details', groupId], type: 'all' });
            queryClient.refetchQueries({ queryKey: ['conversations'], type: 'all' });
            queryClient.refetchQueries({ queryKey: ['sharedPost'], type: 'all' });
            queryClient.refetchQueries({ queryKey: ['profilePreview'], type: 'all' });
            queryClient.refetchQueries({ queryKey: ['entityPreview'], type: 'all' });
            queryClient.refetchQueries({ queryKey: ['jobContext'], type: 'all' });
        };

        const handleMessageEdited = (payload: { messageId: string; conversationId: string; text_content: string }) => {
            if (payload.conversationId !== groupId) return;
            queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    pages: old.pages.map(page => page.map(m => {
                        if (m.id === payload.messageId) {
                            return {
                                ...m,
                                text: payload.text_content,
                                text_content: payload.text_content,
                                is_edited: true,
                            };
                        }
                        return m;
                    }))
                };
            });
        };

        socket.on('new_message', handleNewMessage);
        socket.on('isTyping', handleTyping);
        socket.on('stoppedTyping', handleStopTyping);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('message_deleted_for_me', handleMessageDeleted);
        socket.on('message_deleted_for_everyone', handleMessageDeleted);
        socket.on('message_edited', handleMessageEdited);
        socket.on('memberLeft', handleMemberLeft);
        socket.on('removed_from_group', handleRemovedFromGroup);
        socket.on('user_blocked', handleBlockOrDeactivate);
        socket.on('block_confirmed', handleBlockOrDeactivate);
        socket.on('relationshipUpdated', handleBlockOrDeactivate);
        socket.on('user_unblocked', handleBlockOrDeactivate);
        socket.on('unblock_confirmed', handleBlockOrDeactivate);
        socket.on('user_deactivated', handleBlockOrDeactivate);
        socket.on('USER_DEACTIVATED', handleBlockOrDeactivate);
        socket.on('user_reactivated', handleBlockOrDeactivate);
        socket.on('USER_REACTIVATED', handleBlockOrDeactivate);
        socket.on('message_reaction_updated', (payload: { messageId: string; conversationId: string; reaction: { user_id: string; emoji: string; full_name: string; avatar: string | null; updated_at: string } | null; userId?: string }) => {
            if (payload.conversationId !== groupId) return;
            queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
                if (!old) return old;
                const newPages = old.pages.map(page => page.map(m => {
                    if (m.id !== payload.messageId) return m;
                    const reactions = m.reactions || [];
                    if (payload.reaction === null) {
                        return { ...m, reactions: reactions.filter(r => r.user_id !== payload.userId) };
                    } else {
                        const idx = reactions.findIndex(r => r.user_id === payload.reaction!.user_id);
                        const newReactions = idx !== -1
                            ? reactions.map((r, i) => i === idx ? payload.reaction! : r)
                            : [...reactions, payload.reaction!];
                        return { ...m, reactions: newReactions };
                    }
                }));
                return { ...old, pages: newPages };
            });
        });

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('isTyping', handleTyping);
            socket.off('stoppedTyping', handleStopTyping);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('message_deleted_for_me', handleMessageDeleted);
            socket.off('message_deleted_for_everyone', handleMessageDeleted);
            socket.off('message_edited', handleMessageEdited);
            socket.off('memberLeft', handleMemberLeft);
            socket.off('removed_from_group', handleRemovedFromGroup);
            socket.off('user_blocked', handleBlockOrDeactivate);
            socket.off('block_confirmed', handleBlockOrDeactivate);
            socket.off('relationshipUpdated', handleBlockOrDeactivate);
            socket.off('user_unblocked', handleBlockOrDeactivate);
            socket.off('unblock_confirmed', handleBlockOrDeactivate);
            socket.off('user_deactivated', handleBlockOrDeactivate);
            socket.off('USER_DEACTIVATED', handleBlockOrDeactivate);
            socket.off('user_reactivated', handleBlockOrDeactivate);
            socket.off('USER_REACTIVATED', handleBlockOrDeactivate);
            socket.off('message_reaction_updated');
            setActiveConversationId(null);
        };
    }, [socket, groupId, queryClient, currentUser.id, currentUser.user_id, setActiveConversationId]);

    const sendMessageMutation = useMutation({
        mutationFn: async ({ text, files, replyMessageId }: { text: string, files: File[], replyMessageId?: string }) => {
            return await sendGroupMessage(groupId, text, 'text', files, replyMessageId);
        },
        onMutate: async ({ text, files }) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['messages', groupId] });

            // Snapshot the previous value
            const previousMessages = queryClient.getQueryData<InfiniteData<Message[]>>(['messages', groupId]);

            // Optimistic update to the new value
            const tempMedia = files.map(file => ({
                url: URL.createObjectURL(file),
                type: file.type.startsWith('video/') ? 'video' : (file.type === 'application/pdf' ? 'document' : 'image') as 'image' | 'video' | 'document'
            }));

            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`,
                senderId: currentUser.id || currentUser.user_id,
                sender: 'me',
                senderName: activeGroup?.members.find(m => m.user_id === (currentUser.id || currentUser.user_id))?.full_name || "Me",
                text: text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                created_at: new Date().toISOString(),
                type: 'text',
                read_at: null,
                media: tempMedia
            };

            queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
                if (!old) return { pages: [[optimisticMessage]], pageParams: [null] };

                const newPages = [...old.pages];
                newPages[0] = [...newPages[0], optimisticMessage];
                return { ...old, pages: newPages };
            });

            queryClient.setQueryData(['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'], (oldData: any[]) => {
                if (!oldData) return oldData;

                const now = new Date().toISOString();
                const updatedList = oldData.map(c => {
                    if (c.conversation_id === groupId || c.id === groupId) {
                        return {
                            ...c,
                            last_message_text: text || "Sent an attachment",
                            lastMessage: text ? (isPostUrl(text) ? "Shared a post" : (isJobUrl(text) ? "Shared a job" : text)) : "Sent an attachment",
                            lastMessageAt: now,    // CRITICAL: Update timestamp for sorting
                            time: formatTimeAgo(now),         // Update time for display
                            unread_count: 0
                        };
                    }
                    return c;
                });

                // Sort by lastMessageAt desc to move to top
                return updatedList.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
            });

            // Return a context object with the snapshotted value
            return { previousMessages, tempId: optimisticMessage.id };
        },
        onError: (err: unknown, newTodo, context: { previousMessages: InfiniteData<Message[]> | undefined; tempId: string } | undefined) => {
            queryClient.setQueryData(['messages', groupId], context?.previousMessages);
            // Revert conversations list if needed? It's tricky without previous state snapshot of conversations.
            // For now, just invalidate on error.
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            console.error("Failed to send", err);
        },
        onSuccess: (data: any, variables, context: { previousMessages: InfiniteData<Message[]> | undefined; tempId: string } | undefined) => {
            // Clear typing indicator immediately on send
            setTypingMap(new Map());

            const myId = currentUser.id || currentUser.user_id;
            const realMessage = mapBackendMessageToMessage(
                data.data || data,
                myId,
                activeProfile?.type === "COMPANY" ? activeProfile.id : undefined,
            );

            queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
                if (!old) return { pages: [[realMessage]], pageParams: [null] };
                const newPages = [...old.pages];
                const alreadyExists = newPages[0].some(m => m.id === realMessage.id);
                if (alreadyExists) {
                    if (context?.tempId) {
                        newPages[0] = newPages[0].filter(m => m.id !== context.tempId);
                    }
                } else if (context?.tempId) {
                    newPages[0] = newPages[0].map(m => m.id === context.tempId ? realMessage : m);
                } else {
                    newPages[0] = [...newPages[0], realMessage];
                }
                return { ...old, pages: newPages };
            });
        },
    });

    const displayMessages = messages.length > 0 ? messages : fetchedMessages;

    // Mark as read when opening conversation or when new messages arrive
    // Mark as read when opening conversation or when new messages arrive
    useEffect(() => {
        if (!groupId || isInactive) return;

        const markRead = async () => {
            if (displayMessages.length > 0) {
                try {
                    const { markGroupAsRead } = await import("@/services/api/group-chat");
                    markGroupAsRead(groupId).catch(() => {});

                    // Optimistically update conversation unread count
                    queryClient.setQueryData(['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'], (oldData: any[]) => {
                        if (!oldData) return oldData;
                        // Avoid update if already 0 to prevent reference change
                        const target = oldData.find(c => c.conversation_id === groupId || c.id === groupId);
                        if (target && target.unread_count === 0 && target.unread === 0) return oldData;

                        return oldData.map(c => {
                            if (c.conversation_id === groupId || c.id === groupId) {
                                return { ...c, unread_count: 0, unread: 0 };
                            }
                            return c;
                        });
                    });
                } catch (error) {
                    console.error("Failed to mark as read", error);
                }
            }
        };

        markRead();

    }, [groupId, displayMessages.length, queryClient, isInactive]);

    useEffect(() => {
        if (!isInactive) {
            setLeaveAction(null);
        }
    }, [isInactive]);

    useEffect(() => {
        if (!activeGroup) return;

        if (isInactive && !leaveAction && displayMessages.length > 0) {
            const myId = currentUser.id || currentUser.user_id;
            const systemMsg = [...displayMessages].reverse().find(m =>
                m.type === 'system' &&
                (m.action_type === 'leave' || m.action_type === 'remove') &&
                (String(m.target_id) === String(myId) || String(m.senderId) === String(myId))
            );
            if (systemMsg) {
                if (systemMsg.action_type === 'leave') {
                    setLeaveAction('left');
                } else if (systemMsg.action_type === 'remove') {
                    setLeaveAction('removed');
                }
            } else {
                setLeaveAction('left');
            }
        }
    }, [activeGroup, isInactive, displayMessages, currentUser, leaveAction]);

    const handleSendMessage = React.useCallback((text: string, files: File[]) => {
        // Stop typing immediately when sending
        if (socket) {
            socket.emit('stopGroupTyping', { groupId: groupId });
        }
        sendMessageMutation.mutate({ text, files, replyMessageId: replyingTo?.messageId });
        setReplyingTo(null);
    }, [socket, groupId, sendMessageMutation, replyingTo]);

    const handleTypingInput = React.useCallback(() => {
        if (!socket) return;

        const now = Date.now();
        if (now - lastTypingRef.current > 2000) {
            socket.emit('groupTyping', { groupId: groupId });
            lastTypingRef.current = now;
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopGroupTyping', { groupId: groupId });
        }, 3000);
    }, [socket, groupId]);

    // ---- Reaction Logic ----
    const currentUserId = currentUser.id || currentUser.user_id || '';

    const optimisticallyUpdateGroupReaction = (messageId: string, emoji: string, userId: string) => {
        queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
            if (!old) return old;
            const newPages = old.pages.map(page => page.map(m => {
                if (m.id !== messageId) return m;
                const reactions = m.reactions || [];
                const existingIdx = reactions.findIndex(r => r.user_id === userId);
                let newReactions;
                if (existingIdx !== -1) {
                    newReactions = reactions.map((r, i) => i === existingIdx ? { ...r, emoji, updated_at: new Date().toISOString() } : r);
                } else {
                    const memberName = activeGroup?.members.find(m => m.user_id === userId)?.full_name || '';
                    newReactions = [...reactions, { user_id: userId, emoji, full_name: memberName, avatar: null, updated_at: new Date().toISOString() }];
                }
                return { ...m, reactions: newReactions };
            }));
            return { ...old, pages: newPages };
        });
    };

    const handleGroupReactionSelect = async (message: Message, selectedEmoji: string) => {
        const myReaction = message.reactions?.find(r => r.user_id === currentUserId);
        if (myReaction && myReaction.emoji === selectedEmoji) return;
        optimisticallyUpdateGroupReaction(message.id, selectedEmoji, currentUserId);
        try {
            if (selectedEmoji === '') {
                await clearReaction(message.id);
            } else {
                await addOrUpdateReaction(message.id, selectedEmoji);
            }
        } catch (error) {
            // Rollback: restore previous state
            queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
                if (!old) return old;
                const newPages = old.pages.map(page => page.map(m => {
                    if (m.id !== message.id) return m;
                    const reactions = m.reactions || [];
                    const newReactions = myReaction
                        ? reactions.map(r => r.user_id === currentUserId ? myReaction : r)
                        : reactions.filter(r => r.user_id !== currentUserId);
                    return { ...m, reactions: newReactions };
                }));
                return { ...old, pages: newPages };
            });
            toast({ title: 'Error', description: 'Failed to update reaction', variant: 'destructive' });
        }
    };
    // ---- End Reaction Logic ----

    // Derived typing string for display
    let typingStatus: string | null = null;
    const typingUsers = Array.from(typingMap.values());
    if (typingUsers.length === 1) {
        typingStatus = `${typingUsers[0]} is typing...`;
    } else if (typingUsers.length > 1) {
        typingStatus = `${typingUsers.join(", ")} are typing...`;
    }

    // Simplified error handling (optional, but keep it for real API errors, just don't redirect away)
    if (error && (error as any).response?.status !== 403) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                <p>Failed to load group details</p>
                <Button variant="outline" onClick={onBack}>Go Back</Button>
            </div>
        );
    }

    if (isLoading && !fetchedMessages.length) {
        return (
            <div className="flex flex-col h-full bg-background relative">
                <GroupHeader
                    onOpenDetails={() => setActiveView('info')}
                    onAddMember={() => setIsAddMemberOpen(true)}
                    onBack={onBack}
                    typingStatus={typingStatus}
                    onLeaveGroup={() => setShowLeaveConfirm(true)}
                    isMessageSelected={isMessageSelected}
                    selectedMessage={selectedMessage}
                    onMessageAction={(action) => handleMessageAction(action)}
                    currentUserId={currentUser.id || currentUser.user_id || ""}
                    isMuted={isMuted}
                />
                <ChatSkeleton />
            </div>
        );
    }

    if (!activeGroup) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                <p>Group not found</p>
                <Button variant="outline" onClick={onBack}>Go Back</Button>
            </div>
        );
    }

    const handleBack = (backPosition: 'chat' | 'info' | 'edit') => {
        setActiveView(backPosition);
    }
    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {activeView === 'chat' && (
                <GroupHeader
                    onOpenDetails={() => setActiveView('info')}
                    onAddMember={() => setIsAddMemberOpen(true)}
                    onBack={activeView !== 'chat' ? () => setActiveView('chat') : onBack}
                    typingStatus={typingStatus}
                    onLeaveGroup={() => setShowLeaveConfirm(true)}
                    isMessageSelected={isMessageSelected}
                    selectedMessage={selectedMessage}
                    onMessageAction={(action) => handleMessageAction(action)}
                    currentUserId={currentUser.id || currentUser.user_id || ""}
                    isMuted={isMuted}
                />
            )}

            <div className="flex-1 flex flex-row overflow-hidden relative">
                {/* Main Chat Area */}
                <div className={cn(
                    "flex-1 flex flex-col transition-all duration-300",
                    activeView !== 'chat' ? "opacity-0 invisible translate-x-[-20px]" : "opacity-100 visible translate-x-0"
                )}>
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        <GroupMessageList
                            messages={displayMessages}
                            currentUserId={currentUser.id || currentUser.user_id || ""}
                            onLoadMore={fetchNextPage}
                            hasMore={hasNextPage}
                            isLoadingMore={isFetchingNextPage}
                            onMessageClick={handleMessageClick}
                            selectedMessageId={selectedMessage?.id}
                            editingMessageId={editingMessageId}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={() => setEditingMessageId(null)}
                            onAction={handleMessageAction}
                            onMediaClick={handleMediaClick}
                            unreadCount={unreadCount}
                            onReply={(msg) => {
                                const myId = currentUser?.id || currentUser?.user_id || activeProfile?.id;
                                const isSelf = msg.sender === "me" || Boolean(myId && msg.senderId === myId);
                                const firstMedia = msg.media?.[0];
                                let detectedMediaType = firstMedia?.type || msg.messageType;
                                const textContent = msg.text || msg.text_content || "";
                                if (!detectedMediaType && textContent) {
                                    const textLower = textContent.toLowerCase();
                                    if (textLower.endsWith('.pdf')) detectedMediaType = 'document';
                                    else if (textLower.endsWith('.doc') || textLower.endsWith('.docx')) detectedMediaType = 'document';
                                    else if (textLower.endsWith('.mp4') || textLower.endsWith('.mov') || textLower.endsWith('.webm')) detectedMediaType = 'video';
                                    else if (textLower.endsWith('.jpg') || textLower.endsWith('.jpeg') || textLower.endsWith('.png') || textLower.endsWith('.webp')) detectedMediaType = 'image';
                                }
                                setReplyingTo({
                                    messageId: msg.id,
                                    senderName: msg.senderName || "Unknown",
                                    content: textContent || firstMedia?.name || (detectedMediaType === 'video' ? 'Video' : detectedMediaType === 'image' ? 'Photo' : detectedMediaType === 'document' ? 'Document' : ''),
                                    isMe: isSelf,
                                    mediaType: detectedMediaType,
                                    mediaName: firstMedia?.name,
                                    mediaUrl: firstMedia?.url,
                                });
                            }}
                            onReaction={handleGroupReactionSelect}
                        />
                    </div>

                    {!isInactive ? (
                        <UnifiedMessageInput
                            onSendMessage={handleSendMessage}
                            onTyping={handleTypingInput}
                            isLoading={isLoading || isMessagesLoading}
                            placeholder="Type a message to group..."
                            replyingTo={replyingTo}
                            onCancelReply={() => setReplyingTo(null)}
                            searchUsersFn={async (query: string) => {
                                const myId = currentUser.id || currentUser.user_id;
                                const members = activeGroup?.members || [];
                                return members
                                    .filter(m => m.user_id !== myId) // Exclude self
                                    .filter(m => {
                                        if (!query) return true; // Show all on empty query (just "@")
                                        const q = query.toLowerCase();
                                        return (
                                            m.full_name?.toLowerCase().includes(q) ||
                                            m.account_name?.toLowerCase().includes(q)
                                        );
                                    })
                                    .map(m => ({
                                        id: m.user_id,
                                        full_name: m.full_name,
                                        account_name: m.account_name || '',
                                        avatar_url: m.avatar_url || '',
                                        headline: m.headline || ''
                                    }));
                            }}
                        />
                    ) : (
                        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm text-center text-muted-foreground text-sm flex flex-col items-center gap-1">
                            {leaveAction === 'removed' ? (
                                <>
                                    <p className="font-medium text-foreground">You were removed from this group</p>
                                    <p className="text-xs opacity-70">You can delete this chat from your list in group info.</p>
                                </>
                            ) : (
                                <>
                                    <p className="font-medium text-foreground">You left this group</p>
                                    <p className="text-xs opacity-70">You can delete this chat from your list in group info.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Info/Edit Panel - Slides in from the right */}
                <div className={cn(
                    "fixed inset-0 z-50 bg-white md:absolute md:inset-0 md:z-10 transition-all duration-300",
                    activeView === 'chat'
                        ? "translate-x-full opacity-0 invisible"
                        : "translate-x-0 opacity-100 visible"
                )}>
                    <GroupDetails
                        isOpen={activeView !== 'chat'}
                        onClose={(backPosition: 'chat' | 'info' | 'edit') => handleBack(backPosition)}
                        currentUserId={currentUser.id || currentUser.user_id || ""}
                        onAddMember={() => setIsAddMemberOpen(true)}
                        activeView={activeView}
                        setActiveView={setActiveView}
                    />
                </div>
            </div>

            <AddMemberModal
                isOpen={isAddMemberOpen}
                onClose={() => setIsAddMemberOpen(false)}
                onInvite={(uid) => inviteMember(uid)}
            />

            {selectedMessage && (
                <MessageInfoModal
                    isOpen={isMessageInfoOpen}
                    onClose={() => setIsMessageInfoOpen(false)}
                    messageId={selectedMessage.id}
                    messageContent={selectedMessage.text}
                />
            )}



            {previewMedia && (
                <MediaPreviewModal
                    isOpen={!!previewMedia}
                    onClose={() => setPreviewMedia(null)}
                    mediaUrl={previewMedia.url}
                    mediaType={previewMedia.type}
                    fileName={previewMedia.name || "media"}
                />
            )}

            <CocpitConfirmBox
                isOpen={showLeaveConfirm}
                title="Leave this group?"
                message="You won't receive messages from this group anymore."
                confirmText="Leave"
                cancelText="Cancel"
                onConfirm={async () => {
                    try {
                        await leaveGroup(groupId);
                        setShowLeaveConfirm(false);
                        if (onBack) onBack();
                    } catch (err: any) {
                        // Error toast is already handled by the leaveGroup mutation in context
                        setShowLeaveConfirm(false);
                    }
                }}
                onCancel={() => setShowLeaveConfirm(false)}
            />
        </div>
    );
}

