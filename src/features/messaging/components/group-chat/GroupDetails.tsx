import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useGroupChat } from "./groupChat.context";
import SharedAvatar from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Trash2, Pencil, ChevronLeft, Plus, Camera } from "lucide-react";
import { MoreVertical, UserCog, Share2, Info, Ban } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import { GroupAvatarUploadModal } from "./GroupAvatarUploadModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { updateGroupAvatar, updateGroupDetails } from "@/services/api/group-chat";
import { createReport } from "@/services/api/report";
import { uploadMedia } from "@/services/api/upload";
import { useSocial } from "@/context/SocialContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuPortal } from "@radix-ui/react-dropdown-menu";
import { CocpitProfileUpload } from "@/shared/commonComponents/Cocpitprofileupload";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";

interface GroupDetailsProps {
    isOpen: boolean;
    onClose: (backPosition: 'chat' | 'info' | 'edit') => void;
    currentUserId: string;
    onAddMember: () => void;
    activeView: 'chat' | 'info' | 'edit';
    setActiveView: (view: 'chat' | 'info' | 'edit') => void;
}

export default function GroupDetails({ isOpen, onClose, currentUserId, onAddMember, activeView, setActiveView }: GroupDetailsProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { activeGroup, leaveGroup, deleteGroup, removeMember, promoteToAdmin, updateMemberRole, isInactive, refreshGroup, cancelInvitation, sentInvitations } = useGroupChat();
    const { isUserOnline } = useSocket();
    const { blockUser, unblockUser, isBlocked } = useSocial();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userToShareProfile, setUserToShareProfile] = useState<string | null>(null);

    // Edit Form State
    const [editData, setEditData] = useState({
        name: "",
        headline: "",
        description: "",
        avatar: ""
    });
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [invitationToCancel, setInvitationToCancel] = useState<string | null>(null);
    const [userToRemove, setUserToRemove] = useState<string | null>(null);
    const [userToMakeAdmin, setUserToMakeAdmin] = useState<string | null>(null);
    const [userToDemote, setUserToDemote] = useState<string | null>(null);
    const [userToBlock, setUserToBlock] = useState<string | null>(null);
    const [userToReport, setUserToReport] = useState<string | null>(null);

    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [initialFormState, setInitialFormState] = useState({
        name: "",
        headline: "",
        description: "",
        avatar: ""
    });

    const [formErrors, setFormErrors] = useState({
        name: '',
        headline: '',
    });

    const hasChanges =
        editData.name !== initialFormState.name ||
        editData.headline !== initialFormState.headline ||
        editData.description !== initialFormState.description ||
        editData.avatar !== initialFormState.avatar;

    const validateForm = () => {
        const errors = { name: '', headline: '' };
        let isValid = true;

        if (!editData.name || !editData.name.trim()) {
            errors.name = 'Group name is required';
            isValid = false;
        }

        if (editData.headline && editData.headline.length > 100) {
            errors.headline = 'Headline cannot exceed 100 characters';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    useEffect(() => {
        if (activeGroup) {
            setEditData({
                name: activeGroup.conversation_name || "",
                headline: activeGroup.group_headline || "",
                description: activeGroup.description || "",
                avatar: activeGroup.group_avatar || ""
            });
            setInitialFormState({
                name: activeGroup.conversation_name || "",
                headline: activeGroup.group_headline || "",
                description: activeGroup.description || "",
                avatar: activeGroup.group_avatar || ""
            });
            setPreviewAvatar(activeGroup.group_avatar || null);
        }
    }, [activeGroup, activeView]);

    if (!activeGroup) return null;

    const currentMember = activeGroup.members?.find(m => m.user_id === currentUserId);
    const isAdmin = Boolean(currentMember?.role === 'admin' && !isInactive);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewAvatar(URL.createObjectURL(file));
        }
    };
    const handleSave = async () => {
        if (!validateForm()) return;
        await handleUpdateGroupDetails(selectedFile!);
        onClose('info')
    }

    const handleAvatarUpload = async (file: File) => {
        try {
            const urls = await uploadMedia([file], { syncProcessing: true });
            if (urls && urls.length > 0) {
                const avatarUrl = typeof urls[0] === 'string' ? urls[0] : urls[0].url;
                await updateGroupAvatar(activeGroup.conversation_id, avatarUrl);
            }
        } catch (err) {
            console.error("Failed to update group avatar:", err);
            toast({
                title: "Error",
                description: "Failed to update group avatar",
                variant: "destructive"
            });
        }
    };
    const handleUpdateGroupDetails = async (file: File) => {
        try {
            let avatarUrl: string | undefined = undefined;

            if (editData.avatar === '') {
                // user removed avatar
                avatarUrl = '';
            } else if (editData.avatar.startsWith('https')) {
                // no change - skip avatar field entirely so backend won't update it
                avatarUrl = undefined;
            } else if (editData.avatar.startsWith('data:')) {
                // new image from CocpitProfileUpload (base64)
                const base64Response = await fetch(editData.avatar);
                const blob = await base64Response.blob();
                const file = new File([blob], "group_avatar.jpg", { type: "image/jpeg" });

                const urls = await uploadMedia([file], { syncProcessing: true });
                if (urls && urls.length > 0) {
                    avatarUrl = typeof urls[0] === 'string' ? urls[0] : urls[0].url;
                }
            }

            await updateGroupDetails(activeGroup.conversation_id, {
                name: editData.name,
                headline: editData.headline,
                description: editData.description,
                ...(avatarUrl !== undefined && { avatar: avatarUrl })
            });

            refreshGroup();
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            onClose('info');
        } catch (err) {
            console.error("Failed to update group details:", err);
            toast({
                title: "Error",
                description: "Failed to update group details",
                variant: "destructive"
            });
        }
    };

    const handleAvatarDelete = async () => {
        try {
            await updateGroupAvatar(activeGroup.conversation_id, null);
        } catch (err) {
            console.error("Failed to update group:", err);
            toast({
                title: "Error",
                description: "Failed to update group profile",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        await removeMember(userId);
    };

    const visibleMembers = activeGroup.members
        .filter(m => !isInactive || m.user_id !== currentUserId)
        .sort((a, b) => {
            // 1. Current user always first among accepted
            if (a.user_id === currentUserId) return -1;
            if (b.user_id === currentUserId) return 1;

            // 2. Admins before members (among accepted)
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (b.role === 'admin' && a.role !== 'admin') return 1;

            // 3. Alphabetical by name
            return (a.full_name || "").localeCompare(b.full_name || "");
        });

    // FIX 1 & SECTION: Group Info Panel View
    const renderInfoPanel = () => (
        <div className="flex flex-col h-full bg-[var(--card)] animate-in slide-in-from-right duration-300">
            {/* FIX 1 — BACK BUTTON */}
            <div className="p-[24px] pb-0 flex items-center">
                <button
                    onClick={() => onClose('chat')}
                    className="flex flex-row justify-center items-center p-2 gap-[10px] w-12 h-12 border border-[var(--border)] backdrop-blur-sm rounded-[100px] shrink-0 transition-colors hover:bg-[var(--primary-tint)]"
                >
                    <ChevronLeft className="w-6 h-6 text-[var(--muted-foreground)]" style={{ strokeWidth: 1.5 }} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-8 scrollbar-hide">
                {/* 1. GROUP AVATAR */}
                <div className="flex flex-col items-center relative mt-4">
                    <div className="w-[80px] h-[80px] rounded-full overflow-hidden bg-muted flex-none mb-[8px]">
                        {activeGroup.group_avatar ? (
                            <Image src={activeGroup.group_avatar} alt={activeGroup.conversation_name} width={80} height={80} className="object-cover w-full h-full" />
                        ) : (
                            <div className="flex items-center justify-center h-full w-full bg-primary/10 text-primary text-2xl font-bold">
                                {(activeGroup.conversation_name || "G").substring(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>

                </div>

                {/* 2. GROUP NAME */}
                <span className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-[var(--foreground)] flex items-center justify-center  h-[26px] mt-[8px]">
                    {activeGroup.conversation_name}
                </span>

                {/* 3. HEADLINE ROW */}
                <div className="flex flex-row items-center justify-center mt-[8px]">
                    <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[var(--muted-foreground)] flex items-center  h-[16px]">
                        {activeGroup.group_headline || ""}
                    </span>
                    <span className="w-[6px] h-[6px] rounded-full bg-[var(--muted-foreground)] mx-[8px]" />
                    <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[var(--muted-foreground)] flex items-center w-[68px] h-[16px]">
                        {activeGroup.members.length} Members
                    </span>
                </div>

                {/* 4. EDIT ICON (ADMIN ONLY) - Below Divider */}
                {isAdmin && (
                    <div className="flex justify-center mt-[12px] mb-[28px]">
                        <button
                            onClick={() => setActiveView('edit')}
                            className="w-[16.75px] h-[16.75px] flex items-center justify-center text-[var(--primary-tint-foreground)]"
                        >
                            <Icon icon="lucide:pencil" className="w-full h-full" />
                        </button>
                    </div>
                )}

                {/* 5. MEMBER LIST + ADD MEMBER BUTTON ROW */}
                <div className="flex flex-row items-center justify-between mt-[28px] mb-[12px]">
                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)] w-[89px] h-[20px] text-center">
                        Members list
                    </span>
                    {isAdmin && (
                        <button
                            onClick={onAddMember}
                            className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[167px] h-[40px] bg-[var(--card)] border border-[var(--primary-tint-foreground)] rounded-[24px] hover:bg-[var(--primary-tint)] transition-colors"
                        >
                            <Plus className="w-4 h-4 text-[var(--primary-tint-foreground)]" style={{ strokeWidth: 1.5 }} />
                            <span
                                className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[var(--primary-tint-foreground)]"
                                style={{ width: '101px' }}
                            >
                                Add members
                            </span>
                        </button>
                    )}
                </div>

                {/* 6. MEMBER LIST (scrollable) */}
                <div className="flex flex-col  overflow-y-auto  max-h-[400px] pr-[2px]"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                    {visibleMembers.map((member) => {
                        const isSelf = member.user_id === currentUserId;
                        const isBlockedByOther = !isSelf && (Boolean(member.is_blocked_by_other) || isBlocked(member.user_id));
                        const isDeactivated = Boolean(member.is_deactivated);
                        const isDeleted = Boolean(member.is_deleted);
                        const isDeactivatedOrDeleted = isDeactivated || isDeleted || Boolean(member.is_unavailable);
                        const isUnknown = isBlockedByOther || isDeactivatedOrDeleted || member.full_name === "Unknown User" || member.full_name === "Unknown Page";
                        const displayName = isSelf ? "You" : (isUnknown ? (member.org_name ? "Unknown Page" : "Unknown User") : member.full_name);
                        const displayHeadline = isUnknown ? "User unavailable" : (member.headline || "Member");
                        const isCompany = Boolean(member.org_name);

                        return (
                            <div
                                key={member.user_id}
                                className="flex flex-row justify-between items-center py-[8px] gap-[8px] w-full h-[56px] bg-[var(--card)] rounded-[24px] relative"
                            >
                                {/* Left: Avatar */}
                                <div
                                    className={cn("w-[32px] h-[32px] shrink-0 self-stretch flex items-center justify-center", !isUnknown && "cursor-pointer")}
                                    onClick={() => {
                                        if (isUnknown) return;
                                        const returnTo = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/messaging';
                                        router.push(`/profile/${member.user_id}?returnTo=${encodeURIComponent(returnTo)}`);
                                    }}
                                >
                                    <SharedAvatar
                                        url={isUnknown ? undefined : member.avatar_url}
                                        name={displayName}
                                        size="sm"
                                        isCompany={isCompany}
                                        isUnknown={isUnknown}
                                        className="w-8 h-8"
                                    />
                                </div>

                                {/* Middle: Name + Headline + Admin badge */}
                                <div
                                    className={cn("flex flex-col flex-1 ml-[8px]", !isUnknown && "cursor-pointer")}
                                    onClick={() => {
                                        if (isUnknown) return;
                                        const returnTo = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/messaging';
                                        router.push(`/profile/${member.user_id}?returnTo=${encodeURIComponent(returnTo)}`);
                                    }}
                                >
                                    <span className={cn("font-['Poppins'] font-normal text-[16px] leading-[24px] text-[var(--foreground)] flex items-center gap-2", !isUnknown && "hover:underline")}>
                                        <span>{displayName}</span>
                                    </span>
                                    <div className="flex flex-row items-center">
                                        {displayHeadline && (
                                            <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[var(--muted-foreground)] flex items-center mr-[8px]">
                                                {displayHeadline}
                                            </span>
                                        )}
                                        {member.role === 'admin' && (
                                            <>
                                                <span className="w-[6px] h-[6px] rounded-full bg-[var(--primary)] mr-[8px]" />
                                                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[var(--primary)] flex items-center  h-[16px]">
                                                    Admin
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Right: 3-dot menu (only if isAdmin) */}
                                {isAdmin && (
                                    isUnknown ? (
                                        <TooltipProvider delayDuration={100}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        disabled
                                                        className="cursor-default opacity-40 p-1 outline-none bg-transparent border-none flex items-center justify-center"
                                                        aria-label="User unavailable"
                                                    >
                                                        <Icon
                                                            icon="mdi-light:dots-vertical"
                                                            width={24}
                                                            height={24}
                                                            style={{ color: 'var(--muted-foreground)' }}
                                                        />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="left"
                                                    className="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] font-['Poppins'] text-[12px] shadow-md z-[100]"
                                                >
                                                    <p>{isDeactivated ? "This user's account is deactivated" : (isDeleted ? "User account is deleted" : "User unavailable")}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <DropdownMenu onOpenChange={setIsDropdownOpen}>
                                            <DropdownMenuTrigger asChild>
                                                <Icon
                                                    icon="mdi-light:dots-vertical"
                                                    width={24}
                                                    height={24}
                                                    style={{ color: isDropdownOpen ? 'var(--primary)' : 'var(--foreground)' }}
                                                />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-[220px] p-[8px] mr-4  bg-[var(--card)] border border-[var(--border)] z-[100]"
                                                    style={{ borderRadius: '24px 0px 24px 24px' }}
                                                >
                                                    {member.user_id === currentUserId ? (
                                                        <DropdownMenuItem
                                                            onClick={() => setShowLeaveConfirm(true)}
                                                            className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--destructive)]/10 rounded-md transition-colors"
                                                        >
                                                            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--destructive)]">Leave group</span>
                                                            <LogOut className="w-[19px] h-[20px] text-[var(--destructive)]" strokeWidth={1} />
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <>
                                                            {member.role !== 'admin' ? (
                                                                <DropdownMenuItem onClick={() => setUserToMakeAdmin(member.user_id)} className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors">
                                                                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">Make admin</span>
                                                                    <Icon icon="material-symbols:admin-panel-settings-outline" width={24} height={24} color="var(--foreground)" />
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => setUserToDemote(member.user_id)} className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors">
                                                                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">Dismiss as admin</span>
                                                                    <Icon icon="solar:shield-minus-linear" width={24} height={24} color="var(--foreground)" />
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => setUserToShareProfile(member.user_id)} className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors">
                                                                <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">Share profile</span>
                                                                <Icon icon="fluent:share-16-regular" width={24} height={24} color="var(--foreground)" />
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setUserToReport(member.user_id)} className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors">
                                                                <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">Report profile</span>
                                                                <Info className="w-[24px] h-[24px] text-[var(--foreground)]" strokeWidth={1.5} />
                                                            </DropdownMenuItem>
                                                            {isBlocked(member.user_id) ? (
                                                                <DropdownMenuItem onClick={async () => {
                                                                    try {
                                                                        await unblockUser(member.user_id);
                                                                    } catch (err) { }
                                                                }} className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors">
                                                                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">Unblock profile</span>
                                                                    <Ban className="w-[24px] h-[24px] text-[var(--foreground)]" strokeWidth={1} />
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => setUserToBlock(member.user_id)} className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--primary-tint)] rounded-md transition-colors">
                                                                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">Block profile</span>
                                                                    <Ban className="w-[24px] h-[24px] text-[var(--foreground)]" strokeWidth={1} />
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() => setUserToRemove(member.user_id)}
                                                                className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--destructive)]/10 rounded-md transition-colors"
                                                            >
                                                                <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--destructive)]">Remove</span>
                                                                <Trash2 className="w-[19px] h-[20px] text-[var(--destructive)]" strokeWidth={1} />
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenu>
                                    )
                                )}
                            </div>
                        );
                    })}

                    {/* Pending Invitations Section (Admin Only) */}
                    {isAdmin && sentInvitations && sentInvitations.length > 0 && (
                        <>
                            <div className="flex flex-row items-center justify-between mt-[24px] mb-[12px]">
                                <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">
                                    Pending Invitations
                                </span>
                            </div>
                            {sentInvitations.map((invitation) => (
                                <div
                                    key={invitation.invitation_id}
                                    className="flex flex-row justify-between items-center py-[8px] gap-[8px] w-full h-[56px] bg-[var(--card)] rounded-[24px] relative"
                                >
                                    <div className="w-[32px] h-[32px] rounded-full overflow-hidden bg-muted shrink-0 self-stretch opacity-50">
                                        {invitation.invitee_avatar ? (
                                            <Image src={invitation.invitee_avatar} alt={invitation.invitee_name || ""} width={32} height={32} className="object-cover w-full h-full" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full bg-primary/10 text-primary text-[10px] font-bold">
                                                {(invitation.invitee_name || "U").substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1 ml-[8px] opacity-50">
                                        <span className="font-['Poppins'] font-normal text-[16px] leading-[24px] text-[var(--foreground)] flex items-center gap-2">
                                            <span>{invitation.invitee_name || "Invited User"}</span>
                                            <span className="bg-[#EEF2FF] border border-[#6366F1] rounded-[24px] px-[6px] py-[2px] font-['Poppins'] font-medium text-[10px] leading-[14px] text-[#6366F1] whitespace-nowrap z-10">
                                                Invited
                                            </span>
                                        </span>
                                    </div>
                                    <DropdownMenu onOpenChange={setIsDropdownOpen}>
                                        <DropdownMenuTrigger asChild>
                                            <Icon
                                                icon="mdi-light:dots-vertical"
                                                width={24}
                                                height={24}
                                                style={{ color: isDropdownOpen ? 'var(--primary)' : 'var(--foreground)' }}
                                            />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuContent
                                                align="end"
                                                className="w-[220px] p-[8px] mr-4  bg-[var(--card)] border border-[var(--border)] z-[100]"
                                                style={{ borderRadius: '24px 0px 24px 24px' }}
                                            >
                                                <DropdownMenuItem
                                                    onClick={() => setInvitationToCancel(invitation.invitation_id)}
                                                    className="flex items-center justify-between px-[16px] py-[10px] cursor-pointer hover:bg-[var(--destructive)]/10 rounded-md transition-colors"
                                                >
                                                    <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--destructive)]">Cancel invitation</span>
                                                    <Trash2 className="w-[19px] h-[20px] text-[var(--destructive)]" strokeWidth={1} />
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* 7. LEAVE GROUP & DELETE GROUP BUTTONS */}
                {!isInactive && (
                    <div className="mt-[24px]">
                        <div className="w-full flex items-center justify-between py-[10px]">
                            <button
                                onClick={() => setShowLeaveConfirm(true)}
                                className="bg-transparent border-none outline-none cursor-pointer"
                            >
                                <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-left text-[var(--destructive)] h-[20px]">
                                    Leave group
                                </span>
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="bg-transparent border-none outline-none cursor-pointer p-1 hover:bg-[var(--destructive)]/10 rounded transition-colors"
                                    title="Delete group"
                                >
                                    <Trash2 className="w-[19px] h-[20px] text-[var(--destructive)]" strokeWidth={1} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // Section 2: Edit Group Profile Form
    const renderEditForm = () => (
        <div className="flex flex-col h-full bg-[var(--card)] animate-in slide-in-from-right duration-300 overflow-y-auto scrollbar-hide">
            {/* FIX 1 — BACK BUTTON */}
            <div className="p-[24px] pb-0 flex items-center">
                <button
                    onClick={() => onClose('info')}
                    className="flex flex-row justify-center items-center p-2 gap-[10px] w-12 h-12 border border-[var(--border)] backdrop-blur-sm rounded-[100px] shrink-0 transition-colors hover:bg-[var(--primary-tint)]"
                >
                    <ChevronLeft className="w-6 h-6 text-[var(--muted-foreground)]" style={{ strokeWidth: 1.5 }} />
                </button>
            </div>

            <div className="p-4 md:p-0">
                {/* Avatar Section */}
                <div className="flex flex-col items-center">
                    <CocpitProfileUpload
                        value={editData.avatar}
                        onChange={(val) => setEditData({ ...editData, avatar: val })}
                        showCircle={true}
                        trigger={
                            <div className="relative group cursor-pointer">
                                <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-muted border-4 border-[var(--card)]">
                                    {editData.avatar ? (
                                        <Image src={editData.avatar} alt="Preview" width={100} height={100} className="object-cover w-full h-full" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full bg-primary/10 text-primary text-4xl font-bold">
                                            {editData.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Icon icon="solar:upload-linear" className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        }
                    />
                    <p className="font-['Poppins'] font-normal text-[14px] leading-[16px] text-center text-[var(--foreground)] mt-3">
                        Profile image
                    </p>
                </div>

                <div className="flex flex-col gap-[16px] mt-[16px] px-6 md:px-0">
                    {/* Group Name */}
                    <div className="flex flex-col items-start gap-[8px] w-full">
                        <Label htmlFor="group-name" className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">
                            Group name
                        </Label>
                        <Input
                            id="group-name"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="flex flex-row items-center px-[16px] py-[12px] w-full h-[48px] bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-700 text-[var(--foreground)] rounded-[12px] focus-visible:ring-1 focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)] transition-all placeholder:text-[var(--muted-foreground)]"
                            placeholder="Enter group name"
                        />
                        {formErrors.name && (
                            <p className="text-[var(--destructive)] text-[12px] font-['Poppins'] font-normal mt-[2px]">
                                {formErrors.name}
                            </p>
                        )}
                    </div>

                    {/* Group Headline */}
                    <div className="flex flex-col items-start gap-[8px] w-full">
                        <Label htmlFor="group-headline" className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">
                            Group headline
                        </Label>
                        <Input
                            id="group-headline"
                            value={editData.headline}
                            onChange={(e) => setEditData({ ...editData, headline: e.target.value })}
                            className="flex flex-row items-center px-[16px] py-[12px] w-full h-[48px] bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-700 text-[var(--foreground)] rounded-[12px] focus-visible:ring-1 focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)] transition-all placeholder:text-[var(--muted-foreground)]"
                            placeholder="Enter group headline"
                        />
                        {formErrors.headline && (
                            <p className="text-[var(--destructive)] text-[12px] font-['Poppins'] font-normal mt-[2px]">
                                {formErrors.headline}
                            </p>
                        )}
                    </div>

                    {/* Group Description */}
                    <div className="flex flex-col items-start gap-[8px] w-full">
                        <Label htmlFor="group-description" className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--foreground)]">
                            Group description
                        </Label>
                        <Input
                            id="group-description"
                            value={editData.description}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            className="flex flex-row items-center px-[16px] py-[12px] w-full h-[48px] bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-700 text-[var(--foreground)] rounded-[12px] focus-visible:ring-1 focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)] transition-all placeholder:text-[var(--muted-foreground)]"
                            placeholder="Describe your group"
                        />
                    </div>
                </div>

                <div className="flex flex-row items-center justify-center gap-[12px] mt-[24px]">
                    <button
                        onClick={() => setShowDiscardConfirm(true)}
                        className="flex flex-row justify-center items-center px-[24px] py-[10px] w-[146px] h-[40px] bg-transparent border border-[var(--primary)] rounded-full hover:bg-[var(--primary)]/10 transition-colors"
                    >
                        <span className="font-['Poppins'] font-medium text-[14px] leading-[20px] text-center text-[var(--primary)]">
                            Discard
                        </span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || !editData.name?.trim() || isSaving}
                        className={
                            hasChanges && editData.name?.trim() && !isSaving
                                ? "flex flex-row justify-center items-center px-[24px] py-[10px] w-[146px] h-[40px] bg-[var(--primary)] rounded-full cursor-pointer hover:opacity-90 transition-all font-['Poppins'] font-medium text-[14px] text-white shadow-sm"
                                : "flex flex-row justify-center items-center px-[24px] py-[10px] w-[146px] h-[40px] bg-[#E9ECEF] dark:bg-zinc-800 rounded-full cursor-default font-['Poppins'] font-medium text-[14px] text-[#ADB5BD] dark:text-zinc-500"
                        }
                    >
                        <span className="font-['Poppins'] font-medium text-[14px] leading-[20px] text-center">
                            Save
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full relative">
            {activeView === 'info' ? renderInfoPanel() : renderEditForm()}

            <CocpitConfirmBox
                isOpen={userToReport !== null}
                title="Report this profile?"
                message="We'll review this profile based on your report."
                confirmText="Report"
                cancelText="Cancel"
                onConfirm={async () => {
                    if (userToReport) {
                        try {
                            const reportRes = await createReport({
                                targetType: 'USER',
                                targetId: userToReport,
                                customReason: "Reported from group chat info panel"
                            });
                            toast({ description: reportRes.message || "Profile reported successfully" });
                        } catch (err: any) {
                            const errorMsg = err?.response?.data?.message || err?.message || "Failed to report profile";
                            toast({
                                title: "Error",
                                description: errorMsg,
                                variant: "destructive"
                            });
                        } finally {
                            setUserToReport(null);
                        }
                    }
                }}
                onCancel={() => setUserToReport(null)}
            />

            <CocpitConfirmBox
                isOpen={userToBlock !== null}
                title="Block this user?"
                message="They won't be able to message or find you"
                confirmText="Block"
                cancelText="Cancel"
                onConfirm={async () => {
                    if (userToBlock) {
                        try {
                            await blockUser(userToBlock);
                        } catch (err: any) {
                            // SocialContext already shows the specific API error toast
                        } finally {
                            setUserToBlock(null);
                        }
                    }
                }}
                onCancel={() => setUserToBlock(null)}
            />

            <CocpitConfirmBox
                isOpen={showDiscardConfirm}
                title="Discard all changes"
                confirmText="Discard"
                cancelText="Cancel"
                onConfirm={() => {
                    toast({ description: "Changes discarded" });
                    setShowDiscardConfirm(false);
                    onClose('info');
                }}
                onCancel={() => setShowDiscardConfirm(false)}
            />

            <CocpitConfirmBox
                isOpen={showLeaveConfirm}
                title="Leave this group?"
                message="You won't receive messages from this group anymore."
                confirmText="Leave"
                cancelText="Cancel"
                onConfirm={async () => {
                    try {
                        await leaveGroup(activeGroup.conversation_id);
                        onClose('chat');
                    } catch (err: any) {
                        const errorMsg = err?.response?.data?.message || err?.message || "Failed to leave group";
                        toast({
                            title: "Error",
                            description: errorMsg,
                            variant: "destructive"
                        });
                    } finally {
                        setShowLeaveConfirm(false);
                    }
                }}
                onCancel={() => setShowLeaveConfirm(false)}
            />

            <CocpitConfirmBox
                isOpen={showDeleteConfirm}
                title="Delete this group?"
                message="This will permanently delete the group for all members."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={async () => {
                    try {
                        await deleteGroup(activeGroup.conversation_id);
                        toast({ description: "Group deleted successfully" });
                        onClose('chat');
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

            <CocpitConfirmBox
                isOpen={invitationToCancel !== null}
                title="Cancel this invitation?"
                message="This user will no longer be invited to the group."
                confirmText="Cancel Invitation"
                cancelText="Keep Invited"
                onConfirm={async () => {
                    if (invitationToCancel) {
                        try {
                            await cancelInvitation(invitationToCancel);
                        } catch (err: any) {
                            const errorMsg = err?.response?.data?.message || err?.message || "Failed to cancel invitation";
                            toast({
                                title: "Error",
                                description: errorMsg,
                                variant: "destructive"
                            });
                        } finally {
                            setInvitationToCancel(null);
                        }
                    }
                }}
                onCancel={() => setInvitationToCancel(null)}
            />

            <CocpitConfirmBox
                isOpen={userToRemove !== null}
                title="Remove this member?"
                message="They won't be part of the group anymore."
                confirmText="Remove"
                cancelText="Cancel"
                onConfirm={async () => {
                    if (userToRemove) {
                        try {
                            await handleRemoveMember(userToRemove);
                        } catch (err: any) {
                            const errorMsg = err?.response?.data?.message || err?.message || "Failed to remove member";
                            toast({
                                title: "Error",
                                description: errorMsg,
                                variant: "destructive"
                            });
                        } finally {
                            setUserToRemove(null);
                        }
                    }
                }}
                onCancel={() => setUserToRemove(null)}
            />

            <CocpitConfirmBox
                isOpen={userToMakeAdmin !== null}
                title="Make this member admin?"
                message="They will be able to edit group details and manage members."
                confirmText="Confirm"
                cancelText="Cancel"
                onConfirm={async () => {
                    if (userToMakeAdmin) {
                        try {
                            await promoteToAdmin(userToMakeAdmin);
                        } catch (err: any) {
                            const errorMsg = err?.response?.data?.message || err?.message || "Failed to make member admin";
                            toast({
                                title: "Error",
                                description: errorMsg,
                                variant: "destructive"
                            });
                        } finally {
                            setUserToMakeAdmin(null);
                        }
                    }
                }}
                onCancel={() => setUserToMakeAdmin(null)}
            />

            <CocpitConfirmBox
                isOpen={userToDemote !== null}
                title="Dismiss as admin?"
                message="This member will no longer have admin privileges."
                confirmText="Dismiss"
                cancelText="Cancel"
                onConfirm={async () => {
                    if (userToDemote) {
                        try {
                            await updateMemberRole(userToDemote, 'member');
                        } catch (err: any) {
                            const errorMsg = err?.response?.data?.message || err?.message || "Failed to demote member";
                            toast({
                                title: "Error",
                                description: errorMsg,
                                variant: "destructive"
                            });
                        } finally {
                            setUserToDemote(null);
                        }
                    }
                }}
                onCancel={() => setUserToDemote(null)}
            />

            <CocpitShareModel
                isOpen={!!userToShareProfile}
                onClose={() => setUserToShareProfile(null)}
                profileId={userToShareProfile || undefined}
            />
        </div>
    );
}
