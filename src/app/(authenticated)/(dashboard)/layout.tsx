"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SocketProvider } from "@/context/SocketContext";
import { SocialProvider } from "@/context/SocialContext";
import { StoriesProvider } from "@/context/StoriesContext";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui.store";
import { MobileCreatePostModal } from "@/features/feed/components/create-post";
import { EditPostModal } from "@/shared/commonComponents/EditPostModal";
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
    const isEditMode = useUIStore(state => state.isEditMode);
    const editingPostId = useUIStore(state => state.editingPostId);
    const editingPostData = useUIStore(state => state.editingPostData);

    // Check if we are on mobile using window.innerWidth or just render it and use CSS to hide it?
    // The MobileCreatePostModal is a full-screen mobile modal, but we can just render it conditionally.
    // However, it's better to render it always when activeModal is 'create-post' 
    // and rely on CSS or matchMedia if we wanted to restrict to mobile. 
    // But since the + button is only on mobile, it will only trigger on mobile anyway.

    return (
        <SocketProvider>
            <SocialProvider>
                {/* StoriesProvider disabled on feed as story rail is not shown on feed */}
                {/* <StoriesProvider enabled={isFeedRoute}> */}
                <StoriesProvider enabled={false}>
                    <AppShell>{children}</AppShell>
                    
                    <MobileCreatePostModal 
                        isOpen={activeModal === 'create-post'} 
                        onClose={() => {
                            setActiveModal(null);
                            useUIStore.getState().setSharedPostData(null);
                            useUIStore.getState().setEditMode(false, null);
                        }}
                        initialSharedPost={useUIStore(state => state.sharedPostData)}
                        editPostId={useUIStore(state => state.editingPostId)}
                    />

                    {/* Fullscreen Edit Post Modal */}
                    <EditPostModal
                        isOpen={isEditMode && !!editingPostId}
                        onClose={() => {
                            useUIStore.getState().setEditMode(false, null, null);
                        }}
                        editPostId={editingPostId || ''}
                        postData={editingPostData}
                    />
                    
                    {/* 
                    <CreatePostModal
                        isOpen={activeModal === 'create-post'}
                        onClose={() => setActiveModal(null)}
                        initialPostType={initialPostType}
                    /> 
                    */}
                </StoriesProvider>
            </SocialProvider>
        </SocketProvider>
    );
}
