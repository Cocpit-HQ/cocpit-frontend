"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChatThread } from "@/types/messaging";
import MessageList from "./MessageList";
import ChatSkeleton from "./ChatSkeleton";
import UnifiedMessageInput from "./UnifiedMessageInput";
import MessageSelectionBottomBar from "./MessageSelectionBottomBar";
import MobileChatHeader from "./MobileChatHeader";
import ChatDesktopHeader from "./ChatDesktopHeader";
import ChatStatusBanner from "./ChatStatusBanner";
import ChatRequestBanner from "./ChatRequestBanner";
import ChatModals from "./ChatModals";
import { useSearchParams, useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { markAsRead, pinConversation } from "@/services/api/messaging";
import { searchUsers, UserMention } from "@/services/api/users";
import { useSocial } from "@/context/SocialContext";
import { useCompanyPermissions } from "@/features/businessProfile";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useOrgBlockPermissions } from "@/hooks/useOrgBlockPermissions";
import { cn } from "@/lib/utils";
import { setChatPinned, isChatPinned } from "../../utils/pinUtils";
import { isChatMuted } from "../../utils/muteUtils";
import { setPinnedMessageId } from "../../utils/pinMessageUtils";
import { PinnedMessageBanner } from "./PinnedMessageBanner";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";
import UserDetails from "./UserDetails";

// Modular hooks
import { useChatSocket } from "../../hooks/useChatSocket";
import { useChatSharedContext } from "../../hooks/useChatSharedContext";
import { useChatMessages } from "../../hooks/useChatMessages";
import { useMessageActions } from "../../hooks/useMessageActions";
import { useChatConversation } from "../../hooks/useChatConversation";
import { useChatModals } from "../../hooks/useChatModals";

interface ChatWindowProps {
  chat: ChatThread;
  isMobile: boolean;
  onBack?: () => void;
  onAcceptSuccess?: () => void;
  onChatCreated?: (createdChat: ChatThread) => void;
  initialEntityContext?: { type: "job" | "offer" | "event"; id: string };
  activeTab?: "chat" | "jobs" | "requests";
  isQuickChat?: boolean;
}

export default function ChatWindow({
  chat: initialChat,
  isMobile,
  onBack,
  onAcceptSuccess,
  onChatCreated,
  initialEntityContext,
  isQuickChat,
}: ChatWindowProps) {
  const { socket, isUserOnline, setActiveConversationId } = useSocket();
  const { isBlocked } = useSocial();
  const { data: session } = useSession();
  const { activeProfile } = useActiveProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Profile & Permissions
  const isCompanyProfile = activeProfile?.type === "COMPANY";
  const isOrgChat =
    isCompanyProfile || initialChat.otherUserType === "COMPANY";
  const targetUserId =
    initialChat.otherUserId ||
    (initialChat as unknown as { other_user_id?: string }).other_user_id;
  const { canManageBlock } = useOrgBlockPermissions(targetUserId);
  const companyPermissions = useCompanyPermissions({
    viewer_role_data: activeProfile?.viewer_role_data,
  });
  const canJobsChat =
    activeProfile?.type !== "COMPANY" || companyPermissions.canJobsChat;
  const canChat =
    activeProfile?.type !== "COMPANY" || companyPermissions.canChat;

  // Typing state
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [typingMap, setTypingMap] = useState<Map<string, string>>(new Map());

  // Active view state ('chat' | 'info')
  const [activeView, setActiveView] = useState<"chat" | "info">("chat");
  const isMutedActive = isChatMuted(initialChat);

  // Reset view when switching conversations
  useEffect(() => {
    setActiveView("chat");
  }, [initialChat?.id]);

  // Block & availability state
  const isBlockedByMe =
    typeof initialChat.isBlockedByMe === "boolean"
      ? initialChat.isBlockedByMe
      : initialChat.otherUserId
        ? isBlocked(initialChat.otherUserId)
        : false;
  const isBlockedByOther = initialChat.isBlockedByOther;

  const chat = {
    ...initialChat,
    online: initialChat.isMock
      ? initialChat.online
      : !isBlockedByMe && !isBlockedByOther && initialChat.otherUserId
        ? isUserOnline(initialChat.otherUserId)
        : false,
  };

  const isJobChatDisabled = Boolean(
    (chat.isJobChat || (chat.jobIds && chat.jobIds.length > 0)) && !canJobsChat,
  );
  const isGeneralChatDisabled = Boolean(
    !chat.isJobChat &&
      !(chat.jobIds && chat.jobIds.length > 0) &&
      activeProfile?.type === "COMPANY" &&
      !canChat,
  );

  const isDeletedAccount =
    !chat.isGroup &&
    Boolean(
      chat.isDeleted ||
        chat.name === "Deleted Page" ||
        chat.name === "Deleted User" ||
        chat.role === "This user is no longer available" ||
        chat.role === "This page is no longer available" ||
        chat.orgHeadline === "This page is no longer available" ||
        chat.role === "This account has been deactivated",
    );
  const isDeactivatedAccount =
    !chat.isGroup &&
    !isDeletedAccount &&
    Boolean(
      chat.isDeactivated ||
        chat.name === "Deactivated User" ||
        chat.role === "This user has gone offline - for a while." ||
        chat.role === "This page has gone offline - for a while." ||
        chat.orgHeadline === "This page has gone offline - for a while.",
    );

  const currentUserId =
    activeProfile?.type === "COMPANY"
      ? activeProfile.id
      : session?.user?.id || "";

  // 1. Shared URL & Context management hook
  const {
    pendingSharedPostId,
    setPendingSharedPostId,
    pendingSharedPost,
    setPendingSharedPost,
    pendingSharedProfileId,
    setPendingSharedProfileId,
    pendingSharedProfile,
    setPendingSharedProfile,
    pendingEntityContext,
    setPendingEntityContext,
  } = useChatSharedContext({
    chatId: chat.id,
    initialEntityContext,
    searchParams,
  });

  // 2. Real-time socket listener hook
  useChatSocket({
    socket,
    chat,
    sessionUserId: session?.user?.id,
    activeProfile,
    queryClient,
    setTypingUser,
    setTypingMap,
  });

  // 3. Message Actions & Selection hook
  const {
    selectedMessage,
    selectedMessages,
    selectedMessageIds,
    isMessageSelected,
    editingMessageId,
    setEditingMessageId,
    isMessageInfoOpen,
    setIsMessageInfoOpen,
    messageInfoMessage,
    setMessageInfoMessage,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    messageToDelete,
    previewMedia,
    setPreviewMedia,
    replyingTo,
    setReplyingTo,
    handleMessageClick,
    handleDeleteForMe,
    handleDeleteForEveryone,
    handleSaveEdit,
    handleReactionSelect,
    handleReply,
    handleMediaClick,
    handleMessageActionWithMsg,
    pinnedMessageId,
    setPinnedMessageId: setPinnedMessageIdState,
    handleUnpinMessage,
    isReplacePinModalOpen,
    isRemovePinModalOpen,
    confirmReplacePin,
    cancelReplacePin,
    confirmRemovePin,
    cancelRemovePin,
  } = useMessageActions({
    chat,
    currentUserId,
    queryClient,
    toast,
    activeProfile,
    session,
  });

  // 4. Conversation-level actions (unblock, accept/decline request, mute with duration)
  const {
    isGroupInvitation,
    typingDisplayString,
    handleUnblock,
    handleAcceptRequest,
    handleDeclineRequest,
    handleMuteWithDuration,
    handleUnmuteChat,
  } = useChatConversation({
    chat,
    activeProfile,
    queryClient,
    toast,
    typingUser,
    typingMap,
    onAcceptSuccess,
    onBack,
  });

  // 5. Message Query & Sending hook
  const {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleSendMessage,
    handleRetryMessage,
    handleTypingInput,
    searchGroupMembers,
    groupMembers,
  } = useChatMessages({
    chat,
    session,
    activeProfile,
    queryClient,
    socket,
    isGroupInvitation,
    isBlockedByMe,
    isBlockedByOther: !!isBlockedByOther,
    replyingTo,
    setReplyingTo,
    pendingSharedPostId,
    setPendingSharedPostId,
    pendingSharedPost,
    setPendingSharedPost,
    pendingSharedProfileId,
    setPendingSharedProfileId,
    pendingSharedProfile,
    setPendingSharedProfile,
    pendingEntityContext,
    setPendingEntityContext,
    searchParams,
    router,
    onChatCreated,
    isQuickChat,
    setTypingUser,
    setTypingMap,
  });

  const editingMessage = useMemo(() => {
    if (!editingMessageId) return null;
    return messages?.find((m) => m.id === editingMessageId) || null;
  }, [editingMessageId, messages]);

  const pinnedMessage = useMemo(() => {
    if (!pinnedMessageId) return null;
    const msg = messages?.find((m) => String(m.id) === String(pinnedMessageId));
    if (!msg || msg.is_deleted_for_me || msg.text === "This message was deleted for you.") {
      return null;
    }
    return msg;
  }, [messages, pinnedMessageId]);

  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const handleScrollToPinnedMessage = useCallback((msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(msgId);
      setTimeout(() => setHighlightedMessageId(null), 1000);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleMessagePinned = (payload: {
      conversationId: string;
      pinnedMessageId: string | null;
      is_pinned: boolean;
    }) => {
      if (String(payload.conversationId) === String(chat.id)) {
        setPinnedMessageId(chat.id, payload.pinnedMessageId, activeProfile?.type, activeProfile?.id);
        setPinnedMessageIdState(payload.pinnedMessageId);
      }
    };
    const handleMessageDeleted = (payload: {
      messageId: string;
      conversationId: string;
      deleteType?: string;
    }) => {
      if (
        String(payload.conversationId) === String(chat.id) &&
        pinnedMessageId &&
        String(payload.messageId) === String(pinnedMessageId)
      ) {
        setPinnedMessageId(chat.id, null, activeProfile?.type, activeProfile?.id);
        setPinnedMessageIdState(null);
      }
    };
    socket.on("message_pinned", handleMessagePinned);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_deleted_for_everyone", handleMessageDeleted);
    return () => {
      socket.off("message_pinned", handleMessagePinned);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_deleted_for_everyone", handleMessageDeleted);
    };
  }, [socket, chat.id, activeProfile?.type, activeProfile?.id, pinnedMessageId, setPinnedMessageIdState]);

  // 6. Modals management hook
  const modals = useChatModals({
    chat,
    activeProfile,
    queryClient,
    toast,
    onBack,
  });

  // Check if current user is the requester (sender of the request)
  const isRequestSender = useMemo(() => {
    if (chat.isGroup) return false;
    if (chat.created_by) {
      return String(chat.created_by) === String(currentUserId);
    }
    const myMsg = messages.find(
      (m) => m.sender === "me" || String(m.senderId) === String(currentUserId) || m.senderId === "me"
    );
    return Boolean(myMsg);
  }, [chat.isGroup, chat.created_by, currentUserId, messages]);

  // Rate limiting for requester: 1 message per 24 hours until accepted
  const isSenderWaiting24h = useMemo(() => {
    if (!chat.is_requesting || !isRequestSender) return false;
    if (chat.is_declined) {
      const baseTime = chat.last_sender_message_at || chat.lastMessageAt;
      if (!baseTime) return true;
      const lastTime = new Date(baseTime).getTime();
      if (isNaN(lastTime)) return true;
      return Date.now() - lastTime < 24 * 60 * 60 * 1000;
    }
    const myMessages = messages.filter(
      (m) => m.sender === "me" || String(m.senderId) === String(currentUserId) || m.senderId === "me"
    );
    if (myMessages.length === 0 && !chat.last_sender_message_at) {
      return false;
    }
    let lastSentTimestamp: string | null = null;
    if (myMessages.length > 0) {
      const latestMsg = myMessages[myMessages.length - 1];
      lastSentTimestamp = latestMsg.created_at || (latestMsg as any).time || null;
    }
    if (!lastSentTimestamp && chat.last_sender_message_at) {
      lastSentTimestamp = chat.last_sender_message_at;
    }
    if (!lastSentTimestamp) return true;
    const lastTime = new Date(lastSentTimestamp).getTime();
    if (isNaN(lastTime)) return true;
    return Date.now() - lastTime < 24 * 60 * 60 * 1000;
  }, [chat.is_requesting, chat.is_declined, isRequestSender, messages, chat.last_sender_message_at, chat.lastMessageAt, currentUserId]);

  // Cannot Message state (matching Figma Block frame)
  const isCannotMessage = useMemo(() => {
    return (
      !chat.isGroup &&
      !isBlockedByMe &&
      Boolean(
        isBlockedByOther ||
          chat.isDeleted ||
          isDeletedAccount ||
          isDeactivatedAccount ||
          chat.isDeactivated,
      )
    );
  }, [
    chat.isGroup,
    isBlockedByMe,
    isBlockedByOther,
    chat.isDeleted,
    isDeletedAccount,
    isDeactivatedAccount,
    chat.isDeactivated,
  ]);

  const cannotMessageText = useMemo(() => {
    const isCompany = chat.otherUserType === "COMPANY";

    // 1. Deactivated account key
    if (isDeactivatedAccount || chat.isDeactivated) {
      return isCompany
        ? "This page has gone offline for a while"
        : "This user has gone offline for a while";
    }

    // 2. Deleted account key
    if (chat.isDeleted || isDeletedAccount) {
      return isCompany
        ? "This page is no longer available"
        : "This user is no longer available";
    }

    // 3. Blocked by other / default key
    return isCompany
      ? "You can't message this page"
      : "You can't message this person";
  }, [
    chat.otherUserType,
    isDeactivatedAccount,
    chat.isDeactivated,
    chat.isDeleted,
    isDeletedAccount,
  ]);

  // Sync active conversation & mark as read
  useEffect(() => {
    setActiveConversationId(chat.id);

    if (
      chat.id &&
      !chat.isMock &&
      !String(chat.id).startsWith("mock-") &&
      (chat.unread > 0 || (isGroupInvitation && !chat.is_read))
    ) {
      const companyId =
        activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
      markAsRead(chat.id, companyId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        })
        .catch(console.error);
    }

    return () => setActiveConversationId(null);
  }, [
    chat.id,
    chat.unread,
    chat.is_read,
    chat.isMock,
    isGroupInvitation,
    activeProfile,
    queryClient,
    setActiveConversationId,
  ]);

  const handleTogglePin = useCallback(async () => {
    const isCurrentlyPinned = isChatPinned(chat.id, activeProfile?.type, activeProfile?.id) || Boolean(chat.is_pinned);
    const newPinned = !isCurrentlyPinned;
    const nowIso = new Date().toISOString();
    const companyId = activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;

    setChatPinned(String(chat.id), newPinned, activeProfile?.type, activeProfile?.id, nowIso);
    queryClient.setQueriesData<ChatThread[]>(
      { queryKey: ["conversations"] },
      (oldChats) => {
        if (!oldChats || !Array.isArray(oldChats)) return oldChats;
        return oldChats.map((c) => {
          const isTarget = String(c.id) === String(chat.id);
          if (isTarget) {
            return {
              ...c,
              is_pinned: newPinned,
              pinned_at: newPinned ? nowIso : null,
            };
          }
          return c;
        });
      }
    );
    toast({
      description: newPinned
        ? chat.isGroup
          ? "Group pinned successfully"
          : "Chat pinned successfully"
        : chat.isGroup
        ? "Group unpinned successfully"
        : "Chat unpinned successfully",
    });

    try {
      await pinConversation(String(chat.id), newPinned, companyId);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      console.error("Failed to persist pin on server:", err);
      setChatPinned(String(chat.id), isCurrentlyPinned, activeProfile?.type, activeProfile?.id);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }, [chat.id, chat.is_pinned, chat.isGroup, activeProfile?.type, activeProfile?.id, queryClient, toast]);

  return (
    <div
      className={`flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-[var(--ds-bg)] relative ${
        isMobile ? "h-dvh" : ""
      }`}
    >
      {/* Header View: Mobile vs Desktop */}
      {activeView === "chat" && (
        isMobile ? (
          <MobileChatHeader
            chat={chat}
            onBack={onBack!}
            selectedMessage={selectedMessage}
            selectedMessages={selectedMessages}
            onMessageAction={(action) => handleMessageActionWithMsg(action)}
            currentUserId={currentUserId}
            onMuteClick={modals.openMuteConfirm}
            onUnmuteClick={modals.openUnmuteConfirm}
            onDeleteClick={modals.openDeleteConfirm}
            onLeaveClick={modals.openLeaveConfirm}
            onTogglePin={handleTogglePin}
            onOpenDetails={!chat.isGroup ? () => setActiveView("info") : undefined}
            isQuickChat={isQuickChat}
          />
        ) : (
          <ChatDesktopHeader
            chat={chat}
            currentUserId={currentUserId}
            selectedMessage={selectedMessage}
            selectedMessages={selectedMessages}
            isMessageSelected={isMessageSelected}
            onMessageAction={(action) => handleMessageActionWithMsg(action)}
            isBlockedByMe={isBlockedByMe}
            isBlockedByOther={!!isBlockedByOther}
            isDeletedAccount={isDeletedAccount}
            isDeactivatedAccount={isDeactivatedAccount}
            typingDisplayString={typingDisplayString}
            onShareClick={modals.openShareModal}
            onReportClick={modals.openReportConfirm}
            onBlockClick={modals.openBlockConfirm}
            onUnblockClick={handleUnblock}
            onClearClick={modals.openClearConfirm}
            onDeleteClick={modals.openDeleteConfirm}
            onLeaveClick={modals.openLeaveConfirm}
            onUnmuteClick={
              chat.isGroup ? modals.openUnmuteConfirm : handleUnmuteChat
            }
            onMuteWithDuration={handleMuteWithDuration}
            onTogglePin={handleTogglePin}
            onOpenDetails={!chat.isGroup ? () => setActiveView("info") : undefined}
          />
        )
      )}

      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Main Chat Area */}
        <div
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 overflow-hidden",
            activeView !== "chat"
              ? "opacity-0 invisible translate-x-[-20px] pointer-events-none"
              : "opacity-100 visible translate-x-0"
          )}
        >
          {/* Status, Context, Typing & Block Banners */}
          <ChatStatusBanner
        chat={chat}
        isGroupInvitation={isGroupInvitation}
        isBlockedByMe={isBlockedByMe}
        isBlockedByOther={!!isBlockedByOther}
        typingDisplayString={typingDisplayString}
        isDeclinedCooldown={Boolean(chat.is_declined && isSenderWaiting24h)}
      />

      {/* Pinned Message Banner */}
      {!isGroupInvitation && pinnedMessageId && pinnedMessage && (
        <PinnedMessageBanner
          message={pinnedMessage}
          pinnedMessageId={pinnedMessageId}
          onScrollToMessage={handleScrollToPinnedMessage}
          onUnpin={handleUnpinMessage}
        />
      )}

      {/* Message List or Skeleton */}
      {!isGroupInvitation &&
        (isLoading ? (
          <ChatSkeleton />
        ) : (
          <MessageList
            messages={messages}
            pinnedMessageId={pinnedMessageId}
            highlightedMessageId={highlightedMessageId}
            onLoadMore={fetchNextPage}
            hasMore={hasNextPage}
            isLoadingMore={isFetchingNextPage}
            // Handle retry click from failed message bubble to re-trigger sending
            onAction={(action, message) => {
              if (action === "retry" && message) {
                handleRetryMessage(message);
                return;
              }
              handleMessageActionWithMsg(action, message);
            }}
            editingMessageId={editingMessageId}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={() => setEditingMessageId(null)}
            selectedMessageId={selectedMessage?.id}
            selectedMessageIds={selectedMessageIds}
            onMessageClick={handleMessageClick}
            onMediaClick={handleMediaClick}
            unreadCount={chat.unread}
            isOpponentOnline={chat.online}
            isGroup={chat.isGroup}
            groupMembers={groupMembers}
            onReply={handleReply}
            onReaction={handleReactionSelect}
            currentUserId={currentUserId}
            conversationId={chat.id.toString()}
            otherUserType={chat.otherUserType}
            otherUserSlug={chat.otherUserSlug || chat.otherUserId}
            chatAvatar={chat.avatar}
            isRequesting={chat.is_requesting}
            isCannotMessage={isCannotMessage}
            cannotMessageText={cannotMessageText}
          />
        ))}

      {/* Input composer, direct request banner, or Blocked Bottom Action Bar */}
      {!isBlockedByMe ? (
        <div className="flex flex-col w-full">
          {!isOrgChat && chat.is_requesting && !isRequestSender && !isBlockedByOther && (
            <ChatRequestBanner
              onDecline={handleDeclineRequest}
              onAccept={handleAcceptRequest}
            />
          )}

          {isMessageSelected && selectedMessages.length > 0 ? (
            <MessageSelectionBottomBar
              selectedCount={selectedMessages.length}
              allAreMine={selectedMessages.every(
                (m) =>
                  m.sender === "me" ||
                  m.senderId === currentUserId ||
                  m.senderId === "me",
              )}
              onClose={() => handleMessageActionWithMsg("close")}
              onDeleteForMe={() => handleMessageActionWithMsg("delete_for_me")}
              onDeleteForEveryone={() =>
                handleMessageActionWithMsg("delete_for_everyone")
              }
            />
          ) : (
            !isGroupInvitation && (
              <UnifiedMessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTypingInput}
                searchUsersFn={chat.isGroup ? searchGroupMembers : searchUsers}
                disabled={
                  isSenderWaiting24h ||
                  chat.is_declined ||
                  (!isOrgChat && chat.is_requesting && !isRequestSender) ||
                  (!chat.otherUserId && !chat.isGroup) ||
                  !!isBlockedByOther ||
                  isJobChatDisabled ||
                  isGeneralChatDisabled ||
                  isDeactivatedAccount ||
                  !!chat.isDeactivated ||
                  !!chat.isDeleted ||
                  isDeletedAccount
                }
                disabledMessage={
                  chat.is_declined
                    ? "You can’t send a chat request to this user right now. Please try again after 24 hours"
                    : isSenderWaiting24h
                      ? "You will be able to send more messages after your request is accepted"
                      : (!isOrgChat && chat.is_requesting && !isRequestSender)
                        ? "Accept the chat request to start the conversation"
                        : isCannotMessage
                          ? undefined
                          : isJobChatDisabled
                            ? "Permission required to participate in job chats"
                            : isGeneralChatDisabled
                              ? "Permission required to participate in general chat"
                              : undefined
                }
                pendingEntityContext={pendingEntityContext}
                onDismissEntityContext={() => setPendingEntityContext(null)}
                placeholder="Write a message..."
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                editingMessage={editingMessage}
                onCancelEdit={() => setEditingMessageId(null)}
                onSaveEdit={handleSaveEdit}
                pendingSharedPost={pendingSharedPost}
                onCancelPendingSharedPost={() => {
                  setPendingSharedPostId(null);
                  setPendingSharedPost(null);
                }}
                pendingSharedProfile={pendingSharedProfile}
                onCancelPendingSharedProfile={() => {
                  setPendingSharedProfileId(null);
                  setPendingSharedProfile(null);
                }}
                isQuickChat={isQuickChat}
              />
            )
          )}
        </div>
      ) : (
        /* Blocked state bottom action bar matching Figma Frame 2610045 */
        <div className="w-full px-4 pb-6 pt-2 shrink-0 flex justify-center order-2">
          <div className="w-full max-w-[618px] h-[56px] flex flex-col justify-center items-center p-0 gap-2 shrink-0">
            {/* Label: You blocked this person */}
            <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-center text-[var(--ds-text-primary)]">
              {canManageBlock
                ? "You blocked this person"
                : "This account is blocked by organization administrators"}
            </span>

            {/* Primary emphasis button: Unblock to chat */}
            <button
              type="button"
              onClick={canManageBlock ? handleUnblock : undefined}
              disabled={!canManageBlock}
              title={
                !canManageBlock
                  ? "Only organization owners or administrators can unblock accounts"
                  : undefined
              }
              className={cn(
                "w-[144px] h-9 px-3 py-1.5 flex flex-row justify-center items-center gap-2.5 rounded-[100px] transition-all",
                canManageBlock
                  ? "bg-[var(--ds-accent)] hover:opacity-90 active:scale-95 cursor-pointer text-[var(--ds-text-primary)]"
                  : "bg-[var(--ds-surface-1)] text-[var(--ds-text-muted)] opacity-50 cursor-default border border-[var(--ds-border)]"
              )}
            >
              <span className="w-[120px] h-6 font-['DM_Sans'] font-medium text-base leading-6 text-center text-[var(--ds-text-primary)] flex items-center justify-center">
                Unblock to chat
              </span>
            </button>
          </div>
        </div>
      )}
        </div>

        {/* 1-on-1 User Details Panel - Slides in from the right */}
        {!chat.isGroup && (
          <div
            className={cn(
              isMobile
                ? "fixed inset-0 z-50 bg-[var(--ds-bg)] transition-all duration-300"
                : "absolute inset-0 z-20 bg-[var(--ds-bg)] transition-all duration-300",
              activeView === "chat"
                ? "translate-x-full opacity-0 invisible pointer-events-none"
                : "translate-x-0 opacity-100 visible"
            )}
          >
            <UserDetails
              chat={chat}
              isOpen={activeView === "info"}
              onClose={() => setActiveView("chat")}
              currentUserId={currentUserId}
              isMuted={isMutedActive}
              onMuteWithDuration={handleMuteWithDuration}
              onUnmuteClick={handleUnmuteChat}
              onShareClick={modals.openShareModal}
              onReportClick={modals.openReportConfirm}
              onBlockClick={modals.openBlockConfirm}
              onUnblockClick={handleUnblock}
              onDeleteClick={modals.openDeleteConfirm}
            />
          </div>
        )}
      </div>

      {/* Modals and Confirmation Dialogs */}
      <ChatModals
        chat={chat}
        modals={modals}
        currentUserId={session?.user?.id}
        selectedMessage={selectedMessage}
        selectedMessages={selectedMessages}
        messageInfoMessage={messageInfoMessage}
        setMessageInfoMessage={setMessageInfoMessage}
        isMessageInfoOpen={isMessageInfoOpen}
        onCloseMessageInfo={() => setIsMessageInfoOpen(false)}
        messageToDelete={messageToDelete}
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        onDeleteForMe={handleDeleteForMe}
        onDeleteForEveryone={handleDeleteForEveryone}
        previewMedia={previewMedia}
        onCloseMediaPreview={() => setPreviewMedia(null)}
      />

      {/* Remove Pinned Message Confirmation Modal */}
      <ActionConfirmModal
        isOpen={isRemovePinModalOpen}
        type="remove_pinned_message"
        onClose={cancelRemovePin}
        onConfirm={confirmRemovePin}
      />

      {/* Replace Pinned Message Confirmation Modal */}
      <ActionConfirmModal
        isOpen={isReplacePinModalOpen}
        type="replace_pinned_message"
        onClose={cancelReplacePin}
        onConfirm={confirmReplacePin}
      />
    </div>
  );
}
