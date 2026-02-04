"use client"

import React, { useState, useEffect } from "react";
import { useGroupChat } from "./groupChat.context";
import GroupHeader from "./GroupHeader";
import GroupMessageList from "./GroupMessageList";
import GroupMessageInput from "./GroupMessageInput";
import GroupDetails from "./GroupDetails";
import AddMemberModal from "./AddMemberModal";
import { Loader2 } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
    const { socket } = useSocket();

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

        const handleNewMessage = (message: any) => {
            if (message.conversation_id === groupId || message.group_id === groupId) {
                queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                queryClient.invalidateQueries({ queryKey: ['group-details', groupId] });
            }
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [socket, groupId, queryClient]);

    const displayMessages = messages.length > 0 ? messages : fetchedMessages;

    if (isLoading) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    if (!activeGroup) {
        return <div className="h-full flex items-center justify-center text-muted-foreground">Group not found</div>;
    }

    const handleSendMessage = async (text: string) => {
        try {
            await sendMessage(groupId, text);
            // Invalidate queries to refresh messages
            queryClient.invalidateQueries({ queryKey: ['messages', groupId] });
            // Also invalidate conversations to update last message snippet
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        } catch (error) {
            console.error("Failed to send", error);
        }
    };

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
