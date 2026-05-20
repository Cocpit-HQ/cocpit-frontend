"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus } from "lucide-react"
import { ChatThread } from "@/types/messaging"
import ChatListItem from "./ChatListItem"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useVirtualizer } from '@tanstack/react-virtual'
import { useSession } from "next-auth/react"
import { getConversations } from "@/services/api/messaging"
import { getPendingInvitations, respondInvitation } from "@/services/api/group-chat"
import { mapBackendChatToChatThread } from "@/lib/mappers/messaging.mapper"
import { useSocket } from "@/context/SocketContext"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { Button } from "@/components/ui/button"
import InvitationCard from "../group-chat/InvitationCard"
import Avatar from "@/components/shared/Avatar"

// Reusable exact tag component
const TagChip = ({ active, label, hasIndicator, onClick }: { active: boolean, label: string, hasIndicator?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex flex-row justify-center items-center px-[16px] py-[6px] gap-[8px] h-[32px] rounded-[24px] flex-none order-0 ${active
        ? "bg-[#EEF2FF] border border-[#EEF2FF]"
        : "bg-transparent border border-[#6366F1]"
      }`}
  >
    <span className={`h-[20px] font-['Poppins'] font-medium text-[14px] leading-[20px] flex items-center text-center tracking-[0.1px] text-[#6366F1] flex-none order-0`}>
      {label}
    </span>
    {hasIndicator && (
      <span className={`w-[6px] h-[6px] rounded-full bg-[#6366F1] flex-none order-1`} />
    )}
  </button>
)

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

export function ChatList({ selectedChatId, onSelectChat, isMobile, chats = [], isLoading, error, onCreateGroup, isCompany = false }: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { socket, isUserOnline } = useSocket();
  const { activeProfile } = useActiveProfile();
  const queryClient = useQueryClient();
  const parentRef = React.useRef<HTMLDivElement>(null);

  const { data: session } = useSession();
  const { data: invitations = [] } = useQuery({
    queryKey: ['invitations'],
    queryFn: getPendingInvitations
  });

  useEffect(() => {
    console.log("ChatList Rendered:", {
      currentUserId: session?.user?.id,
      activeProfile: activeProfile?.type,
      activeProfileId: activeProfile?.id,
      chatsCount: chats?.length,
      isLoading,
      hasError: !!error,
      invitationsCount: invitations?.length
    });
  }, [session, activeProfile, chats, isLoading, error, invitations]);


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
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    const handleInvitationUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    socket.on('group_invite', handleInvite);
    socket.on('invitation_update', handleInvitationUpdate);
    return () => {
      socket.off('group_invite', handleInvite);
      socket.off('invitation_update', handleInvitationUpdate);
    };
  }, [socket, queryClient]);

  const [activeTab, setActiveTab] = useState<'chat' | 'requests'>('chat');

  // Badge logic
  const hasUnreadChats = chats.some(chat => !chat.is_requesting && chat.unread > 0);
  const hasUnreadRequests = chats.some(chat => chat.is_requesting && chat.unread > 0);

  // Merge online status into chats
  const chatsWithStatus = React.useMemo(() => chats.map(chat => ({
    ...chat,
    online: chat.otherUserId ? isUserOnline(chat.otherUserId) : false
  })), [chats, isUserOnline]);

  const filteredChats = React.useMemo(() => {
    let list = chatsWithStatus.filter((chat) => {
      // 1. Filter by Tab
      if (activeTab === 'chat' && chat.is_requesting) return false;
      if (activeTab === 'requests' && !chat.is_requesting) return false;

      // 2. Filter by Search
      return (chat.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Sort by latest message timestamp (most recent first)
    // Unread items bubble to top within their category
    return list.sort((a, b) => {
      if (a.unread > 0 && b.unread === 0) return -1;
      if (b.unread > 0 && a.unread === 0) return 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  }, [chatsWithStatus, activeTab, searchTerm]);

  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: filteredChats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88, // 80px item + 8px gap
    overscan: 6,
  });

  return (
    <div className="box-border flex flex-col items-start p-[16px] gap-[16px] w-full h-full bg-[#FFFFFF] border border-[#EEF2FF] rounded-[24px] overflow-hidden">
      <div className="w-full flex flex-col gap-[16px] shrink-0">
        {/* Chat List Header (Frame 43) */}
        <div className="flex flex-row justify-between items-center p-0 gap-[8px] w-[348px] h-[42px] self-stretch">
          {/* Left Group — Avatar + Text */}
          <div className="flex flex-row items-center p-0 gap-[8px]">
            <div className="w-[32px] h-[32px] flex-none">
              <Avatar
                url={(activeProfile as any)?.avatar || session?.user?.image}
                name={activeProfile?.name || session?.user?.name || "User"}
                size="sm"
              />
            </div>
            <div className="flex flex-col items-start p-0">

              <h2 className="font-['Poppins'] font-medium text-[18px] leading-[26px] flex items-center text-[#000000] flex-none order-0 whitespace-nowrap">
                {activeProfile?.name || session?.user?.name || "Cocpit"}
              </h2>
              <p className="font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] flex-none order-1 whitespace-nowrap">
                @{(activeProfile as any)?.account_name || (session?.user as any)?.username || "cocpit23"}
              </p>
            </div>
          </div>
          {/* Plus Button (Frame 2608532) */}
          <button
            onClick={onCreateGroup}
            className="box-border flex flex-row justify-center items-center px-[16px] py-[8px] gap-[10px] w-[56px] h-[40px] bg-[#FFFFFF] border border-[#6B7280] rounded-[24px] flex-none order-1 hover:bg-[#F9FAFB] transition-colors"
          >
            <Plus className="w-[24px] h-[24px] flex-none order-0 text-[#6B7280]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Search Bar (Frame 2608500) */}
        <div className="box-border flex flex-row justify-between items-center px-[16px] py-[8px] gap-[10px] w-full h-[40px] bg-[#FFFFFF] border border-[#6B7280] rounded-[24px] relative">
          <Search className="w-[20px] h-[20px] text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search messages, people, roles.."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#6B7280] placeholder-[#6B7280] focus:outline-none"
          />
        </div>

        {/* Tags Row (Frame 2608634) */}
        <div className="flex flex-row items-start p-0 gap-[16px] w-[298px] h-[40px] overflow-x-auto scrollbar-hide shrink-0">
          <TagChip
            active={activeTab === 'chat'}
            label="Chat"
            hasIndicator={hasUnreadChats}
            onClick={() => setActiveTab('chat')}
          />
          <TagChip
            active={activeTab === 'requests'}
            label="Requests"
            hasIndicator={hasUnreadRequests}
            onClick={() => setActiveTab('requests')}
          />
        </div>

        {/* Inbox Count */}
        <div className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] ">
          Inbox - {filteredChats.length}
        </div>
      </div>

      <div ref={parentRef} className="flex flex-col flex-1 w-full overflow-y-auto pb-24 md:pb-0 scrollbar-hide relative gap-[8px]">
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

        {!isLoading && !error && filteredChats.length > 0 && (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
              width: "100%",
            }}
            className="flex flex-col gap-[8px]"
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const chat = filteredChats[virtualRow.index];
              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat?.(chat)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ChatListItem
                    chat={chat}
                    isSelected={selectedChatId === chat.id}
                    isMobile={isMobile}
                  />
                </div>
              );
            })}
          </div>
        )}
        {!isLoading && !error && filteredChats.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No conversations found
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(ChatList);
