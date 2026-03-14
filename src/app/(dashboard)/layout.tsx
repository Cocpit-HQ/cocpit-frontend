"use client";

import { AppShell } from "@/components/layout/AppShell";
import { DashboardActorGate } from "@/components/layout/DashboardActorGate";
import { ActiveProfileProvider } from "@/context/ActiveProfileContext";
import { SocketProvider } from "@/context/SocketContext";
import { FeedProvider } from "@/context/FeedContext";
import { ActionModalProvider } from "@/context/ActionModalContext";
import { PostUploadProvider } from "@/context/PostUploadContext";
import { JobsProvider } from "@/context/JobsContext";
import { GlobalUploadProgress } from "@/components/ui/GlobalUploadProgress";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ActiveProfileProvider>
            <DashboardActorGate>
                <SocketProvider>
                    <JobsProvider enableInitialFetch={false}>
                        <FeedProvider enableInitialFetch={false}>
                            <PostUploadProvider>
                                <ActionModalProvider>
                                    <AppShell>{children}</AppShell>
                                    <GlobalUploadProgress />
                                </ActionModalProvider>
                            </PostUploadProvider>
                        </FeedProvider>
                    </JobsProvider>
                </SocketProvider>
            </DashboardActorGate>
        </ActiveProfileProvider>
    );
}

