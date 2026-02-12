"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus } from "lucide-react"
import { ChatThread } from "@/types/messaging"
import ChatListItem from "./ChatListItem"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { getConversations } from "@/services/api/messaging"
import { getPendingInvitations, respondInvitation } from "@/services/api/group-chat"
import { mapBackendChatToChatThread } from "@/lib/mappers/messaging.mapper"
import { useSocket } from "@/context/SocketContext"
import { Button } from "@/components/ui/button"
import InvitationCard from "../group-chat/InvitationCard"

interface ChatListProps {
  selectedChatId?: string // Updated to string
  onSelectChat?: (chat: ChatThread) => void
  isMobile: boolean
  chats: ChatThread[];
  isLoading: boolean;
  error: Error | null;
  onCreateGroup?: () => void;
  isCompany?: boolean;
}

export default function ChatList({ selectedChatId, onSelectChat, isMobile, chats = [], isLoading, error, onCreateGroup, isCompany = false }: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { socket, isUserOnline } = useSocket();
  const queryClient = useQueryClient();

  const { data: session } = useSession();
  const { data: invitations = [] } = useQuery({
    queryKey: ['invitations'],
    queryFn: getPendingInvitations
  });

  useEffect(() => {
    console.log("ChatList Rendered. Current User ID:", session?.user?.id);
    console.log("Invitations Data:", invitations);
  }, [session, invitations]);


  const handleRespond = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      await respondInvitation(invitationId, action);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err) {
      console.error("Failed to respond", err);
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handleInvite = () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    };
    socket.on('group_invite', handleInvite);
    return () => {
      socket.off('group_invite', handleInvite);
    };
  }, [socket, queryClient]);

  const [activeTab, setActiveTab] = useState<'all' | 'groups'>('all');

  // Merge online status into chats
  const chatsWithStatus = chats.map(chat => ({
    ...chat,
    online: chat.otherUserId ? isUserOnline(chat.otherUserId) : false
  }));

  const filteredChats = chatsWithStatus.filter((chat) => {
    // 1. Filter by Tab
    if (activeTab === 'groups' && !chat.isGroup) return false;

    // 2. Filter by Search
    return (chat.name || "").toLowerCase().includes(searchTerm.toLowerCase());
  })

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-xl text-foreground">Messages</h2>
          {!isCompany && (
            <Button variant="ghost" size="icon" onClick={onCreateGroup}>
              <Plus className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="relative mb-3">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted text-foreground placeholder-muted-foreground border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'groups'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            Group
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 md:pb-0 scrollbar-hide">
        {/* Invitations Section */}
        {!isCompany && invitations.length > 0 && (
          <div className="p-4 bg-muted/30 space-y-2 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Invitations</h3>
            {invitations.map((inv: any) => (
              <InvitationCard
                key={inv.invitation_id}
                groupName={inv.group_name}
                groupAvatar={inv.group_avatar}
                inviterName={inv.inviter_name}
                onAccept={() => handleRespond(inv.invitation_id, 'accept')}
                onReject={() => handleRespond(inv.invitation_id, 'reject')}
              />
            ))}
          </div>
        )}

        {/* ... */}
        {isLoading && <div className="p-8 text-center text-muted-foreground">Loading conversations...</div>}
        {error && <div className="p-8 text-center text-red-500">Failed to load conversations</div>}

        {!isLoading && !error && filteredChats.map((chat) => (
          <div key={chat.id} onClick={() => onSelectChat?.(chat)}>
            <ChatListItem
              chat={chat}
              isSelected={selectedChatId === chat.id}
              isMobile={isMobile}
            />
          </div>
        ))}
        {!isLoading && !error && filteredChats.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No conversations found
          </div>
        )}
      </div>
    </div>
  )
}
