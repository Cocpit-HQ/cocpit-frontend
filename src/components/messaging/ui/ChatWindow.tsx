"use client"

import React, { useState, useEffect, useRef } from "react"
import { MoreHorizontal, Phone, Video } from "lucide-react"
import { ChatThread, Message } from "@/types/messaging"
import { avatarGradients, mockMessages } from "@/data/mockMessaging"
import MessageList from "./MessageList"
import ChatInput from "./ChatInput"
import MobileChatHeader from "./MobileChatHeader"
import { useSocket } from "@/context/SocketContext"
import { useSession } from "next-auth/react"
import { SocketMessage, TypingPayload } from "@/types/socket"

interface ChatWindowProps {
  chat: ChatThread
  isMobile: boolean
}

export default function ChatWindow({ chat, isMobile }: ChatWindowProps) {
  // Local state for messages to allow adding new ones
  const [messages, setMessages] = useState<Message[]>(mockMessages[chat.id] || [])
  const { socket } = useSocket();
  const { data: session } = useSession();
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);

  useEffect(() => {
    if (!socket || !chat) return;

    // Join the conversation room
    socket.emit('joinConversation', { conversationId: chat.id.toString() });

    const handleNewMessage = (msg: SocketMessage) => {
        // Map SocketMessage to UI Message
        const isMe = msg.sender_id === session?.user?.id;
        const uiMessage: Message = {
            id: msg.message_id, // Assuming string ID is handled by updated Message type
            sender: isMe ? "me" : "other",
            text: msg.text_content,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => {
             // Simple duplicate check based on ID if possible, or text/time
             if (prev.some(m => m.id === uiMessage.id)) return prev;
             return [...prev, uiMessage];
        });
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

    socket.on('newMessage', handleNewMessage);
    socket.on('isTyping', handleTyping);
    socket.on('stoppedTyping', handleStopTyping);

    return () => {
        socket.off('newMessage', handleNewMessage);
        socket.off('isTyping', handleTyping);
        socket.off('stoppedTyping', handleStopTyping);
        // Leave room logic? Socket.io handles it on disconnect, but we might want to emit 'leaveConversation' if implemented.
        // Guide says: "explicit leaveConversation is not implemented/needed on backend"
    };
  }, [socket, chat, session?.user?.id]);

  const handleSendMessage = (text: string) => {
    // Optimistic update
    const newMessage: Message = {
      id: Date.now(),
      sender: "me",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, newMessage])

    // TODO: Call API to send message
    // api.post('/messages', { conversationId: chat.id, text });
  }

  const handleTypingInput = () => {
    if (!socket || !chat) return;

    const now = Date.now();
    // Throttle typing event to every 2 seconds
    if (now - lastTypingRef.current > 2000) {
        socket.emit('typing', { conversationId: chat.id.toString() });
        lastTypingRef.current = now;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { conversationId: chat.id.toString() });
    }, 3000);
  }

  return (
    <div className={`flex flex-col h-full ${isMobile ? "h-dvh bg-background" : ""}`}>
      {isMobile ? (
        <MobileChatHeader chat={chat} />
      ) : (
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 bg-gradient-to-br ${avatarGradients[chat.avatar]} rounded-full`} />
              {chat.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{chat.name}</h3>
              <p className="text-xs text-muted-foreground">
                {chat.role ? chat.role : chat.online ? "Active now" : "Offline"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
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

      <MessageList messages={messages} />

      {typingUser && (
          <div className="px-4 py-2 text-xs text-muted-foreground italic">
              {typingUser} is typing...
          </div>
      )}

      <ChatInput onSendMessage={handleSendMessage} onTyping={handleTypingInput} />
    </div>
  )
}
