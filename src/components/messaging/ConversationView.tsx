"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Phone, Video, MoreHorizontal, Send, Smile, Paperclip, Image as ImageIcon, ArrowLeft } from "lucide-react"

import type { ChatThread, Message } from "@/types/messaging"

const messagesSeed: Message[] = [
  { id: 1, sender: "other", text: "Hi! Thanks for accepting my connection request!", time: "10:30 AM" },
  { id: 2, sender: "me", text: "Of course! I saw your profile and we have a lot in common.", time: "10:32 AM" },
  { id: 3, sender: "other", text: "Yes! I noticed you work in product design. I've been following your work.", time: "10:33 AM" },
  { id: 4, sender: "me", text: "That's so nice of you to say! What are you working on currently?", time: "10:35 AM" },
  { id: 5, sender: "other", text: "I'm leading a new initiative at Google focused on AI-powered design tools.", time: "10:36 AM" },
  { id: 6, sender: "other", text: "Would love to get your thoughts on it sometime!", time: "10:36 AM" },
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
    const { resolvedTheme } = useTheme();
    const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme]);
    
    const [messageText, setMessageText] = useState("")
    const [messages, setMessages] = useState<Message[]>(messagesSeed)

    const handleSendMessage = () => {
        if (messageText.trim()) {
        const next: Message = {
            id: messages.length + 1,
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
            <div className={`p-4 border-b ${isDark ? "border-[#2d3548]" : "border-gray-200"} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                {isMobileOnly && <button onClick={() => router.back()} className={`p-2 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
                    <ArrowLeft className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                </button>}
                <div className="relative">
                    <div className={`w-10 h-10 bg-gradient-to-br ${avatarGradients[chat.avatar]} rounded-full`} />
                    {chat.online && (
                    <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 ${isDark ? "border-[#242b3d]" : "border-white"}`} />
                    )}
                </div>
                <div>
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{chat.name}</h3>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>{chat.online ? "Active now" : "Offline"}</p>
                </div>
                </div>
                <div className="flex items-center gap-2">
                <button className={`p-2 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
                    <Phone className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                </button>
                <button className={`p-2 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
                    <Video className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                </button>
                <button className={`p-2 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
                    <MoreHorizontal className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
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
                            ? "bg-[#5B7CFF] text-white"
                            : isDark
                            ? "bg-[#1e2535] text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                    >
                        <p>{message.text}</p>
                    </div>
                    <p className={`text-xs mt-1 px-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>{message.time}</p>
                    </div>
                </div>
                ))}
            </div>

            <div className={`p-4 border-t ${isDark ? "border-[#2d3548]" : "border-gray-200"}`}>
                <div className="flex items-center gap-2">
                <button className={`p-2 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
                    <Paperclip className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                </button>
                <button className={`p-2 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
                    <ImageIcon className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                </button>
                <button className={`p-2 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
                    <Smile className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                </button>
                <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Write a message..."
                    className={`flex-1 px-4 py-2 ${
                    isDark ? "bg-[#1e2535] text-white placeholder-gray-400" : "bg-gray-100 text-gray-900 placeholder-gray-500"
                    } border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5B7CFF]`}
                />
                <button
                    onClick={handleSendMessage}
                    className="p-2 bg-[#5B7CFF] text-white rounded-full hover:bg-[#4A6BEF] transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
                </div>
            </div>
        </div>
    );
}
