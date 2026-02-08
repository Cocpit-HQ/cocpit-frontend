"use client"

import React, { useState, useEffect, useRef } from "react"
import { MoreHorizontal, Phone, Video } from "lucide-react"
import { ChatThread, Message } from "@/types/messaging"
import { avatarGradients } from "@/constants/messaging"
import MessageList from "./MessageList"
import ChatInput from "./ChatInput"
import MobileChatHeader from "./MobileChatHeader"
import { useSocket } from "@/context/SocketContext"
import { useSession } from "next-auth/react"
import { SocketMessage, TypingPayload } from "@/types/socket"
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from "@tanstack/react-query"
import { getMessages, sendMessage, markAsRead, editMessage } from "@/services/api/messaging"
import { sendMessage as sendGroupMessage } from "@/services/api/group-chat"
import { mapBackendMessageToMessage } from "@/lib/mappers/messaging.mapper"
import Avatar from "@/components/shared/Avatar"
import { useSocial } from "@/context/SocialContext"
import MessageInfoModal from "../MessageInfoModal"
import { Button } from "@/components/ui/button"
import { X, Copy, Pencil, Info as InfoIcon, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteMessageModal } from "./DeleteMessageModal"
import { deleteMessage } from "@/services/api/messaging"
import { Trash2 } from "lucide-react"

interface ChatWindowProps {
  chat: ChatThread
  isMobile: boolean
  onBack?: () => void
}

const getAvatarGradient = (avatar: string) => {
  return avatarGradients[avatar] || "from-gray-400 to-gray-500";
}

function ChatHeaderMenu({ selectedMessage, onMessageAction, currentUserId }: { selectedMessage: Message, onMessageAction: (action: string) => void, currentUserId: string }) {
  const isMyMessage = selectedMessage.sender === 'me' || selectedMessage.senderId === currentUserId;

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
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [typingMap, setTypingMap] = useState<Map<string, string>>(new Map());

  const isBlockedByMe = initialChat.otherUserId ? isBlocked(initialChat.otherUserId) : false;
  const isBlockedByOther = initialChat.isBlockedByOther;

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
      const backendMessages = await getMessages(chat.id, 50, pageParam);
      return backendMessages.map(m => mapBackendMessageToMessage(m, session?.user?.id));
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 50) return undefined;
      return lastPage[0]?.created_at; // Oldest message in the current batch
    },
    initialPageParam: null as string | null,
    enabled: !!chat.id && chat.id !== 'new' && !!session?.user?.id,
    staleTime: Infinity, // Keep messages fresh since we handle updates via socket
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
    setTypingMap(new Map());

    if (chat.id && chat.unread > 0) {
      markAsRead(chat.id).then(() => {
        // Optimistically update conversation unread count
        queryClient.setQueryData(['conversations'], (oldChats: ChatThread[] | undefined) => {
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
      const uiMessage = mapBackendMessageToMessage(msg as any, session?.user?.id);

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
          // Remove the message
          const newPages = old.pages.map(page => page.filter(m => m.id !== payload.messageId));
          return { ...old, pages: newPages };
        } else {
          // Update the message content
          const newPages = old.pages.map(page => page.map(m => {
            if (m.id === payload.messageId) {
              return {
                ...m,
                text: "🚫 This message was deleted",
                text_content: "🚫 This message was deleted",
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
    mutationFn: async (text: string) => {
      if (chat.isGroup) {
        return sendGroupMessage(chat.id, text);
      }

      if (!chat.otherUserId) throw new Error("Target user ID missing");
      return sendMessage(chat.otherUserId, text);
    },
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chat.id] });
      const previousMessages = queryClient.getQueryData(['messages', chat.id]);

      // Optimistic update
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
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['messages', chat.id], context?.previousMessages);
      console.error("Failed to send message", err);
    },
    onSuccess: (data, variables, context) => {
      // Clear typing indicator immediately on send
      setTypingMap(new Map());
      setTypingUser(null);

      queryClient.setQueryData(['messages', chat.id], (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return old;

        const realMessage = mapBackendMessageToMessage(data.data, session?.user?.id);

        // Find and replace in the first page
        const newPages = [...old.pages];
        newPages[0] = newPages[0].map(m => m.id === context.tempId ? realMessage : m);

        return { ...old, pages: newPages };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSendMessage = (text: string) => {
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

    sendMessageMutation.mutate(text);
  }

  const handleTypingInput = () => {
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
  }

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
    typingDisplayString = typingUser ? `${typingUser} is typing...` : null;
  }

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMessageInfoOpen, setIsMessageInfoOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // Deletion Logic
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  const handleDeleteForMe = async () => {
    if (!messageToDelete) return;
    try {
      await deleteMessage(messageToDelete.id, false);
      // Optimistic update handled by socket or query invalidation
      // For immediate feeling, we could update cache, but socket "message_deleted" for "me" should arrive fast.
    } catch (error) {
      console.error("Failed to delete message", error);
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

  return (
    <div className={`flex flex-col h-full ${isMobile ? "h-dvh bg-background" : ""}`}>
      {isMobile ? (
        <MobileChatHeader
          chat={chat}
          onBack={onBack!}
          selectedMessage={selectedMessage}
          onMessageAction={(action) => handleMessageActionWithMsg(action)}
          currentUserId={session?.user?.id || ""}
        />
      ) : (
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!selectedMessage ? (
            <>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar
                  url={chat.avatar}
                  name={chat.name}
                  size="md"
                  online={chat.online}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate">{chat.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {chat.role ? chat.role : chat.online ? "Active now" : (chat.isGroup ? `${chat.unread} messages` : "Offline")}
                  </p>
                </div>
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

      {chat.pinnedContext && (
        <div className="px-4 py-2 text-xs text-center font-medium bg-primary/20 text-primary">
          Context: {chat.pinnedContext}
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading messages...</div>
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
        />
      )}

      {typingDisplayString && !isBlockedByMe && !isBlockedByOther && (
        <div className="px-4 py-2 text-xs text-muted-foreground italic">
          {typingDisplayString}
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
        <ChatInput
          onSendMessage={handleSendMessage}
          onTyping={handleTypingInput}
          disabled={(!chat.otherUserId && !chat.isGroup) || !!isBlockedByOther}
          disabledMessage={isBlockedByOther ? "User not found" : undefined}
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
    </div>
  )
}
