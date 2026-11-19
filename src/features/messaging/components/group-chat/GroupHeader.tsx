import React, { useState, useEffect } from "react";
import { useGroupChat } from "./groupChat.context";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/context/SocketContext";
import { useQueryClient } from "@tanstack/react-query";
import { muteGroup, unmuteGroup, pinConversation } from "@/services/api/messaging";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MenuIcon } from "@/components/icons";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { Message } from "@/types/messaging";
import { hasMessageMedia } from "../ui/MessageBubble";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isChatMuted, formatMuteToastMessage } from "../../utils/muteUtils";
import { setChatPinned, isChatPinned } from "../../utils/pinUtils";

interface GroupHeaderProps {
    onOpenDetails: () => void;
    onAddMember: () => void;
    onBack?: () => void;
    typingStatus?: string | null;
    onLeaveGroup: () => void;
    isMessageSelected?: boolean;
    selectedMessage?: Message | null;
    selectedMessages?: Message[];
    onMessageAction?: (action: string) => void;
    currentUserId?: string;
    isMuted?: boolean;
    mutedUntil?: string | null;
}

export default function GroupHeader({
    onOpenDetails,
    onAddMember,
    onBack,
    typingStatus,
    onLeaveGroup,
    isMessageSelected,
    selectedMessage,
    selectedMessages,
    onMessageAction,
    currentUserId,
    isMuted = false,
    mutedUntil = null
}: GroupHeaderProps) {
    const { activeGroup, isInactive, deleteGroup } = useGroupChat();
    const { activeProfile } = useActiveProfile();
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const { toast } = useToast();
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [menuView, setMenuView] = useState<"main" | "mute">("main");
    const [showUnmuteConfirm, setShowUnmuteConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isMutedActive = isChatMuted({ is_muted: isMuted, muted_until: mutedUntil });

    const [isPinned, setIsPinned] = useState<boolean>(() => {
        if (!activeGroup?.conversation_id) return false;
        return isChatPinned(activeGroup.conversation_id, activeProfile?.type, activeProfile?.id);
    });

    useEffect(() => {
        if (!activeGroup?.conversation_id) return;
        setIsPinned(Boolean(isChatPinned(activeGroup.conversation_id, activeProfile?.type, activeProfile?.id)));
    }, [activeGroup?.conversation_id, activeProfile?.type, activeProfile?.id]);

    useEffect(() => {
        if (!socket || !activeGroup?.conversation_id) return;
        const handlePinned = (payload: { conversationId: string; is_pinned: boolean }) => {
            if (String(payload.conversationId) === String(activeGroup.conversation_id)) {
                setIsPinned(Boolean(payload.is_pinned));
            }
        };
        socket.on("conversation_pinned", handlePinned);
        return () => {
            socket.off("conversation_pinned", handlePinned);
        };
    }, [socket, activeGroup?.conversation_id]);

    const handleMuteWithDuration = async (hours: number | null) => {
        if (!activeGroup?.conversation_id) return;
        try {
            const calculatedMutedUntil = hours
                ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
                : null;

            const queryKey = ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'];
            queryClient.setQueryData(queryKey, (oldChats: any[] | undefined) => {
                if (!oldChats) return [];
                return oldChats.map(c => 
                    String(c.id) === String(activeGroup.conversation_id)
                        ? { ...c, is_muted: true, muted_until: calculatedMutedUntil }
                        : c
                );
            });
            await muteGroup(activeGroup.conversation_id, true, calculatedMutedUntil, hours);
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast({ description: formatMuteToastMessage(hours, true) });
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to mute group";
            toast({
                title: "Error",
                description: errorMsg,
                variant: "destructive"
            });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    };

    const handleTogglePin = async () => {
        if (!activeGroup?.conversation_id) return;
        const newPinned = !isPinned;
        setIsPinned(newPinned);
        const nowIso = new Date().toISOString();
        const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
        setChatPinned(String(activeGroup.conversation_id), newPinned, activeProfile?.type, activeProfile?.id, nowIso);
        queryClient.setQueriesData<any[]>(
            { queryKey: ['conversations'] },
            (oldChats) => {
                if (!oldChats || !Array.isArray(oldChats)) return oldChats;
                return oldChats.map(c => {
                    const isTarget = String(c.id) === String(activeGroup.conversation_id);
                    if (isTarget) {
                        return { ...c, is_pinned: newPinned, pinned_at: newPinned ? nowIso : null };
                    }
                    return c;
                });
            }
        );
        setIsDropdownOpen(false);
        toast({ description: newPinned ? "Group pinned successfully" : "Group unpinned successfully" });

        try {
            await pinConversation(String(activeGroup.conversation_id), newPinned, companyId);
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        } catch (err) {
            console.error("Failed to persist pin on server:", err);
            setIsPinned(!newPinned);
            setChatPinned(String(activeGroup.conversation_id), !newPinned, activeProfile?.type, activeProfile?.id);
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast({
                title: "Error",
                description: "Failed to update pin state on server",
                variant: "destructive"
            });
        }
    };

    if (!activeGroup) return null;

    const allSelected =
        selectedMessages && selectedMessages.length > 0
            ? selectedMessages
            : selectedMessage
                ? [selectedMessage]
                : [];
    const selectedCount = allSelected.length;
    const isSingle = selectedCount === 1;

    const isMyMessage = (m: Message) =>
        m.sender === 'me' ||
        m.senderId === currentUserId ||
        m.senderId === 'me';

    const allAreMine = allSelected.length > 0 && allSelected.every(isMyMessage);
    const anyHasMedia = allSelected.some((m) => hasMessageMedia(m));

    const isAdmin = activeGroup.members.some(m => String(m.user_id) === String(currentUserId) && m.role === 'admin') || String((activeGroup as any).admin_id) === String(currentUserId);
    const memberCount = activeGroup.members.length;
    const hasHeadline = Boolean(activeGroup.group_headline && activeGroup.group_headline.trim());

    return (
        <div className={`flex items-center justify-between bg-[var(--ds-bg)] shrink-0 h-[72px] ${isMobile ? "px-3" : "px-6"}`}>
            <div className="flex items-center gap-3 overflow-hidden flex-1">
                        {isMobile && onBack && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onBack();
                                }}
                                className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--ds-surface-1)] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] shrink-0"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}

                        {/* Outer Box: Frame 2610104 (flex-row, gap 8px, height 36px) */}
                        <div
                            className={`flex flex-row items-center p-0 gap-2 h-9 min-w-0 max-w-full transition-all ${!isInactive ? "cursor-pointer group" : "cursor-default"}`}
                            onClick={!isInactive ? onOpenDetails : undefined}
                            role={!isInactive ? "button" : undefined}
                            tabIndex={!isInactive ? 0 : undefined}
                        >
                            {/* Avatar: Rectangle 82 (32px x 32px rounded-full) */}
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--ds-surface-1)] shrink-0 flex-none order-0">
                                {activeGroup.group_avatar && (activeGroup.group_avatar.startsWith('http') || activeGroup.group_avatar.startsWith('/')) ? (
                                    <Image src={activeGroup.group_avatar} alt={activeGroup.conversation_name} fill className="object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full w-full bg-[var(--ds-accent)]/10 text-[var(--ds-accent)] font-semibold font-['DM_Sans'] text-xs">
                                        {(activeGroup.conversation_name || "G").substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Text Box: Frame 2609904 (flex-col, height 36px) */}
                            <div className="flex flex-col items-start justify-center p-0 h-9 min-w-0 flex-1 flex-none order-1">
                                {/* Group Name: 16px/24px font-semibold text primary */}
                                <h2 className="font-['DM_Sans'] font-semibold text-base leading-6 text-[var(--ds-text-primary)] truncate max-w-full">
                                    {activeGroup.conversation_name}
                                </h2>
                                {typingStatus ? (
                                    <p className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-[var(--ds-accent)] italic truncate max-w-full">
                                        {typingStatus}
                                    </p>
                                ) : (
                                    /* Subtitle Row: Frame 2608645 (flex-row, gap 4px, height 12px) */
                                    <div className="flex flex-row items-center p-0 gap-1 h-3 min-w-0 max-w-full">
                                        {hasHeadline && (
                                            <>
                                                {/* Group Headline: 10px/12px font-normal text secondary */}
                                                <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-[var(--ds-text-secondary)] truncate flex items-center min-w-0">
                                                    {activeGroup.group_headline}
                                                </span>
                                                {/* Badge: Ellipse 15 (6px x 6px) - only shown when headline is present */}
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full bg-[var(--ds-text-secondary)] shrink-0 flex-none"
                                                    aria-hidden="true"
                                                />
                                            </>
                                        )}
                                        {/* Member Count: 10px/12px font-normal text secondary */}
                                        <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-[var(--ds-text-secondary)] shrink-0 flex items-center">
                                            {memberCount} Members
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {!isMessageSelected && (
                        <DropdownMenu
                            open={isDropdownOpen}
                            onOpenChange={(open) => {
                                setIsDropdownOpen(open);
                                if (!open) setMenuView("main");
                            }}
                        >
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity outline-none cursor-pointer p-0"
                                    aria-label="Group actions"
                                >
                                    <MenuIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                sideOffset={6}
                                className={
                                    menuView === "mute"
                                        ? "chat-mute-menu box-border flex flex-col items-center p-3 gap-4 w-[159px] min-w-[159px] h-[188px] !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-lg !shadow-none z-[200] outline-none overflow-hidden"
                                        : "chat-group-menu box-border flex flex-col items-start p-3 gap-4 w-[111px] min-w-[111px] h-[152px] !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-lg !shadow-none z-[200] outline-none overflow-hidden"
                                }
                                style={{ borderRadius: '8px' }}
                            >
                                {menuView === "mute" ? (
                                    <>
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                handleMuteWithDuration(1);
                                                setIsDropdownOpen(false);
                                                setMenuView("main");
                                            }}
                                            className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-0 grow-0"
                                        >
                                            For 1 hours
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                handleMuteWithDuration(8);
                                                setIsDropdownOpen(false);
                                                setMenuView("main");
                                            }}
                                            className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-1 grow-0"
                                        >
                                            For 8 hours
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                handleMuteWithDuration(24);
                                                setIsDropdownOpen(false);
                                                setMenuView("main");
                                            }}
                                            className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-2 grow-0"
                                        >
                                            For 24 hours
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                handleMuteWithDuration(null);
                                                setIsDropdownOpen(false);
                                                setMenuView("main");
                                            }}
                                            className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-3 grow-0"
                                        >
                                            Until I turn it back on
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                setMenuView("main");
                                            }}
                                            className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-4 grow-0"
                                        >
                                            Cancel
                                        </DropdownMenuItem>
                                    </>
                                ) : isAdmin ? (
                                    /* group admin: Pin group, Mute group, Leave group, Delete Group */
                                    <>
                                        <DropdownMenuItem
                                            onSelect={handleTogglePin}
                                            className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-0 grow-0"
                                        >
                                            {isPinned ? "Unpin group" : "Pin group"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={(e) => {
                                                if (isMutedActive) {
                                                    setShowUnmuteConfirm(true);
                                                } else {
                                                    e.preventDefault();
                                                    setMenuView("mute");
                                                }
                                            }}
                                            className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-1 grow-0"
                                        >
                                            {isMutedActive ? "Unmute group" : "Mute group"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                setIsDropdownOpen(false);
                                                onLeaveGroup();
                                            }}
                                            className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-2 grow-0"
                                        >
                                            Leave group
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                setIsDropdownOpen(false);
                                                setShowDeleteConfirm(true);
                                            }}
                                            className="chat-action-item danger-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-error)] hover:opacity-80 focus:opacity-80 data-[highlighted]:!text-[var(--ds-error)] data-[highlighted]:!opacity-80 flex-none order-3 grow-0"
                                        >
                                            Delete Group
                                        </DropdownMenuItem>
                                    </>
                                ) : (
                                    /* groupUser: Group info, Pin group, Mute group, Leave group */
                                    <>
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                setIsDropdownOpen(false);
                                                onOpenDetails();
                                            }}
                                            className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-0 grow-0"
                                        >
                                            Group info
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={handleTogglePin}
                                            className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-1 grow-0"
                                        >
                                            {isPinned ? "Unpin group" : "Pin group"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={(e) => {
                                                if (isMutedActive) {
                                                    setShowUnmuteConfirm(true);
                                                } else {
                                                    e.preventDefault();
                                                    setMenuView("mute");
                                                }
                                            }}
                                            className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-2 grow-0"
                                        >
                                            {isMutedActive ? "Unmute group" : "Mute group"}
                                        </DropdownMenuItem>
                                        {isInactive ? (
                                            <DropdownMenuItem
                                                onSelect={() => {
                                                    setIsDropdownOpen(false);
                                                    setShowDeleteConfirm(true);
                                                }}
                                                className="chat-action-item danger-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-error)] hover:opacity-80 focus:opacity-80 data-[highlighted]:!text-[var(--ds-error)] data-[highlighted]:!opacity-80 flex-none order-3 grow-0"
                                            >
                                                Delete Group
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                onSelect={() => {
                                                    setIsDropdownOpen(false);
                                                    onLeaveGroup();
                                                }}
                                                className="chat-action-item danger-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-error)] hover:opacity-80 focus:opacity-80 data-[highlighted]:!text-[var(--ds-error)] data-[highlighted]:!opacity-80 flex-none order-3 grow-0"
                                            >
                                                Leave group
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

            <CocpitConfirmBox
                isOpen={showUnmuteConfirm}
                title="Unmute group notifications?"
                message="You will receive notifications from this group again."
                confirmText="Unmute"
                cancelText="Cancel"
                onConfirm={async () => {
                    try {
                        // Optimistic Cache Update
                        const queryKey = ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'];
                        queryClient.setQueryData(queryKey, (oldChats: any[] | undefined) => {
                            if (!oldChats) return [];
                            return oldChats.map(c => 
                                String(c.id) === String(activeGroup.conversation_id)
                                    ? { ...c, is_muted: false, muted_until: null }
                                    : c
                            );
                        });
                        await unmuteGroup(activeGroup.conversation_id);
                        queryClient.invalidateQueries({ queryKey: ['conversations'] });
                        toast({ description: "Group unmuted successfully" });
                    } catch (err: any) {
                        const errorMsg = err?.response?.data?.message || err?.message || "Failed to unmute group";
                        toast({
                            title: "Error",
                            description: errorMsg,
                            variant: "destructive"
                        });
                        queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    } finally {
                        setShowUnmuteConfirm(false);
                    }
                }}
                onCancel={() => setShowUnmuteConfirm(false)}
            />

            <CocpitConfirmBox
                isOpen={showDeleteConfirm}
                title="Delete this group?"
                message={isAdmin && !isInactive ? "This will permanently delete the group for all members." : "Delete group from your list? This will not affect other members."}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={async () => {
                    try {
                        await deleteGroup(activeGroup.conversation_id);
                        toast({ description: "Group deleted successfully" });
                    } catch (err: any) {
                        const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete group";
                        toast({
                            title: "Error",
                            description: errorMsg,
                            variant: "destructive"
                        });
                    } finally {
                        setShowDeleteConfirm(false);
                    }
                }}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
}