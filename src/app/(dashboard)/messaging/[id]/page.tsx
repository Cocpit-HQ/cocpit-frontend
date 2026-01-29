"use client";

import { useParams, useRouter } from 'next/navigation'
import type { Page } from "@/types/common"
import { AppShell } from '@/components/layout/AppShell'
import { useIsMobile } from "@/hooks/use-mobile"
import ChatWindow from '@/components/messaging/ui/ChatWindow';
import ChatList from '@/components/messaging/ui/ChatList';
import { useQuery } from '@tanstack/react-query';
import { getConversations } from '@/services/api/messaging';
import { mapBackendChatToChatThread } from '@/lib/mappers/messaging.mapper';

const routes: Record<string, string> = {
    home: "/feed",
    network: "/showcase",
    events: "/events",
    profile: "/profile",
    settings: "/settings",
    jobs: "/jobs",
    analytics: "/analytics",
    messaging: "/messaging",
}

export default function ConversationPage() {
    const params = useParams();
    const router = useRouter()
    const isMobile = useIsMobile();

    const chatId = params.id as string;

    const { data: chats = [], isLoading, error } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const backendChats = await getConversations();
            return backendChats.map(mapBackendChatToChatThread);
        }
    });

    const chat = chats.find(c => c.id.toString() === chatId);

    const navigateTo = (page: Page) => {
        router.push(routes[page] ?? "/feed")
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Loading chat...</p>
            </div>
        )
    }

    // If chat not found, redirect or show error, or if there's a global error
    if (!chat || error) {
        return (
            <div className="min-h-screen bg-background">
                <div className="flex items-center justify-center h-full">
                    {error ? (
                        <p className="text-red-500">Error loading conversations.</p>
                    ) : (
                        <p>Chat not found.</p>
                    )}
                </div>
            </div>
        )
    }

    // On mobile, show full screen chat window
    if (isMobile) {
        return (
            <div className="h-dvh flex flex-col bg-background">
                <ChatWindow
                    chat={chat}
                    isMobile={true}
                    onBack={() => router.push('/messaging')}
                />
            </div>
        )
    }

    // On desktop, show the same split view as the main page, but with the specific chat selected
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-0 md:px-4 md:py-6 pb-20 md:pb-10 h-full">
                <div
                    className="bg-card border border-border md:rounded-lg overflow-hidden h-full"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                        <ChatList
                            selectedChatId={chat.id}
                            onSelectChat={(c) => router.push(`/messaging/${c.id}`)}
                            isMobile={false}
                            chats={chats}
                            isLoading={isLoading}
                            error={error}
                        />
                        <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
                            <ChatWindow chat={chat} isMobile={false} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
