import React, { useState } from "react";
import { useGroupChat } from "./groupChat.context";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { muteGroup, unmuteGroup } from "@/services/api/messaging";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical, BellOff, Bell, LogOut, Trash2 } from "lucide-react";
import { UserCog, Share2, Info, Ban } from "lucide-react";
import { Icon } from "@iconify/react";
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

interface GroupHeaderProps {
    onOpenDetails: () => void;
    onAddMember: () => void;
    onBack?: () => void;
    typingStatus?: string | null;
    onLeaveGroup: () => void;
    isMessageSelected?: boolean;
    selectedMessage?: Message | null;
    onMessageAction?: (action: string) => void;
    currentUserId?: string;
    isMuted?: boolean;
}

export default function GroupHeader({
    onOpenDetails,
    onAddMember,
    onBack,
    typingStatus,
    onLeaveGroup,
    isMessageSelected,
    selectedMessage,
    onMessageAction,
    currentUserId,
    isMuted = false
}: GroupHeaderProps) {
    const { activeGroup, isInactive, deleteGroup } = useGroupChat();
    const { activeProfile } = useActiveProfile();
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showMuteConfirm, setShowMuteConfirm] = useState(false);
    const [showUnmuteConfirm, setShowUnmuteConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (!activeGroup) return null;

    const isAdmin = activeGroup.members.some(m => String(m.user_id) === String(currentUserId) && m.role === 'admin') || String((activeGroup as any).admin_id) === String(currentUserId);
    const memberCount = activeGroup.members.length;

    return (
        <div className={`flex items-center justify-between border-b border-border bg-[var(--card)] shrink-0 h-[72px] ${isMobile ? "px-3" : "px-6"}`}>
            {isMessageSelected && selectedMessage ? (
                <>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onMessageAction?.('close')}
                            className="p-1 hover:bg-[var(--primary-tint)] rounded-full transition-colors"
                        >
                            <Icon icon="mdi:close" className="h-6 w-6 text-[var(--foreground)]" />
                        </button>
                        <div className="font-['Poppins'] font-medium text-[16px] text-[var(--foreground)]">1 Selected</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <DropdownMenu onOpenChange={setIsDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 outline-none transition-colors">
                                    <Icon
                                        icon="mdi-light:dots-vertical"
                                        width={24}
                                        height={24}
                                        style={{ color: isDropdownOpen ? 'var(--primary)' : 'var(--foreground)' }}
                                    />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[204px] p-[8px] mr-4 bg-[var(--card)] border border-[var(--border)]"
                                style={{ borderRadius: '24px 0px 24px 24px' }}
                            >
                                {((selectedMessage.sender === 'me' || selectedMessage.senderId === currentUserId || selectedMessage.senderId === 'me')) && (
                                    <DropdownMenuItem
                                        onClick={() => onMessageAction?.('edit')}
                                        className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors border-none outline-none"
                                    >
                                        <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">Edit</span>
                                        <Icon icon="fluent:edit-16-regular" width={24} height={24} color="var(--foreground)" />
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() => onMessageAction?.('delete_for_me')}
                                    className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--destructive)]/10 rounded-md transition-colors border-none outline-none"
                                >
                                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--destructive)]">Delete for me</span>
                                    <Icon icon="fluent:delete-16-regular" width={24} height={24} color="var(--destructive)" />
                                </DropdownMenuItem>
                                {((selectedMessage.sender === 'me' || selectedMessage.senderId === currentUserId || selectedMessage.senderId === 'me')) && (
                                    <DropdownMenuItem
                                        onClick={() => onMessageAction?.('delete_for_everyone')}
                                        className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--destructive)]/10 rounded-md transition-colors border-none outline-none"
                                    >
                                        <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--destructive)]">Delete for everyone</span>
                                        <Icon icon="fluent:delete-16-regular" width={24} height={24} color="var(--destructive)" />
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() => onMessageAction?.('info')}
                                    className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors border-none outline-none"
                                >
                                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">Info</span>
                                    <Icon icon="fluent:info-16-regular" width={24} height={24} color="var(--foreground)" />
                                </DropdownMenuItem>
                                {!hasMessageMedia(selectedMessage) && (
                                    <DropdownMenuItem
                                        onClick={() => onMessageAction?.('copy')}
                                        className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors border-none outline-none"
                                    >
                                        <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">Copy</span>
                                        <Icon icon="fluent:copy-16-regular" width={24} height={24} color="var(--foreground)" />
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                        {isMobile && onBack && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onBack();
                                }}
                                className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--primary-tint)] text-muted-foreground hover:text-foreground shrink-0"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}

                        <div
                            className={`flex items-center gap-3 transition-all min-w-0 ${!isInactive ? "cursor-pointer group" : "cursor-default"}`}
                            onClick={!isInactive ? onOpenDetails : undefined}
                            role={!isInactive ? "button" : undefined}
                            tabIndex={!isInactive ? 0 : undefined}
                        >
                            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0">
                                {activeGroup.group_avatar && (activeGroup.group_avatar.startsWith('http') || activeGroup.group_avatar.startsWith('/')) ? (
                                    <Image src={activeGroup.group_avatar} alt={activeGroup.conversation_name} fill className="object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full w-full bg-primary/10 text-primary font-bold">
                                        {(activeGroup.conversation_name || "G").substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex flex-col justify-center flex-1">
                                <h2 className="font-medium text-[16px] leading-[24px] text-[var(--foreground)] truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    {activeGroup.conversation_name}
                                </h2>
                                {typingStatus ? (
                                    <p className="text-[12px] leading-[16px] text-primary italic font-medium animate-pulse truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                        {typingStatus}
                                    </p>
                                ) : (
                                    <div className="flex items-center gap-0 min-w-0">
                                        {activeGroup.group_headline && (
                                            <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[var(--muted-foreground)] truncate">
                                                {activeGroup.group_headline}
                                            </span>
                                        )}
                                        <span className="w-[6px] h-[6px] rounded-full bg-[var(--muted-foreground)] mx-2 shrink-0" />
                                        <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[var(--muted-foreground)] shrink-0">
                                            {memberCount} Members
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DropdownMenu onOpenChange={setIsDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 outline-none transition-colors">
                                <Icon
                                    icon="mdi-light:dots-vertical"
                                    width={24}
                                    height={24}
                                    style={{ color: isDropdownOpen ? 'var(--primary)' : 'var(--foreground)' }}
                                />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className=" p-[8px] mr-4  bg-[var(--card)] border border-[var(--border)]"
                            style={{ borderRadius: '24px 0px 24px 24px' }}>
                            {isMuted ? (
                                <DropdownMenuItem
                                    onClick={() => setShowUnmuteConfirm(true)}
                                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors"
                                >
                                    <span className="text-sm font-normal">Unmute Group</span>
                                    <Bell className="w-4 h-4" />
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => setShowMuteConfirm(true)}
                                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors"
                                >
                                    <span className="text-sm font-normal">Mute Group</span>
                                    <BellOff className="w-4 h-4" />
                                </DropdownMenuItem>
                            )}
                            {(!isInactive && activeGroup.members.some(m => String(m.user_id) === String(currentUserId))) && (
                                <DropdownMenuItem
                                    onClick={onLeaveGroup}
                                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[var(--primary-tint)] text-[var(--destructive)] focus:text-[var(--destructive)] rounded-md transition-colors"
                                >
                                    <span className="text-sm font-normal">Leave Group</span>
                                    <LogOut className="w-4 h-4" />
                                </DropdownMenuItem>
                            )}
                            {(isAdmin || isInactive || !activeGroup.members.some(m => String(m.user_id) === String(currentUserId))) && (
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[var(--primary-tint)] text-[var(--destructive)] focus:text-[var(--destructive)] rounded-md transition-colors"
                                >
                                    <span className="text-sm font-normal">Delete Group</span>
                                    <Trash2 className="w-4 h-4" />
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}

            <CocpitConfirmBox
                isOpen={showMuteConfirm}
                title="Mute group notifications?"
                message="You won’t receive notifications from this group."
                confirmText="Mute"
                cancelText="Cancel"
                onConfirm={async () => {
                    try {
                        // Optimistic Cache Update
                        const queryKey = ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'];
                        queryClient.setQueryData(queryKey, (oldChats: any[] | undefined) => {
                            if (!oldChats) return [];
                            return oldChats.map(c => 
                                String(c.id) === String(activeGroup.conversation_id)
                                    ? { ...c, is_muted: true, muted_until: null }
                                    : c
                            );
                        });
                        await muteGroup(activeGroup.conversation_id, true);
                        queryClient.invalidateQueries({ queryKey: ['conversations'] });
                        toast({ description: "Group muted successfully" });
                    } catch (err: any) {
                        const errorMsg = err?.response?.data?.message || err?.message || "Failed to mute group";
                        toast({
                            title: "Error",
                            description: errorMsg,
                            variant: "destructive"
                        });
                        queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    } finally {
                        setShowMuteConfirm(false);
                    }
                }}
                onCancel={() => setShowMuteConfirm(false)}
            />

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