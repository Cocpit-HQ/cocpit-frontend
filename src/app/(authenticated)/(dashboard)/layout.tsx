"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SocketProvider } from "@/context/SocketContext";
import { SocialProvider } from "@/context/SocialContext";
import { StoriesProvider } from "@/context/StoriesContext";
import { JobsProvider } from "@/context/JobsContext";
import { GlobalUploadProgress } from "@/components/ui/GlobalUploadProgress";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui.store";
import { CreatePostModal } from "@/components/home/CreatePostModal";
import MobileCreateMenu from "@/components/home/MobileCreateMenu";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
                                setActiveModal('create-post', type as any);
                            }}
                        />
                        <CreatePostModal
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
