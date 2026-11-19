"use client"

import React, { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { AddIcon } from "@/components/icons"
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
import { useCompanyPermissions } from "@/features/businessProfile"
import { Button } from "@/components/ui/button"
import InvitationCard from "../group-chat/InvitationCard"
import Avatar from "@/components/shared/Avatar"
import ConversationListSkeleton from "../skeletons/ConversationListSkeleton"
import { FeatureDisabledTooltip } from "@/components/feature-flags"
import { useFeatureFlags } from "@/context/FeatureFlagContext"
import { ChatFilterDropdown, ChatFilterOption } from "./ChatFilterDropdown"
import { UnderlineTabs, TabItem } from "@/components/ui/UnderlineTabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface ChatListProps {
  selectedChatId?: string // Updated to string
  onSelectChat?: (chat: ChatThread) => void
  isMobile: boolean
  chats: ChatThread[];
  isLoading: boolean;
  error: Error | null;
  onCreateGroup?: () => void;
  onSelectNewChat?: (type: 'personal' | 'group') => void;
  isCompany?: boolean;
  activeTab?: 'chat' | 'jobs' | 'requests';
  setActiveTab?: (tab: 'chat' | 'jobs' | 'requests') => void;
  isQuickChat?: boolean;
  chatFilter?: ChatFilterOption;
}

export function ChatList({
  selectedChatId,
  onSelectChat,
  isMobile,
  chats = [],
  isLoading,
  error,
  onCreateGroup,
  onSelectNewChat,
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
  const { flags } = useFeatureFlags();

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
        const isIncomingRequest = Boolean(
          chat.is_requesting &&
          (!chat.created_by || String(chat.created_by) !== String(session?.user?.id))
        );
        if (effectiveTab === 'chat') return !isIncomingRequest;
        if (effectiveTab === 'requests') return isIncomingRequest;
        return true;
      }
    });

    // Step 2: Then apply dropdown filter (All | Group | Unread) and search on that tab basis
    const filteredList = tabBaseChats.filter((chat) => {
      if (isUserActor) {
        if (selectedFilter === 'Group' || selectedFilter === 'Groups') {
          if (effectiveTab === 'requests') {
            const isGroupInvitation = Boolean(
              chat.isGroup || (chat as any).is_group || chat.request_source === 'group_invitation'
            );
            if (!isGroupInvitation) return false;
          } else {
            const isGroupChat = Boolean(chat.isGroup || (chat as any).is_group);
            if (!isGroupChat) return false;
          }
        } else if (selectedFilter === 'Unread') {
          const unreadCount = Number(chat.unread || (chat as any).unread_count || 0);
          if (unreadCount <= 0) return false;
        }
      }

      // Filter by Search
      return (chat.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Pinned chat stays strictly at the top (like other messaging platforms), then sort by latest message timestamp
    return [...filteredList].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

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
    estimateSize: () => isQuickChat ? 68 : 84, // 68px for Quick Chat, 84px (76+8) for main list matching Frame 2610026
    overscan: 6,
  });

  return (
    <div className={`box-border flex flex-col items-stretch w-full h-full bg-[var(--ds-bg)] ${isQuickChat ? 'p-0 gap-0 border-none rounded-none' : 'py-4 px-0 gap-4 border-none'} overflow-hidden`}>
      <div className="w-full flex flex-col gap-4 shrink-0">
        {/* search: 380px x 40px, padding: 6px 12px, gap: 10px, border-bottom: 1px solid #FFECE6 */}
        <div className="box-border flex flex-row items-center justify-between px-3 py-1.5 gap-2.5 w-full h-10 self-stretch shrink-0 flex-none order-0 grow-0 border-b border-[var(--ds-text-primary)] focus-within:border-[var(--ds-accent)] transition-colors">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-0 bg-transparent font-['DM_Sans'] text-base font-normal text-[var(--ds-text-primary)] placeholder-[var(--ds-text-muted)] focus:outline-none leading-6 order-0 grow"
            aria-label="Search conversations"
          />
          <Search
            className="w-5 h-5 text-[var(--ds-text-primary)] shrink-0 flex-none order-1 grow-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        {/* Frame 2609925: Tabs Row + Action Button */}
        <div className="self-stretch px-3 flex justify-between items-center h-9 gap-3">
          <UnderlineTabs<'chat' | 'requests' | 'jobs'>
            tabs={[
              { id: 'chat', label: 'Chat', badge: hasUnreadChats, disabled: !canChat },
              ...(!isCompany
                ? (flags?.enableMessageRequests ?? true)
                  ? [{ id: 'requests' as const, label: 'Request', badge: hasUnreadRequests }]
                  : []
                : [{ id: 'jobs' as const, label: 'Jobs', badge: hasUnreadJobChats, disabled: !canJobsChat }]
              ),
            ]}
            activeTab={effectiveTab}
            onChange={(tabId) => setActiveTab(tabId)}
            size="md"
            className="w-auto h-9"
          />

          {/* Frame 2610103: Create new button with AddIcon & Dropdown matching Figma */}
          <DropdownMenu modal={false}>
            <FeatureDisabledTooltip featureKey="enableNewChatCreation" position="left">
              <DropdownMenuTrigger asChild>
                <button
                  className="box-border flex flex-row items-center justify-center px-3 py-1.5 w-[46px] h-[34px] border border-[var(--ds-border)] rounded-[99px] hover:bg-[var(--ds-surface-1)] transition-colors cursor-pointer shrink-0 outline-none"
                  aria-label="New Chat or Group"
                  title="New Chat or Group"
                >
                  <AddIcon className="w-5 h-5 text-[var(--ds-text-primary)] shrink-0" />
                </button>
              </DropdownMenuTrigger>
            </FeatureDisabledTooltip>

            {/* Dropdown Menu - Frame: add icon (114px x 80px, padding 12px, gap 16px) */}
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="box-border flex flex-col items-start p-3 gap-4 w-[114px] min-w-[114px] h-[80px] !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-lg !shadow-none z-[100] outline-none"
            >
              <DropdownMenuItem
                onClick={() => {
                  if (onSelectNewChat) {
                    onSelectNewChat('personal');
                  } else if (onCreateGroup) {
                    onCreateGroup();
                  }
                }}
                className="!p-0 m-0 h-5 w-[90px] font-['DM_Sans'] font-normal text-sm leading-5 whitespace-nowrap cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-0"
              >
                Personal Chat
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (onSelectNewChat) {
                    onSelectNewChat('group');
                  } else if (onCreateGroup) {
                    onCreateGroup();
                  }
                }}
                className="!p-0 m-0 h-5 w-[86px] font-['DM_Sans'] font-normal text-sm leading-5 whitespace-nowrap cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-1"
              >
                Create group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Inbox Count & Filter Row */}
        <div className="self-stretch px-3 flex justify-between items-center">
          <div className="font-['DM_Sans'] text-xs font-normal text-[var(--ds-text-secondary)] leading-4">
            Inbox - {filteredChats.length}
          </div>
          {isUserActor && (
            <ChatFilterDropdown value={selectedFilter} onChange={setSelectedFilter} />
          )}
        </div>
      </div>

      <div ref={parentRef} className={`flex flex-col flex-1 w-full overflow-y-auto px-2 ${isQuickChat ? 'pb-[20px]' : 'pb-24 md:pb-0'} scrollbar-hide relative gap-[8px]`}>
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
                  className={isJobChatDisabled ? 'opacity-50 cursor-default pointer-events-none' : ''}
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
