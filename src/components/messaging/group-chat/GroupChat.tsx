"use client"

import React, { useState, useEffect } from "react";
import { useGroupChat } from "./groupChat.context";
import GroupHeader from "./GroupHeader";
import GroupMessageList from "./GroupMessageList";
import GroupMessageInput from "./GroupMessageInput";
import GroupDetails from "./GroupDetails";
import AddMemberModal from "./AddMemberModal";
import { Loader2 } from "lucide-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { sendMessage } from "../../../services/api/group-chat";
import { Message } from "../../../types/messaging";
import { useSocket } from "../../../context/SocketContext";

interface GroupChatProps {
    groupId: string;
    currentUser: { id?: string; user_id?: string;[key: string]: any }; // Fallback since user object structure varies
    messages?: Message[]; // Pass messages optionally if managed by parent
    onBack?: () => void;
}

export default function GroupChat({ groupId, currentUser, messages = [], onBack }: GroupChatProps) {
    const { activeGroup, isLoading, inviteMember } = useGroupChat();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const queryClient = useQueryClient();
    const { socket, setActiveConversationId } = useSocket();

    const { data: fetchedMessages = [] } = useQuery({
        queryKey: ['messages', groupId],
        queryFn: async () => {
            const { getMessages } = await import("../../../services/api/messaging");
            const { mapBackendMessageToMessage } = await import("../../../lib/mappers/messaging.mapper");
            const backendMessages = await getMessages(groupId);
            return backendMessages.map(m => mapBackendMessageToMessage(m, currentUser.id || currentUser.user_id));
        }
    });

    useEffect(() => {
        if (!socket) return;

        // Inform context of active conversation to suppress notifications
        setActiveConversationId(groupId);

        // Join the conversation room (standardized with ChatWindow)
        socket.emit('joinConversation', { conversationId: groupId });

        const handleNewMessage = async (message: any) => {
            // Filter
            if (message.conversation_id !== groupId && message.group_id !== groupId) return;

            const { mapBackendMessageToMessage } = await import("../../../lib/mappers/messaging.mapper");
            const uiMessage = mapBackendMessageToMessage(message, currentUser.id || currentUser.user_id);
            const isMe = message.sender_id === (currentUser.id || currentUser.user_id);

            queryClient.setQueryData(['messages', groupId], (old: Message[] | undefined) => {
                const current = old || [];

                // Deduplicate by ID
                if (current.some(m => m.id === uiMessage.id)) return current;

                // Handle optimistic update replacement for own messages
                if (isMe) {
                    const optimisticMatch = current.find(m =>
                        m.id.startsWith('temp-') &&
                        m.text === uiMessage.text
                    );
                    if (optimisticMatch) {
                        return current.map(m => m.id === optimisticMatch.id ? uiMessage : m);
                    }
                }

                return [...current, uiMessage];
            });

            // Update last message in specific conversation without refetching all conversation lists? 
            // Or just invalidate to be safe.
            queryClient.invalidateQueries({ queryKey: ['conversations'] });

            // We could also mark as read if focused, just like ChatWindow
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
            setActiveConversationId(null);
        };
    }, [socket, groupId, queryClient, currentUser, setActiveConversationId]);

    const sendMessageMutation = useMutation({
        mutationFn: async (text: string) => {
            return await sendMessage(groupId, text);
        },
        onMutate: async (text: string) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['messages', groupId] });

            // Snapshot the previous value
            const previousMessages = queryClient.getQueryData<Message[]>(['messages', groupId]);

            // Optimistically update to the new value
            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`,
                senderId: currentUser.id || currentUser.user_id,
                sender: 'me',
                senderName: activeGroup?.members.find(m => m.user_id === (currentUser.id || currentUser.user_id))?.full_name || "Me",
                text: text,
                time: new Date().toISOString(),
                created_at: new Date().toISOString(),
                type: 'text',
            };

            queryClient.setQueryData(['messages', groupId], (old: Message[] | undefined) => {
                return [...(old || []), optimisticMessage];
            });

            queryClient.setQueryData(['conversations'], (oldData: any[]) => {
                if (!oldData) return oldData;

                const now = new Date().toISOString();
                const updatedList = oldData.map(c => {
                    if (c.conversation_id === groupId || c.id === groupId) {
                        return {
                            ...c,
                            last_message_text: text,
                            lastMessage: text,
                            lastMessageAt: now,    // CRITICAL: Update timestamp for sorting
                            time: now,         // Update time for display
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
        onError: (err: unknown, newTodo: string, context: { previousMessages: Message[] | undefined; tempId: string } | undefined) => {
            queryClient.setQueryData(['messages', groupId], context?.previousMessages);
            // Revert conversations list if needed? It's tricky without previous state snapshot of conversations.
            // For now, just invalidate on error.
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            console.error("Failed to send", err);
        },
        onSuccess: (data: any, variables: string, context: { previousMessages: Message[] | undefined; tempId: string } | undefined) => {
            // Invalidate to fetch the true state
            queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });

    const displayMessages = messages.length > 0 ? messages : fetchedMessages;

    // Mark as read when opening conversation or when new messages arrive
    useEffect(() => {
        if (!groupId) return;

        const markRead = async () => {
            try {
                const { markAsRead } = await import("../../../services/api/messaging");
                await markAsRead(groupId);

                // Optimistically update conversation unread count
                queryClient.setQueryData(['conversations'], (oldData: any[]) => {
                    if (!oldData) return oldData;
                    return oldData.map(c => {
                        if (c.conversation_id === groupId) {
                            return { ...c, unread_count: 0 };
                        }
                        return c;
                    });
                });

                // Invalidate to be sure
                queryClient.invalidateQueries({ queryKey: ['conversations'] });

            } catch (error) {
                console.error("Failed to mark as read", error);
            }
        };

        markRead();

    }, [groupId, displayMessages.length, queryClient]); // Trigger when messages change too

    const handleSendMessage = (text: string) => {
        sendMessageMutation.mutate(text);
    };

    if (isLoading) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    if (!activeGroup) {
        return <div className="h-full flex items-center justify-center text-muted-foreground">Group not found</div>;
    }

    return (
        <div className="flex flex-col h-full bg-background relative">
            <GroupHeader
                onOpenDetails={() => setIsDetailsOpen(true)}
                onAddMember={() => setIsAddMemberOpen(true)}
                onBack={onBack}
            />

            <GroupMessageList messages={displayMessages} currentUserId={currentUser.id || currentUser.user_id || ""} />

            {activeGroup?.members.some(m => m.user_id === (currentUser.id || currentUser.user_id)) ? (
                <GroupMessageInput onSendMessage={handleSendMessage} />
            ) : (
                <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm text-center text-muted-foreground text-sm">
                    You left this group. <span className="text-xs opacity-70 block mt-1">You can delete this chat from your list in group info.</span>
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
        </div>
    );
}
