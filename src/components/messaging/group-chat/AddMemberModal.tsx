"use client"

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/services/api/user";
import { useGroupChat } from "./groupChat.context";
import { Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchedUser } from "@/types/user";

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (userId: string) => void;
}

export default function AddMemberModal({ isOpen, onClose, onInvite }: AddMemberModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const { activeGroup, sentInvitations } = useGroupChat();

    // Use SearchedUser[] type for data
    const { data: users = [], isLoading } = useQuery<SearchedUser[]>({
        queryKey: ['searchUsers', searchTerm],
        queryFn: async () => {
            // Type assertion if searchUsers returns any
            return (await searchUsers(searchTerm));
        },
        enabled: searchTerm.length > 2
    });

    const handleInvite = (userId: string) => {
        onInvite(userId);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Members</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="h-[300px] overflow-y-auto space-y-2">
                        {isLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}

                        {!isLoading && users.length === 0 && searchTerm.length > 2 && (
                            <p className="text-center text-muted-foreground text-sm py-4">No users found</p>
                        )}

                        {users.map((user: SearchedUser) => (
                            <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatar_url || ""} />
                                        <AvatarFallback>{(user.full_name || "?").substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{user.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{user.headline || "No headline"}</p>
                                    </div>
                                </div>
                                {activeGroup?.members?.some((m: any) => m.user_id === user.id) ? (
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Joined</span>
                                ) : sentInvitations?.some((inv: any) => inv.invitee_id === user.id) ? (
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Invited</span>
                                ) : (
                                    <Button size="sm" variant="secondary" onClick={() => handleInvite(user.id)}>
                                        Invite
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
