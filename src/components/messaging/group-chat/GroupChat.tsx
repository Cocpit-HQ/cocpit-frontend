"use client"

import React, { useState, useEffect } from "react";
import { useGroupChat } from "./groupChat.context";
import GroupHeader from "./GroupHeader";
import GroupMessageList from "./GroupMessageList";
import UnifiedMessageInput from "../ui/UnifiedMessageInput";
import GroupDetails from "./GroupDetails";
import AddMemberModal from "./AddMemberModal";
import { Loader2 } from "lucide-react";
import { useQueryClient, useQuery, useMutation, useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import { sendMessage as sendGroupMessage } from "../../../services/api/group-chat";
import { editMessage, deleteMessage } from "../../../services/api/messaging";
import { Message } from "../../../types/messaging";
import { formatTimeAgo } from "../../../lib/mappers/messaging.mapper";
import { useSocket } from "../../../context/SocketContext";
import { TypingPayload } from "../../../types/socket";
import { useRef } from "react";
import MessageInfoModal from "../MessageInfoModal";
import { DeleteMessageModal } from "../ui/DeleteMessageModal";
import MediaPreviewModal from "../ui/MediaPreviewModal";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import ChatSkeleton from "../ui/ChatSkeleton";

interface GroupChatProps {
    groupId: string;
    currentUser: { id?: string; user_id?: string;[key: string]: any }; // Fallback since user object structure varies
    messages?: Message[]; // Pass messages optionally if managed by parent
    onBack?: () => void;
}

export default function GroupChat({ groupId, currentUser, messages = [], onBack }: GroupChatProps) {
    const { activeGroup, isLoading, error, inviteMember, isInactive } = useGroupChat();
    const { toast } = useToast();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const queryClient = useQueryClient();
    const { socket, setActiveConversationId } = useSocket();
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isMessageInfoOpen, setIsMessageInfoOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [previewMedia, setPreviewMedia] = useState<{ url: string, type: 'image' | 'video' | 'document', name?: string } | null>(null);

    const handleMediaClick = (url: string, type: 'image' | 'video' | 'document', name?: string) => {
        setPreviewMedia({ url, type, name });
    };

    const handleMessageAction = React.useCallback((action: string, msg?: Message) => {
        const targetMsg = msg || selectedMessage;
        if (!targetMsg) return;

        if (action === 'info') {
            setIsMessageInfoOpen(true);
        } else if (action === 'copy') {
            navigator.clipboard.writeText(targetMsg.text || targetMsg.text_content || "");
            setSelectedMessage(null);
        } else if (action === 'edit') {
            setEditingMessageId(targetMsg.id);
            setSelectedMessage(null);
        } else if (action === 'delete') {
            setMessageToDelete(targetMsg);
            setIsDeleteModalOpen(true);
            setSelectedMessage(null);
        } else if (action === 'close') {
            setSelectedMessage(null);
        }
    }, [selectedMessage]);

    const handleMessageClick = React.useCallback((message: Message) => {
        if (selectedMessage?.id === message.id) {
            setSelectedMessage(null); // Toggle off
        } else {
            setSelectedMessage(message);
        }
    }, [selectedMessage]);

    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

    const editMessageMutation = useMutation({
        mutationFn: async ({ messageId, text }: { messageId: string, text: string }) => {
            return editMessage(messageId, text);
        },
        onSuccess: () => {
            setEditingMessageId(null);
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
            const { getMessages } = await import("../../../services/api/messaging");
            const { mapBackendMessageToMessage } = await import("../../../lib/mappers/messaging.mapper");
            const backendMessages = await getMessages(groupId, 50, pageParam);
            return backendMessages.map(m => mapBackendMessageToMessage(m, currentUser.id || currentUser.user_id));
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.length < 50) return undefined;
            return lastPage[0]?.created_at;
        },
        initialPageParam: null as string | null,
        enabled: !!groupId,
        staleTime: Infinity,
    });

    const fetchedMessages = React.useMemo(() => {
        if (!data) return [];
        return [...data.pages].reverse().flatMap(page => page);
    }, [data]);

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

        const handleNewMessage = async (message: any) => {
            // Filter
            if (message.conversation_id !== groupId && message.group_id !== groupId) return;

            const { mapBackendMessageToMessage } = await import("../../../lib/mappers/messaging.mapper");
            const uiMessage = mapBackendMessageToMessage(message, currentUser.id || currentUser.user_id);
            const isMe = message.sender_id === (currentUser.id || currentUser.user_id);

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
                    newPages[existsPage] = newPages[existsPage].map(m => m.id === uiMessage.id ? uiMessage : m);
                    return { ...old, pages: newPages };
                }

                const newPages = [...old.pages];

                // Handle optimistic update replacement for own messages in FIRST page
                if (isMe) {
                    const firstPage = newPages[0];
                    const optimisticMatch = firstPage.find(m =>
                        m.id.startsWith('temp-') &&
                        m.text === uiMessage.text
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
            // queryClient.invalidateQueries({ queryKey: ['conversations'] }); // Handled by MessagingPage via socket or manual update

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

        const handleMessageDeletedForMe = (payload: { messageId: string }) => {
            queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    pages: old.pages.map(page => page.map(m => {
                        if (m.id === payload.messageId) {
                            return {
                                ...m,
                                text: "This message is deleted for you",
                                is_deleted_for_me: true
                            };
                        }
                        return m;
                    }))
                };
            });
            // Also update conversation list logic here if needed, but invalidation is safer
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        };

        const handleMessageDeletedForEveryone = (payload: { messageId: string, conversationId: string }) => {
            if (payload.conversationId !== groupId) return;

            queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    pages: old.pages.map(page => page.map(m => {
                        if (m.id === payload.messageId) {
                            return { ...m, text: "This message deleted for everyone", is_deleted_for_everyone: true };
                        }
                        return m;
                    }))
                };
            });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        };

        socket.on('new_message', handleNewMessage);
        socket.on('isTyping', handleTyping);
        socket.on('stoppedTyping', handleStopTyping);
        socket.on('message_deleted_for_me', handleMessageDeletedForMe);
        socket.on('message_deleted_for_everyone', handleMessageDeletedForEveryone);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('isTyping', handleTyping);
            socket.off('stoppedTyping', handleStopTyping);
            socket.off('message_deleted_for_me', handleMessageDeletedForMe);
            socket.off('message_deleted_for_everyone', handleMessageDeletedForEveryone);
            setActiveConversationId(null);
        };
    }, [socket, groupId, queryClient, currentUser.id, currentUser.user_id, setActiveConversationId]);

    const sendMessageMutation = useMutation({
        mutationFn: async ({ text, files }: { text: string, files: File[] }) => {
            return await sendGroupMessage(groupId, text, 'text', files);
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

            queryClient.setQueryData(['conversations'], (oldData: any[]) => {
                if (!oldData) return oldData;

                const now = new Date().toISOString();
                const updatedList = oldData.map(c => {
                    if (c.conversation_id === groupId || c.id === groupId) {
                        return {
                            ...c,
                            last_message_text: text || "Sent an attachment",
                            lastMessage: text || "Sent an attachment",
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

            // Invalidate to fetch the true state
            queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
            // queryClient.invalidateQueries({ queryKey: ['conversations'] }); // Optimistic update is enough, avoid sidebar re-render
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
                    const { markGroupAsRead } = await import("../../../services/api/group-chat");
                    // Fire and forget - don't wait for it to block UI
                    markGroupAsRead(groupId).catch(console.error);

                    // Optimistically update conversation unread count
                    queryClient.setQueryData(['conversations'], (oldData: any[]) => {
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

    const handleSendMessage = React.useCallback((text: string, files: File[]) => {
        // Stop typing immediately when sending
        if (socket) {
            socket.emit('stopGroupTyping', { groupId: groupId });
        }
        sendMessageMutation.mutate({ text, files });
    }, [socket, groupId, sendMessageMutation]);

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
                    onOpenDetails={() => setIsDetailsOpen(true)}
                    onAddMember={() => setIsAddMemberOpen(true)}
                    onBack={onBack}
                    typingStatus={typingStatus}
                    selectedMessage={selectedMessage}
                    onMessageAction={handleMessageAction}
                    currentUserId={currentUser.id || currentUser.user_id || ""}
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
        <div className="flex flex-col h-full bg-background relative">
            <GroupHeader
                onOpenDetails={() => setIsDetailsOpen(true)}
                onAddMember={() => setIsAddMemberOpen(true)}
                onBack={onBack}
                typingStatus={typingStatus}
                selectedMessage={selectedMessage}
                onMessageAction={handleMessageAction}
                currentUserId={currentUser.id || currentUser.user_id || ""}
            />

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
                />
            </div>

            {!isInactive ? (
                <UnifiedMessageInput
                    onSendMessage={handleSendMessage}
                    onTyping={handleTypingInput}
                    isLoading={isLoading || isMessagesLoading}
                    placeholder="Type a message to group..."
                />
            ) : (
                <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm text-center text-muted-foreground text-sm flex flex-col items-center gap-1">
                    <p className="font-medium text-foreground">You left this group</p>
                    <p className="text-xs opacity-70">You can delete this chat from your list in group info.</p>
                </div>
            )}

            <GroupDetails
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                currentUserId={currentUser.id || currentUser.user_id || ""}
                onAddMember={() => setIsAddMemberOpen(true)}
            />

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

            {messageToDelete && (
                <DeleteMessageModal
                    open={isDeleteModalOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsDeleteModalOpen(false);
                            setMessageToDelete(null);
                        }
                    }}
                    onDeleteForMe={async () => {
                        if (!messageToDelete) return;
                        const msgId = messageToDelete.id;
                        // Optimistic Update
                        queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
                            if (!old) return undefined;
                            return {
                                ...old,
                                pages: old.pages.map(page => page.map(m => {
                                    if (m.id === msgId) {
                                        return {
                                            ...m,
                                            text: "This message is deleted for you",
                                            is_deleted_for_me: true
                                        };
                                    }
                                    return m;
                                }))
                            };
                        });

                        setIsDeleteModalOpen(false);
                        setMessageToDelete(null);

                        try {
                            await deleteMessage(msgId, false);
                        } catch (e) {
                            console.error("Failed to delete for me", e);
                            queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
                        }
                    }}
                    onDeleteForEveryone={async () => {
                        if (!messageToDelete) return;
                        const msgId = messageToDelete.id;

                        // Optimistic Update
                        queryClient.setQueryData(['messages', groupId], (old: InfiniteData<Message[]> | undefined) => {
                            if (!old) return undefined;
                            return {
                                ...old,
                                pages: old.pages.map(page => page.map(m => {
                                    if (m.id === msgId) {
                                        return { ...m, text: "This message was deleted for everyone", is_deleted_for_everyone: true };
                                    }
                                    return m;
                                }))
                            };
                        });

                        setIsDeleteModalOpen(false);
                        setMessageToDelete(null);

                        try {
                            await deleteMessage(msgId, true);
                        } catch (e) {
                            console.error("Failed to delete for everyone", e);
                            queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
                        }
                    }}
                    isSender={!!(messageToDelete && (messageToDelete.sender === 'me' || (messageToDelete.senderId && String(messageToDelete.senderId) === String(currentUser.id || currentUser.user_id))))}
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
        </div>
    );
}

