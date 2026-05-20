"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { MoreHorizontal, Phone, Video } from "lucide-react"
import { ChatThread, Message } from "@/types/messaging"
import { avatarGradients } from "@/constants/messaging"
import MessageList from "./MessageList"
import UnifiedMessageInput from "./UnifiedMessageInput"
import MobileChatHeader from "./MobileChatHeader"
import { useSearchParams, useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext"
import { useSession } from "next-auth/react"
import { SocketMessage, TypingPayload } from "@/types/socket"
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox"
import { getMessages, sendMessage, markAsRead, editMessage, deleteMessage, acceptChatRequest, declineChatRequest, addOrUpdateReaction, clearReaction, deletePersonalChat, muteGroup } from "@/services/api/messaging"
import { sendMessage as sendGroupMessage, getGroupDetails, leaveGroup } from "@/services/api/group-chat"
import { GroupMember } from "@/types/group-chat"
import { mapBackendMessageToMessage } from "@/lib/mappers/messaging.mapper"
import Avatar from "@/components/shared/Avatar"
import { useSocial } from "@/context/SocialContext"
import { createReport } from "@/services/api/report"
import MessageInfoModal from "../../MessageInfoModal"
import { Button } from "@/components/ui/button"
import { X, Copy, Pencil, Info as InfoIcon, MoreVertical, Ban } from "lucide-react"
import { Icon } from "@iconify/react"
import { Plus } from "lucide-react"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteMessageModal } from "./DeleteMessageModal"
import { Trash2 } from "lucide-react"
import MediaPreviewModal from "./MediaPreviewModal"
import ChatSkeleton from "./ChatSkeleton"
import { useChatSession } from "@/features/messaging/hooks/use-chat-session"
import { SessionBanner } from "./SessionBanner"

interface ChatWindowProps {
  chat: ChatThread
  isMobile: boolean
  onBack?: () => void
}

const getAvatarGradient = (avatar: string) => {
  return avatarGradients[avatar] || "from-gray-400 to-gray-500";
}

function ChatHeaderMenu({ selectedMessage, onMessageAction, currentUserId }: { selectedMessage: Message, onMessageAction: (action: string) => void, currentUserId: string }) {
  const isMyMessage = selectedMessage.sender === 'me' || selectedMessage.senderId === currentUserId || selectedMessage.senderId === 'me';
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onMessageAction('close')}
          className="p-1 hover:bg-[#EEF2FF] rounded-full transition-colors"
        >
          <X className="h-6 w-6 text-[#000000]" />
        </button>
        <div className="font-['Poppins'] font-medium text-[16px] text-[#000000]">1 Selected</div>
      </div>
      <div className="flex items-center gap-1">
        <DropdownMenu onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button className="p-1 outline-none transition-colors">
              <Icon
                icon="mdi-light:dots-vertical"
                width={24}
                height={24}
                style={{ color: isOpen ? '#6366F1' : '#000000' }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[204px] p-[8px] mr-4 bg-white border border-[#C7D2FE]"
            style={{ borderRadius: '24px 0px 24px 24px' }}
          >
            {isMyMessage && (
              <DropdownMenuItem
                onClick={() => onMessageAction('edit')}
                className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors border-none outline-none"
              >
                <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">Edit</span>
                <Icon icon="fluent:edit-16-regular" width={24} height={24} color="#000000" />
              </DropdownMenuItem>
            )}
            {isMyMessage && (
              <DropdownMenuItem
                onClick={() => onMessageAction('delete')}
                className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#FFF0F0] rounded-md transition-colors border-none outline-none"
              >
                <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#FF6B6B]">Delete</span>
                <Icon icon="fluent:delete-16-regular" width={24} height={24} color="#FF6B6B" />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onMessageAction('info')}
              className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors border-none outline-none"
            >
              <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">Info</span>
              <Icon icon="fluent:info-16-regular" width={24} height={24} color="#000000" />
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onMessageAction('copy')}
              className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors border-none outline-none"
            >
              <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">Copy</span>
              <Icon icon="fluent:copy-16-regular" width={24} height={24} color="#000000" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export default function ChatWindow({ chat: initialChat, isMobile, onBack }: ChatWindowProps) {
  const { socket, isUserOnline, setActiveConversationId } = useSocket();
  const { unblockUser, isBlocked, blockUser } = useSocial();
  const { data: session } = useSession();
  const { activeProfile } = useActiveProfile();
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMuteConfirm, setShowMuteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const [typingMap, setTypingMap] = useState<Map<string, string>>(new Map());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMessageSelected, setIsMessageSelected] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ messageId: string, senderName: string, content: string } | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const sharedPostIdParam = searchParams?.get("sharedPostId");
  const sharedProfileIdParam = searchParams?.get("sharedProfileId");

  const [pendingSharedPostId, setPendingSharedPostId] = useState<string | null>(null);
  const [pendingSharedPost, setPendingSharedPost] = useState<any | null>(null);
  const [pendingSharedProfileId, setPendingSharedProfileId] = useState<string | null>(null);
  const [pendingSharedProfile, setPendingSharedProfile] = useState<any | null>(null);

  const isBlockedByMe = initialChat.otherUserId ? isBlocked(initialChat.otherUserId) : false;
  const isBlockedByOther = initialChat.isBlockedByOther;

  // Company chat session management
  const chatSession = useChatSession(
    activeProfile?.type === 'COMPANY' ? initialChat.id : undefined
  );
  const isCompanyMode = activeProfile?.type === 'COMPANY';
  const sessionDisabled = isCompanyMode && initialChat.id !== 'new' && chatSession.featureEnabled && !chatSession.isMySession;

  const chat = {
    ...initialChat,
    online: (!isBlockedByMe && !isBlockedByOther && initialChat.otherUserId) ? isUserOnline(initialChat.otherUserId) : false
  };

  // Sync state with URL parameter on mount or when chat/param changes
  useEffect(() => {
    if (sharedPostIdParam) {
      setPendingSharedPostId(sharedPostIdParam);
      // Fetch post details to display preview
      Promise.all([
        import("@/services/api/posts"),
        import("@/lib/mappers/feed.mapper")
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
      const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : "");
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
      const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState(null, "", newPath);
    }
  }, [sharedProfileIdParam, chat.id]);

  const handleUnblock = async () => {
    if (!chat.otherUserId) return;
    await unblockUser(chat.otherUserId);
    queryClient.invalidateQueries({ queryKey: ['messages', chat.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const handleAcceptRequest = async () => {
    try {
      await acceptChatRequest(chat.id);
      queryClient.setQueryData(['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'], (oldChats: ChatThread[] | undefined) => {
        if (!oldChats) return [];
        return oldChats.map(c => c.id === chat.id ? { ...c, is_requesting: false } : c);
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({ description: "Request accepted" });
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to accept request";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    }
  };

  const handleDeclineRequest = async () => {
    try {
      await declineChatRequest(chat.id);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({ description: "Request declined" });
      if (onBack) onBack();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to decline request";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    }
  };

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['messages', chat.id],
    queryFn: async ({ pageParam }) => {
      const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
      const backendMessages = await getMessages(chat.id, 50, pageParam, companyId);
      return backendMessages.map(m => mapBackendMessageToMessage(m, session?.user?.id, activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined));
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 50) return undefined;
      return lastPage[0]?.created_at; // Oldest message in the current batch
    },
    initialPageParam: null as string | null,
    enabled: !!chat.id && chat.id !== 'new' && !!session?.user?.id,
  });

  // Flatten and reverse pages to show oldest to newest
  // Pages are [MostRecentObj, OlderObj, EvenOlderObj]
  // We want to render: EvenOlderObj...OlderObj...MostRecentObj
  const messages = React.useMemo(() => {
    if (!data) return [];
    return [...data.pages].reverse().flatMap(page => page);
  }, [data]);

  // Mark as read on mount or when chat.id changes
  useEffect(() => {
    setActiveConversationId(chat.id);

    // Reset typing state when chat changes
    setTypingUser(null);
    chatSession.clearSessionLost();
    setTypingMap(new Map());

    if (chat.id && chat.unread > 0) {
      const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
      markAsRead(chat.id, companyId).then(() => {
        // Optimistically update conversation unread count
        queryClient.setQueryData(['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'], (oldChats: ChatThread[] | undefined) => {
          if (!oldChats) return [];
          return oldChats.map(c => c.id === chat.id ? { ...c, unread: 0 } : c);
        });
      }).catch(console.error);
    }

    return () => setActiveConversationId(null);
  }, [chat.id, chat.unread, queryClient, setActiveConversationId]);


  useEffect(() => {
    if (!socket || !chat) return;

    // Join the conversation room (existing logic)
    socket.emit('joinConversation', { conversationId: chat.id.toString() });

    // Also join Group explicitly if it's a group to be safe (backend might rely on it for some checks)
    if (chat.isGroup) {
      socket.emit('joinGroup', { groupId: chat.id.toString() });
    }

    const handleNewMessage = (msg: SocketMessage) => {
      // Only handle messages for this conversation
      if (msg.conversation_id !== chat.id) return;

      const isMe = msg.sender_id === session?.user?.id;

      // Clear typing indicator for the sender
      if (chat.isGroup) {
        setTypingMap(prev => {
          const next = new Map(prev);
          next.delete(msg.sender_id);
          return next;
        });
      } else {
        setTypingUser(null);
      }

      // Map socket message to frontend entity using valid mapper
      const uiMessage = mapBackendMessageToMessage(msg as any, session?.user?.id, activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined);

      queryClient.setQueryData(['messages', chat.id], (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return undefined; // Should we create structure? Maybe not if not loaded yet.

        // Check if real ID already exists in ANY page
        const existsPage = old.pages.findIndex(page => page.some(m => m.id === uiMessage.id));

        if (existsPage !== -1) {
          // Update existing message
          const newPages = [...old.pages];
          newPages[existsPage] = newPages[existsPage].map(m => m.id === uiMessage.id ? uiMessage : m);
          return { ...old, pages: newPages };
        }

        const newPages = [...old.pages];

        // If it's my message, check for optimistic match in FIRST page
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

        // Just append to first page (most recent)
        newPages[0] = [...newPages[0], uiMessage];
        return { ...old, pages: newPages };
      });

      // Also update the conversation list last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      // Mark as read if we are focused
      if (!isMe) {
        markAsRead(chat.id).catch(console.error);
      }
    };

    const handleTyping = (payload: TypingPayload) => {
      if (payload.conversationId === chat.id.toString() && payload.senderId !== session?.user?.id) {
        if (chat.isGroup && payload.isGroup) {
          if (payload.senderId && payload.username) {
            setTypingMap(prev => new Map(prev).set(payload.senderId!, payload.username!));
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
            setTypingMap(prev => {
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

    const handleMessagesSeen = (payload: { conversationId: string, messageIds: string[], readAt: string, readerId: string }) => {
      if (payload.conversationId !== chat.id) return;

      queryClient.setQueryData(['messages', chat.id], (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return undefined;
        const newPages = old.pages.map(page =>
          page.map(m => {
            if (payload.messageIds.includes(m.id)) {
              return { ...m, read_at: payload.readAt };
            }
            return m;
          })
        );
        return { ...old, pages: newPages };
      });
    };

    const handleMessageDeleted = (payload: { messageId: string, conversationId: string, deleteType: 'me' | 'everyone' }) => {
      // payload: { messageId, conversationId, deleteType: 'me'|'everyone' }
      if (payload.conversationId !== chat.id) return;

      queryClient.setQueryData(['messages', chat.id], (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return undefined;

        if (payload.deleteType === 'me') {
          // Update the message content for "Delete for me"
          const newPages = old.pages.map(page => page.map(m => {
            if (m.id === payload.messageId) {
              return {
                ...m,
                text: "This message is deleted for you",
                text_content: "This message is deleted for you",
                sharedPost: null,
                is_deleted: true,
                is_deleted_for_me: true
              };
            }
            return m;
          }));
          return { ...old, pages: newPages };
        } else {
          // Update the message content
          const newPages = old.pages.map(page => page.map(m => {
            if (m.id === payload.messageId) {
              return {
                ...m,
                text: "This message deleted for everyone",
                text_content: "This message deleted for everyone",
                sharedPost: null,
                is_deleted: true,
                is_deleted_for_everyone: true
              };
            }
            return m;
          }));
          return { ...old, pages: newPages };
        }
      });
    };

    const handleMessageEdited = (payload: { messageId: string, conversationId: string, text_content: string }) => {
      if (payload.conversationId !== chat.id) return;

      queryClient.setQueryData(['messages', chat.id], (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return undefined;
        const newPages = old.pages.map(page => page.map(m => {
          if (m.id === payload.messageId) {
            return {
              ...m,
              text: payload.text_content,
              text_content: payload.text_content,
              is_edited: true
            };
          }
          return m;
        }));
        return { ...old, pages: newPages };
      });
    };

    const handleReactionUpdated = (payload: { messageId: string; conversationId: string; reaction: { user_id: string; emoji: string; full_name: string; avatar: string | null; updated_at: string } | null; userId?: string }) => {
      if (payload.conversationId !== chat.id) return;
      queryClient.setQueryData(['messages', chat.id], (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return old;
        const newPages = old.pages.map(page => page.map(m => {
          if (m.id !== payload.messageId) return m;
          const reactions = m.reactions || [];
          if (payload.reaction === null) {
            // Remove reaction for that user
            const uid = payload.userId;
            return { ...m, reactions: reactions.filter(r => r.user_id !== uid) };
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
    };

    socket.on('new_message', handleNewMessage);
    socket.on('isTyping', handleTyping);
    socket.on('stoppedTyping', handleStopTyping);
    socket.on('messages_seen', handleMessagesSeen);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_reaction_updated', handleReactionUpdated);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('isTyping', handleTyping);
      socket.off('stoppedTyping', handleStopTyping);
      socket.off('messages_seen', handleMessagesSeen);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_reaction_updated', handleReactionUpdated);
    };
  }, [socket, chat.id, chat.isGroup, session?.user?.id, queryClient]); // Depend only on chat.id, not the full chat object

  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, files, replyMessageId, sharedPostId, sharedProfileId }: { text: string, files: File[], replyMessageId?: string, sharedPostId?: string, sharedProfileId?: string }) => {
      if (chat.isGroup) {
        return sendGroupMessage(chat.id, text, 'text', files, replyMessageId);
      }

      if (!chat.otherUserId) throw new Error("Target user ID missing");
      return sendMessage(chat.otherUserId, text, sharedPostId, files, activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined, replyMessageId, sharedProfileId);
    },
    onMutate: async ({ text, files, sharedPostId }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chat.id] });
      const previousMessages = queryClient.getQueryData(['messages', chat.id]);

      // Optimistic update
      const tempMedia = files.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : (file.type === 'application/pdf' ? 'document' : 'image') as 'image' | 'video' | 'document'
      }));

      const newMessage: Message = {
        id: 'temp-' + Date.now(),
        sender: "me",
        text: text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        // Add minimal required fields for mapping/rendering
        senderId: session?.user?.id || 'me',
        created_at: new Date().toISOString(),
        type: 'text',
        read_at: null,
        media: tempMedia,
        sharedPost: pendingSharedPost ? {
          id: pendingSharedPost.id,
          content: pendingSharedPost.content,
          author: pendingSharedPost.author,
          authorAvatar: pendingSharedPost.authorAvatar || null,
          media: pendingSharedPost.images?.map((img: string) => ({ url: img, type: 'image' })) || []
        } : null
      };

      queryClient.setQueryData(['messages', chat.id], (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return { pages: [[newMessage]], pageParams: [null] };

        // Add to the FIRST page (most recent)
        const newPages = [...old.pages];
        newPages[0] = [...newPages[0], newMessage];
        return {
          ...old,
          pages: newPages
        };
      });

      return { previousMessages, tempId: newMessage.id };
    },
    onError: (err: any, newTodo, context) => {
      queryClient.setQueryData(['messages', chat.id], context?.previousMessages);
      // Handle session lost (403 from backend)
      if (err?.response?.status === 403 && isCompanyMode) {
        chatSession.clearSessionLost();
        chatSession.refetchSession();
        // Small delay then set sessionLost
        setTimeout(() => {
          // The refetch above will update session state, and if session is gone the banner will show
        }, 100);
      }
      console.error("Failed to send message", err);
    },
    onSuccess: (data, variables, context) => {
      // Clear typing indicator immediately on send
      setTypingMap(new Map());
      setTypingUser(null);

      queryClient.setQueryData(['messages', chat.id], (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return old;

        const realMessage = mapBackendMessageToMessage(data.data || data, session?.user?.id, activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined);

        // Find and replace in the first page
        const newPages = [...old.pages];
        newPages[0] = newPages[0].map(m => m.id === context.tempId ? realMessage : m);

        return { ...old, pages: newPages };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'] });
    },
  });

  const handleSendMessage = React.useCallback((text: string, files: File[]) => {
    // Basic validation
    if ((!chat.otherUserId && !chat.isGroup) || isBlockedByMe || isBlockedByOther) {
      return;
    }

    // Stop typing immediately when sending
    if (socket) {
      if (chat.isGroup) {
        socket.emit('stopGroupTyping', { groupId: chat.id.toString() });
      } else {
        socket.emit('stopTyping', { conversationId: chat.id.toString() });
      }
    }

    sendMessageMutation.mutate({
      text,
      files,
      replyMessageId: replyingTo?.messageId,
      sharedPostId: pendingSharedPostId || undefined,
      sharedProfileId: pendingSharedProfileId || undefined
    });
    setReplyingTo(null);
    setPendingSharedPostId(null);
    setPendingSharedPost(null);
    setPendingSharedProfileId(null);
    setPendingSharedProfile(null);
  }, [chat.otherUserId, chat.isGroup, chat.id, isBlockedByMe, isBlockedByOther, socket, sendMessageMutation, replyingTo, pendingSharedPostId, pendingSharedProfileId]);

  const handleTypingInput = React.useCallback(() => {
    if (!socket || !chat) return;

    const now = Date.now();
    if (now - lastTypingRef.current > 2000) {
      if (chat.isGroup) {
        socket.emit('groupTyping', { groupId: chat.id.toString() });
      } else {
        socket.emit('typing', { conversationId: chat.id.toString() });
      }
      lastTypingRef.current = now;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (chat.isGroup) {
        socket.emit('stopGroupTyping', { groupId: chat.id.toString() });
      } else {
        socket.emit('stopTyping', { conversationId: chat.id.toString() });
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

  const handleDeleteForMe = async () => {
    if (!messageToDelete) return;
    const msgId = messageToDelete.id;
    try {
      // Optimistic/Immediate update since backend won't emit event for "me"
      queryClient.setQueryData(['messages', chat.id], (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return undefined;
        const newPages = old.pages.map(page => page.map(m => {
          if (m.id === msgId) {
            return {
              ...m,
              text: "This message deleted for you",
              text_content: "This message deleted for you",
              sharedPost: null,
              is_deleted: true,
              is_deleted_for_me: true
            };
          }
          return m;
        }));
        return { ...old, pages: newPages };
      });

      await deleteMessage(msgId, false);
      setIsDeleteModalOpen(false);
      setMessageToDelete(null);
    } catch (error) {
      console.error("Failed to delete message", error);
      // Revert or invalidate on error
      queryClient.invalidateQueries({ queryKey: ['messages', chat.id] });
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!messageToDelete) return;
    try {
      await deleteMessage(messageToDelete.id, true);
    } catch (error) {
      console.error("Failed to delete message for everyone", error);
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
    mutationFn: async ({ messageId, text }: { messageId: string, text: string }) => {
      return editMessage(messageId, text);
    },
    onSuccess: () => {
      setEditingMessageId(null);
      // Socket event will handle the UI update
    },
    onError: (error) => {
      console.error("Failed to edit message:", error);
    }
  });

  const handleMessageAction = (action: string) => {
    if (!selectedMessage) return;

    if (action === 'info') {
      setIsMessageInfoOpen(true);
    } else if (action === 'copy') {
      navigator.clipboard.writeText(selectedMessage.text || selectedMessage.text_content || "");
      setSelectedMessage(null);
      setIsMessageSelected(false);
    } else if (action === 'edit') {
      setEditingMessageId(selectedMessage.id);
      setSelectedMessage(null);
      setIsMessageSelected(false);
    } else if (action === 'delete') {
      // If action comes from bubble menu, 'selectedMessage' might not be set or might be different.
      // But here handleMessageAction is for header menu usually.
      // Wait, MessageList calls onAction too. We need to handle passed message if possible or rely on selected.
      // The shared handleMessageAction uses selectedMessage for context.
      // If called from bubble, we might need a separate handler or update this one.

      // Since MessageBubble passes the message in onAction('delete', message), we need to update signature of handleMessageAction?
      // No, looking at MessageBubble: onAction('delete', message).
      // Looking at MessageList, it passes (action, message) => onAction(action, message).
      // So handleMessageAction needs to accept message?
      // In ChatWindow line 432: const handleMessageAction = (action: string) => { ... }
      // It DOES NOT accept message. It uses 'selectedMessage' state.

      // ISSUE: MessageBubble actions pass the message, but ChatWindow handler ignores it.
      // We must update ChatWindow handler to accept optional message.
      setMessageToDelete(selectedMessage);
      setIsDeleteModalOpen(true);
      setSelectedMessage(null);
    } else if (action === 'close') {
      setSelectedMessage(null);
      setIsMessageSelected(false);
    }
  };

  // Improved handler to support direct action from bubble
  const handleMessageActionWithMsg = (action: string, message?: Message) => {
    const targetMsg = message || selectedMessage;
    if (!targetMsg && action !== 'close') return;

    if (action === 'delete') {
      setMessageToDelete(targetMsg);
      setIsDeleteModalOpen(true);
      if (selectedMessage) {
        setSelectedMessage(null);
        setIsMessageSelected(false);
      }
    } else if (action === 'edit') {
      setEditingMessageId(targetMsg!.id);
      if (selectedMessage) {
        setSelectedMessage(null);
        setIsMessageSelected(false);
      }
    } else if (action === 'copy') {
      navigator.clipboard.writeText(targetMsg!.text || targetMsg!.text_content || "");
      if (selectedMessage) {
        setSelectedMessage(null);
        setIsMessageSelected(false);
      }
    } else if (action === 'info') {
      if (targetMsg) {
        // setSelectedMessage(targetMsg); // Maybe needed?
        // setIsMessageInfoOpen(true);
        // For info modal, we rely on selectedMessage being set? 
        // If clicked from bubble, we might need to set it first.

        // Current impl relies on selectedMessage for 'info'.
        if (selectedMessage?.id !== targetMsg.id) setSelectedMessage(targetMsg);
        setIsMessageInfoOpen(true);
      }
    } else if (action === 'close') {
      setSelectedMessage(null);
      setIsMessageSelected(false);
    }
  };

  const handleSaveEdit = (messageId: string, text: string) => {
    editMessageMutation.mutate({ messageId, text });
  };

  // ---- Reaction Logic ----
  const currentUserId = activeProfile?.type === 'COMPANY' ? activeProfile.id : (session?.user?.id || '');

  const optimisticallyUpdateReaction = (messageId: string, emoji: string, userId: string) => {
    queryClient.setQueryData(['messages', chat.id], (old: InfiniteData<Message[]> | undefined) => {
      if (!old) return old;
      const newPages = old.pages.map(page => page.map(m => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions || [];
        const existingIdx = reactions.findIndex(r => r.user_id === userId);
        let newReactions;
        if (existingIdx !== -1) {
          newReactions = reactions.map((r, i) => i === existingIdx ? { ...r, emoji, updated_at: new Date().toISOString() } : r);
        } else {
          newReactions = [...reactions, { user_id: userId, emoji, full_name: session?.user?.name || '', avatar: null, updated_at: new Date().toISOString() }];
        }
        return { ...m, reactions: newReactions };
      }));
      return { ...old, pages: newPages };
    });
  };

  const rollbackReaction = (messageId: string, previousReaction: Message['reactions'] extends Array<infer R> | undefined ? R | undefined : never, userId: string) => {
    queryClient.setQueryData(['messages', chat.id], (old: InfiniteData<Message[]> | undefined) => {
      if (!old) return old;
      const newPages = old.pages.map(page => page.map(m => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions || [];
        let newReactions;
        if (previousReaction) {
          newReactions = reactions.map(r => r.user_id === userId ? previousReaction : r);
        } else {
          newReactions = reactions.filter(r => r.user_id !== userId);
        }
        return { ...m, reactions: newReactions };
      }));
      return { ...old, pages: newPages };
    });
  };

  const handleReactionSelect = async (message: Message, selectedEmoji: string) => {
    const myReaction = message.reactions?.find(r => r.user_id === currentUserId);
    // Same emoji — no-op
    if (myReaction && myReaction.emoji === selectedEmoji) return;
    // Optimistic update
    optimisticallyUpdateReaction(message.id, selectedEmoji, currentUserId);
    try {
      if (selectedEmoji === '') {
        await clearReaction(message.id);
      } else {
        await addOrUpdateReaction(message.id, selectedEmoji);
      }
    } catch (error) {
      rollbackReaction(message.id, myReaction, currentUserId);
      toast({ title: 'Error', description: 'Failed to update reaction', variant: 'destructive' });
    }
  };
  // ---- End Reaction Logic ----

  const [previewMedia, setPreviewMedia] = useState<{ url: string, type: 'image' | 'video' | 'document', name?: string } | null>(null);

  const handleMediaClick = (url: string, type: 'image' | 'video' | 'document', name?: string) => {
    setPreviewMedia({ url, type, name });
  };

  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  useEffect(() => {
    if (chat.isGroup) {
      getGroupDetails(chat.id).then(details => {
        // Broaden fallback for member list property
        const members = details.members || (details as any).participants || (details as any).users || [];
        setGroupMembers(members);
      }).catch(err => {
        console.error("Failed to load group members:", err);
      });
    }
  }, [chat.id, chat.isGroup]);

  const searchGroupMembers = React.useCallback(async (query: string) => {
    if (!chat.isGroup) return [];

    // Safety check for empty cache: if empty, try to fetch immediately
    let membersToFilter = groupMembers;
    if (membersToFilter.length === 0) {
      try {
        const details = await getGroupDetails(chat.id);
        const members = (details as any).members || (details as any).participants || (details as any).users || [];
        setGroupMembers(members);
        membersToFilter = members;
      } catch (e) {
        console.error("Delayed fetch of group members failed", e);
      }
    }

    const q = (query || "").toLowerCase();

    return membersToFilter.filter(m => {
      const fullName = (m.full_name || (m as any).name || (m as any).fullName || "").toLowerCase();
      const accountName = (m.account_name || (m as any).accountName || (m as any).username || "").toLowerCase();

      // If query is empty, return true for all
      if (!q) return true;

      return fullName.includes(q) || accountName.includes(q);
    }).map(m => {
      const fName = m.full_name || (m as any).name || (m as any).fullName || "User";
      const uId = m.user_id || (m as any).id || (m as any).userId;
      return {
        ...m,
        id: uId,
        user_id: uId,
        full_name: fName,
        account_name: m.account_name || (m as any).accountName || (m as any).username || fName.replace(/\s+/g, '_').toLowerCase(),
        avatar_url: m.avatar_url || (m as any).avatar || ''
      };
    });
  }, [groupMembers, chat.id, chat.isGroup]);

  return (
    <div className={`flex flex-col h-full ${isMobile ? "h-dvh bg-background" : ""}`}>
      {isMobile ? (
        <MobileChatHeader
          chat={chat}
          onBack={onBack!}
          selectedMessage={selectedMessage}
          onMessageAction={(action) => handleMessageActionWithMsg(action)}
          currentUserId={activeProfile?.type === 'COMPANY' ? activeProfile.id : (session?.user?.id || "")}
        />
      ) : (
        <div className="px-[16px] py-[12px] border-b border-[#EEF2FF] flex items-center justify-between bg-[#FFFFFF] shrink-0">
          {!isMessageSelected || !selectedMessage ? (
            <>
              {/* LEFT: Avatar + Text Group */}
              <div className="flex flex-row items-center">
                {chat.isGroup ? (
                  <>
                    <div className="w-[40px] h-[40px] flex-none mr-[8px]">
                      <Avatar url={chat.avatar} name={chat.name} size="md" online={chat.online} />
                    </div>
                    <div className="flex flex-col items-start p-0 min-w-0">
                      <h2 className="font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#000000] w-full">
                        <span className="truncate">{chat.name}</span>
                      </h2>
                      <p className="font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] w-full">
                        <span className="truncate">{chat.role || "Group Chat"}</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href={chat.otherUserType === 'COMPANY' ? `/organization/${chat.otherUserSlug || chat.otherUserId}` : `/profile/${chat.otherUserSlug || chat.otherUserId}`}
                      className="w-[40px] h-[40px] flex-none mr-[8px] hover:opacity-80 transition-opacity"
                    >
                      <Avatar url={chat.avatar} name={chat.name} size="md" online={chat.online} />
                    </Link>
                    <div className="flex flex-col items-start p-0 min-w-0">
                      <Link
                        href={chat.otherUserType === 'COMPANY' ? `/organization/${chat.otherUserSlug || chat.otherUserId}` : `/profile/${chat.otherUserSlug || chat.otherUserId}`}
                        className="hover:opacity-80 transition-opacity w-full"
                      >
                        <h2 className="font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#000000] w-full">
                          <span className="truncate">{chat.name}</span>
                        </h2>
                      </Link>
                      <p className="font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] w-full">
                        <span className="truncate">{chat.role || "Member"}</span>
                      </p>
                      {/* Active Status */}
                      {chat.online && (
                        <div className="flex flex-row items-center p-0 gap-[8px] h-[16px] mt-[4px]">
                          <span className="w-[6px] h-[6px] rounded-full bg-[#22C55E] flex-none" />
                          <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#22C55E]">
                            Active now
                          </span>
                        </div>
                      )}
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
                      style={{ color: isDropdownOpen ? '#6366F1' : '#000000' }}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[204px] p-[8px] mr-4 bg-white border border-[#C7D2FE]"
                    style={{ borderRadius: '24px 0px 24px 24px' }}>
                    {chat.isGroup ? (
                      <>
                        <DropdownMenuItem className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors">
                          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">Share profile</span>
                          <Icon icon="fluent:share-16-regular" width={24} height={24} color="#000000" />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowMuteConfirm(true)} className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors">
                          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">Mute group</span>
                          <Icon icon="fluent:speaker-mute-16-regular" width={24} height={24} color="#000000" />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowLeaveConfirm(true)} className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#FFF0F0] rounded-md transition-colors">
                          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#FF6B6B]">Leave group</span>
                          <Icon icon="fluent:door-arrow-left-16-regular" width={24} height={24} color="#FF6B6B" />
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors">
                          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">Share profile</span>
                          <Icon icon="fluent:share-16-regular" width={24} height={24} color="#000000" />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowReportConfirm(true)} className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors">
                          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">Report profile</span>
                          <InfoIcon className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowBlockConfirm(true)} className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors">
                          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">Block profile</span>
                          <Ban className="w-[24px] h-[24px] text-[#000000]" strokeWidth={1.5} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#FFF0F0] rounded-md transition-colors">
                          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#FF6B6B]">Delete Chat</span>
                          <Trash2 className="w-[24px] h-[24px] text-[#FF6B6B]" strokeWidth={1} />
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
              currentUserId={activeProfile?.type === 'COMPANY' ? activeProfile.id : (session?.user?.id || "")}
            />
          )}
        </div>
      )}

      {/* Session Banner (company mode only) */}
      {isCompanyMode && (
        <SessionBanner
          session={chatSession.session}
          featureEnabled={chatSession.featureEnabled}
          isMySession={chatSession.isMySession}
          isActionLoading={chatSession.isActionLoading}
          actionError={chatSession.actionError}
          sessionLost={chatSession.sessionLost}
          onClaim={chatSession.claim}
          onRelease={chatSession.release}
          onTakeover={chatSession.takeover}
          onClearSessionLost={chatSession.clearSessionLost}
        />
      )}

      {chat.pinnedContext && (
        <div className="px-4 py-2 text-xs text-center font-medium bg-primary/20 text-primary">
          Context: {chat.pinnedContext}
        </div>
      )}

      {isLoading ? (
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
          onReply={(msg) => setReplyingTo({
            messageId: msg.id,
            senderName: msg.senderName || "Unknown",
            content: msg.text || msg.text_content || ""
          })}
          onReaction={handleReactionSelect}
          currentUserId={currentUserId}
        />
      )}

      {typingDisplayString && !isBlockedByMe && !isBlockedByOther && (
        <div className="px-5 py-1.5 text-xs text-muted-foreground/80 italic flex items-center gap-1.5 border-t border-border/30">
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          {typingDisplayString}
        </div>
      )}

      {activeProfile?.type === 'COMPANY' && !isBlockedByMe && !isBlockedByOther && (
        <div className="px-4 py-1 text-xs text-center bg-muted/40 text-muted-foreground/70 border-t border-border/40">
          Replying as <span className="font-semibold text-foreground">{activeProfile.name}</span>
        </div>
      )}

      {isBlockedByMe ? (
        <div className="px-4 py-3.5 border-t border-border bg-muted/20 flex flex-col items-center justify-center gap-2 text-center shrink-0">
          <p className="text-sm text-muted-foreground">You have blocked this user</p>
          <button
            onClick={handleUnblock}
            className="px-5 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-primary/90 transition-colors"
          >
            Unblock to chat
          </button>
        </div>
      ) : (
        <div className="flex flex-col w-full">
          {chat.is_requesting && !isBlockedByOther && (
            <div className="flex flex-row justify-end items-center gap-[16px] mt-[10px] px-4 md:px-6 mb-2">
              <button
                onClick={handleDeclineRequest}
                className="box-border flex flex-row justify-center items-center px-[16px] py-[8px] gap-[10px] w-[142px] h-[40px] bg-[#FFFFFF] border border-[#818CF8] rounded-[24px] flex-none order-0 cursor-pointer"
              >
                <span className="w-[102px] h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[#818CF8] whitespace-nowrap">
                  Decline request
                </span>
              </button>
              <button
                onClick={handleAcceptRequest}
                className="box-border flex flex-row justify-center items-center px-[16px] py-[8px] gap-[10px] w-[142px] h-[40px] bg-[#6366F1] border border-[#FFFFFF] rounded-[24px] flex-none order-1 cursor-pointer"
              >
                <span className="w-[107px] h-[20px] font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[#FFFFFF] whitespace-nowrap">
                  Accept request
                </span>
              </button>
            </div>
          )}
          <UnifiedMessageInput
            onSendMessage={handleSendMessage}
            onTyping={handleTypingInput}
            searchUsersFn={chat.isGroup ? searchGroupMembers : undefined}
            disabled={chat.is_requesting || (!chat.otherUserId && !chat.isGroup) || !!isBlockedByOther || sessionDisabled}
            disabledMessage={
              isBlockedByOther ? "User not found" :
                sessionDisabled && chatSession.session ? `Handled by ${chatSession.session.handler_name_snapshot}` :
                  sessionDisabled ? "Claim this conversation to reply" :
                    undefined
            }
            placeholder={sessionDisabled ? "Claim to start typing..." : "Type a message..."}
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
          />
        </div>
      )}

      {selectedMessage && (
        <MessageInfoModal
          isOpen={isMessageInfoOpen}
          onClose={() => setIsMessageInfoOpen(false)}
          messageId={selectedMessage.id}
          messageContent={selectedMessage.text || selectedMessage.text_content || ""}
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
          isSender={messageToDelete.sender === 'me' || messageToDelete.senderId === (session?.user?.id)}
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

      {/* Confirmation Boxes */}
      <CocpitConfirmBox
        isOpen={showReportConfirm}
        title="Report this profile?"
        message="We'll review this profile based on your report."
        confirmText="Report"
        cancelText="Cancel"
        onConfirm={async () => {
          if (chat.otherUserId) {
            try {
              const targetType = chat.otherUserType === 'COMPANY' ? 'COMPANY' : 'USER';
              const reportRes = await createReport({
                targetType: targetType,
                targetId: chat.otherUserId,
                customReason: "Reported from chat window"
              });
              toast({ description: reportRes.message || "Profile reported successfully" });
              setShowReportConfirm(false);
            } catch (err: any) {
              const errorMsg = err?.response?.data?.message || "Failed to report profile";
              toast({
                title: "Error",
                description: errorMsg,
                variant: "destructive"
              });
            }
          }
        }}
        onCancel={() => setShowReportConfirm(false)}
      />

      <CocpitConfirmBox
        isOpen={showBlockConfirm}
        title="Block this user?"
        message="They won't be able to message or find you"
        confirmText="Block"
        cancelText="Cancel"
        onConfirm={async () => {
          if (chat.otherUserId) {
            try {
              await blockUser(chat.otherUserId);
              setShowBlockConfirm(false);
            } catch (err: any) {
              // Context shows toast, ensure we close the modal
              setShowBlockConfirm(false);
            }
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
            queryClient.setQueryData(['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'], (oldChats: ChatThread[] | undefined) => {
              if (!oldChats) return [];
              return oldChats.filter(c => c.id !== chat.id);
            });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast({ description: "Chat deleted successfully" });
            if (onBack) onBack();
          } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete chat";
            toast({ title: "Error", description: errorMsg, variant: "destructive" });
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
            await muteGroup(chat.id, true);
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast({ description: "Group muted successfully" });
          } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to mute group";
            toast({ title: "Error", description: errorMsg, variant: "destructive" });
          } finally {
            setShowMuteConfirm(false);
          }
        }}
        onCancel={() => setShowMuteConfirm(false)}
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
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast({ description: "You left the group" });
            if (onBack) onBack();
          } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to leave group";
            toast({ title: "Error", description: errorMsg, variant: "destructive" });
          } finally {
            setShowLeaveConfirm(false);
          }
        }}
        onCancel={() => setShowLeaveConfirm(false)}
      />

    </div>
  )
}
