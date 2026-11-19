"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChatThread } from "@/types/messaging";
import Avatar from "@/components/shared/Avatar";
import {
    LeftArrowIcon,
    GroupActionBellIcon,
    GroupActionMoreIcon,
} from "@/components/icons";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverClose,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getGroupSharedContent } from "@/services/api/group-chat";
import { getUserById } from "@/services/api/user";
import {
    GroupPostsTab,
    GroupMediaTab,
    GroupLinksTab,
} from "../group-chat/details";
import MediaDetailViewer from "./MediaDetailViewer";
import { cn } from "@/lib/utils";

export type UserDetailsTab = 'posts' | 'media' | 'links';

interface UserDetailsProps {
    chat: ChatThread;
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    isMuted?: boolean;
    onMuteWithDuration: (hours: number | null) => void;
    onUnmuteClick: () => void;
    onShareClick?: () => void;
    onReportClick?: () => void;
    onBlockClick?: () => void;
    onUnblockClick?: () => void;
    onDeleteClick?: () => void;
}

export default function UserDetails({
    chat,
    isOpen,
    onClose,
    currentUserId,
    isMuted = false,
    onMuteWithDuration,
    onUnmuteClick,
    onShareClick,
    onReportClick,
    onBlockClick,
    onUnblockClick,
    onDeleteClick,
}: UserDetailsProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<UserDetailsTab>('posts');
    const [isMuteDropdownOpen, setIsMuteDropdownOpen] = useState(false);

    // Fullscreen Media Viewer State
    const [previewMedia, setPreviewMedia] = useState<{
        url: string;
        type: string;
        name?: string | null;
        mediaList?: Array<{ url: string; type: string; name?: string | null }>;
        initialIndex?: number;
    } | null>(null);

    // Fetch shared content (media, posts, links) for this conversation
    const { data: sharedContent, isLoading: isSharedLoading } = useQuery({
        queryKey: ['shared-content', chat.id],
        queryFn: () => getGroupSharedContent(chat.id),
        enabled: Boolean(chat.id && isOpen),
        staleTime: 60000,
    });

    const isCompany = chat.otherUserType === "COMPANY";
    const isBlockedByMe = Boolean(chat.isBlockedByMe || (chat as any).isBlocked);
    const isBlockedByOther = chat.isBlockedByOther;
    const isAccountUnavailable = Boolean(
        isBlockedByOther ||
        chat.isDeactivated ||
        chat.isDeleted ||
        chat.name === "Unknown Page" ||
        chat.name === "Unknown User" ||
        chat.name === "Unknown user" ||
        chat.name === "Deleted Page" ||
        chat.name === "Deleted User" ||
        chat.name === "Deactivated User"
    );

    const displayName = isAccountUnavailable
        ? (isCompany ? "Unknown Page" : "Unknown user")
        : (chat.name || (isCompany ? "Unknown Page" : "Unknown User"));

    const displayHeadline = isAccountUnavailable
        ? (isCompany ? "Page unavailable" : "User unavailable")
        : (isCompany ? (chat.orgHeadline || chat.role || "") : (chat.role || ""));

    const displayAvatar = isAccountUnavailable ? undefined : (chat.avatar || undefined);

    // Resolve public profile slug/username if not already populated on chat
    const { data: fetchedUserSlug } = useQuery({
        queryKey: ['user-slug', chat.otherUserId],
        queryFn: async () => {
            if (!chat.otherUserId) return null;
            try {
                const res = await getUserById(chat.otherUserId);
                return res?.user?.account_name || (res?.user as any)?.username || null;
            } catch {
                return null;
            }
        },
        enabled: Boolean(!chat.otherUserSlug && chat.otherUserId && !isCompany && isOpen),
        staleTime: 300000,
    });

    const resolvedUserSlug = chat.otherUserSlug || fetchedUserSlug || (chat as any).username || (chat as any).account_name;

    const profileHref = isAccountUnavailable
        ? "#"
        : isCompany
            ? `/organization/${chat.otherUserSlug || chat.otherUserId}`
            : `/profile/${resolvedUserSlug || chat.otherUserId}`;

    const tabs: Array<{ id: UserDetailsTab; label: string }> = [
        { id: "posts", label: "Posts" },
        { id: "media", label: "Media" },
        { id: "links", label: "Links" },
    ];

    return (
        <div className="w-full h-full flex flex-col bg-[var(--ds-bg)] text-[var(--ds-text-primary)] font-['DM_Sans'] animate-in slide-in-from-right duration-200">
            {/* 1. Header Back Button */}
            <div className="pt-4 pl-4 pb-2 flex items-center shrink-0">
                <button
                    onClick={onClose}
                    type="button"
                    aria-label="Back to conversation"
                    className="flex flex-row items-center gap-2 w-[65px] h-[24px] p-0 cursor-pointer hover:opacity-80 transition-opacity outline-none bg-transparent border-none"
                >
                    <LeftArrowIcon
                        size={20}
                        className="w-5 h-5 shrink-0 text-[var(--ds-text-primary)]"
                        fill="var(--ds-text-primary)"
                    />
                    <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-center text-[var(--ds-text-primary)]">
                        Back
                    </span>
                </button>
            </div>

            {/* 2. User Profile Info Box */}
            <div className="mt-6 flex flex-col items-center gap-2 max-w-[618px] mx-auto w-full px-4 rounded-[24px] text-center shrink-0">
                {/* Avatar with Profile Redirection */}
                <Link
                    href={profileHref}
                    className={`w-[80px] h-[80px] rounded-full overflow-hidden bg-[var(--ds-surface-1)] flex items-center justify-center shrink-0 ${
                        isAccountUnavailable ? "pointer-events-none cursor-default" : "hover:opacity-90 transition-opacity cursor-pointer"
                    }`}
                >
                    <Avatar
                        url={displayAvatar}
                        name={displayName}
                        size="lg"
                        className="w-[80px] h-[80px]"
                        isCompany={isCompany}
                        isUnknown={isAccountUnavailable}
                    />
                </Link>

                {/* User Name with Profile Redirection */}
                <Link
                    href={profileHref}
                    className={`${isAccountUnavailable ? "pointer-events-none cursor-default" : "hover:opacity-85 transition-opacity cursor-pointer"}`}
                >
                    <h1 className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] text-center flex items-center justify-center">
                        {displayName}
                    </h1>
                </Link>

                {/* User Headline */}
                {displayHeadline && (
                    <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)] truncate max-w-[280px]">
                        {displayHeadline}
                    </span>
                )}

                {/* Quick Action Buttons (Bell/Mute, More) */}
                <div className="flex flex-row justify-center items-center gap-3 h-[36px] mt-1">
                    {/* Bell / Mute */}
                    {isMuted ? (
                        <button
                            type="button"
                            onClick={onUnmuteClick}
                            title="Unmute conversation"
                            aria-label="Unmute notifications"
                            className="p-0 border-none bg-transparent cursor-pointer hover:opacity-90 transition-opacity outline-none"
                        >
                            <GroupActionBellIcon size={36} className="w-[36px] h-[36px]" />
                        </button>
                    ) : (
                        <DropdownMenu
                            open={isMuteDropdownOpen}
                            onOpenChange={setIsMuteDropdownOpen}
                        >
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    title="Mute conversation"
                                    aria-label="Mute notifications"
                                    className="p-0 border-none bg-transparent cursor-pointer hover:opacity-90 transition-opacity outline-none"
                                >
                                    <GroupActionBellIcon size={36} className="w-[36px] h-[36px]" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="center"
                                sideOffset={6}
                                className="chat-mute-menu box-border flex flex-col items-center p-3 gap-4 w-[159px] min-w-[159px] h-[188px] !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-lg !shadow-none z-[200] outline-none overflow-hidden"
                                style={{ borderRadius: '8px' }}
                            >
                                <DropdownMenuItem
                                    onSelect={() => {
                                        onMuteWithDuration(1);
                                        setIsMuteDropdownOpen(false);
                                    }}
                                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-0 grow-0"
                                >
                                    For 1 hours
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        onMuteWithDuration(8);
                                        setIsMuteDropdownOpen(false);
                                    }}
                                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-1 grow-0"
                                >
                                    For 8 hours
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        onMuteWithDuration(24);
                                        setIsMuteDropdownOpen(false);
                                    }}
                                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-2 grow-0"
                                >
                                    For 24 hours
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        onMuteWithDuration(null);
                                        setIsMuteDropdownOpen(false);
                                    }}
                                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-3 grow-0"
                                >
                                    Until I turn it back on
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        setIsMuteDropdownOpen(false);
                                    }}
                                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-4 grow-0"
                                >
                                    Cancel
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* More Options Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                title="More options"
                                aria-label="More options"
                                className="p-0 border-none bg-transparent cursor-pointer hover:opacity-90 transition-opacity outline-none"
                            >
                                <GroupActionMoreIcon size={36} className="w-[36px] h-[36px]" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="end"
                            sideOffset={6}
                            className="w-auto min-w-[120px] p-3 flex flex-col items-start gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-[8px] shadow-2xl z-[100] outline-none"
                        >
                            {!isAccountUnavailable && onShareClick && (
                                <PopoverClose asChild>
                                    <button
                                        type="button"
                                        onClick={onShareClick}
                                        className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-colors"
                                    >
                                        Share profile
                                    </button>
                                </PopoverClose>
                            )}

                            {onReportClick && (
                                <PopoverClose asChild>
                                    <button
                                        type="button"
                                        onClick={onReportClick}
                                        className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-colors"
                                    >
                                        Report {isCompany ? "page" : "user"}
                                    </button>
                                </PopoverClose>
                            )}

                            {isBlockedByMe ? (
                                onUnblockClick && (
                                    <PopoverClose asChild>
                                        <button
                                            type="button"
                                            onClick={onUnblockClick}
                                            className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-colors"
                                        >
                                            Unblock {isCompany ? "page" : "user"}
                                        </button>
                                    </PopoverClose>
                                )
                            ) : (
                                onBlockClick && (
                                    <PopoverClose asChild>
                                        <button
                                            type="button"
                                            onClick={onBlockClick}
                                            className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-error)] hover:opacity-80 cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-opacity"
                                        >
                                            Block {isCompany ? "page" : "user"}
                                        </button>
                                    </PopoverClose>
                                )
                            )}

                            {onDeleteClick && (
                                <PopoverClose asChild>
                                    <button
                                        type="button"
                                        onClick={onDeleteClick}
                                        className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-error)] hover:opacity-80 cursor-pointer outline-none bg-transparent border-none p-0 text-left transition-opacity"
                                    >
                                        Delete chat
                                    </button>
                                </PopoverClose>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* 3. 3-Tab Navigation Bar (Posts, Media, Links) */}
            <div className="mt-6 flex flex-row justify-center items-center gap-6 max-w-[618px] mx-auto w-full h-[36px] shrink-0">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex flex-col items-center justify-center h-[36px] px-3 py-1.5 cursor-pointer relative outline-none bg-transparent border-none transition-colors",
                                isActive
                                    ? "text-[var(--ds-text-primary)]"
                                    : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                            )}
                        >
                            <span className="font-['DM_Sans'] font-medium text-[14px] leading-[20px] text-center">
                                {tab.label}
                            </span>
                            {isActive && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--ds-accent)] rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* 4. Active Tab Content Pane */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-8 scrollbar-hide">
                {activeTab === 'posts' && (
                    <GroupPostsTab
                        posts={sharedContent?.posts}
                        isLoading={isSharedLoading}
                        onPostClick={(postId) => router.push(`/post/${postId}`)}
                    />
                )}

                {activeTab === 'media' && (
                    <GroupMediaTab
                        media={sharedContent?.media}
                        isLoading={isSharedLoading}
                        onPreviewMedia={(item, idx) => {
                            setPreviewMedia({
                                url: item.url,
                                type: item.media_type,
                                name: item.filename,
                                initialIndex: idx,
                                mediaList: (sharedContent?.media || []).map(m => ({
                                    url: m.url,
                                    type: m.media_type,
                                    name: m.filename,
                                }))
                            });
                        }}
                    />
                )}

                {activeTab === 'links' && (
                    <GroupLinksTab
                        links={sharedContent?.links}
                        isLoading={isSharedLoading}
                    />
                )}
            </div>

            {/* 5. Fullscreen Media Detail Viewer */}
            {previewMedia && (
                <MediaDetailViewer
                    isOpen={Boolean(previewMedia)}
                    items={previewMedia.mediaList || [{ url: previewMedia.url, type: previewMedia.type, name: previewMedia.name }]}
                    initialIndex={previewMedia.initialIndex || 0}
                    onClose={() => setPreviewMedia(null)}
                />
            )}
        </div>
    );
}
