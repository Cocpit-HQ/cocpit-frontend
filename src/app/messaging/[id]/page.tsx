"use client";

import { useParams, useRouter } from 'next/navigation'
import type { Page } from "@/types/common"
import { AppShell } from '@/components/layout/AppShell'
import { useIsMobile } from "@/hooks/use-mobile"
import ChatWindow from '@/components/messaging/ui/ChatWindow';
import ChatList from '@/components/messaging/ui/ChatList';
import { mockChats } from '@/data/mockMessaging';

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
    const isMobile = useIsMobile();

    const chatId = params.id;
    const chat = mockChats.find(c => c.id.toString() === chatId);

    const navigateTo = (page: Page) => {
        router.push(routes[page] ?? "/feed")
    }

    // If chat not found, redirect or show error
    if (!chat) {
         return (
            <div className="min-h-screen bg-background">
                <AppShell currentPage="messaging" navigateTo={navigateTo}>
                    <div className="flex items-center justify-center h-full">
                        <p>Chat not found.</p>
                    </div>
                </AppShell>
            </div>
        )
    }

    // On mobile, show full screen chat window
    if (isMobile) {
        return (
             <div className="h-dvh flex flex-col bg-background">
                <ChatWindow chat={chat} isMobile={true} />
            </div>
        )
    }

    // On desktop, show the same split view as the main page, but with the specific chat selected
    return (
        <div className="min-h-screen bg-background">
            <AppShell currentPage="messaging" navigateTo={navigateTo}>
                <div className="max-w-7xl mx-auto px-0 md:px-4 md:py-6 pb-20 md:pb-10 h-full">
                <div
                    className="bg-card border border-border md:rounded-lg overflow-hidden h-full"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                        <ChatList
                            chats={mockChats}
                            selectedChatId={chat.id}
                            onSelectChat={(c) => router.push(`/messaging/${c.id}`)}
                            isMobile={false}
                        />
                        <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
                            <ChatWindow chat={chat} isMobile={false} />
                        </div>
                    </div>
                </div>
                </div>
            </AppShell>
        </div>
    )
}
