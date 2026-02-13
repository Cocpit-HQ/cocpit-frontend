import React from "react";
import { useGroupChat } from "./groupChat.context";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SharedAvatar from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Trash2, UserPlus, Camera, Crown, MoreVertical } from "lucide-react";
import { GroupAvatarUploadModal } from "./GroupAvatarUploadModal";
import { updateGroupAvatar } from "@/services/api/group-chat";
import { uploadMedia } from "@/services/api/upload";
import { useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface GroupDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    onAddMember: () => void;
}

export default function GroupDetails({ isOpen, onClose, currentUserId, onAddMember }: GroupDetailsProps) {
    const { activeGroup, leaveGroup, deleteGroup, sentInvitations, removeMember, promoteToAdmin, isInactive } = useGroupChat();
    const { isUserOnline } = useSocket();

    if (!activeGroup) return null;

    const isAdmin = (activeGroup.admin_id === currentUserId || activeGroup.members.find(m => m.user_id === currentUserId)?.role === 'admin') && !isInactive;
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    const handleAvatarUpload = async (file: File) => {
        try {
            const urls = await uploadMedia([file]);
            if (urls && urls.length > 0) {
                const avatarUrl = typeof urls[0] === 'string' ? urls[0] : urls[0].url;
                await updateGroupAvatar(activeGroup.conversation_id, avatarUrl);
            }
        } catch (err) {
            console.error("Failed to update group avatar:", err);
            alert("Failed to update group avatar");
        }
    };

    const handleAvatarDelete = async () => {
        try {
            await updateGroupAvatar(activeGroup.conversation_id, null);
        } catch (err) {
            console.error("Failed to delete group avatar:", err);
            alert("Failed to delete group avatar");
        }
    };

    const handlePromoteToAdmin = async (userId: string) => {
        if (confirm("Promote this member to Group Admin?")) {
            await promoteToAdmin(userId);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (confirm("Remove this member from the group?")) {
            await removeMember(userId);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
                <SheetHeader className="flex-none">
                    <SheetTitle>Group Info</SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground">
                        View and manage group details and members
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto -mx-6 px-6 scrollbar-hide">
                    <div className="flex flex-col items-center mt-6 mb-8">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src={activeGroup.group_avatar} />
                                <AvatarFallback className="text-2xl">{(activeGroup.conversation_name || "G").substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {isAdmin && (
                                <button
                                    onClick={() => setIsAvatarModalOpen(true)}
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity mb-4"
                                >
                                    <Camera className="text-white w-8 h-8" />
                                </button>
                            )}
                        </div>
                        <h2 className="text-xl font-bold">{activeGroup.conversation_name}</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            {activeGroup.members.length} {activeGroup.members.length === 1 ? 'member' : 'members'}
                        </p>
                        {activeGroup.description && (
                            <p className="text-sm mt-2 text-center text-muted-foreground">{activeGroup.description}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Members</h3>
                        {isAdmin && (
                            <Button variant="outline" size="sm" onClick={onAddMember}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Member
                            </Button>
                        )}
                    </div>

                    <div className="border rounded-md p-4 mb-6">
                        <div className="space-y-4">
                            {activeGroup.members.map((member) => (
                                <div key={member.user_id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <SharedAvatar
                                            url={member.avatar_url}
                                            name={member.full_name || "?"}
                                            online={isUserOnline(member.user_id)}
                                            size="md"
                                        />
                                        <div>
                                            <p className="font-medium text-sm">
                                                {member.full_name}
                                                {member.user_id === currentUserId && " (You)"}
                                            </p>
                                            {member.role === 'admin' && (
                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
                                            )}
                                        </div>
                                    </div>
                                    {isAdmin && member.user_id !== currentUserId && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {member.role !== 'admin' && (
                                                    <DropdownMenuItem onClick={() => handlePromoteToAdmin(member.user_id)}>
                                                        <Crown className="w-4 h-4 mr-2" />
                                                        Make Group Admin
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleRemoveMember(member.user_id)} className="text-destructive focus:text-destructive">
                                                    <LogOut className="w-4 h-4 mr-2" />
                                                    Remove from Group
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {isAdmin && sentInvitations.length > 0 && (
                        <>
                            <h3 className="font-semibold mb-4">Pending Invitations</h3>
                            <div className="border rounded-md p-4 mb-6">
                                <div className="space-y-4">
                                    {sentInvitations.map((inv) => (
                                        <div key={inv.invitation_id} className="flex items-center justify-between opacity-70">
                                            <div className="flex items-center gap-3">
                                                <SharedAvatar
                                                    url={inv.invitee_avatar}
                                                    name={inv.invitee_name || "?"}
                                                    size="md"
                                                />
                                                <div>
                                                    <p className="font-medium text-sm">{inv.invitee_name}</p>
                                                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Invited</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-3 pb-6">
                        {/* Show Leave Group only if user is an active member */}
                        {!isInactive && activeGroup.members.some(m => m.user_id === currentUserId) && (
                            <Button
                                variant="destructive"
                                className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500 border-none justify-start"
                                onClick={() => {
                                    if (confirm("Are you sure you want to leave?")) {
                                        leaveGroup(activeGroup.conversation_id);
                                    }
                                }}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Leave Group
                            </Button>
                        )}

                        {/* Delete Group is always available (Deletes for user only) */}
                        <Button
                            variant="ghost"
                            className="w-full text-red-500 hover:bg-red-500/10 hover:text-red-500 justify-start"
                            onClick={() => {
                                if (confirm("Delete group from your list? This will not affect other members.")) {
                                    deleteGroup(activeGroup.conversation_id);
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Group
                        </Button>
                    </div>
                </div>
            </SheetContent>

            <GroupAvatarUploadModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                currentAvatarUrl={activeGroup.group_avatar || null}
                onUpload={handleAvatarUpload}
                onDelete={handleAvatarDelete}
            />
        </Sheet>
    );
}
