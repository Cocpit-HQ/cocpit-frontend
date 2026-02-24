
"use client";

import React from "react";
import { MessageCircle, UserPlus, UserCheck, CheckCircle } from "lucide-react";
import { ProfileIdentityChips } from "@/components/profile/ProfileIdentityChips";
import { CompanyRoleModal } from "./CompanyRoleModal";
import { Building2 } from "lucide-react";
import { User } from "@/types/user";
import { ConnectionButton } from "@/components/profile/ConnectionButton";
import { CompanyRolesList } from "./CompanyRolesList";

interface ProfileHeaderProps {
    user: User;
    isOwnProfile: boolean;
    isUserFollowing: boolean;
    isFollowLoading: boolean;
    onFollowToggle: () => void;
    onMessage: () => void;
    onAvatarClick: () => void;
}

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Ban } from "lucide-react";
import { useSocial } from "@/context/SocialContext";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// ... existing component props ...

// HMR Trigger 2
export function ProfileHeader({
    user,
    isOwnProfile,
    isUserFollowing,
    isFollowLoading,
    onFollowToggle,
    onMessage,
    onAvatarClick,
}: ProfileHeaderProps) {
    const { blockUser } = useSocial();
    const [showBlockDialog, setShowBlockDialog] = useState(false);

    // Read connection status directly from the same cache as ConnectionButton
    const { data: relationship } = useQuery<any>({
        queryKey: ['relationship', user.id],
        queryFn: () => null, // Dummy function since enabled is false
        enabled: false, // We only want to read from cache, not fetch it again here to avoid duplicate requests
    });

    // Determine effective connection status
    const isActuallyConnected = relationship?.status === 'connected' || user.connectionStatus === 'connected';

    const handleBlock = async () => {
        await blockUser(user.id);
        setShowBlockDialog(false);
        // Note: The page might need refresh or redirect, but 404 block logic handles view.
        // For smoother UX, maybe router.push('/feed')? 
        // Let's assume the component consuming this might handle it, or we force it here.
        // For now, allow Optimistic UI to take effect (clears following) and Toast to show.
        // A reload will show 404.
        window.location.reload();
    };

    const [selectedRole, setSelectedRole] = useState<import("@/types/user").CompanyRole | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

    const handleRoleClick = (role: import("@/types/user").CompanyRole) => {
        setSelectedRole(role);
        setIsRoleModalOpen(true);
    };

    return (
        <div className="rounded-xl overflow-hidden border mb-4 relative bg-card border-border">
            {/* Block Confirmation Dialog */}
            <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Block {user.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            They will not be able to find your profile, posts, or message you. This will also remove any connection between you.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBlock} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Block
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="h-36 bg-gradient-to-r from-[#4169E1] via-[#A855F7] to-[#EC4899] relative"></div>

            <div className="px-6 pb-6">
                <div className="flex items-start justify-between -mt-14 mb-4">
                    <div
                        className="w-32 h-32 rounded-full border-4 border-background bg-card overflow-hidden flex-shrink-0 relative cursor-pointer"
                        onClick={onAvatarClick}
                    >
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {!isOwnProfile && (
                        <div className="mt-16 flex gap-2">
                            <button
                                onClick={onMessage}
                                className="bg-background hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Message
                            </button>
                            <ConnectionButton
                                userId={user.id}
                                isFollowing={user.is_following || false}
                                isFollowedBy={user.is_followed_by || false}
                                connectionRequestStatus={user.connection_request_status}
                                connectionRequestId={user.connection_request_id}
                                connectionRequestSender={user.connection_request_sender}
                            />
                            {!isActuallyConnected && (
                                <button
                                    onClick={onFollowToggle}
                                    disabled={isFollowLoading}
                                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${isUserFollowing
                                        ? "bg-muted text-foreground hover:bg-muted/80"
                                        : "bg-primary text-primary-foreground hover:opacity-90"
                                        } ${isFollowLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {isUserFollowing ? (
                                        <>
                                            <UserCheck className="w-4 h-4" />
                                            Following
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            Follow
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Dropdown Menu for More Actions */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="bg-background hover:bg-muted text-foreground border border-input p-2 rounded-lg transition-colors flex items-center justify-center">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setShowBlockDialog(true)} className="text-destructive focus:text-destructive cursor-pointer">
                                        <Ban className="w-4 h-4 mr-2" />
                                        Block User
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl text-foreground">{user.name}</h1>
                        <CheckCircle className="w-5 h-5 text-primary fill-primary/10" />
                        {user.connectionStatus !== "none" && (
                            <span className="text-sm text-muted-foreground">
                                · {user.connectionStatus === "connected" ? "1st" : "2nd"}
                            </span>
                        )}
                    </div>

                    {/* Company Roles */}
                    {user.company_roles && user.company_roles.length > 0 && (
                        <div className="mb-3">
                            <CompanyRolesList
                                roles={user.company_roles}
                                isOwnProfile={isOwnProfile}
                                onRoleClick={handleRoleClick}
                            />
                        </div>
                    )}

                    <p className="text-base mb-2 text-foreground">{user.headline}</p>

                    <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
                        <span>{user.location}</span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                        {user.mutualConnections} mutual connections
                    </p>

                    {/* Identity Chips - Read Only */}
                    {user.identity && (
                        <ProfileIdentityChips initialIdentity={user.identity} readOnly />
                    )}
                </div>
            </div>


            <CompanyRoleModal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                role={selectedRole}
                isOwnProfile={isOwnProfile}
            />
        </div >
    );
}
