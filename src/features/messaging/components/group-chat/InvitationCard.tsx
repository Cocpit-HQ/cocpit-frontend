import React from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface InvitationCardProps {
    groupName: string;
    groupAvatar?: string;
    inviterName: string; // The person who invited you
    onAccept: () => void;
    onReject: () => void;
}

export default function InvitationCard({ groupName, groupAvatar, inviterName, onAccept, onReject }: InvitationCardProps) {
    return (
        <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="shrink-0">
                        <AvatarImage src={groupAvatar} />
                        <AvatarFallback>{(groupName || "Group").substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{groupName || "Unnamed Group"}</p>
                        <p className="text-xs text-muted-foreground truncate">Invited by {inviterName || "Someone"}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={(e) => { e.stopPropagation(); onAccept(); }}>
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={(e) => { e.stopPropagation(); onReject(); }}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
