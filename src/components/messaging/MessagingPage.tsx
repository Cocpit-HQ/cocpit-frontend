"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Search } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import type { Page } from "@/types/common"
import type { ChatThread } from "@/types/messaging"
import { useIsMobile } from "@/hooks/use-mobile"
import ConversationView from "./ConversationView"

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

const avatarGradients: Record<string, string> = {
  "gradient-1": "from-blue-400 to-cyan-400",
  "gradient-2": "from-pink-400 to-rose-400",
  "gradient-3": "from-purple-400 to-indigo-400",
  "gradient-4": "from-green-400 to-emerald-400",
  "gradient-5": "from-orange-400 to-amber-400",
}

export default function MessagingPage() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme])
  const isMobile = useIsMobile()

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const [selectedChat, setSelectedChat] = useState<ChatThread>(chats[0])

  const ChatList = () => (
    <div className={`border-r ${isDark ? "border-[#2d3548]" : "border-gray-200"} flex flex-col h-full`}>
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
        {chats.map((chat) => {
          const chatItemContent = (
            <div className={`p-4 cursor-pointer ${
                isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-50"
            } transition-colors border-b ${isDark ? "border-[#2d3548]" : "border-gray-200"} ${
                !isMobile && selectedChat.id === chat.id ? (isDark ? "bg-[#2d3548]" : "bg-[#EAF4FF]") : ""
            }`}>
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
          );

          if (isMobile) {
            return <Link href={`/messaging/${chat.id}`} key={chat.id}>{chatItemContent}</Link>
          }

          return (
            <div key={chat.id} onClick={() => setSelectedChat(chat)}>
              {chatItemContent}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
      <AppShell currentPage="messaging" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto px-0 md:px-4 md:py-6 pb-20 md:pb-10 h-full">
          <div
            className={`${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} md:rounded-lg md:border overflow-hidden h-full`}
          >
          {isMobile ? <ChatList /> : (
            <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                <ChatList />
                <div className="md:col-span-2 flex flex-col">
                    {selectedChat && <ConversationView chat={selectedChat} isMobileOnly={false} />}
                </div>
            </div>
          )}
          </div>
        </div>
      </AppShell>
    </div>
  )
}

