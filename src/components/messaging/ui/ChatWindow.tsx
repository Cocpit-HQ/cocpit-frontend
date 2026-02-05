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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getMessages, sendMessage, markAsRead } from "@/services/api/messaging"
import { mapBackendMessageToMessage } from "@/lib/mappers/messaging.mapper"
import Avatar from "@/components/shared/Avatar"
import { useSocial } from "@/context/SocialContext"

interface ChatWindowProps {
  chat: ChatThread
  isMobile: boolean
  onBack?: () => void
}

const getAvatarGradient = (avatar: string) => {
  return avatarGradients[avatar] || "from-gray-400 to-gray-500";
}

export default function ChatWindow({ chat: initialChat, isMobile, onBack }: ChatWindowProps) {
  const { socket, isUserOnline, setActiveConversationId } = useSocket();
  const { unblockUser, isBlocked } = useSocial();
  const { data: session } = useSession();
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', chat.id],
    queryFn: async () => {
      const backendMessages = await getMessages(chat.id);
      return backendMessages.map(m => mapBackendMessageToMessage(m, session?.user?.id));
    },
    enabled: !!chat.id && chat.id !== 'new' && !!session?.user?.id,
  });

  // Mark as read on mount or when chat.id changes
  useEffect(() => {
    setActiveConversationId(chat.id);

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

    // Join the conversation room
    socket.emit('joinConversation', { conversationId: chat.id.toString() });

    const handleNewMessage = (msg: SocketMessage) => {
      // Only handle messages for this conversation
      if (msg.conversation_id !== chat.id) return;

      const isMe = msg.sender_id === session?.user?.id;

      // Map socket message to frontend entity using valid mapper
      const uiMessage = mapBackendMessageToMessage(msg as any, session?.user?.id);

      queryClient.setQueryData(['messages', chat.id], (old: Message[] | undefined) => {
        const current = old || [];

        // Check if real ID already exists
        if (current.some(m => m.id === uiMessage.id)) return current;

        // If it's my message, check if an optimistic message with same text/time exists
        if (isMe) {
          const optimisticMatch = current.find(m =>
            m.id.startsWith('temp-') &&
            m.text === uiMessage.text
          );
          if (optimisticMatch) {
            // Replace optimistic message with real one
            return current.map(m => m.id === optimisticMatch.id ? uiMessage : m);
          }
        }

        return [...current, uiMessage];
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
        setTypingUser("Someone"); // In a real app, resolve user name from ID
      }
    };

    const handleStopTyping = (payload: TypingPayload) => {
      if (payload.conversationId === chat.id.toString()) {
        setTypingUser(null);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('isTyping', handleTyping);
    socket.on('stoppedTyping', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('isTyping', handleTyping);
      socket.off('stoppedTyping', handleStopTyping);
    };
  }, [socket, chat.id, session?.user?.id, queryClient]); // Depend only on chat.id, not the full chat object

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
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
      };

      queryClient.setQueryData(['messages', chat.id], (old: Message[] | undefined) => {
        return [...(old || []), newMessage];
      });

      return { previousMessages, tempId: newMessage.id };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['messages', chat.id], context?.previousMessages);
      console.error("Failed to send message", err);
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(['messages', chat.id], (old: Message[] | undefined) => {
        const realMessage = mapBackendMessageToMessage(data.data, session?.user?.id);
        const current = old || [];

        if (current.some(m => m.id === realMessage.id)) {
          return current.filter(m => m.id !== context.tempId);
        }
        return current.map(m => m.id === context.tempId ? realMessage : m);
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSendMessage = (text: string) => {
    if (!chat.otherUserId || isBlockedByMe || isBlockedByOther) {
      return;
    }
    sendMessageMutation.mutate(text);
  }

  const handleTypingInput = () => {
    if (!socket || !chat) return;

    const now = Date.now();
    if (now - lastTypingRef.current > 2000) {
      socket.emit('typing', { conversationId: chat.id.toString() });
      lastTypingRef.current = now;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { conversationId: chat.id.toString() });
    }, 3000);
  }

  return (
    <div className={`flex flex-col h-full ${isMobile ? "h-dvh bg-background" : ""}`}>
      {isMobile ? (
        <MobileChatHeader chat={chat} onBack={onBack!} />
      ) : (
        <div className="p-4 border-b border-border flex items-center justify-between">
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
                {chat.role ? chat.role : chat.online ? "Active now" : "Offline"}
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
            <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
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
        <MessageList messages={messages} />
      )}

      {typingUser && !isBlockedByMe && !isBlockedByOther && (
        <div className="px-4 py-2 text-xs text-muted-foreground italic">
          {typingUser} is typing...
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
          disabled={!chat.otherUserId || !!isBlockedByOther}
          disabledMessage={isBlockedByOther ? "User not found" : undefined}
        />
      )}
    </div>
  )
}
