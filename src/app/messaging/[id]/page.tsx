"use client";

import { useParams, useRouter } from 'next/navigation'
import ConversationView from '@/components/messaging/ConversationView'
import type { ChatThread } from "@/types/messaging"
import type { Page } from "@/types/common"
import { AppShell } from '@/components/layout/AppShell'
import { useTheme } from 'next-themes'
import { useMemo } from 'react';

// This would in reality be an API call
const chats: ChatThread[] = [
  { id: 1, name: "Michael Chen", lastMessage: "Thanks for connecting! Looking forward to chatting.", time: "2m ago", unread: 2, avatar: "gradient-1", online: true },
  { id: 2, name: "Emily Rodriguez", lastMessage: "That sounds great! When would be a good time?", time: "1h ago", unread: 0, avatar: "gradient-2", online: true },
  { id: 3, name: "David Park", lastMessage: "I saw your recent post about AI trends...", time: "3h ago", unread: 1, avatar: "gradient-3", online: false },
  { id: 4, name: "Jessica Williams", lastMessage: "Happy to help with that project!", time: "1d ago", unread: 0, avatar: "gradient-4", online: false },
  { id: 5, name: "Alex Thompson", lastMessage: "Let me know if you need anything else.", time: "2d ago", unread: 0, avatar: "gradient-5", online: false },
]

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

export default function ConversationPage() {
    const params = useParams();
    const router = useRouter()
    const { resolvedTheme } = useTheme();
    const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme]);
    const chatId = params.id;
    const chat = chats.find(c => c.id.toString() === chatId);

    const navigateTo = (page: Page) => {
        router.push(routes[page] ?? "/feed")
    }

    if (!chat) {
        return (
            <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
                <AppShell currentPage="messaging" navigateTo={navigateTo}>
                    <div className="flex items-center justify-center h-full">
                        <p>Chat not found.</p>
                    </div>
                </AppShell>
            </div>
        )
    }

    return (
        <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
            <AppShell currentPage="messaging" navigateTo={navigateTo}>
                <div 
                  className={`${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} rounded-lg border overflow-hidden`}
                  style={{ height: "calc(100vh - 80px)" }}
                >
                    <ConversationView chat={chat} isMobileOnly={true} />
                </div>
            </AppShell>
        </div>
    )
}
