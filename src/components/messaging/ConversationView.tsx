"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Phone, Video, MoreHorizontal, Send, Smile, Paperclip, Image as ImageIcon, ArrowLeft } from "lucide-react"

import type { ChatThread, Message } from "@/types/messaging"

const messagesSeed: Message[] = [
  { id: "1", sender: "other", text: "Hi! Thanks for accepting my connection request!", time: "10:30 AM" },
  { id: "2", sender: "me", text: "Of course! I saw your profile and we have a lot in common.", time: "10:32 AM" },
  { id: "3", sender: "other", text: "Yes! I noticed you work in product design. I've been following your work.", time: "10:33 AM" },
  { id: "4", sender: "me", text: "That's so nice of you to say! What are you working on currently?", time: "10:35 AM" },
  { id: "5", sender: "other", text: "I'm leading a new initiative at Google focused on AI-powered design tools.", time: "10:36 AM" },
  { id: "6", sender: "other", text: "Would love to get your thoughts on it sometime!", time: "10:36 AM" },
]

const avatarGradients: Record<string, string> = {
  "gradient-1": "from-blue-400 to-cyan-400",
  "gradient-2": "from-pink-400 to-rose-400",
  "gradient-3": "from-purple-400 to-indigo-400",
  "gradient-4": "from-green-400 to-emerald-400",
  "gradient-5": "from-orange-400 to-amber-400",
}

interface ConversationViewProps {
    chat: ChatThread;
    isMobileOnly: boolean;
}

export default function ConversationView({ chat, isMobileOnly }: ConversationViewProps) {
    const router = useRouter();
    // Removed useTheme
    
    const [messageText, setMessageText] = useState("")
    const [messages, setMessages] = useState<Message[]>(messagesSeed)

    const handleSendMessage = () => {
        if (messageText.trim()) {
        const next: Message = {
            id: (messages.length + 1).toString(),
            sender: "me",
            text: messageText.trim(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
        setMessages((prev) => [...prev, next])
        setMessageText("")
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                {isMobileOnly && <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-5 h-5" />
                </button>}
                <div className="relative">
                    <div className={`w-10 h-10 bg-gradient-to-br ${avatarGradients[chat.avatar]} rounded-full`} />
                    {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">{chat.name}</h3>
                    <p className="text-xs text-muted-foreground">{chat.online ? "Active now" : "Offline"}</p>
                </div>
                </div>
                <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <Video className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] ${message.sender === "me" ? "order-2" : "order-1"}`}>
                    <div
                        className={`px-4 py-2 rounded-2xl ${
                        message.sender === "me"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                    >
                        <p>{message.text}</p>
                    </div>
                    <p className="text-xs mt-1 px-2 text-muted-foreground">{message.time}</p>
                    </div>
                </div>
                ))}
            </div>

            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <Paperclip className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <ImageIcon className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <Smile className="w-5 h-5" />
                </button>
                <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Write a message..."
                    className="flex-1 px-4 py-2 bg-muted text-foreground placeholder-muted-foreground border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                    onClick={handleSendMessage}
                    className="p-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
                </div>
            </div>
        </div>
    );
}
