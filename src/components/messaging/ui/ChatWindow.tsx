"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { MoreHorizontal, Phone, Video } from "lucide-react"
import { ChatThread, Message } from "@/types/messaging"
import { avatarGradients } from "@/constants/messaging"
import MessageList from "./MessageList"
import UnifiedMessageInput from "./UnifiedMessageInput"
import MobileChatHeader from "./MobileChatHeader"
import { useSocket } from "@/context/SocketContext"
import { useSession } from "next-auth/react"
import { SocketMessage, TypingPayload } from "@/types/socket"
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from "@tanstack/react-query"
import { getMessages, sendMessage, markAsRead, editMessage } from "@/services/api/messaging"
import { sendMessage as sendGroupMessage, getGroupDetails } from "@/services/api/group-chat"
import { GroupMember } from "@/types/group-chat"
import { mapBackendMessageToMessage } from "@/lib/mappers/messaging.mapper"
import Avatar from "@/components/shared/Avatar"
import { useSocial } from "@/context/SocialContext"
import MessageInfoModal from "../MessageInfoModal"
import { Button } from "@/components/ui/button"
import { X, Copy, Pencil, Info as InfoIcon, MoreVertical } from "lucide-react"
import { Plus } from "lucide-react"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteMessageModal } from "./DeleteMessageModal"
import { deleteMessage } from "@/services/api/messaging"
import { Trash2 } from "lucide-react"
import MediaPreviewModal from "./MediaPreviewModal"
import ChatSkeleton from "./ChatSkeleton"
import { useChatSession } from "@/components/messaging/hooks/use-chat-session"
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

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="font-medium text-foreground">1 Selected</div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => onMessageAction('close')} title="Close Selection">
          <X className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onMessageAction('copy')}>
              <Copy className="w-4 h-4 mr-2" /> Copy
            </DropdownMenuItem>
            {isMyMessage && (
              <>
                <DropdownMenuItem onClick={() => onMessageAction('info')}>
                  <InfoIcon className="w-4 h-4 mr-2" /> Info
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMessageAction('edit')}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMessageAction('delete')} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export default function ChatWindow({ chat: initialChat, isMobile, onBack }: ChatWindowProps) {
  const { socket, isUserOnline, setActiveConversationId } = useSocket();
  const { unblockUser, isBlocked } = useSocial();
  const { data: session } = useSession();
  const { activeProfile } = useActiveProfile();
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [typingMap, setTypingMap] = useState<Map<string, string>>(new Map());

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

  const handleUnblock = async () => {
    if (!chat.otherUserId) return;
    await unblockUser(chat.otherUserId);
    queryClient.invalidateQueries({ queryKey: ['messages', chat.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
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

    socket.on('new_message', handleNewMessage);
    socket.on('isTyping', handleTyping);
    socket.on('stoppedTyping', handleStopTyping);
    socket.on('messages_seen', handleMessagesSeen);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('isTyping', handleTyping);
      socket.off('stoppedTyping', handleStopTyping);
      socket.off('messages_seen', handleMessagesSeen);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, chat.id, chat.isGroup, session?.user?.id, queryClient]); // Depend only on chat.id, not the full chat object

  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, files }: { text: string, files: File[] }) => {
      if (chat.isGroup) {
        return sendGroupMessage(chat.id, text, 'text', files);
      }

      if (!chat.otherUserId) throw new Error("Target user ID missing");
      return sendMessage(chat.otherUserId, text, undefined, files, activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined);
    },
    onMutate: async ({ text, files }) => {
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
        media: tempMedia
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

    sendMessageMutation.mutate({ text, files });
  }, [chat.otherUserId, chat.isGroup, chat.id, isBlockedByMe, isBlockedByOther, socket, sendMessageMutation]);

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
    } else {
      setSelectedMessage(message);
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
    } else if (action === 'edit') {
      setEditingMessageId(selectedMessage.id);
      setSelectedMessage(null);
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
    }
  };

  // Improved handler to support direct action from bubble
  const handleMessageActionWithMsg = (action: string, message?: Message) => {
    const targetMsg = message || selectedMessage;
    if (!targetMsg && action !== 'close') return;

    if (action === 'delete') {
      setMessageToDelete(targetMsg);
      setIsDeleteModalOpen(true);
      if (selectedMessage) setSelectedMessage(null);
    } else if (action === 'edit') {
      setEditingMessageId(targetMsg!.id);
      if (selectedMessage) setSelectedMessage(null);
    } else if (action === 'copy') {
      navigator.clipboard.writeText(targetMsg!.text || targetMsg!.text_content || "");
      if (selectedMessage) setSelectedMessage(null);
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
    }
  };

  const handleSaveEdit = (messageId: string, text: string) => {
    editMessageMutation.mutate({ messageId, text });
  };

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
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!selectedMessage ? (
            <>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {chat.isGroup ? (
                   <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar
              url={chat.avatar}
                      name={chat.name}
                      size="md"
                      online={chat.online}
                    />
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-sm font-semibold truncate text-foreground">
                        {chat.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {chat.role ? chat.role : "Group Chat"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={chat.otherUserType === 'COMPANY' ? `/organization/${chat.otherUserSlug || chat.otherUserId}` : `/profile/${chat.otherUserSlug || chat.otherUserId}`}
                    className="flex items-center gap-3 min-w-0 flex-1 group transition-opacity"
                  >
                    <Avatar
                      url={chat.avatar}
                      name={chat.name}
                      size="md"
                      online={chat.online}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate group-hover:underline group-hover:text-primary">{chat.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {chat.role ? chat.role : chat.online ? "Active now" : "Offline"}
                      </p>
                    </div>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button disabled={!!(isBlockedByMe || isBlockedByOther)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground disabled:opacity-50">
                  <Phone className="w-5 h-5" />
                </button>
                <button disabled={!!(isBlockedByMe || isBlockedByOther)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground disabled:opacity-50">
                  <Video className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <ChatHeaderMenu
              selectedMessage={selectedMessage}
              onMessageAction={(action) => handleMessageActionWithMsg(action)}
              currentUserId={session?.user?.id || ""}
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
        />
      )}

      {typingDisplayString && !isBlockedByMe && !isBlockedByOther && (
        <div className="px-4 py-2 text-xs text-muted-foreground italic">
          {typingDisplayString}
        </div>
      )}

      {activeProfile?.type === 'COMPANY' && !isBlockedByMe && !isBlockedByOther && (
        <div className="px-4 py-1 text-xs text-center bg-muted/50 text-muted-foreground border-t border-border">
          Replying as <span className="font-medium text-foreground">{activeProfile.name}</span>
        </div>
      )}

      {isBlockedByMe ? (
        <div className="p-4 border-t bg-muted/30 flex flex-col items-center justify-center gap-2 text-center mt-auto shrink-0">
          <p className="text-sm text-muted-foreground">You have blocked this user</p>
          <button
            onClick={handleUnblock}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-primary/90 transition-colors"
          >
            Unblock to chat
          </button>
        </div>
      ) : (
        <UnifiedMessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTypingInput}
          searchUsersFn={chat.isGroup ? searchGroupMembers : undefined}
          disabled={(!chat.otherUserId && !chat.isGroup) || !!isBlockedByOther || sessionDisabled}
          disabledMessage={
            isBlockedByOther ? "User not found" :
              sessionDisabled && chatSession.session ? `Handled by ${chatSession.session.handler_name_snapshot}` :
                sessionDisabled ? "Claim this conversation to reply" :
                  undefined
          }
          placeholder={sessionDisabled ? "Claim to start typing..." : "Type a message..."}
        />
      )}

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
    </div>
  )
}
