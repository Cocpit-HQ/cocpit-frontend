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
    const { activeGroup, isInactive } = useGroupChat();
    const { activeProfile } = useActiveProfile();
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showMuteConfirm, setShowMuteConfirm] = useState(false);
    const [showUnmuteConfirm, setShowUnmuteConfirm] = useState(false);

    if (!activeGroup) return null;

    const memberCount = activeGroup.members.length;

    return (
        <div className={`flex items-center justify-between border-b border-border bg-white shrink-0 h-[72px] ${isMobile ? "px-3" : "px-6"}`}>
            {isMessageSelected && selectedMessage ? (
                <>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onMessageAction?.('close')}
                            className="p-1 hover:bg-[#EEF2FF] rounded-full transition-colors"
                        >
                            <Icon icon="mdi:close" className="h-6 w-6 text-[#000000]" />
                        </button>
                        <div className="font-['Poppins'] font-medium text-[16px] text-[#000000]">1 Selected</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <DropdownMenu onOpenChange={setIsDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 outline-none transition-colors">
                                    <Icon
                                        icon="mdi-light:dots-vertical"
                                        width={24}
                                        height={24}
                                        style={{ color: isDropdownOpen ? '#6366F1' : '#000000' }}
                                    />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[204px] p-[8px] mr-4 bg-white border border-[#C7D2FE]"
                                style={{ borderRadius: '24px 0px 24px 24px' }}
                            >
                                {((selectedMessage.sender === 'me' || selectedMessage.senderId === currentUserId || selectedMessage.senderId === 'me')) && (
                                    <DropdownMenuItem
                                        onClick={() => onMessageAction?.('edit')}
                                        className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors border-none outline-none"
                                    >
                                        <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">Edit</span>
                                        <Icon icon="fluent:edit-16-regular" width={24} height={24} color="#000000" />
                                    </DropdownMenuItem>
                                )}
                                {((selectedMessage.sender === 'me' || selectedMessage.senderId === currentUserId || selectedMessage.senderId === 'me')) && (
                                    <DropdownMenuItem
                                        onClick={() => onMessageAction?.('delete')}
                                        className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#FFF0F0] rounded-md transition-colors border-none outline-none"
                                    >
                                        <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#FF6B6B]">Delete</span>
                                        <Icon icon="fluent:delete-16-regular" width={24} height={24} color="#FF6B6B" />
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() => onMessageAction?.('info')}
                                    className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors border-none outline-none"
                                >
                                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">Info</span>
                                    <Icon icon="fluent:info-16-regular" width={24} height={24} color="#000000" />
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onMessageAction?.('copy')}
                                    className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors border-none outline-none"
                                >
                                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#000000]">Copy</span>
                                    <Icon icon="fluent:copy-16-regular" width={24} height={24} color="#000000" />
                                </DropdownMenuItem>
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
                                className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[#EEF2FF] text-muted-foreground hover:text-foreground shrink-0"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}

                        <div
                            className="flex items-center gap-3 cursor-pointer group transition-all min-w-0"
                            onClick={onOpenDetails}
                            role="button"
                            tabIndex={0}
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
                                <h2 className="font-medium text-[16px] leading-[24px] text-[#000000] truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    {activeGroup.conversation_name}
                                </h2>
                                {typingStatus ? (
                                    <p className="text-[12px] leading-[16px] text-primary italic font-medium animate-pulse truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                        {typingStatus}
                                    </p>
                                ) : (
                                    <div className="flex items-center gap-0 min-w-0">
                                        {activeGroup.group_headline && (
                                            <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] truncate">
                                                {activeGroup.group_headline}
                                            </span>
                                        )}
                                        <span className="w-[6px] h-[6px] rounded-full bg-[#6B7280] mx-2 shrink-0" />
                                        <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] shrink-0">
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
                                    style={{ color: isDropdownOpen ? '#6366F1' : '#000000' }}
                                />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className=" p-[8px] mr-4  bg-white border border-[#C7D2FE]"
                            style={{ borderRadius: '24px 0px 24px 24px' }}>
                            {isMuted ? (
                                <DropdownMenuItem
                                    onClick={() => setShowUnmuteConfirm(true)}
                                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors"
                                >
                                    <span className="text-sm font-normal">Unmute Group</span>
                                    <Bell className="w-4 h-4" />
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => setShowMuteConfirm(true)}
                                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#EEF2FF] rounded-md transition-colors"
                                >
                                    <span className="text-sm font-normal">Mute Group</span>
                                    <BellOff className="w-4 h-4" />
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={onLeaveGroup}
                                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#EEF2FF] text-red-500 focus:text-red-500 rounded-md transition-colors"
                            >
                                <span className="text-sm font-normal">Leave Group</span>
                                <LogOut className="w-4 h-4" />
                            </DropdownMenuItem>
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
        </div>
    );
}