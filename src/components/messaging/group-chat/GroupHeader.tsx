import React from "react";
import { useGroupChat } from "./groupChat.context";
import { useAuth } from "../../../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, Info, ArrowLeft, Copy, Pencil, X, MoreVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import { useIsMobile } from "../../../hooks/use-mobile";
import { Message } from "@/types/messaging";
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
    selectedMessage?: Message | null;
    onMessageAction?: (action: string) => void;
    currentUserId?: string;
}

export default function GroupHeader({ onOpenDetails, onAddMember, onBack, typingStatus, selectedMessage, onMessageAction, currentUserId }: GroupHeaderProps) {
    const { activeGroup, isInactive } = useGroupChat();
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const isAdmin = activeGroup?.admin_id === (user?.id || (user as { user_id?: string } | null)?.user_id) && !isInactive;

    const isMyMessage = selectedMessage && (selectedMessage.sender === 'me' || (selectedMessage.senderId && String(selectedMessage.senderId) === String(currentUserId)));


    if (!activeGroup) return null;

    return (
        <div className={`flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm ${isMobile ? "p-3" : "p-4"}`}>
            <div className="flex items-center gap-3 overflow-hidden flex-1">
                {isMobile && onBack && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onBack();
                        }}
                        className="p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                )}
                {!selectedMessage ? (
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={onOpenDetails}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                            {activeGroup.group_avatar && (activeGroup.group_avatar.startsWith('http') || activeGroup.group_avatar.startsWith('/')) ? (
                                <Image src={activeGroup.group_avatar} alt={activeGroup.conversation_name} fill className="object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full w-full bg-primary/10 text-primary font-bold">
                                    {(activeGroup.conversation_name || "G").substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            {typingStatus ? (
                                <p className="text-xs text-muted-foreground">
                                    <span className="text-primary italic font-medium animate-pulse">{typingStatus}</span>
                                </p>
                            ) : (
                                <div className="flex flex-col">
                                    <h2 className="font-semibold text-sm leading-none flex items-center gap-2">
                                        {activeGroup.conversation_name}
                                    </h2>
                                    <p className="text-muted-foreground text-xs">
                                        {activeGroup.members.filter(m => !isInactive || m.user_id !== currentUserId).length} {activeGroup.members.filter(m => !isInactive || m.user_id !== currentUserId).length === 1 ? 'member' : 'members'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="font-medium text-foreground">1 Selected</div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {selectedMessage ? (
                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                        <Button variant="ghost" size="icon" onClick={() => onMessageAction?.('close')} title="Close Selection">
                            <X className="h-5 w-5" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onMessageAction?.('copy')}>
                                    <Copy className="w-4 h-4 mr-2" /> Copy
                                </DropdownMenuItem>
                                {isMyMessage && (
                                    <>
                                        <DropdownMenuItem onClick={() => onMessageAction?.('info')}>
                                            <Info className="w-4 h-4 mr-2" /> Info
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onMessageAction?.('edit')}>
                                            <Pencil className="w-4 h-4 mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onMessageAction?.('delete')} className="text-destructive focus:text-destructive">
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ) : (
                    <>
                        {!isInactive && isAdmin && (
                            <Button variant="ghost" size="icon" onClick={onAddMember} title="Add Member">
                                <Plus className="h-5 w-5" />
                            </Button>
                        )}
                        {!isInactive && (
                            <Button variant="ghost" size="icon" onClick={onOpenDetails} title="Group Info">
                                <Info className="h-5 w-5" />
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
