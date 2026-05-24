"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SocketProvider } from "@/context/SocketContext";
import { SocialProvider } from "@/context/SocialContext";
import { StoriesProvider } from "@/context/StoriesContext";
import { JobsProvider } from "@/context/JobsContext";
import { GlobalUploadProgress } from "@/components/ui/GlobalUploadProgress";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui.store";
import { FeedCreatePostModal } from "@/features/create-post/components/FeedCreatePostModal";
import MobileCreateMenu from "@/components/home/MobileCreateMenu";
import { useNavigationTracker } from "@/hooks/use-navigation-memory";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useNavigationTracker();
    const pathname = usePathname();
    const isFeedRoute = pathname?.startsWith("/feed") ?? false;
    const { activeModal, setActiveModal, isOptionsOpen, setOptionsOpen, initialPostType } = useUIStore();

    return (
        <SocketProvider>
            <SocialProvider>
                <StoriesProvider enabled={isFeedRoute}>
                    <JobsProvider>
                        <AppShell>{children}</AppShell>
                        <GlobalUploadProgress />
                        
                        <MobileCreateMenu
                            open={isOptionsOpen}
                            onOpenChange={setOptionsOpen}
                            onOptionClick={(type) => {
                                setOptionsOpen(false);
                                if (type === 'article') {
                                    useUIStore.getState().setArticleMode(true);
                                } else {
                                    setActiveModal('create-post', type);
                                }
                            }}
                        />
                        <FeedCreatePostModal
                            isOpen={activeModal === 'create-post'}
                            onClose={() => setActiveModal(null)}
                            initialPostType={initialPostType}
                        />
                    </JobsProvider>
                </StoriesProvider>
            </SocialProvider>
        </SocketProvider>
    );
}
