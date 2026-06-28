"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SocketProvider } from "@/context/SocketContext";
import { SocialProvider } from "@/context/SocialContext";
import { StoriesProvider } from "@/context/StoriesContext";
import { GlobalUploadProgress } from "@/components/ui/GlobalUploadProgress";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui.store";
import { FeedCreatePostModal } from "@/features/create-post/components/FeedCreatePostModal";
import { useNavigationTracker } from "@/hooks/use-navigation-memory";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useNavigationTracker();
    const pathname = usePathname();
    const isFeedRoute = pathname?.startsWith("/feed") ?? false;
    const { activeModal, setActiveModal, initialPostType } = useUIStore();

    return (
        <SocketProvider>
            <SocialProvider>
                <StoriesProvider enabled={isFeedRoute}>
                    <AppShell>{children}</AppShell>
                    <GlobalUploadProgress />
                    
                    <FeedCreatePostModal
                        isOpen={activeModal === 'create-post'}
                        onClose={() => setActiveModal(null)}
                        initialPostType={initialPostType}
                    />
                </StoriesProvider>
            </SocialProvider>
        </SocketProvider>
    );
}
