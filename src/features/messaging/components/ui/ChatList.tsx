"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus } from "lucide-react"
import { toast } from "sonner"
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
import { useCompanyPermissions } from "@/features/companyprofile/hooks/useCompanyPermissions"
import { Button } from "@/components/ui/button"
import InvitationCard from "../group-chat/InvitationCard"
import Avatar from "@/components/shared/Avatar"
import ConversationListSkeleton from "../skeletons/ConversationListSkeleton"
import { ChatFilterDropdown, ChatFilterOption } from "./ChatFilterDropdown"

// Reusable exact tag component
const TagChip = ({ active, label, hasIndicator, onClick, disabled }: { active: boolean, label: string, hasIndicator?: boolean, onClick: () => void, disabled?: boolean }) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    title={disabled ? (label === 'Jobs' ? "Permission required to access job chat" : "Permission required to access chat") : undefined}
    className={`flex flex-row justify-center items-center px-[16px] py-[6px] gap-[8px] h-[32px] rounded-[24px] flex-none order-0 ${
      disabled
        ? "opacity-50 cursor-not-allowed bg-gray-100 border border-gray-300"
        : active
          ? "bg-[#EEF2FF] border border-[#EEF2FF]"
          : "bg-transparent border border-[#6366F1]"
    }`}
  >
    <span className={`h-[20px] font-['Poppins'] font-medium text-[14px] leading-[20px] flex items-center text-center tracking-[0.1px] ${disabled ? 'text-gray-400' : 'text-[#6366F1]'} flex-none order-0`}>
      {label}
    </span>
    {hasIndicator && !disabled && (
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
  activeTab?: 'chat' | 'jobs' | 'requests';
  setActiveTab?: (tab: 'chat' | 'jobs' | 'requests') => void;
  isQuickChat?: boolean;
  chatFilter?: 'All' | 'Groups';
}

export function ChatList({
  selectedChatId,
  onSelectChat,
  isMobile,
  chats = [],
  isLoading,
  error,
  onCreateGroup,
  isCompany = false,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  isQuickChat = false,
  chatFilter = 'All',
}: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<ChatFilterOption>(chatFilter || 'All')
  const { socket, isUserOnline, typingConversations } = useSocket();
  const { activeProfile } = useActiveProfile();
  const isUserActor = !activeProfile || activeProfile.type === "USER";
  const companyPermissions = useCompanyPermissions({ viewer_role_data: activeProfile?.viewer_role_data });
  const canChat = !isCompany || companyPermissions.canChat;
  const canJobsChat = !isCompany || companyPermissions.canJobsChat;
  const queryClient = useQueryClient();
  const parentRef = React.useRef<HTMLDivElement>(null);

  const { data: session } = useSession();

  useEffect(() => {
    if (chatFilter) {
      setSelectedFilter(chatFilter);
    }
  }, [chatFilter]);

  useEffect(() => {
    console.log("ChatList Rendered:", {
      currentUserId: session?.user?.id,
      activeProfile: activeProfile?.type,
      activeProfileId: activeProfile?.id,
      chatsCount: chats?.length,
      isLoading,
      hasError: !!error,
    });
  }, [session, activeProfile, chats, isLoading, error]);


  const handleRespond = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      await respondInvitation(invitationId, action);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err) {
      console.error("Failed to respond", err);
    }
  };

  const [localTypingMap, setLocalTypingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!socket) return;
    const handleInvite = (payload?: any) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    const handleInvitationUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    const handleConversationUpdated = (data?: { conversationId?: string; isJobChat?: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };
    const handleTyping = (payload: { conversationId?: string; senderId?: string }) => {
      if (payload?.conversationId && String(payload.senderId) !== String(session?.user?.id)) {
        const convId = String(payload.conversationId);
        setLocalTypingMap((prev) => ({ ...prev, [convId]: true }));
      }
    };
    const handleStopTyping = (payload: { conversationId?: string }) => {
      if (payload?.conversationId) {
        const convId = String(payload.conversationId);
        setLocalTypingMap((prev) => {
          const next = { ...prev };
          delete next[convId];
          return next;
        });
      }
    };

    socket.on('group_invite', handleInvite);
    socket.on('invitation_update', handleInvitationUpdate);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('conversation_job_status_changed', handleConversationUpdated);
    socket.on('isTyping', handleTyping);
    socket.on('stoppedTyping', handleStopTyping);

    return () => {
      socket.off('group_invite', handleInvite);
      socket.off('invitation_update', handleInvitationUpdate);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('conversation_job_status_changed', handleConversationUpdated);
      socket.off('isTyping', handleTyping);
      socket.off('stoppedTyping', handleStopTyping);
    };
  }, [socket, queryClient, session?.user?.id]);

  const [localActiveTab, setLocalActiveTab] = useState<'chat' | 'jobs' | 'requests'>('chat');
  const rawActiveTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;

  // Strict normalization: in User mode, tab can ONLY be 'chat' or 'requests'; in Company mode, 'chat' or 'jobs'
  const effectiveTab: 'chat' | 'jobs' | 'requests' = isCompany
    ? (rawActiveTab === 'jobs' ? 'jobs' : 'chat')
    : (rawActiveTab === 'requests' ? 'requests' : 'chat');

  const otherTabQuery = useQuery({
    queryKey: [
      "conversations",
      activeProfile?.type ?? "USER",
      activeProfile?.id ?? "me",
      activeProfile?.type === "COMPANY" ? (effectiveTab === "jobs" ? "chat" : "jobs") : "none",
    ],
    queryFn: async () => {
      if (activeProfile?.type !== "COMPANY") return [];
      const otherTabParam = effectiveTab === "jobs" ? "GENERAL" : "JOBS";
      const backendChats = await getConversations({ companyId: activeProfile.id, tab: otherTabParam });
      return backendChats.map(mapBackendChatToChatThread);
    },
    enabled: isCompany,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const currentTabHasUnread = chats.some(chat => chat.unread > 0);
  const otherTabHasUnread = (otherTabQuery.data || []).some(chat => chat.unread > 0);

  const hasUnreadChats = isCompany
    ? (effectiveTab === 'chat' ? currentTabHasUnread : otherTabHasUnread)
    : chats.some(chat => !chat.is_requesting && chat.unread > 0);

  const hasUnreadJobChats = isCompany
    ? (effectiveTab === 'jobs' ? currentTabHasUnread : otherTabHasUnread)
    : false;

  const hasUnreadRequests = chats.some(chat => {
    if (chat.is_requesting === true) {
      const isGroupInv = chat.isGroup === true || (chat as any).is_group === true || chat.request_source === 'group_invitation';
      const isGroupInvUnread = isGroupInv && !chat.is_read;
      return isGroupInvUnread || (typeof chat.unread === 'number' && chat.unread > 0) || chat.is_read === false;
    }
    return false;
  });

  // Merge online status into chats
  const chatsWithStatus = React.useMemo(() => chats.map(chat => ({
    ...chat,
    online: chat.isMock ? chat.online : (chat.otherUserId && !chat.isBlockedByMe && !chat.isBlockedByOther ? isUserOnline(chat.otherUserId) : false)
  })), [chats, isUserOnline]);

  const filteredChats = React.useMemo(() => {
    // Step 1: First check Tab basis (Chat vs Requests or Chat vs Jobs)
    const tabBaseChats = chatsWithStatus.filter((chat) => {
      if (isCompany) {
        const isJob = Boolean(chat.isJobChat || (chat.jobIds && chat.jobIds.length > 0));
        if (effectiveTab === 'chat') return !isJob;
        if (effectiveTab === 'jobs') return isJob;
        return true;
      } else {
        if (effectiveTab === 'chat') return !chat.is_requesting;
        if (effectiveTab === 'requests') return Boolean(chat.is_requesting);
        return true;
      }
    });

    // Step 2: Then apply dropdown filter (All | Groups) and search on that tab basis
    const filteredList = tabBaseChats.filter((chat) => {
      if (isUserActor && selectedFilter === 'Groups') {
        if (effectiveTab === 'requests') {
          const isGroupInvitation = Boolean(
            chat.isGroup || (chat as any).is_group || chat.request_source === 'group_invitation'
          );
          if (!isGroupInvitation) return false;
        } else {
          const isGroupChat = Boolean(chat.isGroup || (chat as any).is_group);
          if (!isGroupChat) return false;
        }
      }

      // Filter by Search
      return (chat.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Sort strictly by latest message timestamp (most recent first)
    return [...filteredList].sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      const validTimeA = isNaN(timeA) ? 0 : timeA;
      const validTimeB = isNaN(timeB) ? 0 : timeB;
      return validTimeB - validTimeA;
    });
  }, [chatsWithStatus, effectiveTab, searchTerm, isCompany, isUserActor, selectedFilter]);

  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: filteredChats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isQuickChat ? 68 : 88, // 68px for Quick Chat, 88px (80+8) for main list
    overscan: 6,
  });

  return (
    <div className={`box-border flex flex-col items-start w-full h-full bg-[#FFFFFF] ${isQuickChat ? 'p-0 gap-0 border-none rounded-none' : 'p-[16px] gap-[16px] border border-[#EEF2FF] rounded-[24px]'} overflow-hidden`}>
      <div className={`w-full flex flex-col ${isQuickChat ? 'gap-0' : 'gap-[16px]'} shrink-0`}>
        {/* Chat List Header (Frame 43) */}
        {!isQuickChat && (
          <div className="flex flex-row justify-between items-center p-0 gap-[8px] w-full h-[42px] self-stretch">
            {/* Left Group — Avatar + Text */}
            <div className="flex flex-row items-center p-0 gap-[8px] min-w-0 flex-1">
              <div className="w-[40px] h-[40px] flex-none">
                <Avatar
                  url={(activeProfile as any)?.avatar_url || (activeProfile as any)?.avatar || session?.user?.image}
                  name={activeProfile?.name || session?.user?.name || "User"}
                  size="md"
                  isCompany={activeProfile?.type === 'COMPANY'}
                />
              </div>
              <div className="flex flex-col items-start p-0 min-w-0 flex-1 overflow-hidden">
                <h2 
                  title={activeProfile?.name || session?.user?.name || "Cocpit"}
                  className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-[#000000] truncate w-full block"
                >
                  {activeProfile?.name || session?.user?.name || "Cocpit"}
                </h2>
                <p 
                  title={`@${activeProfile?.type === 'COMPANY' 
                    ? ((activeProfile as any)?.slug || activeProfile?.name?.toLowerCase().replace(/\s+/g, "") || "cocpit")
                    : ((activeProfile as any)?.slug || (activeProfile as any)?.account_name || (session?.user as any)?.username || activeProfile?.name?.toLowerCase().replace(/\s+/g, "") || "cocpit")}`}
                  className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] truncate w-full block"
                >
                  @{activeProfile?.type === 'COMPANY' 
                      ? ((activeProfile as any)?.slug || activeProfile?.name?.toLowerCase().replace(/\s+/g, "") || "cocpit")
                      : ((activeProfile as any)?.slug || (activeProfile as any)?.account_name || (session?.user as any)?.username || activeProfile?.name?.toLowerCase().replace(/\s+/g, "") || "cocpit")}
                </p>
              </div>
            </div>
            {/* Right Controls — Filter (User only) & Plus Button */}
            <div className="flex flex-row items-center gap-[8px] shrink-0">
              {isUserActor && (
                <ChatFilterDropdown value={selectedFilter} onChange={setSelectedFilter} />
              )}
              <button
                onClick={onCreateGroup}
                className="box-border flex flex-row justify-center items-center px-[16px] py-[8px] gap-[10px] w-[56px] h-[40px] bg-[#FFFFFF] border border-[#6B7280] rounded-[24px] flex-none order-1 hover:bg-[#F9FAFB] transition-colors"
              >
                <Plus className="w-[24px] h-[24px] flex-none order-0 text-[#6B7280]" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* Search Bar (Frame 2608500) */}
        <div className={isQuickChat ? "px-[16px] pb-[8px] pt-[0px]" : ""}>
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
        </div>

        {isQuickChat && (
          <div className="relative w-full h-[36px] border-b border-[#EEF2FF] mt-0 mb-0">
            <button 
              onClick={() => { if (canChat) setActiveTab('chat'); }}
              disabled={!canChat}
              title={!canChat ? "Permission required to access chat" : undefined}
              className={`absolute left-[16px] flex flex-row justify-center items-center gap-[4px] px-[16px] py-[8px] h-[36px] border-b ${effectiveTab === 'chat' ? 'border-[#6366F1] text-[#6366F1] font-semibold' : 'border-transparent text-[#000000] font-normal'} transition-colors ${!canChat ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <span className="font-['Poppins'] text-[14px] leading-[20px]">Chat</span>
              {hasUnreadChats && <span className="w-[6px] h-[6px] rounded-full bg-[#6366F1] flex-none" />}
            </button>
            {!isCompany ? (
              <button 
                onClick={() => setActiveTab('requests')}
                className={`absolute left-[206px] flex flex-row justify-center items-center gap-[4px] px-[16px] py-[8px] h-[36px] border-b ${effectiveTab === 'requests' ? 'border-[#6366F1] text-[#6366F1] font-semibold' : 'border-transparent text-[#000000] font-normal'} transition-colors`}
              >
                <span className="font-['Poppins'] text-[14px] leading-[20px]">Requests</span>
                {hasUnreadRequests && <span className="w-[6px] h-[6px] rounded-full bg-[#6366F1] flex-none" />}
              </button>
            ) : (
              <button 
                onClick={() => { if (canJobsChat) setActiveTab('jobs'); }}
                disabled={!canJobsChat}
                title={!canJobsChat ? "Permission required to access job chat" : undefined}
                className={`absolute left-[206px] flex flex-row justify-center items-center gap-[4px] px-[16px] py-[8px] h-[36px] border-b ${effectiveTab === 'jobs' ? 'border-[#6366F1] text-[#6366F1] font-semibold' : 'border-transparent text-[#000000] font-normal'} transition-colors ${!canJobsChat ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="font-['Poppins'] text-[14px] leading-[20px]">Jobs</span>
                {hasUnreadJobChats && <span className="w-[6px] h-[6px] rounded-full bg-[#6366F1] flex-none" />}
              </button>
            )}
          </div>
        )}

        {/* Tags Row (Frame 2608634) */}
        {!isQuickChat && (
          <>
            <div className="flex flex-row items-start p-0 gap-[16px] w-[298px] h-[40px] overflow-x-auto scrollbar-hide shrink-0">
              <TagChip
                active={effectiveTab === 'chat'}
                label="Chat"
                hasIndicator={hasUnreadChats}
                disabled={!canChat}
                onClick={() => {
                  if (canChat) {
                    setActiveTab('chat');
                  }
                }}
              />
              {isCompany ? (
                <TagChip
                  active={effectiveTab === 'jobs'}
                  label="Jobs"
                  hasIndicator={hasUnreadJobChats}
                  disabled={!canJobsChat}
                  onClick={() => {
                    if (canJobsChat) {
                      setActiveTab('jobs');
                    }
                  }}
                />
              ) : (
                <TagChip
                  active={effectiveTab === 'requests'}
                  label="Requests"
                  hasIndicator={hasUnreadRequests}
                  onClick={() => setActiveTab('requests')}
                />
              )}
            </div>

            {/* Inbox Count */}
            <div className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] ">
              Inbox - {filteredChats.length}
            </div>
          </>
        )}
      </div>

      <div ref={parentRef} className={`flex flex-col flex-1 w-full overflow-y-auto ${isQuickChat ? 'pb-[20px]' : 'pb-24 md:pb-0'} scrollbar-hide relative gap-[8px]`}>
        {/* ... */}
        {isLoading && <ConversationListSkeleton />}
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
              const isJobChat = Boolean(chat.isJobChat || (chat.jobIds && chat.jobIds.length > 0));
              const isJobChatDisabled = isCompany && isJobChat && !canJobsChat;

              return (
                <div
                  key={virtualRow.key}
                  onClick={(e) => {
                    if (isJobChatDisabled) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    onSelectChat?.(chat);
                    if (isCompany && chat.isJobChat && rawActiveTab !== 'jobs' && setActiveTab) {
                      setActiveTab('jobs');
                    }
                  }}
                  className={isJobChatDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                  title={isJobChatDisabled ? "Permission required to access job chat" : undefined}
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
                    isGroupInvitationRead={chat.is_read}
                    isTyping={Boolean(chat?.id && (typingConversations?.[String(chat.id)] || localTypingMap?.[String(chat.id)]))}
                    isQuickChat={isQuickChat}
                    isFirst={virtualRow.index === 0}
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
