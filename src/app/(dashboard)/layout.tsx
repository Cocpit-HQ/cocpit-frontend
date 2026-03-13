"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActiveProfileProvider } from "@/context/ActiveProfileContext";
import { SocketProvider } from "@/context/SocketContext";
import { SocialProvider } from "@/context/SocialContext";
import { EventsProvider } from "@/context/EventsContext";
import { FeedProvider } from "@/context/FeedContext";
import { JobsProvider } from "@/context/JobsContext";
import { ActionModalProvider } from "@/context/ActionModalContext";
import { PostUploadProvider } from "@/context/PostUploadContext";
import { GlobalUploadProgress } from "@/components/ui/GlobalUploadProgress";
import { StoriesProvider } from "@/context/StoriesContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ActiveProfileProvider>
            <StoriesProvider>
                <SocketProvider>
                    <SocialProvider>
                        <EventsProvider>
                            <FeedProvider>
                                <PostUploadProvider>
                                    <JobsProvider>
                                        <ActionModalProvider>
                                            <AppShell>{children}</AppShell>
                                            <GlobalUploadProgress />
                                        </ActionModalProvider>
                                    </JobsProvider>
                                </PostUploadProvider>
                            </FeedProvider>
                        </EventsProvider>
                    </SocialProvider>
                </SocketProvider>
            </StoriesProvider>
        </ActiveProfileProvider>
    );
}

