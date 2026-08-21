"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MoreHorizontal, Phone, Video, Ban, X } from "lucide-react";
import { ChatThread, Message } from "@/types/messaging";
import { avatarGradients } from "@/constants/messaging";
import MessageList from "./MessageList";
import ChatSkeleton from "./ChatSkeleton";
import UnifiedMessageInput from "./UnifiedMessageInput";
import MobileChatHeader from "./MobileChatHeader";
import { useSearchParams, useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";
import { useSession } from "next-auth/react";
import { SocketMessage, TypingPayload } from "@/types/socket";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  InfiniteData,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import {
  getMessages,
  sendMessage,
  markAsRead,
  editMessage,
  deleteMessage,
  acceptChatRequest,
  declineChatRequest,
  addOrUpdateReaction,
  clearReaction,
  deletePersonalChat,
  muteGroup,
  unmuteGroup,
  updateJobChatStatus,
} from "@/services/api/messaging";
import {
  sendMessage as sendGroupMessage,
  getGroupDetails,
  leaveGroup,
  respondInvitation,
} from "@/services/api/group-chat";
import { GroupMember } from "@/types/group-chat";
import {
  mapBackendMessageToMessage,
  formatTimeAgo,
} from "@/lib/mappers/messaging.mapper";
import Avatar from "@/components/shared/Avatar";
import { hasMessageMedia } from "./MessageBubble";
import { useSocial } from "@/context/SocialContext";
import { companyProfileService } from "@/features/companyprofile/services/companyprofile.service";
import { cn } from "@/lib/utils";
import { ReportModal } from "@/components/shared/ReportModal";
import MessageInfoModal from "../../MessageInfoModal";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import { getMessageCopyText } from "@/features/messaging/utils/messageCopy";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Plus } from "lucide-react";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useCompanyPermissions } from "@/features/companyprofile/hooks/useCompanyPermissions";
import { useOrgBlockPermissions } from "@/hooks/useOrgBlockPermissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteMessageModal } from "./DeleteMessageModal";
import { Trash2 } from "lucide-react";
import MediaPreviewModal from "./MediaPreviewModal";

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

const getAvatarGradient = (avatar: string) => {
  return avatarGradients[avatar] || "from-gray-400 to-gray-500";
};

function ChatHeaderMenu({
  selectedMessage,
  onMessageAction,
  currentUserId,
}: {
  selectedMessage: Message;
  onMessageAction: (action: string) => void;
  currentUserId: string;
}) {
  const isMyMessage =
    selectedMessage.sender === "me" ||
    selectedMessage.senderId === currentUserId ||
    selectedMessage.senderId === "me";
  const isMedia = hasMessageMedia(selectedMessage);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onMessageAction("close")}
          className="p-1 hover:bg-[var(--primary-tint)] rounded-full transition-colors"
        >
          <X className="h-6 w-6 text-[var(--foreground)]" />
        </button>
        <div className="font-['Poppins'] font-medium text-[16px] text-[var(--foreground)]">
          1 Selected
        </div>
      </div>
      <div className="flex items-center gap-1">
        <DropdownMenu onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button className="p-1 outline-none transition-colors">
              <Icon
                icon="mdi-light:dots-vertical"
                width={24}
                height={24}
                style={{
                  color: isOpen ? "var(--primary)" : "var(--foreground)",
                }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[204px] p-[8px] mr-4 bg-[var(--popover)] border border-[var(--border)]"
            style={{ borderRadius: "24px 0px 24px 24px" }}
          >
            {isMyMessage && (
              <DropdownMenuItem
                onClick={() => onMessageAction("edit")}
                className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors border-none outline-none"
              >
                <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">
                  Edit
                </span>
                <Icon
                  icon="fluent:edit-16-regular"
                  width={24}
                  height={24}
                  color="var(--foreground)"
                />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onMessageAction("delete_for_me")}
              className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--destructive)]/10 rounded-md transition-colors border-none outline-none"
            >
              <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--destructive)]">
                Delete for me
              </span>
              <Icon
                icon="fluent:delete-16-regular"
                width={24}
                height={24}
                color="var(--destructive)"
              />
            </DropdownMenuItem>
            {isMyMessage && (
              <DropdownMenuItem
                onClick={() => onMessageAction("delete_for_everyone")}
                className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--destructive)]/10 rounded-md transition-colors border-none outline-none"
              >
                <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--destructive)]">
                  Delete for everyone
                </span>
                <Icon
                  icon="fluent:delete-16-regular"
                  width={24}
                  height={24}
                  color="var(--destructive)"
                />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onMessageAction("info")}
              className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors border-none outline-none"
            >
              <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">
                Info
              </span>
              <Icon
                icon="fluent:info-16-regular"
                width={24}
                height={24}
                color="var(--foreground)"
              />
            </DropdownMenuItem>
            {!isMedia && (
              <DropdownMenuItem
                onClick={() => onMessageAction("copy")}
                className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors border-none outline-none"
              >
                <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">
                  Copy
                </span>
                <Icon
                  icon="fluent:copy-16-regular"
                  width={24}
                  height={24}
                  color="var(--foreground)"
                />
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export default function ChatWindow({
  chat: initialChat,
  isMobile,
  onBack,
  onAcceptSuccess,
  onChatCreated,
  initialEntityContext,
  activeTab,
  isQuickChat,
}: ChatWindowProps) {
  const { socket, isUserOnline, setActiveConversationId } = useSocket();
  const { unblockUser, isBlocked, blockUser } = useSocial();
  const { data: session } = useSession();
  const { activeProfile } = useActiveProfile();
  const isCompanyProfile = activeProfile?.type === "COMPANY";
  const isOrgChat = isCompanyProfile || initialChat.otherUserType === "COMPANY";
  const targetUserId =
    initialChat.otherUserId || (initialChat as any).other_user_id;
  const { canManageBlock, canBlockTarget } =
    useOrgBlockPermissions(targetUserId);
  const companyPermissions = useCompanyPermissions({
    viewer_role_data: activeProfile?.viewer_role_data,
  });
  const canJobsChat =
    activeProfile?.type !== "COMPANY" || companyPermissions.canJobsChat;
  const canChat =
    activeProfile?.type !== "COMPANY" || companyPermissions.canChat;

  const [typingUser, setTypingUser] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMuteConfirm, setShowMuteConfirm] = useState(false);
  const [showUnmuteConfirm, setShowUnmuteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [typingMap, setTypingMap] = useState<Map<string, string>>(new Map());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMessageSelected, setIsMessageSelected] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    messageId: string;
    senderName: string;
    content: string;
    isMe?: boolean;
    mediaType?: 'image' | 'video' | 'document' | string | null;
    mediaName?: string | null;
    mediaUrl?: string | null;
  } | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const sharedPostIdParam = searchParams?.get("sharedPostId");
  const sharedProfileIdParam = searchParams?.get("sharedProfileId");

  const [pendingSharedPostId, setPendingSharedPostId] = useState<string | null>(
    null,
  );
  const [pendingEntityContext, setPendingEntityContext] = useState<{
    type: "job" | "offer" | "event";
    id: string;
  } | null>(null);
  const [pendingSharedPost, setPendingSharedPost] = useState<any | null>(null);
  const [pendingSharedProfileId, setPendingSharedProfileId] = useState<
    string | null
  >(null);
  const [pendingSharedProfile, setPendingSharedProfile] = useState<any | null>(
    null,
  );
  const processedEntityContextRef = useRef<string | null>(null);

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

  const handleUnblock = async () => {
    const targetId = chat.otherUserId || (chat as any).other_user_id;
    if (!targetId) return;
    try {
      if (chat.otherUserType === "COMPANY") {
        await companyProfileService.unblockTarget(targetId);
      } else {
        await unblockUser(targetId);
      }
      toast({ description: "Account unblocked successfully" });
      const convKey = [
        "conversations",
        activeProfile?.type ?? "USER",
        activeProfile?.id ?? "me",
      ];
      queryClient.setQueryData(convKey, (oldChats: ChatThread[] | undefined) => {
        if (!oldChats) return [];
        return oldChats.map((c) =>
          String(c.id) === String(chat.id) || (targetId && String(c.otherUserId) === String(targetId))
            ? { ...c, isBlockedByMe: false }
            : c
        );
      });
      queryClient.invalidateQueries({ queryKey: ["messages", chat.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to unblock account",
        variant: "destructive",
      });
    }
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

  const isGroupInvitation =
    !!chat.is_requesting &&
    (chat.isGroup === true ||
      (chat as any).is_group === true ||
      chat.request_source === "group_invitation");
  const isDeletedAccount =
    !chat.isGroup &&
    Boolean(
      chat.isDeleted ||
      chat.name === "Deleted Page" ||
      chat.name === "Deleted User" ||
      chat.name === "Deactivated User" ||
      chat.role === "This account has been deactivated"
    );
  const isDeactivatedAccount =
    !chat.isGroup &&
    !isDeletedAccount &&
    Boolean(
      chat.isDeactivated ||
      chat.orgHeadline === "This page has been deactivated" ||
      chat.role === "This user has gone offline - for a while." ||
      chat.role === "This page has gone offline - for a while."
    );

  // Sync state with URL parameter on mount or when chat/param changes
  useEffect(() => {
    if (sharedPostIdParam) {
      setPendingSharedPostId(sharedPostIdParam);
      // Fetch post details to display preview
      Promise.all([
        import("@/services/api/posts"),
        import("@/lib/mappers/feed.mapper"),
      ]).then(([{ getPostById }, { mapBackendPostToFrontend }]) => {
        getPostById(sharedPostIdParam)
          .then((backendPost) => {
            const mapped = mapBackendPostToFrontend(backendPost);
            setPendingSharedPost(mapped);
          })
          .catch((err) => {
            console.error("Failed to fetch shared post details:", err);
          });
      });

      // Clean up the URL query parameter without a full reload
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete("sharedPostId");
      const newSearch = newParams.toString();
      const newPath =
        window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState(null, "", newPath);
    }
  }, [sharedPostIdParam, chat.id]);

  useEffect(() => {
    if (sharedProfileIdParam) {
      setPendingSharedProfileId(sharedProfileIdParam);
      // Fetch profile details to display preview
      import("@/services/api/user").then(({ getUserById }) => {
        getUserById(sharedProfileIdParam)
          .then((response) => {
            setPendingSharedProfile(response.user);
          })
          .catch((err) => {
            console.error("Failed to fetch shared profile details:", err);
          });
      });

      // Clean up the URL query parameter without a full reload
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete("sharedProfileId");
      const newSearch = newParams.toString();
      const newPath =
        window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState(null, "", newPath);
    }
  }, [sharedProfileIdParam, chat.id]);

  const handleAcceptRequest = async () => {
    try {
      if (isGroupInvitation) {
        if (!chat.invitation_id) {
          throw new Error("Invitation ID missing");
        }
        await respondInvitation(chat.invitation_id, "accept");
        queryClient.setQueryData(
          [
            "conversations",
            activeProfile?.type ?? "USER",
            activeProfile?.id ?? "me",
          ],
          (oldChats: ChatThread[] | undefined) => {
            if (!oldChats) return [];
            return oldChats.map((c) =>
              c.id === chat.id ? { ...c, is_requesting: false } : c,
            );
          },
        );
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["invitations"] });
        toast({ description: "Request accepted" });
        if (onAcceptSuccess) onAcceptSuccess();
      } else {
        await acceptChatRequest(chat.id);
        queryClient.setQueryData(
          [
            "conversations",
            activeProfile?.type ?? "USER",
            activeProfile?.id ?? "me",
          ],
          (oldChats: ChatThread[] | undefined) => {
            if (!oldChats) return [];
            return oldChats.map((c) =>
              c.id === chat.id ? { ...c, is_requesting: false } : c,
            );
          },
        );
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        toast({ description: "Request accepted" });
        if (onAcceptSuccess) onAcceptSuccess();
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to accept request";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    }
  };

  const handleDeclineRequest = async () => {
    try {
      if (isGroupInvitation) {
        if (!chat.invitation_id) {
          throw new Error("Invitation ID missing");
        }
        await respondInvitation(chat.invitation_id, "reject");
        queryClient.setQueryData(
          [
            "conversations",
            activeProfile?.type ?? "USER",
            activeProfile?.id ?? "me",
          ],
          (oldChats: ChatThread[] | undefined) => {
            if (!oldChats) return [];
            return oldChats.filter((c) => c.id !== chat.id);
          },
        );
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["invitations"] });
        toast({ description: "Request declined" });
        if (onBack) onBack();
      } else {
        await declineChatRequest(chat.id);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        toast({ description: "Request declined" });
        if (onBack) onBack();
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to decline request";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    }
  };

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["messages", chat.id, activeProfile?.id || "USER"],
      queryFn: async ({ pageParam }) => {
        const companyId =
          activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
        const backendMessages = await getMessages(
          chat.id,
          50,
          pageParam,
          companyId,
        );
        return backendMessages.map((m) =>
          mapBackendMessageToMessage(
            m,
            session?.user?.id,
            activeProfile?.type === "COMPANY" ? activeProfile.id : undefined,
          ),
        );
      },
      getNextPageParam: (lastPage) => {
        if (lastPage.length < 50) return undefined;
        return lastPage[0]?.created_at; // Oldest message in the current batch
      },
      initialPageParam: null as string | null,
      enabled:
        !!chat.id &&
        chat.id !== "new" &&
        !!session?.user?.id &&
        !isGroupInvitation,
      staleTime: 0,
    });

  // Flatten and reverse pages to show oldest to newest
  // Pages are [MostRecentObj, OlderObj, EvenOlderObj]
  // We want to render: EvenOlderObj...OlderObj...MostRecentObj
  const messages = React.useMemo(() => {
    if (!data) return [];
    return [...data.pages].reverse().flatMap((page) => page);
  }, [data]);

  useEffect(() => {
    const contextKey = `${chat.id}:${initialEntityContext?.id}`;
    if (
      !initialEntityContext ||
      processedEntityContextRef.current === contextKey
    )
      return;

    // Mark as processed immediately to prevent duplicate calls from dependency re-evaluations
    processedEntityContextRef.current = contextKey;

    const checkContext = async () => {
      // New conversation — show card right away, no API check needed
      if (chat.id === "new") {
        setPendingEntityContext(initialEntityContext);
        return;
      }

      try {
        const { checkContextSent } = await import("@/services/api/messaging");
        const res = await checkContextSent(
          chat.id,
          initialEntityContext.id,
          initialEntityContext.type,
        );
        setPendingEntityContext(res && !res.sent ? initialEntityContext : null);
      } catch (e) {
        console.error("Failed to check if context is sent:", e);
        // Fallback: show card by default so user isn't stuck
        setPendingEntityContext(initialEntityContext);
      }

      // Clean up the URL query parameters without a full reload
      const newParams = new URLSearchParams(window.location.search);
      let changed = false;
      if (newParams.has("jobContext")) {
        newParams.delete("jobContext");
        changed = true;
      }
      if (newParams.has("offerContext")) {
        newParams.delete("offerContext");
        changed = true;
      }
      if (newParams.has("eventContext")) {
        newParams.delete("eventContext");
        changed = true;
      }
      if (changed) {
        const newSearch = newParams.toString();
        window.history.replaceState(
          null,
          "",
          window.location.pathname + (newSearch ? `?${newSearch}` : ""),
        );
      }
    };

    checkContext();
    // Only re-run if the entity context id or chat changes — NOT on every message page load
  }, [initialEntityContext?.id, chat.id]);

  // Mark as read on mount or when chat.id changes
  useEffect(() => {
    setActiveConversationId(chat.id);

    // Reset typing state when chat changes
    setTypingUser(null);
    setTypingMap(new Map());

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
          // Optimistically update conversation unread count and read status
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        })
        .catch(console.error);
    }

    return () => setActiveConversationId(null);
  }, [
    chat.id,
    chat.unread,
    chat.is_read,
    isGroupInvitation,
    activeProfile,
    queryClient,
    setActiveConversationId,
  ]);

  useEffect(() => {
    if (!socket || !chat) return;

    // Join the conversation room (existing logic)
    socket.emit("joinConversation", { conversationId: chat.id.toString() });

    // Also join Group explicitly if it's a group to be safe (backend might rely on it for some checks)
    if (chat.isGroup) {
      socket.emit("joinGroup", { groupId: chat.id.toString() });
    }

    const handleNewMessage = (msg: SocketMessage) => {
      // Only handle messages for this conversation — use String() to avoid type mismatch
      if (String(msg.conversation_id) !== String(chat.id)) return;

      const isMe = msg.sender_id === session?.user?.id;

      // Clear typing indicator for the sender
      if (chat.isGroup) {
        setTypingMap((prev) => {
          const next = new Map(prev);
          next.delete(msg.sender_id);
          return next;
        });
      } else {
        setTypingUser(null);
      }

      // Map socket message to frontend entity using valid mapper
      const uiMessage = mapBackendMessageToMessage(
        msg as any,
        session?.user?.id,
        activeProfile?.type === "COMPANY" ? activeProfile.id : undefined,
      );

      queryClient.setQueryData(
        ["messages", chat.id, activeProfile?.id || "USER"],
        (old: InfiniteData<Message[]> | undefined) => {
          // If cache is empty (not loaded yet), create a minimal structure so the message isn't lost
          if (!old) {
            return { pages: [[uiMessage]], pageParams: [null] };
          }

          // Check if real ID already exists in ANY page
          const existsPage = old.pages.findIndex((page) =>
            page.some((m) => m.id === uiMessage.id),
          );

          if (existsPage !== -1) {
            // Update existing message in place
            const newPages = [...old.pages];
            newPages[existsPage] = newPages[existsPage].map((m) => {
              if (m.id === uiMessage.id) {
                return {
                  ...m,
                  ...uiMessage,
                  media:
                    uiMessage.media && uiMessage.media.length > 0
                      ? uiMessage.media
                      : m.media,
                  sharedPost: uiMessage.sharedPost || m.sharedPost,
                  sharedProfile: uiMessage.sharedProfile || m.sharedProfile,
                  sharedProfileId:
                    uiMessage.sharedProfileId || m.sharedProfileId,
                  sharedProfileType:
                    uiMessage.sharedProfileType || m.sharedProfileType,
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

          // If it's my message, check for any pending temp placeholder in the FIRST page
          if (isMe) {
            const firstPage = newPages[0];
            // Match by temp id prefix AND text content to avoid replacing the wrong placeholder
            const optimisticMatch = firstPage.find(
              (m) => m.id.startsWith("temp-") && m.text === uiMessage.text,
            );
            if (optimisticMatch) {
              newPages[0] = firstPage.map((m) =>
                m.id === optimisticMatch.id ? uiMessage : m,
              );
              return { ...old, pages: newPages };
            }
          }

          // Append to the first (most-recent) page
          newPages[0] = [...newPages[0], uiMessage];
          return { ...old, pages: newPages };
        },
      );

      // Also update the conversation list last message
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // Mark as read if we are focused
      if (!isMe && !chat.isMock && !String(chat.id).startsWith("mock-")) {
        const companyId =
          activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
        markAsRead(chat.id, companyId).catch(console.error);
      }
    };

    const handleTyping = (payload: TypingPayload) => {
      if (
        payload.conversationId === chat.id.toString() &&
        payload.senderId !== session?.user?.id
      ) {
        if (chat.isGroup && payload.isGroup) {
          if (payload.senderId && payload.username) {
            setTypingMap((prev) =>
              new Map(prev).set(payload.senderId!, payload.username!),
            );
          }
        } else {
          setTypingUser(payload.username || "Someone"); // Use payload username
        }
      }
    };

    const handleStopTyping = (payload: TypingPayload) => {
      if (payload.conversationId === chat.id.toString()) {
        if (chat.isGroup && payload.isGroup) {
          if (payload.senderId) {
            setTypingMap((prev) => {
              const next = new Map(prev);
              next.delete(payload.senderId!);
              return next;
            });
          }
        } else {
          setTypingUser(null);
        }
      }
    };

    const handleMessagesSeen = (payload: {
      conversationId: string;
      messageIds: string[];
      readAt: string;
      readerId: string;
    }) => {
      if (payload.conversationId !== chat.id) return;

      queryClient.setQueryData(
        ["messages", chat.id, activeProfile?.id || "USER"],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return undefined;
          const newPages = old.pages.map((page) =>
            page.map((m) => {
              if (payload.messageIds.includes(m.id)) {
                return { ...m, read_at: payload.readAt };
              }
              return m;
            }),
          );
          return { ...old, pages: newPages };
        },
      );
    };

    const handleMessageDeleted = (payload: {
      messageId: string;
      conversationId: string;
      deleteType: "me" | "everyone";
    }) => {
      // payload: { messageId, conversationId, deleteType: 'me'|'everyone' }
      if (payload.conversationId !== chat.id) return;

      queryClient.setQueryData(
        ["messages", chat.id, activeProfile?.id || "USER"],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return undefined;

          if (payload.deleteType === "me") {
            // Update the message content for "Delete for me"
            const newPages = old.pages.map((page) =>
              page.map((m) => {
                if (m.id === payload.messageId) {
                  return {
                    ...m,
                    text: "This message is deleted for you",
                    text_content: "This message is deleted for you",
                    sharedPost: null,
                    is_deleted: true,
                    is_deleted_for_me: true,
                  };
                }
                return m;
              }),
            );
            return { ...old, pages: newPages };
          } else {
            // Update the message content
            const newPages = old.pages.map((page) =>
              page.map((m) => {
                if (m.id === payload.messageId) {
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
                    is_deleted_for_everyone: true,
                  };
                }
                return m;
              }),
            );
            return { ...old, pages: newPages };
          }
        },
      );
    };

    const handleMessageEdited = (payload: {
      messageId: string;
      conversationId: string;
      text_content: string;
    }) => {
      if (payload.conversationId !== chat.id) return;

      queryClient.setQueryData(
        ["messages", chat.id, activeProfile?.id || "USER"],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return undefined;
          const newPages = old.pages.map((page) =>
            page.map((m) => {
              if (m.id === payload.messageId) {
                return {
                  ...m,
                  text: payload.text_content,
                  text_content: payload.text_content,
                  is_edited: true,
                };
              }
              return m;
            }),
          );
          return { ...old, pages: newPages };
        },
      );
    };

    const handleReactionUpdated = (payload: {
      messageId: string;
      conversationId: string;
      reaction: {
        user_id: string;
        emoji: string;
        full_name: string;
        avatar: string | null;
        updated_at: string;
      } | null;
      userId?: string;
    }) => {
      if (payload.conversationId !== chat.id) return;
      queryClient.setQueryData(
        ["messages", chat.id, activeProfile?.id || "USER"],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return old;
          const newPages = old.pages.map((page) =>
            page.map((m) => {
              if (m.id !== payload.messageId) return m;
              const reactions = m.reactions || [];
              if (payload.reaction === null) {
                // Remove reaction for that user
                const uid = payload.userId;
                return {
                  ...m,
                  reactions: reactions.filter((r) => r.user_id !== uid),
                };
              } else {
                const idx = reactions.findIndex(
                  (r) => r.user_id === payload.reaction!.user_id,
                );
                const newReactions =
                  idx !== -1
                    ? reactions.map((r, i) =>
                        i === idx ? payload.reaction! : r,
                      )
                    : [...reactions, payload.reaction!];
                return { ...m, reactions: newReactions };
              }
            }),
          );
          return { ...old, pages: newPages };
        },
      );
    };

    const handlePreferenceUpdated = (payload: {
      conversationId: string;
      preference: { is_muted: boolean; muted_until: string | null };
    }) => {
      if (String(payload.conversationId) === String(chat.id)) {
        const queryKey = [
          "conversations",
          activeProfile?.type ?? "USER",
          activeProfile?.id ?? "me",
        ];
        queryClient.setQueryData(
          queryKey,
          (oldChats: ChatThread[] | undefined) => {
            if (!oldChats) return [];
            return oldChats.map((c) =>
              String(c.id) === String(payload.conversationId)
                ? {
                    ...c,
                    is_muted: payload.preference.is_muted,
                    muted_until: payload.preference.muted_until,
                  }
                : c,
            );
          },
        );
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    };

    const handleBlockOrDeactivate = () => {
      queryClient.resetQueries({ queryKey: ["messages", chat.id], exact: false });
      queryClient.resetQueries({ queryKey: ["sharedPost"], exact: false });
      queryClient.resetQueries({ queryKey: ["profilePreview"], exact: false });
      queryClient.resetQueries({ queryKey: ["entityPreview"], exact: false });
      queryClient.resetQueries({ queryKey: ["jobContext"], exact: false });
      queryClient.refetchQueries({ queryKey: ["messages", chat.id], type: "all" });
      queryClient.refetchQueries({ queryKey: ["conversations"], type: "all" });
      queryClient.refetchQueries({ queryKey: ["sharedPost"], type: "all" });
      queryClient.refetchQueries({ queryKey: ["profilePreview"], type: "all" });
      queryClient.refetchQueries({ queryKey: ["entityPreview"], type: "all" });
      queryClient.refetchQueries({ queryKey: ["jobContext"], type: "all" });
    };

    socket.on("new_message", handleNewMessage);
    socket.on("isTyping", handleTyping);
    socket.on("stoppedTyping", handleStopTyping);
    socket.on("messages_seen", handleMessagesSeen);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_deleted_for_everyone", handleMessageDeleted);
    socket.on("message_deleted_for_me", handleMessageDeleted);
    socket.on("message_edited", handleMessageEdited);
    socket.on("message_reaction_updated", handleReactionUpdated);
    socket.on("conversation_preference_updated", handlePreferenceUpdated);
    socket.on("user_blocked", handleBlockOrDeactivate);
    socket.on("block_confirmed", handleBlockOrDeactivate);
    socket.on("user_unblocked", handleBlockOrDeactivate);
    socket.on("unblock_confirmed", handleBlockOrDeactivate);
    socket.on("ORGANIZATION_USER_BLOCKED", handleBlockOrDeactivate);
    socket.on("ORGANIZATION_USER_UNBLOCKED", handleBlockOrDeactivate);
    socket.on("ORGANIZATION_BLOCK_UPDATED", handleBlockOrDeactivate);
    socket.on("relationshipUpdated", handleBlockOrDeactivate);
    socket.on("ORGANIZATION_DEACTIVATED", handleBlockOrDeactivate);
    socket.on("organization_deactivated", handleBlockOrDeactivate);
    socket.on("ORGANIZATION_REACTIVATED", handleBlockOrDeactivate);
    socket.on("organization_reactivated", handleBlockOrDeactivate);
    socket.on("org_status_changed", handleBlockOrDeactivate);
    socket.on("user_deactivated", handleBlockOrDeactivate);
    socket.on("USER_DEACTIVATED", handleBlockOrDeactivate);
    socket.on("user_reactivated", handleBlockOrDeactivate);
    socket.on("USER_REACTIVATED", handleBlockOrDeactivate);
    socket.on("account_deactivated", handleBlockOrDeactivate);
    socket.on("ACCOUNT_DEACTIVATED", handleBlockOrDeactivate);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("isTyping", handleTyping);
      socket.off("stoppedTyping", handleStopTyping);
      socket.off("messages_seen", handleMessagesSeen);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_deleted_for_everyone", handleMessageDeleted);
      socket.off("message_deleted_for_me", handleMessageDeleted);
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_reaction_updated", handleReactionUpdated);
      socket.off("conversation_preference_updated", handlePreferenceUpdated);
      socket.off("user_blocked", handleBlockOrDeactivate);
      socket.off("block_confirmed", handleBlockOrDeactivate);
      socket.off("user_unblocked", handleBlockOrDeactivate);
      socket.off("unblock_confirmed", handleBlockOrDeactivate);
      socket.off("ORGANIZATION_USER_BLOCKED", handleBlockOrDeactivate);
      socket.off("ORGANIZATION_USER_UNBLOCKED", handleBlockOrDeactivate);
      socket.off("ORGANIZATION_BLOCK_UPDATED", handleBlockOrDeactivate);
      socket.off("relationshipUpdated", handleBlockOrDeactivate);
      socket.off("ORGANIZATION_DEACTIVATED", handleBlockOrDeactivate);
      socket.off("organization_deactivated", handleBlockOrDeactivate);
      socket.off("ORGANIZATION_REACTIVATED", handleBlockOrDeactivate);
      socket.off("organization_reactivated", handleBlockOrDeactivate);
      socket.off("org_status_changed", handleBlockOrDeactivate);
      socket.off("user_deactivated", handleBlockOrDeactivate);
      socket.off("USER_DEACTIVATED", handleBlockOrDeactivate);
      socket.off("user_reactivated", handleBlockOrDeactivate);
      socket.off("USER_REACTIVATED", handleBlockOrDeactivate);
      socket.off("account_deactivated", handleBlockOrDeactivate);
      socket.off("ACCOUNT_DEACTIVATED", handleBlockOrDeactivate);
    };
  }, [
    socket,
    chat.id,
    chat.isGroup,
    session?.user?.id,
    queryClient,
    activeProfile,
  ]); // Depend only on chat.id, not the full chat object

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      text,
      files,
      replyMessageId,
      sharedPostId,
      sharedProfileId,
      entityType,
      entityId,
    }: {
      text: string;
      files: File[];
      replyMessageId?: string;
      sharedPostId?: string;
      sharedProfileId?: string;
      entityType?: string;
      entityId?: string;
    }) => {
      if (chat.isGroup) {
        return sendGroupMessage(chat.id, text, "text", files, replyMessageId);
      }

      if (!chat.otherUserId) throw new Error("Target user ID missing");
      return sendMessage(
        chat.otherUserId,
        text,
        sharedPostId,
        files,
        activeProfile?.type === "COMPANY" ? activeProfile.id : undefined,
        replyMessageId,
        sharedProfileId,
        entityType,
        entityId,
      );
    },
    onMutate: async ({ text, files, sharedPostId }) => {
      const activeQueryKey = ["messages", chat.id, activeProfile?.id || "USER"];
      const fallbackQueryKey = ["messages", chat.id];

      await queryClient.cancelQueries({ queryKey: activeQueryKey });
      await queryClient.cancelQueries({ queryKey: fallbackQueryKey });

      const previousMessages = queryClient.getQueryData(activeQueryKey) || queryClient.getQueryData(fallbackQueryKey);

      // Optimistic update
      const tempMedia = files.map((file) => {
        const isDoc =
          file.type === "application/pdf" ||
          file.type.includes("word") ||
          file.type.includes("officedocument") ||
          /\.(doc|docx|pdf|txt|rtf)$/i.test(file.name);
        const type = file.type.startsWith("video/")
          ? "video"
          : isDoc
            ? "document"
            : "image";
        return {
          url: URL.createObjectURL(file),
          type: type as "image" | "video" | "document",
          name: file.name,
        };
      });

      const newMessage: Message = {
        id: "temp-" + Date.now(),
        sender: "me",
        text: text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        // Add minimal required fields for mapping/rendering
        senderId:
          activeProfile?.type === "COMPANY"
            ? activeProfile.id
            : session?.user?.id || "me",
        senderMemberName:
          (session?.user as any)?.full_name ||
          session?.user?.name ||
          activeProfile?.name ||
          "Member",
        created_at: new Date().toISOString(),
        type: "text",
        read_at: null,
        media: tempMedia,
        sharedPost: pendingSharedPost
          ? {
              id: pendingSharedPost.id,
              content: pendingSharedPost.content,
              author: pendingSharedPost.author,
              authorAvatar: pendingSharedPost.authorAvatar || null,
              media:
                pendingSharedPost.images?.map((img: string) => ({
                  url: img,
                  type: "image",
                })) || [],
            }
          : null,
      };

      const updateCacheWithTemp = (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return { pages: [[newMessage]], pageParams: [null] };
        const newPages = [...old.pages];
        newPages[0] = [...newPages[0], newMessage];
        return {
          ...old,
          pages: newPages,
        };
      };

      queryClient.setQueryData(activeQueryKey, updateCacheWithTemp);
      queryClient.setQueryData(fallbackQueryKey, updateCacheWithTemp);

      // Optimistically update conversation thread in list
      const nowIso = new Date().toISOString();
      const convQueryKey = [
        "conversations",
        activeProfile?.type ?? "USER",
        activeProfile?.id ?? "me",
      ];
      queryClient.setQueryData(
        convQueryKey,
        (oldChats: ChatThread[] | undefined) => {
          if (!oldChats) return [];
          return oldChats.map((c) =>
            String(c.id) === String(chat.id)
              ? {
                  ...c,
                  lastMessage:
                    text ||
                    (pendingSharedPost ? "Shared a post" : "Attachment"),
                  time: formatTimeAgo(nowIso),
                  lastMessageAt: nowIso,
                }
              : c,
          );
        },
      );

      return { previousMessages, tempId: newMessage.id };
    },
    onError: (err: any, newTodo, context) => {
      const activeQueryKey = ["messages", chat.id, activeProfile?.id || "USER"];
      const fallbackQueryKey = ["messages", chat.id];
      queryClient.setQueryData(activeQueryKey, context?.previousMessages);
      queryClient.setQueryData(fallbackQueryKey, context?.previousMessages);
      console.error("Failed to send message", err);
    },
    onSuccess: (data, variables, context) => {
      // Clear typing indicator immediately on send
      setTypingMap(new Map());
      setTypingUser(null);

      const realMessage = mapBackendMessageToMessage(
        data.data || data,
        session?.user?.id,
        activeProfile?.type === "COMPANY" ? activeProfile.id : undefined,
      );

      const updateCacheWithReal = (old: InfiniteData<Message[]> | undefined) => {
        if (!old) {
          return { pages: [[realMessage]], pageParams: [null] };
        }

        const newPages = [...old.pages];
        const alreadyExists = newPages[0].some(
          (m) => m.id === realMessage.id,
        );
        if (alreadyExists) {
          newPages[0] = newPages[0].filter((m) => m.id !== context?.tempId);
          return { ...old, pages: newPages };
        }

        const tempReplaced = newPages[0].map((m) =>
          m.id === context?.tempId ? realMessage : m,
        );

        const tempExists = newPages[0].some((m) => m.id === context?.tempId);
        newPages[0] = tempExists
          ? tempReplaced
          : [...newPages[0], realMessage];

        return { ...old, pages: newPages };
      };

      const activeQueryKey = ["messages", chat.id, activeProfile?.id || "USER"];
      const fallbackQueryKey = ["messages", chat.id];
      queryClient.setQueryData(activeQueryKey, updateCacheWithReal);
      queryClient.setQueryData(fallbackQueryKey, updateCacheWithReal);

      queryClient.invalidateQueries({
        queryKey: [
          "conversations",
          activeProfile?.type ?? "USER",
          activeProfile?.id ?? "me",
        ],
      });

      if (chat.id === "new") {
        const newConversationId =
          data.data?.conversation_id || data.conversation_id;
        if (newConversationId) {
          const newActiveQueryKey = ["messages", newConversationId, activeProfile?.id || "USER"];
          const newFallbackQueryKey = ["messages", newConversationId];
          queryClient.setQueryData(newActiveQueryKey, updateCacheWithReal);
          queryClient.setQueryData(newFallbackQueryKey, updateCacheWithReal);
          queryClient.removeQueries({ queryKey: ["messages", "new"] });

          const convKey = [
            "conversations",
            activeProfile?.type ?? "USER",
            activeProfile?.id ?? "me",
          ];
          const newThread: ChatThread = {
            ...chat,
            id: newConversationId,
            lastMessage: variables.text || "Attachment",
            time: "Just now",
            lastMessageAt: new Date().toISOString(),
          };
          queryClient.setQueryData(convKey, (oldChats: ChatThread[] | undefined) => {
            const list = oldChats || [];
            if (!list.some((c) => String(c.id) === String(newConversationId))) {
              return [newThread, ...list];
            }
            return list;
          });

          if (onChatCreated) {
            onChatCreated(newThread);
          }

          if (!isQuickChat) {
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, "", `/messaging?conversationId=${newConversationId}`);
            }
            router.replace(`/messaging?conversationId=${newConversationId}`);
          }
        }
      }
    },
  });

  const handleSendMessage = React.useCallback(
    (text: string, files: File[]) => {
      // Basic validation
      if (
        (!chat.otherUserId && !chat.isGroup) ||
        isBlockedByMe ||
        isBlockedByOther
      ) {
        return;
      }

      // Stop typing immediately when sending
      if (socket) {
        if (chat.isGroup) {
          socket.emit("stopGroupTyping", { groupId: chat.id.toString() });
        } else {
          socket.emit("stopTyping", { conversationId: chat.id.toString() });
        }
      }

      let effectiveSharedPostId = pendingSharedPostId || undefined;
      let effectiveSharedProfileId = pendingSharedProfileId || undefined;
      let effectiveEntityType = pendingEntityContext?.type || undefined;
      let effectiveEntityId = pendingEntityContext?.id || undefined;

      if (!effectiveSharedPostId && !effectiveSharedProfileId && !effectiveEntityId && text) {
        const postMatch = text.match(/(?:https?:\/\/[^\/\s]+)?\/(?:(?:channels\/[^\/\s]+\/article)|(?:channel\/article)|(?:post\/article)|(?:article\/edit)|(?:article)|(?:post))\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}|[a-zA-Z0-9_-]+)/i);
        const isUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

        if (postMatch && isUuid(postMatch[1])) {
          effectiveSharedPostId = postMatch[1];
        }

        const jobMatch = text.match(/(?:https?:\/\/[^\/\s]+)?\/jobs\/([a-zA-Z0-9_-]+)/i);
        if (jobMatch) {
          effectiveEntityType = "job";
          effectiveEntityId = jobMatch[1];
        }

        const profileMatch = text.match(/(?:https?:\/\/[^\/\s]+)?\/profile\/([a-zA-Z0-9_.-]+)/i);
        if (profileMatch && isUuid(profileMatch[1])) {
          effectiveSharedProfileId = profileMatch[1];
        }

        const orgMatch = text.match(/(?:https?:\/\/[^\/\s]+)?\/(?:organization|company)\/([a-zA-Z0-9_-]+)/i);
        if (orgMatch && isUuid(orgMatch[1])) {
          effectiveSharedProfileId = orgMatch[1];
        }
      }

      sendMessageMutation.mutate({
        text,
        files,
        replyMessageId: replyingTo?.messageId,
        sharedPostId: effectiveSharedPostId,
        sharedProfileId: effectiveSharedProfileId,
        entityType: effectiveEntityType,
        entityId: effectiveEntityId,
      });
      setReplyingTo(null);
      setPendingSharedPostId(null);
      setPendingSharedPost(null);
      setPendingSharedProfileId(null);
      setPendingSharedProfile(null);
      setPendingEntityContext(null);

      // Clear URL parameters for entity contexts if present
      if (
        searchParams?.get("jobContext") ||
        searchParams?.get("offerContext") ||
        searchParams?.get("eventContext")
      ) {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("jobContext");
        newParams.delete("offerContext");
        newParams.delete("eventContext");
        router.replace(`/messaging?${newParams.toString()}`);
      }
    },
    [
      chat.otherUserId,
      chat.isGroup,
      chat.id,
      isBlockedByMe,
      isBlockedByOther,
      socket,
      sendMessageMutation,
      replyingTo,
      pendingSharedPostId,
      pendingSharedProfileId,
      pendingEntityContext,
      searchParams,
      router,
    ],
  );

  const handleTypingInput = React.useCallback(() => {
    if (!socket || !chat || chat.id === "new") return;

    const now = Date.now();
    if (now - lastTypingRef.current > 2000) {
      if (chat.isGroup) {
        socket.emit("groupTyping", { groupId: chat.id.toString() });
      } else {
        socket.emit("typing", { conversationId: chat.id.toString() });
      }
      lastTypingRef.current = now;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (chat.isGroup) {
        socket.emit("stopGroupTyping", { groupId: chat.id.toString() });
      } else {
        socket.emit("stopTyping", { conversationId: chat.id.toString() });
      }
    }, 3000);
  }, [socket, chat.id, chat.isGroup]);

  // Derived typing string for display
  let typingDisplayString: string | null = null;
  if (chat.isGroup) {
    const users = Array.from(typingMap.values());
    if (users.length === 1) {
      typingDisplayString = `${users[0]} is typing...`;
    } else if (users.length > 1) {
      typingDisplayString = `${users.join(", ")} are typing...`;
    }
  } else {
    typingDisplayString = typingUser ? "typing..." : null;
  }

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMessageInfoOpen, setIsMessageInfoOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // Deletion Logic
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  const handleDeleteForMe = async (msg?: Message) => {
    const targetMsg = msg || messageToDelete;
    if (!targetMsg) return;
    const msgId = targetMsg.id;
    try {
      // Optimistic/Immediate update since backend won't emit event for "me"
      queryClient.setQueryData(
        ["messages", chat.id],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return undefined;
          const newPages = old.pages.map((page) =>
            page.map((m) => {
              if (m.id === msgId) {
                return {
                  ...m,
                  text: "This message deleted for you",
                  text_content: "This message deleted for you",
                  sharedPost: null,
                  is_deleted: true,
                  is_deleted_for_me: true,
                };
              }
              return m;
            }),
          );
          return { ...old, pages: newPages };
        },
      );

      await deleteMessage(msgId, false);
      toast({ description: "Message deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete message", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete message";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
      // Revert or invalidate on error
      queryClient.invalidateQueries({ queryKey: ["messages", chat.id] });
    } finally {
      setIsDeleteModalOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleDeleteForEveryone = async (msg?: Message) => {
    const targetMsg = msg || messageToDelete;
    if (!targetMsg) return;
    const msgId = targetMsg.id;

    // Immediately clear selection and modal states
    setSelectedMessage(null);
    setIsMessageSelected(false);
    setIsDeleteModalOpen(false);
    setMessageToDelete(null);

    // Optimistic Update
    const updateCache = (old: InfiniteData<Message[]> | undefined) => {
      if (!old) return undefined;
      const newPages = old.pages.map((page) =>
        page.map((m) => {
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
              is_deleted_for_everyone: true,
            };
          }
          return m;
        }),
      );
      return { ...old, pages: newPages };
    };

    queryClient.setQueryData(["messages", chat.id, activeProfile?.id || "USER"], updateCache);
    queryClient.setQueryData(["messages", chat.id], updateCache);

    try {
      await deleteMessage(msgId, true);
      toast({ description: "Message deleted for everyone" });
    } catch (error: any) {
      console.error("Failed to delete message for everyone", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete message for everyone";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["messages", chat.id] });
    }
  };

  const handleMessageClick = (message: Message) => {
    if (editingMessageId) return; // Don't allow selection while editing
    if (selectedMessage?.id === message.id) {
      setSelectedMessage(null); // Toggle off
      setIsMessageSelected(false);
    } else {
      setSelectedMessage(message);
      setIsMessageSelected(true);
    }
  };

  const editMessageMutation = useMutation({
    mutationFn: async ({
      messageId,
      text,
    }: {
      messageId: string;
      text: string;
    }) => {
      return editMessage(messageId, text);
    },
    onSuccess: () => {
      setEditingMessageId(null);
      // Socket event will handle the UI update
    },
    onError: (error) => {
      console.error("Failed to edit message:", error);
    },
  });

  // Improved handler to support direct action from bubble
  const handleMessageActionWithMsg = (action: string, message?: Message) => {
    const targetMsg = message || selectedMessage;
    if (!targetMsg && action !== "close") return;

    if (action === "delete") {
      setMessageToDelete(targetMsg);
      setIsDeleteModalOpen(true);
      if (selectedMessage) {
        setSelectedMessage(null);
        setIsMessageSelected(false);
      }
    } else if (action === "delete_for_me") {
      if (targetMsg) handleDeleteForMe(targetMsg);
      if (selectedMessage) {
        setSelectedMessage(null);
        setIsMessageSelected(false);
      }
    } else if (action === "delete_for_everyone") {
      if (targetMsg) handleDeleteForEveryone(targetMsg);
      if (selectedMessage) {
        setSelectedMessage(null);
        setIsMessageSelected(false);
      }
    } else if (action === "edit") {
      setEditingMessageId(targetMsg!.id);
      if (selectedMessage) {
        setSelectedMessage(null);
        setIsMessageSelected(false);
      }
    } else if (action === "copy") {
      if (targetMsg) {
        navigator.clipboard.writeText(getMessageCopyText(targetMsg));
      }
      if (selectedMessage) {
        setSelectedMessage(null);
        setIsMessageSelected(false);
      }
    } else if (action === "info") {
      if (targetMsg) {
        if (selectedMessage?.id !== targetMsg.id) setSelectedMessage(targetMsg);
        setIsMessageInfoOpen(true);
      }
    } else if (action === "close") {
      setSelectedMessage(null);
      setIsMessageSelected(false);
    }
  };

  const handleSaveEdit = (messageId: string, text: string) => {
    editMessageMutation.mutate({ messageId, text });
  };

  const handleClearSelection = () => {
    setSelectedMessage(null);
    setIsMessageSelected(false);
  };

  // ---- Reaction Logic ----
  const currentUserId =
    activeProfile?.type === "COMPANY"
      ? activeProfile.id
      : session?.user?.id || "";

  const optimisticallyUpdateReaction = (
    messageId: string,
    emoji: string,
    userId: string,
  ) => {
    queryClient.setQueryData(
      ["messages", chat.id],
      (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return old;
        const newPages = old.pages.map((page) =>
          page.map((m) => {
            if (m.id !== messageId) return m;
            const reactions = m.reactions || [];
            const existingIdx = reactions.findIndex(
              (r) => r.user_id === userId,
            );
            let newReactions;
            if (existingIdx !== -1) {
              newReactions = reactions.map((r, i) =>
                i === existingIdx
                  ? { ...r, emoji, updated_at: new Date().toISOString() }
                  : r,
              );
            } else {
              newReactions = [
                ...reactions,
                {
                  user_id: userId,
                  emoji,
                  full_name: session?.user?.name || "",
                  avatar: null,
                  updated_at: new Date().toISOString(),
                },
              ];
            }
            return { ...m, reactions: newReactions };
          }),
        );
        return { ...old, pages: newPages };
      },
    );
  };

  const rollbackReaction = (
    messageId: string,
    previousReaction: Message["reactions"] extends Array<infer R> | undefined
      ? R | undefined
      : never,
    userId: string,
  ) => {
    queryClient.setQueryData(
      ["messages", chat.id],
      (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return old;
        const newPages = old.pages.map((page) =>
          page.map((m) => {
            if (m.id !== messageId) return m;
            const reactions = m.reactions || [];
            let newReactions;
            if (previousReaction) {
              newReactions = reactions.map((r) =>
                r.user_id === userId ? previousReaction : r,
              );
            } else {
              newReactions = reactions.filter((r) => r.user_id !== userId);
            }
            return { ...m, reactions: newReactions };
          }),
        );
        return { ...old, pages: newPages };
      },
    );
  };

  const handleReactionSelect = async (
    message: Message,
    selectedEmoji: string,
  ) => {
    const myReaction = message.reactions?.find(
      (r) => r.user_id === currentUserId,
    );
    // Same emoji — no-op
    if (myReaction && myReaction.emoji === selectedEmoji) return;
    // Optimistic update
    optimisticallyUpdateReaction(message.id, selectedEmoji, currentUserId);
    try {
      if (selectedEmoji === "") {
        await clearReaction(message.id);
      } else {
        await addOrUpdateReaction(message.id, selectedEmoji);
      }
    } catch (error) {
      rollbackReaction(message.id, myReaction, currentUserId);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      });
    }
  };
  // ---- End Reaction Logic ----

  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: "image" | "video" | "document";
    name?: string;
  } | null>(null);

  const handleMediaClick = (
    url: string,
    type: "image" | "video" | "document",
    name?: string,
  ) => {
    setPreviewMedia({ url, type, name });
  };

  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  useEffect(() => {
    if (chat.isGroup) {
      getGroupDetails(chat.id)
        .then((details) => {
          // Broaden fallback for member list property
          const members =
            details.members ||
            (details as any).participants ||
            (details as any).users ||
            [];
          setGroupMembers(members);
        })
        .catch((err) => {
          console.error("Failed to load group members:", err);
        });
    }
  }, [chat.id, chat.isGroup]);

  const searchGroupMembers = React.useCallback(
    async (query: string) => {
      if (!chat.isGroup) return [];

      // Safety check for empty cache: if empty, try to fetch immediately
      let membersToFilter = groupMembers;
      if (membersToFilter.length === 0) {
        try {
          const details = await getGroupDetails(chat.id);
          const members =
            (details as any).members ||
            (details as any).participants ||
            (details as any).users ||
            [];
          setGroupMembers(members);
          membersToFilter = members;
        } catch (e) {
          console.error("Delayed fetch of group members failed", e);
        }
      }

      const q = (query || "").toLowerCase();

      return membersToFilter
        .filter((m) => {
          const fullName = (
            m.full_name ||
            (m as any).name ||
            (m as any).fullName ||
            ""
          ).toLowerCase();
          const accountName = (
            m.account_name ||
            (m as any).accountName ||
            (m as any).username ||
            ""
          ).toLowerCase();

          // If query is empty, return true for all
          if (!q) return true;

          return fullName.includes(q) || accountName.includes(q);
        })
        .map((m) => {
          const fName =
            m.full_name || (m as any).name || (m as any).fullName || "User";
          const uId = m.user_id || (m as any).id || (m as any).userId;
          return {
            ...m,
            id: uId,
            user_id: uId,
            full_name: fName,
            account_name:
              m.account_name ||
              (m as any).accountName ||
              (m as any).username ||
              fName.replace(/\s+/g, "_").toLowerCase(),
            avatar_url: m.avatar_url || (m as any).avatar || "",
          };
        });
    },
    [groupMembers, chat.id, chat.isGroup],
  );

  return (
    <div
      className={`flex flex-col h-full ${isMobile ? "h-dvh bg-[var(--background)]" : ""}`}
    >
      {isMobile ? (
        <MobileChatHeader
          chat={chat}
          onBack={onBack!}
          selectedMessage={selectedMessage}
          onMessageAction={(action) => handleMessageActionWithMsg(action)}
          currentUserId={
            activeProfile?.type === "COMPANY"
              ? activeProfile.id
              : session?.user?.id || ""
          }
          onMuteClick={() => setShowMuteConfirm(true)}
          onUnmuteClick={() => setShowUnmuteConfirm(true)}
          onDeleteClick={() => setShowDeleteConfirm(true)}
          onLeaveClick={() => setShowLeaveConfirm(true)}
          isQuickChat={isQuickChat}
        />
      ) : (
        <div className="px-[16px] py-[12px] border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)] shrink-0">
          {!isMessageSelected || !selectedMessage ? (
            <>
              {/* LEFT: Avatar + Text Group */}
              <div className="flex flex-row items-center">
                {chat.isGroup ? (
                  <>
                    <div className="w-[40px] h-[40px] flex-none mr-[8px]">
                      <Avatar url={chat.avatar} name={chat.name} size="md" />
                    </div>
                    <div className="flex flex-col items-start p-0 min-w-0">
                      <h2 className="font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[var(--foreground)] w-full">
                        <span className="truncate">{chat.name}</span>
                      </h2>
                      <p className="font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[var(--muted-foreground)] w-full">
                        <span className="truncate">
                          {chat.role || "Group Chat"}
                        </span>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href={
                        (isBlockedByOther || isDeactivatedAccount || chat.isDeactivated || chat.isDeleted || isDeletedAccount)
                          ? "#"
                          : chat.otherUserType === "COMPANY"
                            ? `/organization/${chat.otherUserSlug || chat.otherUserId}`
                            : `/profile/${chat.otherUserSlug || chat.otherUserId}`
                      }
                      className={`w-[40px] h-[40px] flex-none mr-[8px] ${(isBlockedByOther || isDeactivatedAccount || chat.isDeactivated || chat.isDeleted || isDeletedAccount) ? 'pointer-events-none cursor-default' : 'transition-opacity hover:opacity-80'}`}
                    >
                      <Avatar
                        url={chat.avatar}
                        name={chat.name || (chat.otherUserType === "COMPANY" ? "Unknown Page" : "Unknown User")}
                        size="md"
                        online={chat.online}
                        fallbackGradient="gradient-1"
                        isCompany={chat.otherUserType === "COMPANY"}
                        isUnknown={
                          isBlockedByOther ||
                          isDeactivatedAccount ||
                          chat.isDeactivated ||
                          chat.isDeleted ||
                          isDeletedAccount ||
                          chat.name === "Unknown Page" ||
                          chat.name === "Unknown user" ||
                          chat.name === "Unknown User" ||
                          chat.name === "Deleted Page" ||
                          chat.name === "Deleted User" ||
                          chat.name === "Deactivated User" ||
                          chat.orgHeadline === "This page has been deactivated" ||
                          chat.orgHeadline === "User unavailable" ||
                          chat.role === "User unavailable" ||
                          chat.role === "Page unavailable"
                        }
                        className="w-full h-full"
                      />
                    </Link>
                    <div className="flex flex-col items-start p-0 min-w-0">
                      <Link
                        href={
                          (isBlockedByOther || isDeactivatedAccount || chat.isDeactivated || chat.isDeleted || isDeletedAccount)
                            ? "#"
                            : chat.otherUserType === "COMPANY"
                              ? `/organization/${chat.otherUserSlug || chat.otherUserId}`
                              : `/profile/${chat.otherUserSlug || chat.otherUserId}`
                        }
                        className={`w-full ${(isBlockedByOther || isDeactivatedAccount || chat.isDeactivated || chat.isDeleted || isDeletedAccount) ? 'pointer-events-none cursor-default' : 'transition-opacity hover:opacity-80'}`}
                      >
                        <h2 className="font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[var(--foreground)] w-full">
                          <span className="truncate">
                            {chat.name ||
                              (chat.otherUserType === "COMPANY"
                                ? "Unknown Page"
                                : "Unknown User")}
                          </span>
                        </h2>
                      </Link>
                      <p className="font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[var(--muted-foreground)] w-full">
                        <span className="truncate">
                          {(isBlockedByOther || isDeletedAccount || isDeactivatedAccount || chat.isDeleted || chat.isDeactivated)
                            ? chat.otherUserType === "COMPANY"
                              ? "Page unavailable"
                              : "User unavailable"
                            : chat.otherUserType === "COMPANY"
                              ? chat.orgHeadline ||
                                chat.role ||
                                "Page unavailable"
                              : chat.role || ""}
                        </span>
                        {!isBlockedByOther && !chat.is_requesting &&
                          (typingDisplayString || chat.online) && (
                            <>
                              <span className="w-[6px] h-[6px] rounded-full bg-[#22C55E] flex-none mx-[8px]" />
                              <span className="text-[#22C55E]">
                                {typingDisplayString
                                  ? "Typing..."
                                  : "Active now"}
                              </span>
                            </>
                          )}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT: 3-dot menu */}
              <div className="flex flex-row items-center p-0 gap-[16px] flex-none order-1">
                <DropdownMenu onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Icon
                      icon="mdi-light:dots-vertical"
                      width={24}
                      height={24}
                      style={{
                        color: isDropdownOpen
                          ? "var(--primary)"
                          : "var(--foreground)",
                      }}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[217px] p-[8px] mr-4 bg-white border border-[#F2F7FF] shadow-sm flex flex-col gap-0"
                    style={{ borderRadius: "24px 0px 24px 24px" }}
                  >
                    {chat.isGroup ? (
                      <>
                        <DropdownMenuItem className="flex items-center justify-between px-[16px] py-[8px] h-[40px] w-full cursor-pointer hover:bg-gray-50 rounded-[24px] transition-colors border-none outline-none">
                          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">
                            Share profile
                          </span>
                          <Icon
                            icon="fluent:share-16-regular"
                            width={24}
                            height={24}
                            color="#000000"
                          />
                        </DropdownMenuItem>
                        {chat.is_muted ? (
                          <DropdownMenuItem
                            onClick={() => setShowUnmuteConfirm(true)}
                            className="flex items-center justify-between px-[16px] py-[8px] h-[40px] w-full cursor-pointer hover:bg-gray-50 rounded-[24px] transition-colors border-none outline-none"
                          >
                            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">
                              Unmute group
                            </span>
                            <Icon
                              icon="fluent:speaker-2-16-regular"
                              width={24}
                              height={24}
                              color="#000000"
                            />
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setShowMuteConfirm(true)}
                            className="flex items-center justify-between px-[16px] py-[8px] h-[40px] w-full cursor-pointer hover:bg-gray-50 rounded-[24px] transition-colors border-none outline-none"
                          >
                            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">
                              Mute group
                            </span>
                            <Icon
                              icon="fluent:speaker-mute-16-regular"
                              width={24}
                              height={24}
                              color="#000000"
                            />
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setShowLeaveConfirm(true)}
                          className="flex items-center justify-between px-[16px] py-[8px] h-[40px] w-full cursor-pointer hover:bg-red-50 rounded-[24px] transition-colors border-none outline-none"
                        >
                          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#EF4444]">
                            Leave group
                          </span>
                          <Icon
                            icon="fluent:door-arrow-left-16-regular"
                            width={24}
                            height={24}
                            color="#EF4444"
                          />
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        {activeProfile?.type === "COMPANY" &&
                          ((
                            activeTab !== undefined
                              ? activeTab === "jobs"
                              : Boolean(
                                  chat.isJobChat ||
                                  (chat.jobIds && chat.jobIds.length > 0),
                                )
                          ) ? (
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await updateJobChatStatus(chat.id, false);
                                  queryClient.invalidateQueries({
                                    queryKey: ["conversations"],
                                  });
                                  toast({
                                    description:
                                      "Conversation removed from jobs",
                                  });
                                } catch (err: any) {
                                  const msg =
                                    err?.response?.data?.message ||
                                    err?.message ||
                                    "Failed to remove conversation from jobs";
                                  toast({
                                    title: "Error",
                                    description: msg,
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="flex items-center justify-between px-[16px] py-[8px] h-[40px] w-full cursor-pointer hover:bg-gray-50 rounded-[24px] transition-colors border-none outline-none"
                            >
                              <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">
                                Remove from jobs
                              </span>
                              <Icon
                                icon="hugeicons:job-search"
                                width={24}
                                height={24}
                                color="#000000"
                              />
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  await updateJobChatStatus(chat.id, true);
                                  queryClient.invalidateQueries({
                                    queryKey: ["conversations"],
                                  });
                                  toast({
                                    description: "Conversation moved to jobs",
                                  });
                                } catch (err: any) {
                                  const msg =
                                    err?.response?.data?.message ||
                                    err?.message ||
                                    "Failed to move conversation to jobs";
                                  toast({
                                    title: "Error",
                                    description: msg,
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="flex items-center justify-between px-[16px] py-[8px] h-[40px] w-full cursor-pointer hover:bg-gray-50 rounded-[24px] transition-colors border-none outline-none"
                            >
                              <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">
                                Move to jobs
                              </span>
                              <Icon
                                icon="hugeicons:job-search"
                                width={24}
                                height={24}
                                color="#000000"
                              />
                            </DropdownMenuItem>
                          ))}
                        <DropdownMenuItem
                          onClick={() => setIsShareModalOpen(true)}
                          className="flex items-center justify-between px-[16px] py-[8px] h-[40px] w-full cursor-pointer hover:bg-gray-50 rounded-[24px] transition-colors border-none outline-none"
                        >
                          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">
                            Share profile
                          </span>
                          <Icon
                            icon="fluent:share-16-regular"
                            width={24}
                            height={24}
                            color="#000000"
                          />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowReportConfirm(true)}
                          className="flex items-center justify-between px-[16px] py-[8px] h-[40px] w-full cursor-pointer hover:bg-gray-50 rounded-[24px] transition-colors border-none outline-none"
                        >
                          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">
                            Report profile
                          </span>
                          <Icon
                            icon="fluent:info-16-regular"
                            width={24}
                            height={24}
                            color="#000000"
                          />
                        </DropdownMenuItem>
                        {isBlockedByMe
                          ? canManageBlock && (
                              <DropdownMenuItem
                                onClick={handleUnblock}
                                className="flex items-center justify-between px-[16px] py-[8px] h-[40px] w-full cursor-pointer hover:bg-gray-50 rounded-[24px] transition-colors border-none outline-none"
                              >
                                <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">
                                  Unblock profile
                                </span>
                                <Ban
                                  className="w-[24px] h-[24px] text-[#000000]"
                                  strokeWidth={1.5}
                                />
                              </DropdownMenuItem>
                            )
                          : canBlockTarget && (
                              <DropdownMenuItem
                                onClick={() => setShowBlockConfirm(true)}
                                className="flex items-center justify-between px-[16px] py-[8px] h-[40px] w-full cursor-pointer hover:bg-gray-50 rounded-[24px] transition-colors border-none outline-none"
                              >
                                <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">
                                  Block profile
                                </span>
                                <Ban
                                  className="w-[24px] h-[24px] text-[#000000]"
                                  strokeWidth={1.5}
                                />
                              </DropdownMenuItem>
                            )}
                        <DropdownMenuItem
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center justify-between px-[16px] py-[8px] h-[40px] w-full cursor-pointer hover:bg-red-50 rounded-[24px] transition-colors border-none outline-none"
                        >
                          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#EF4444]">
                            Delete Chat
                          </span>
                          <Icon
                            icon="fluent:delete-16-regular"
                            width={24}
                            height={24}
                            color="#EF4444"
                          />
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <ChatHeaderMenu
              selectedMessage={selectedMessage}
              onMessageAction={(action) => handleMessageActionWithMsg(action)}
              currentUserId={
                activeProfile?.type === "COMPANY"
                  ? activeProfile.id
                  : session?.user?.id || ""
              }
            />
          )}
        </div>
      )}

      {chat.pinnedContext && !isGroupInvitation && (
        <div className="px-4 py-2 text-xs text-center font-medium bg-primary/20 text-primary">
          Context: {chat.pinnedContext}
        </div>
      )}

      {!isGroupInvitation &&
        (isLoading ? (
          <ChatSkeleton />
        ) : (
          <MessageList
            messages={messages}
            onLoadMore={fetchNextPage}
            hasMore={hasNextPage}
            isLoadingMore={isFetchingNextPage}
            onAction={handleMessageActionWithMsg}
            editingMessageId={editingMessageId}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={() => setEditingMessageId(null)}
            selectedMessageId={selectedMessage?.id}
            onMessageClick={handleMessageClick}
            onMediaClick={handleMediaClick}
            unreadCount={chat.unread}
            isOpponentOnline={chat.online}
            isGroup={chat.isGroup}
            onReply={(msg) => {
              const isSelf = msg.sender === "me" || Boolean(currentUserId && msg.senderId === currentUserId);
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
            onReaction={handleReactionSelect}
            currentUserId={currentUserId}
            conversationId={chat.id.toString()}
            otherUserType={chat.otherUserType}
            otherUserSlug={chat.otherUserSlug || chat.otherUserId}
            chatAvatar={chat.avatar}
          />
        ))}

      {typingDisplayString &&
        !isBlockedByMe &&
        !isBlockedByOther &&
        !isGroupInvitation && (
          <div className="px-6 py-1.5 flex items-center gap-2 bg-transparent text-[#000000] font-['Poppins'] font-normal text-[12px] leading-[16px] shrink-0">
            <span className="flex gap-1 items-center">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#000000] animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#000000] animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#000000] animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </span>
            <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#000000]">
              {typingDisplayString}
            </span>
          </div>
        )}

      {!isBlockedByMe && (isBlockedByOther || chat.isDeleted || isDeletedAccount || isDeactivatedAccount || chat.isDeactivated) && (
        <div className="px-4 py-2 my-1 flex items-center justify-center text-center shrink-0">
          <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-4 py-1.5 rounded-full border border-border/40 font-['Poppins']">
            {(isDeactivatedAccount || chat.isDeactivated)
              ? chat.otherUserType === "COMPANY"
                ? "This page has gone offline for a while"
                : "This user has gone offline for a while"
              : chat.otherUserType === "COMPANY"
                ? "This page is no longer available"
                : "This user is no longer available"}
          </span>
        </div>
      )}

      {isBlockedByMe ? (
        <div className="px-4 py-3.5 border-t border-border bg-muted/20 flex flex-col items-center justify-center gap-2 text-center shrink-0">
          <p className="text-sm text-muted-foreground">
            {canManageBlock
              ? "You have blocked this user"
              : "This account is blocked by organization administrators"}
          </p>
          <button
            onClick={canManageBlock ? handleUnblock : undefined}
            disabled={!canManageBlock}
            title={
              !canManageBlock
                ? "Only organization owners or administrators can unblock accounts"
                : undefined
            }
            className={cn(
              "px-5 py-1.5 text-sm font-medium rounded-full transition-colors",
              canManageBlock
                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed border border-border",
            )}
          >
            Unblock to chat
          </button>
        </div>
      ) : (
        <div className="flex flex-col w-full">
          {!isOrgChat && chat.is_requesting && !isBlockedByOther && (
            <div className="flex flex-row justify-end items-center gap-[16px] mt-[10px] px-4 md:px-6 mb-2">
              <button
                onClick={handleDeclineRequest}
                className="box-border flex flex-row justify-center items-center px-[16px] py-[8px] gap-[10px] w-[142px] h-[40px] bg-[var(--card)] border border-[var(--primary)] rounded-[24px] flex-none order-0 cursor-pointer"
              >
                <span className="w-[102px] h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[var(--primary-tint-foreground)] whitespace-nowrap">
                  Decline request
                </span>
              </button>
              <button
                onClick={handleAcceptRequest}
                className="box-border flex flex-row justify-center items-center px-[16px] py-[8px] gap-[10px] w-[142px] h-[40px] bg-[var(--primary)] border border-[var(--primary-foreground)] rounded-[24px] flex-none order-1 cursor-pointer"
              >
                <span className="w-[107px] h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[var(--primary-foreground)] whitespace-nowrap">
                  Accept request
                </span>
              </button>
            </div>
          )}
          {!isGroupInvitation && (
            <UnifiedMessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTypingInput}
              searchUsersFn={chat.isGroup ? searchGroupMembers : undefined}
              disabled={
                (!isOrgChat && chat.is_requesting) ||
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
                isDeactivatedAccount || chat.isDeactivated || isBlockedByOther || chat.isDeleted || isDeletedAccount
                  ? "Message unavailable"
                  : isJobChatDisabled
                    ? "Permission required to participate in job chats"
                    : isGeneralChatDisabled
                      ? "Permission required to participate in general chat"
                      : undefined
              }
              pendingEntityContext={pendingEntityContext}
              onDismissEntityContext={() => setPendingEntityContext(null)}
              placeholder="Message..."
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
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
          )}
        </div>
      )}

      {selectedMessage && (
        <MessageInfoModal
          isOpen={isMessageInfoOpen}
          onClose={() => setIsMessageInfoOpen(false)}
          messageId={selectedMessage.id}
          messageContent={
            selectedMessage.text || selectedMessage.text_content || ""
          }
          readAt={selectedMessage.read_at}
          receiver={{ name: chat.name, avatar: chat.avatar }}
        />
      )}
      {messageToDelete && (
        <DeleteMessageModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForEveryone={handleDeleteForEveryone}
          isSender={
            messageToDelete.sender === "me" ||
            messageToDelete.senderId === session?.user?.id
          }
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

      {/* Report Modal */}
      {showReportConfirm && (
        <ReportModal
          isOpen={showReportConfirm}
          onClose={() => setShowReportConfirm(false)}
          targetType={chat.otherUserType === "COMPANY" ? "COMPANY" : "USER"}
          targetId={chat.otherUserId || (chat as any).other_user_id || ""}
        />
      )}

      <CocpitConfirmBox
        isOpen={showBlockConfirm}
        title="Block this user?"
        message="They won't be able to message or find you"
        confirmText="Block"
        cancelText="Cancel"
        onConfirm={async () => {
          const targetUserId = chat.otherUserId || (chat as any).other_user_id;
          if (targetUserId) {
            try {
              await blockUser(targetUserId);
              queryClient.invalidateQueries({
                queryKey: ["messages", chat.id],
              });
              queryClient.invalidateQueries({ queryKey: ["conversations"] });
            } catch (err: any) {
              console.error("Failed to block user:", err);
            } finally {
              setShowBlockConfirm(false);
            }
          } else {
            setShowBlockConfirm(false);
          }
        }}
        onCancel={() => setShowBlockConfirm(false)}
      />

      <CocpitConfirmBox
        isOpen={showDeleteConfirm}
        title="Delete this chat?"
        message="This will remove the chat from your inbox"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          try {
            await deletePersonalChat(chat.id);
            queryClient.removeQueries({ queryKey: ["messages", chat.id] });
            queryClient.setQueryData(
              [
                "conversations",
                activeProfile?.type ?? "USER",
                activeProfile?.id ?? "me",
              ],
              (oldChats: ChatThread[] | undefined) => {
                if (!oldChats) return [];
                return oldChats.filter((c) => c.id !== chat.id);
              },
            );
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            toast({ description: "Chat deleted successfully" });
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, "", "/messaging");
            }
            if (onBack) onBack();
          } catch (err: any) {
            const errorMsg =
              err?.response?.data?.message ||
              err?.message ||
              "Failed to delete chat";
            toast({
              title: "Error",
              description: errorMsg,
              variant: "destructive",
            });
          } finally {
            setShowDeleteConfirm(false);
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <CocpitConfirmBox
        isOpen={showMuteConfirm}
        title="Mute this group?"
        message="You won't receive notifications from this group."
        confirmText="Mute"
        cancelText="Cancel"
        onConfirm={async () => {
          try {
            // Optimistic Cache Update
            const queryKey = [
              "conversations",
              activeProfile?.type ?? "USER",
              activeProfile?.id ?? "me",
            ];
            queryClient.setQueryData(
              queryKey,
              (oldChats: ChatThread[] | undefined) => {
                if (!oldChats) return [];
                return oldChats.map((c) =>
                  String(c.id) === String(chat.id)
                    ? { ...c, is_muted: true, muted_until: null }
                    : c,
                );
              },
            );
            await muteGroup(chat.id, true);
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            toast({ description: "Group muted successfully" });
          } catch (err: any) {
            const errorMsg =
              err?.response?.data?.message ||
              err?.message ||
              "Failed to mute group";
            toast({
              title: "Error",
              description: errorMsg,
              variant: "destructive",
            });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          } finally {
            setShowMuteConfirm(false);
          }
        }}
        onCancel={() => setShowMuteConfirm(false)}
      />

      <CocpitConfirmBox
        isOpen={showUnmuteConfirm}
        title="Unmute this group?"
        message="You will receive notifications from this group again."
        confirmText="Unmute"
        cancelText="Cancel"
        onConfirm={async () => {
          try {
            // Optimistic Cache Update
            const queryKey = [
              "conversations",
              activeProfile?.type ?? "USER",
              activeProfile?.id ?? "me",
            ];
            queryClient.setQueryData(
              queryKey,
              (oldChats: ChatThread[] | undefined) => {
                if (!oldChats) return [];
                return oldChats.map((c) =>
                  String(c.id) === String(chat.id)
                    ? { ...c, is_muted: false, muted_until: null }
                    : c,
                );
              },
            );
            await unmuteGroup(chat.id);
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            toast({ description: "Group unmuted successfully" });
          } catch (err: any) {
            const errorMsg =
              err?.response?.data?.message ||
              err?.message ||
              "Failed to unmute group";
            toast({
              title: "Error",
              description: errorMsg,
              variant: "destructive",
            });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          } finally {
            setShowUnmuteConfirm(false);
          }
        }}
        onCancel={() => setShowUnmuteConfirm(false)}
      />

      <CocpitConfirmBox
        isOpen={showLeaveConfirm}
        title="Leave this group?"
        message="You won't receive messages from this group anymore."
        confirmText="Leave"
        cancelText="Cancel"
        onConfirm={async () => {
          try {
            await leaveGroup(chat.id);
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            toast({ description: "You left the group" });
            if (onBack) onBack();
          } catch (err: any) {
            const errorMsg =
              err?.response?.data?.message ||
              err?.message ||
              "Failed to leave group";
            toast({
              title: "Error",
              description: errorMsg,
              variant: "destructive",
            });
          } finally {
            setShowLeaveConfirm(false);
          }
        }}
        onCancel={() => setShowLeaveConfirm(false)}
      />

      <CocpitShareModel
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        profileId={chat.otherUserId || (chat as any).other_user_id}
        onShare={(selectedIds) => {
          setIsShareModalOpen(false);
        }}
      />
    </div>
  );
}
