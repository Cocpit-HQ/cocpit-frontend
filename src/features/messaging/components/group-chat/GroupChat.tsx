"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useGroupChat } from "./groupChat.context";
import GroupHeader from "./GroupHeader";
import GroupMessageList from "./GroupMessageList";
import UnifiedMessageInput from "../ui/UnifiedMessageInput";
import GroupDetails from "./GroupDetails";
import CreateGroupModal from "./CreateGroupModal";
import { DeleteMessageModal } from "../ui/DeleteMessageModal";
import MessageSelectionBottomBar from "../ui/MessageSelectionBottomBar";
import { Loader2 } from "lucide-react";
import { useQueryClient, useQuery, useMutation, useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import { sendMessage as sendGroupMessage } from "@/services/api/group-chat";
import { editMessage, deleteMessage, addOrUpdateReaction, clearReaction, pinMessage } from "@/services/api/messaging";
import { Message } from "@/types/messaging";
import { formatTimeAgo, isPostUrl, isJobUrl, mapBackendMessageToMessage } from "@/lib/mappers/messaging.mapper";
import { useSocket } from "@/context/SocketContext";
import { TypingPayload } from "@/types/socket";
import MessageInfoModal from "../../MessageInfoModal";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import MediaDetailViewer from "../ui/MediaDetailViewer";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import ChatSkeleton from "../ui/ChatSkeleton";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useSocial } from "@/context/SocialContext";
import { cn } from "@/lib/utils";
import { getMessageCopyText } from "@/features/messaging/utils/messageCopy";
import { searchUsers, getSuggestedUsers, UserMention } from "@/services/api/users";
import { getPinnedMessageId, setPinnedMessageId } from "@/features/messaging/utils/pinMessageUtils";
import { PinnedMessageBanner } from "../ui/PinnedMessageBanner";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";

interface GroupChatProps {
    groupId: string;
    currentUser: { id?: string; user_id?: string;[key: string]: any }; // Fallback since user object structure varies
    messages?: Message[]; // Pass messages optionally if managed by parent
    onBack?: () => void;
    unreadCount?: number;
    isMuted?: boolean;
    mutedUntil?: string | null;
}

export default function GroupChat({ groupId, currentUser, messages = [], onBack, unreadCount = 0, isMuted = false, mutedUntil = null }: GroupChatProps) {
    const { activeGroup, isLoading, error, inviteMember, isInactive, leaveGroup } = useGroupChat();
    const { activeProfile } = useActiveProfile();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const viewParam = searchParams?.get("view");
    const initialView = (viewParam === "info" || viewParam === "details") ? 'info' : (viewParam === "edit" ? 'edit' : 'chat');
    const [activeView, setActiveView] = useState<'chat' | 'info' | 'edit'>(initialView);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const queryClient = useQueryClient();
    const { socket, setActiveConversationId } = useSocket();
    const { isBlocked } = useSocial();
    const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
    const isMessageSelected = selectedMessages.length > 0;
    const selectedMessage = selectedMessages[selectedMessages.length - 1] || null;
    const selectedMessageIds = useMemo(() => selectedMessages.map((m) => m.id), [selectedMessages]);

    const conversationId = activeGroup?.conversation_id || groupId;
    const [pinnedMessageId, setPinnedMessageIdState] = useState<string | null>(() => {
        return (activeGroup as any)?.pinned_message_id || getPinnedMessageId(conversationId, activeProfile?.type, activeProfile?.id);
    });

    useEffect(() => {
        const initialPinnedId = (activeGroup as any)?.pinned_message_id || getPinnedMessageId(conversationId, activeProfile?.type, activeProfile?.id);
        setPinnedMessageIdState(initialPinnedId);
        if ((activeGroup as any)?.pinned_message_id && conversationId) {
            setPinnedMessageId(conversationId, (activeGroup as any).pinned_message_id, activeProfile?.type, activeProfile?.id);
        }
    }, [conversationId, (activeGroup as any)?.pinned_message_id, activeProfile?.type, activeProfile?.id]);

    useEffect(() => {
        if (!socket) return;
        const handleMessagePinned = (payload: { conversationId: string; pinnedMessageId: string | null; is_pinned: boolean }) => {
            if (String(payload.conversationId) === String(conversationId)) {
                setPinnedMessageId(conversationId, payload.pinnedMessageId, activeProfile?.type, activeProfile?.id);
                setPinnedMessageIdState(payload.pinnedMessageId);
                pinnedMessageIdRef.current = payload.pinnedMessageId;
            }
        };
        socket.on("message_pinned", handleMessagePinned);
        return () => {
            socket.off("message_pinned", handleMessagePinned);
        };
    }, [socket, conversationId, activeProfile?.type, activeProfile?.id]);

    const [isMessageInfoOpen, setIsMessageInfoOpen] = useState(false);
    const pinnedMessageIdRef = useRef<string | null>(pinnedMessageId);
    useEffect(() => {
        pinnedMessageIdRef.current = pinnedMessageId;
    }, [pinnedMessageId]);

    const [pendingGroupPinMsgId, setPendingGroupPinMsgId] = useState<string | null>(null);
    const [isReplacePinModalOpen, setIsReplacePinModalOpen] = useState(false);
    const [isRemovePinModalOpen, setIsRemovePinModalOpen] = useState(false);

    const executePinGroupMessage = useCallback((msgId: string) => {
        const companyId = activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
        setPinnedMessageId(conversationId, msgId, activeProfile?.type, activeProfile?.id);
        setPinnedMessageIdState(String(msgId));
        pinnedMessageIdRef.current = String(msgId);
        toast({ description: "A message was pinned" });
        pinMessage(String(conversationId), String(msgId), true, companyId).catch((err) => {
            console.error("Failed to pin group message on server:", err);
        });
    }, [activeProfile?.id, activeProfile?.type, conversationId, toast]);

    const executeUnpinGroupMessage = useCallback(() => {
        const companyId = activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
        setPinnedMessageId(conversationId, null, activeProfile?.type, activeProfile?.id);
        setPinnedMessageIdState(null);
        pinnedMessageIdRef.current = null;
        toast({ description: "A message was unpinned" });
        pinMessage(String(conversationId), null, false, companyId).catch((err) => {
            console.error("Failed to unpin group message on server:", err);
        });
    }, [activeProfile?.id, activeProfile?.type, conversationId, toast]);

    const confirmReplaceGroupPin = useCallback(() => {
        if (pendingGroupPinMsgId) {
            executePinGroupMessage(pendingGroupPinMsgId);
            setPendingGroupPinMsgId(null);
        }
        setIsReplacePinModalOpen(false);
    }, [executePinGroupMessage, pendingGroupPinMsgId]);

    const cancelReplaceGroupPin = useCallback(() => {
        setPendingGroupPinMsgId(null);
        setIsReplacePinModalOpen(false);
    }, []);

    const confirmRemoveGroupPin = useCallback(() => {
        executeUnpinGroupMessage();
        setIsRemovePinModalOpen(false);
    }, [executeUnpinGroupMessage]);

    const cancelRemoveGroupPin = useCallback(() => {
        setIsRemovePinModalOpen(false);
    }, []);
    const [messageInfoMessage, setMessageInfoMessage] = useState<Message | null>(null);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [previewMedia, setPreviewMedia] = useState<{
        url: string;
        type: 'image' | 'video' | 'document' | string;
        name?: string;
        mediaList?: { url: string; type: 'image' | 'video' | 'document' | string; name?: string | null }[];
        initialIndex?: number;
    } | null>(null);
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

    const handleMediaClick = (
        url: string,
        type: 'image' | 'video' | 'document' | string,
        name?: string,
        allMedia?: { url: string; type: string; name?: string | null }[],
        index?: number,
    ) => {
        setPreviewMedia({
            url,
            type,
            name,
            mediaList: allMedia as any,
            initialIndex: index ?? 0,
        });
    };

    const handleDeleteForMe = React.useCallback(async (targetMsg?: Message) => {
        const targetMsgs = targetMsg ? [targetMsg] : selectedMessages;
        if (targetMsgs.length === 0) return;
        const targetIds = new Set(targetMsgs.map((m) => m.id));

        setSelectedMessages([]);

        if (pinnedMessageId && targetIds.has(pinnedMessageId)) {
            setPinnedMessageId(conversationId, null, activeProfile?.type, activeProfile?.id);
            setPinnedMessageIdState(null);
            // Delete for Me hides the pinned message locally for this user only; does not unpin for other group members
        }

        queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
            if (!old) return undefined;
            return {
                ...old,
                pages: old.pages.map(page => page.map(m => {
                    if (targetIds.has(m.id)) {
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
                    return m;
                }))
            };
        });

        try {
            await Promise.allSettled(targetMsgs.map((m) => deleteMessage(m.id, false)));
            toast({
                description:
                    targetMsgs.length > 1
                        ? `${targetMsgs.length} messages deleted`
                        : "Message deleted successfully",
            });
        } catch (e: any) {
            console.error("Failed to delete for me", e);
            const errorMsg = e?.response?.data?.message || e?.message || "Failed to delete message";
            toast({ title: "Error", description: errorMsg, variant: "destructive" });
            queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
        }
    }, [groupId, selectedMessages, queryClient, toast]);

    const handleDeleteForEveryone = React.useCallback(async (targetMsg?: Message) => {
        const targetMsgs = targetMsg ? [targetMsg] : selectedMessages;
        if (targetMsgs.length === 0) return;

        const currentUid = currentUser?.id || currentUser?.user_id || activeProfile?.id || "";
        const allMine = targetMsgs.every(
            (m) => m.sender === 'me' || m.senderId === currentUid || m.senderId === 'me'
        );
        if (!allMine) {
            toast({
                title: "Permission Denied",
                description: "You can only delete your own messages for everyone",
                variant: "destructive",
            });
            return;
        }

        const targetIds = new Set(targetMsgs.map((m) => m.id));

        setSelectedMessages([]);

        if (pinnedMessageId && targetIds.has(pinnedMessageId)) {
            setPinnedMessageId(conversationId, null, activeProfile?.type, activeProfile?.id);
            setPinnedMessageIdState(null);
            const companyId = activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
            pinMessage(String(conversationId), null, false, companyId).catch((err) => {
                console.error("Failed to unpin deleted group message on server:", err);
            });
        }

        queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
            if (!old) return undefined;
            return {
                ...old,
                pages: old.pages.map(page => page.map(m => {
                    if (targetIds.has(m.id)) {
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
            await Promise.allSettled(targetMsgs.map((m) => deleteMessage(m.id, true)));
            toast({
                description:
                    targetMsgs.length > 1
                        ? `${targetMsgs.length} messages deleted for everyone`
                        : "Message deleted for everyone",
            });
        } catch (e: any) {
            console.error("Failed to delete for everyone", e);
            const errorMsg = e?.response?.data?.message || e?.message || "Failed to delete message for everyone";
            toast({ title: "Error", description: errorMsg, variant: "destructive" });
            queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
        }
    }, [groupId, selectedMessages, currentUser, activeProfile, queryClient, toast]);

    const handleMessageAction = React.useCallback((action: string, msg?: Message) => {
        const targetMsg = msg || selectedMessage;
        if (!targetMsg && selectedMessages.length === 0 && action !== 'close') return;

        if (action === 'info') {
            const msgForInfo = targetMsg || (selectedMessages.length > 0 ? selectedMessages[0] : null);
            if (msgForInfo) {
                setMessageInfoMessage(msgForInfo);
                setIsMessageInfoOpen(true);
            }
        } else if (action === 'copy') {
            const msgsToCopy = selectedMessages.length > 0 ? selectedMessages : (targetMsg ? [targetMsg] : []);
            if (msgsToCopy.length > 0) {
                const textToCopy = msgsToCopy
                    .map((m) => getMessageCopyText(m))
                    .filter(Boolean)
                    .join("\n\n");
                if (textToCopy) {
                    navigator.clipboard.writeText(textToCopy);
                    toast({
                        description:
                            msgsToCopy.length > 1
                                ? `${msgsToCopy.length} messages copied`
                                : "Message copied",
                    });
                }
            }
            setSelectedMessages([]);
        } else if (action === 'edit') {
            if (targetMsg) {
                const createdAtStr = targetMsg.created_at || (targetMsg as any).createdAt || (targetMsg as any).timestamp;
                const createdAtTime = createdAtStr ? new Date(createdAtStr).getTime() : NaN;
                if (!isNaN(createdAtTime) && (Date.now() - createdAtTime) / (1000 * 60) > 15) {
                    toast({
                        description: "Messages can only be edited within 15 minutes of sending",
                        variant: "destructive",
                    });
                    setSelectedMessages([]);
                    return;
                }
                setEditingMessageId(targetMsg.id);
            }
            setSelectedMessages([]);
        } else if (action === 'pin') {
            if (targetMsg) {
                const currentPinnedId = pinnedMessageIdRef.current || pinnedMessageId;
                if (currentPinnedId && String(currentPinnedId) !== String(targetMsg.id)) {
                    setPendingGroupPinMsgId(String(targetMsg.id));
                    setIsReplacePinModalOpen(true);
                } else {
                    executePinGroupMessage(String(targetMsg.id));
                }
            }
            setSelectedMessages([]);
        } else if (action === 'unpin') {
            setIsRemovePinModalOpen(true);
            setSelectedMessages([]);
        } else if (action === 'delete') {
            setDeleteTargetMessage(msg || targetMsg || null);
            setIsDeleteModalOpen(true);
        } else if (action === 'delete_for_me') {
            handleDeleteForMe(msg);
        } else if (action === 'delete_for_everyone') {
            handleDeleteForEveryone(msg);
        } else if (action === 'close') {
            setSelectedMessages([]);
        }
    }, [selectedMessage, selectedMessages, handleDeleteForMe, handleDeleteForEveryone, toast, pinnedMessageId, executePinGroupMessage]);

    const handleMessageClick = React.useCallback((message: Message) => {
        setSelectedMessages((prev) => {
            const exists = prev.some((m) => m.id === message.id);
            if (exists) {
                return prev.filter((m) => m.id !== message.id);
            } else {
                return [...prev, message];
            }
        });
    }, []);

    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [deleteTargetMessage, setDeleteTargetMessage] = useState<Message | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

    const editingMessage = React.useMemo(() => {
        if (!editingMessageId) return null;
        return fetchedMessages.find((m) => m.id === editingMessageId) || null;
    }, [editingMessageId, fetchedMessages]);

    useEffect(() => {
        const vParam = searchParams?.get("view");
        if (vParam === "info" || vParam === "details") {
            setActiveView("info");
        } else if (vParam === "edit") {
            setActiveView("edit");
        } else if (!vParam) {
            setActiveView("chat");
        }
    }, [groupId, searchParams]);

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
            if (pinnedMessageId && String(payload.messageId) === String(pinnedMessageId)) {
                setPinnedMessageId(conversationId, null, activeProfile?.type, activeProfile?.id);
                setPinnedMessageIdState(null);
            }
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
            const isDoc = (f: File) =>
                f.type === "application/pdf" ||
                f.type.includes("word") ||
                f.type.includes("officedocument") ||
                /\.(doc|docx|pdf|txt|rtf|xls|xlsx|ppt|pptx)$/i.test(f.name);
            const tempMedia = files.map(file => ({
                url: URL.createObjectURL(file),
                type: file.type.startsWith('video/') ? 'video' : (isDoc(file) ? 'document' : 'image') as 'image' | 'video' | 'document',
                name: file.name
            }));

            const optimisticMessage: Message = {
                id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

        const isDocFile = (f: File) =>
            f.type === "application/pdf" ||
            f.type.includes("word") ||
            f.type.includes("officedocument") ||
            /\.(doc|docx|pdf|txt|rtf|xls|xlsx|ppt|pptx)$/i.test(f.name);

        const visualFiles = files ? files.filter((f) => !isDocFile(f)) : [];
        const docFiles = files ? files.filter((f) => isDocFile(f)) : [];

        if (docFiles.length > 0) {
            if (visualFiles.length > 0 || text.trim()) {
                sendMessageMutation.mutate({ text, files: visualFiles, replyMessageId: replyingTo?.messageId });
                docFiles.forEach((docFile) => {
                    sendMessageMutation.mutate({ text: "", files: [docFile] });
                });
            } else {
                docFiles.forEach((docFile, idx) => {
                    sendMessageMutation.mutate({
                        text: "",
                        files: [docFile],
                        replyMessageId: idx === 0 ? replyingTo?.messageId : undefined,
                    });
                });
            }
        } else {
            sendMessageMutation.mutate({ text, files: visualFiles, replyMessageId: replyingTo?.messageId });
        }

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

    const handleOpenInfo = () => {
        setActiveView('info');
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'info');
            window.history.replaceState(null, '', url.pathname + url.search);
        }
    };

    const handleBack = (backPosition: 'chat' | 'info' | 'edit') => {
        setActiveView(backPosition);
        if (backPosition === 'chat' && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('view');
            url.searchParams.delete('tab');
            window.history.replaceState(null, '', url.pathname + url.search);
        }
    };

    const pinnedMessage = useMemo(() => {
        if (!pinnedMessageId) return null;
        const msg = displayMessages.find((m) => String(m.id) === String(pinnedMessageId));
        if (!msg || msg.is_deleted_for_me || msg.text === "This message was deleted for you.") {
            return null;
        }
        return msg;
    }, [displayMessages, pinnedMessageId]);

    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

    const handleScrollToPinnedMessage = (msgId: string) => {
        const el = document.getElementById(`msg-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(msgId);
            setTimeout(() => setHighlightedMessageId(null), 1000);
        }
    };

    const handleUnpinPinnedMessage = () => {
        setIsRemovePinModalOpen(true);
    };

    if (isLoading && !fetchedMessages.length) {
        return (
            <div className="flex flex-col h-full bg-[var(--ds-bg)] relative">
                <GroupHeader
                    onOpenDetails={handleOpenInfo}
                    onAddMember={() => setIsAddMemberOpen(true)}
                    onBack={onBack}
                    typingStatus={typingStatus}
                    onLeaveGroup={() => setShowLeaveConfirm(true)}
                    isMessageSelected={isMessageSelected}
                    selectedMessage={selectedMessage}
                    selectedMessages={selectedMessages}
                    onMessageAction={(action) => handleMessageAction(action)}
                    currentUserId={currentUser.id || currentUser.user_id || ""}
                    isMuted={isMuted}
                    mutedUntil={mutedUntil}
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

    return (
        <div className="flex flex-col h-full bg-[var(--ds-bg)] relative overflow-hidden">
            {activeView === 'chat' && (
                <GroupHeader
                    onOpenDetails={handleOpenInfo}
                    onAddMember={() => setIsAddMemberOpen(true)}
                    onBack={activeView !== 'chat' ? () => setActiveView('chat') : onBack}
                    typingStatus={typingStatus}
                    onLeaveGroup={() => setShowLeaveConfirm(true)}
                    isMessageSelected={isMessageSelected}
                    selectedMessage={selectedMessage}
                    selectedMessages={selectedMessages}
                    onMessageAction={(action) => handleMessageAction(action)}
                    currentUserId={currentUser.id || currentUser.user_id || ""}
                    isMuted={isMuted}
                    mutedUntil={mutedUntil}
                />
            )}

            <div className="flex-1 flex flex-row overflow-hidden relative">
                {/* Main Chat Area */}
                <div className={cn(
                    "flex-1 flex flex-col transition-all duration-300",
                    activeView !== 'chat' ? "opacity-0 invisible translate-x-[-20px]" : "opacity-100 visible translate-x-0"
                )}>
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        {pinnedMessageId && pinnedMessage && (
                            <PinnedMessageBanner
                                message={pinnedMessage}
                                pinnedMessageId={pinnedMessageId}
                                onScrollToMessage={handleScrollToPinnedMessage}
                                onUnpin={handleUnpinPinnedMessage}
                            />
                        )}
                        <GroupMessageList
                            messages={displayMessages}
                            pinnedMessageId={pinnedMessageId}
                            highlightedMessageId={highlightedMessageId}
                            conversationId={conversationId}
                            groupMembers={activeGroup?.members}
                            currentUserId={currentUser.id || currentUser.user_id || ""}
                            onLoadMore={fetchNextPage}
                            hasMore={hasNextPage}
                            isLoadingMore={isFetchingNextPage}
                            onMessageClick={handleMessageClick}
                            selectedMessageId={selectedMessage?.id}
                            selectedMessageIds={selectedMessageIds}
                            editingMessageId={editingMessageId}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={() => setEditingMessageId(null)}
                            // Handle retry click from failed message bubble to re-trigger sending in group chat
                            onAction={(action, msg) => {
                                if (action === "retry" && msg) {
                                    handleSendMessage(msg.text || msg.text_content || "", []);
                                    return;
                                }
                                handleMessageAction(action, msg);
                            }}
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
                        isMessageSelected && selectedMessages.length > 0 ? (
                            <MessageSelectionBottomBar
                                selectedCount={selectedMessages.length}
                                allAreMine={selectedMessages.every(
                                    (m) =>
                                        m.sender === "me" ||
                                        m.senderId === (currentUser?.id || currentUser?.user_id || activeProfile?.id) ||
                                        m.senderId === "me",
                                )}
                                onClose={() => handleMessageAction("close")}
                                onDeleteForMe={() => handleMessageAction("delete_for_me")}
                                onDeleteForEveryone={() => handleMessageAction("delete_for_everyone")}
                            />
                        ) : (
                            <UnifiedMessageInput
                                onSendMessage={handleSendMessage}
                                onTyping={handleTypingInput}
                                isLoading={isLoading || isMessagesLoading}
                                placeholder="Type a message to group..."
                                replyingTo={replyingTo}
                                onCancelReply={() => setReplyingTo(null)}
                                editingMessage={editingMessage}
                                onCancelEdit={() => setEditingMessageId(null)}
                                onSaveEdit={(msgId, text) => editMessageMutation.mutate({ messageId: msgId, text })}
                                searchUsersFn={async (query: string): Promise<UserMention[]> => {
                                    const myId = currentUser.id || currentUser.user_id;
                                    const members = activeGroup?.members || [];
                                    const q = (query || "").toLowerCase();

                                    // 1. Group members first (excluding self)
                                    const matchedMembers: UserMention[] = members
                                        .filter(m => (m.user_id || (m as any).id) !== myId)
                                        .filter(m => {
                                            if (!q) return true;
                                            return (
                                                m.full_name?.toLowerCase().includes(q) ||
                                                m.account_name?.toLowerCase().includes(q)
                                            );
                                        })
                                        .map(m => ({
                                            id: String(m.user_id || (m as any).id || ''),
                                            full_name: m.full_name || 'User',
                                            account_name: m.account_name || '',
                                            avatar_url: m.avatar_url || '',
                                            headline: m.headline || '',
                                            type: 'USER',
                                            is_company: false
                                        }));

                                    // 2. External platform users & organizations from Feed API
                                    let externalResults: UserMention[] = [];
                                    try {
                                        externalResults = query
                                            ? await searchUsers(query, true)
                                            : await getSuggestedUsers(true);
                                    } catch (err) {
                                        externalResults = [];
                                    }

                                    // 3. Deduplicate against group members and self
                                    const memberIds = new Set(matchedMembers.map(m => m.id));
                                    if (myId) memberIds.add(String(myId));

                                    const filteredExternal = (externalResults || []).filter(u => !memberIds.has(u.id));

                                    // 4. @everyone for group chats
                                    const showEveryone = !q || "everyone".includes(q) || "all".includes(q);
                                    const everyoneMention: UserMention = {
                                        id: "everyone",
                                        full_name: "Everyone",
                                        account_name: "everyone",
                                        avatar_url: "",
                                        headline: "Notify all members in this group",
                                        type: "GROUP",
                                        is_company: false,
                                    };

                                    return [
                                        ...(showEveryone ? [everyoneMention] : []),
                                        ...matchedMembers,
                                        ...filteredExternal,
                                    ];
                                }}
                            />
                        )
                    ) : (
                        <div className="p-4 border-t border-[var(--ds-border)] bg-[var(--ds-surface-1)] text-center text-[var(--ds-text-secondary)] font-['DM_Sans'] text-sm flex flex-col items-center gap-1">
                            {leaveAction === 'removed' ? (
                                <>
                                    <p className="font-medium text-[var(--ds-text-primary)]">You were removed from this group</p>
                                    <p className="text-xs text-[var(--ds-text-muted)]">You can delete this chat from your list in group info.</p>
                                </>
                            ) : (
                                <>
                                    <p className="font-medium text-[var(--ds-text-primary)]">You left this group</p>
                                    <p className="text-xs text-[var(--ds-text-muted)]">You can delete this chat from your list in group info.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Info/Edit Panel - Slides in from the right */}
                <div className={cn(
                    "fixed inset-0 z-50 bg-[var(--ds-bg)] md:absolute md:inset-0 md:z-10 transition-all duration-300",
                    activeView === 'chat'
                        ? "translate-x-full opacity-0 invisible"
                        : "translate-x-0 opacity-100 visible"
                )}>
                    <GroupDetails
                        groupId={groupId}
                        isOpen={activeView !== 'chat'}
                        onClose={(backPosition: 'chat' | 'info' | 'edit') => handleBack(backPosition)}
                        currentUserId={currentUser.id || currentUser.user_id || ""}
                        onAddMember={() => setIsAddMemberOpen(true)}
                        activeView={activeView}
                        setActiveView={setActiveView}
                    />
                </div>
            </div>

            <CreateGroupModal
                isOpen={isAddMemberOpen}
                onClose={() => setIsAddMemberOpen(false)}
                initialView="addMembers"
                mode="addMembers"
                groupId={groupId}
            />

            {isMessageInfoOpen && (messageInfoMessage || selectedMessage) && (
                <MessageInfoModal
                    isOpen={isMessageInfoOpen}
                    onClose={() => {
                        setIsMessageInfoOpen(false);
                        setMessageInfoMessage(null);
                    }}
                    message={messageInfoMessage || selectedMessage}
                    messageId={(messageInfoMessage || selectedMessage)!.id}
                    messageContent={(messageInfoMessage || selectedMessage)!.text || (messageInfoMessage || selectedMessage)!.text_content || ""}
                    groupId={groupId}
                    isGroup={true}
                    currentUserId={currentUser?.id || activeProfile?.id}
                />
            )}

            <DeleteMessageModal
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                count={1}
                onDeleteForMe={() => {
                    if (deleteTargetMessage) {
                        handleDeleteForMe(deleteTargetMessage);
                    }
                    setDeleteTargetMessage(null);
                }}
                onDeleteForEveryone={() => {
                    if (deleteTargetMessage) {
                        handleDeleteForEveryone(deleteTargetMessage);
                    }
                    setDeleteTargetMessage(null);
                }}
                isSender={Boolean(
                    deleteTargetMessage &&
                    (deleteTargetMessage.sender === "me" ||
                     deleteTargetMessage.senderId === (currentUser?.id || currentUser?.user_id || activeProfile?.id) ||
                     deleteTargetMessage.senderId === "me")
                )}
            />



            {previewMedia && (
                <MediaDetailViewer
                    isOpen={!!previewMedia}
                    onClose={() => setPreviewMedia(null)}
                    items={
                        previewMedia.mediaList && previewMedia.mediaList.length > 0
                            ? previewMedia.mediaList
                            : [
                                  {
                                      url: previewMedia.url,
                                      type: previewMedia.type,
                                      name: previewMedia.name,
                                  },
                              ]
                    }
                    initialIndex={previewMedia.initialIndex ?? 0}
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

            {/* Remove Pinned Message Confirmation Modal */}
            <ActionConfirmModal
                isOpen={isRemovePinModalOpen}
                type="remove_pinned_message"
                onClose={cancelRemoveGroupPin}
                onConfirm={confirmRemoveGroupPin}
            />

            {/* Replace Pinned Message Confirmation Modal */}
            <ActionConfirmModal
                isOpen={isReplacePinModalOpen}
                type="replace_pinned_message"
                onClose={cancelReplaceGroupPin}
                onConfirm={confirmReplaceGroupPin}
            />
        </div>
    );
}

