"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Search, Phone, Video, MoreHorizontal, Send, Smile, Paperclip, Image as ImageIcon, ArrowLeft } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import type { Page, Theme } from "@/types/common"
import type { ChatThread, Message } from "@/types/messaging"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
  achievements: "/achievements",
  messaging: "/messaging",
}

const chats: ChatThread[] = [
  { id: 1, name: "Michael Chen", lastMessage: "Thanks for connecting! Looking forward to chatting.", time: "2m ago", unread: 2, avatar: "gradient-1", online: true },
  { id: 2, name: "Emily Rodriguez", lastMessage: "That sounds great! When would be a good time?", time: "1h ago", unread: 0, avatar: "gradient-2", online: true },
  { id: 3, name: "David Park", lastMessage: "I saw your recent post about AI trends...", time: "3h ago", unread: 1, avatar: "gradient-3", online: false },
  { id: 4, name: "Jessica Williams", lastMessage: "Happy to help with that project!", time: "1d ago", unread: 0, avatar: "gradient-4", online: false },
  { id: 5, name: "Alex Thompson", lastMessage: "Let me know if you need anything else.", time: "2d ago", unread: 0, avatar: "gradient-5", online: false },
]

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

export default function MessagingPage() {
  const router = useRouter()
  const { resolvedTheme, theme } = useTheme()
  const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme])

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const [selectedChat, setSelectedChat] = useState<ChatThread | null>(chats[0])
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
    <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
      <AppShell currentPage="messaging" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto h-full flex flex-col p-4 md:p-6">
          <div
            className={`${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} rounded-lg border overflow-hidden flex-1 flex`}
          >
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Chat List */}
            <div className={`border-r ${isDark ? "border-[#2d3548]" : "border-gray-200"} ${selectedChat ? 'hidden md:flex' : 'flex'} flex-col`}>
              <div className={`p-4 border-b ${isDark ? "border-[#2d3548]" : "border-gray-200"}`}>
                <h2 className={`mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>Messages</h2>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className={`w-full pl-10 pr-4 py-2 ${
                      isDark ? "bg-[#1e2535] text-white placeholder-gray-400" : "bg-gray-100 text-gray-900 placeholder-gray-500"
                    } border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B7CFF]`}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 cursor-pointer ${
                      isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-50"
                    } transition-colors border-b ${isDark ? "border-[#2d3548]" : "border-gray-200"} ${
                      selectedChat?.id === chat.id ? (isDark ? "bg-[#2d3548]" : "bg-[#EAF4FF]") : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="relative">
                        <div className={`w-12 h-12 bg-gradient-to-br ${avatarGradients[chat.avatar]} rounded-full flex-shrink-0`} />
                        {chat.online && (
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 ${
                              isDark ? "border-[#242b3d]" : "border-white"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{chat.name}</h3>
                          <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>{chat.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}>{chat.lastMessage}</p>
                          {chat.unread > 0 && (
                            <span className="ml-2 bg-[#5B7CFF] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {chat.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            {selectedChat && (
            <div className={`md:col-span-2 ${selectedChat ? 'flex' : 'hidden'} md:flex flex-col`}>
              <div className={`p-4 border-b ${isDark ? "border-[#2d3548]" : "border-gray-200"} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedChat(null)} className={`p-2 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors md:hidden`}>
                    <ArrowLeft className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                  </button>
                  <div className="relative">
                    <div className={`w-10 h-10 bg-gradient-to-br ${avatarGradients[selectedChat.avatar]} rounded-full`} />
                    {selectedChat.online && (
                      <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 ${isDark ? "border-[#242b3d]" : "border-white"}`} />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{selectedChat.name}</h3>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>{selectedChat.online ? "Active now" : "Offline"}</p>
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

              <div className={`px-4 py-2 border-t ${isDark ? "border-[#2d3548]" : "border-gray-200"}`}>
                <div className="flex items-center gap-2">
                  <button className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
                    <Paperclip className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                  </button>
                  <button className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
                    <ImageIcon className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                  </button>
                  <button className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
                    <Smile className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                  </button>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Write a message..."
                    className={`h-9 flex-1 px-4 ${
                      isDark ? "bg-[#1e2535] text-white placeholder-gray-400" : "bg-gray-100 text-gray-900 placeholder-gray-500"
                    } border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5B7CFF]`}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="w-9 h-9 flex items-center justify-center flex-shrink-0 bg-[#5B7CFF] text-white rounded-full hover:bg-[#4A6BEF] transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}

