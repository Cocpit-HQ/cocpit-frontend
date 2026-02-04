import React from "react";
import { useGroupChat } from "./groupChat.context";
import { useAuth } from "../../../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, Info, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useIsMobile } from "../../../hooks/use-mobile";

interface GroupHeaderProps {
    onOpenDetails: () => void;
    onAddMember: () => void;
    onBack?: () => void;
}

export default function GroupHeader({ onOpenDetails, onAddMember, onBack }: GroupHeaderProps) {
    const { activeGroup } = useGroupChat();
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const isAdmin = activeGroup?.admin_id === (user?.id || (user as { user_id?: string } | null)?.user_id);

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
                        <h2 className="font-semibold text-foreground">{activeGroup.conversation_name}</h2>
                        <p className="text-xs text-muted-foreground">
                            {activeGroup.members?.length || 0} members
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={onAddMember} title="Add Member">
                        <Plus className="h-5 w-5" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onOpenDetails} title="Group Info">
                    <Info className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
