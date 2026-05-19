
"use client";

import React, { useMemo } from "react";
import { MessageCircle, UserPlus, UserCheck, CheckCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProfileIdentityChips } from "@/components/profile/ProfileIdentityChips";
import { CompanyRoleModal } from "./CompanyRoleModal";
import { Building2 } from "lucide-react";
import { User } from "@/types/user";
import { ConnectionButton } from "@/components/profile/ConnectionButton";
import { CompanyRolesList } from "./CompanyRolesList";
import { SendOfferDialog } from "./SendOfferDialog";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import { Share2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { ReportModal } from "@/components/shared/ReportModal";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

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
import { getMyConnections, getFollowers, getFollowing } from "@/services/api/social";

// ... existing component props ...

// HMR Trigger 2
export const ProfileHeader = React.memo(function ProfileHeader({
    user,
    isOwnProfile,
    isUserFollowing,
    isFollowLoading,
    onFollowToggle,
    onMessage,
    onAvatarClick,
}: ProfileHeaderProps) {
    const router = useRouter();
    const { blockUser } = useSocial();
    const [showBlockDialog, setShowBlockDialog] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Fetch following list for share modal
    const { data: followingData = [] } = useQuery({
        queryKey: ['following', user.id],
        queryFn: () => getFollowing(user.id),
        staleTime: 1000 * 60 * 5,
    });

    const shareUsers = useMemo(() =>
        followingData.map((f: any) => ({
            id: f.following_id,
            name: f.full_name,
            avatar: f.avatar_url || undefined,
        })),
        [followingData]
    );

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
        window.location.reload();
    };

    const [selectedRole, setSelectedRole] = useState<import("@/types/user").CompanyRole | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

    const handleRoleClick = (role: import("@/types/user").CompanyRole) => {
        setSelectedRole(role);
        setIsRoleModalOpen(true);
    };

    return (
        <div className="max-w-[998px] w-full mx-auto rounded-[24px] overflow-hidden border mb-4 relative bg-card border-border">

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

            <div className="h-[160px] relative rounded-b-[24px] overflow-hidden">
                {user.cover_image ? (
                    <img src={user.cover_image} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#4169E1] via-[#A855F7] to-[#EC4899]"></div>
                )}
            </div>

            <div className="px-6 pb-6">
                <div className="flex items-start justify-between -mt-10 sm:-mt-14 mb-4 relative z-10">
                    <div
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-card overflow-hidden flex-shrink-0 relative cursor-pointer"
                        onClick={onAvatarClick}
                    >
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="mt-12 sm:mt-16 flex items-center gap-2">
                        {!isOwnProfile ? (
                            <>
                                <button
                                    onClick={onMessage}
                                    title="Message"
                                    className="bg-background hover:bg-muted text-foreground border border-input p-2 sm:px-4 sm:py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <MessageCircle className="w-5 h-5 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Message</span>
                                </button>
                                <SendOfferDialog targetUserId={user.id} targetUserName={user.name} />
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
                            </>
                        ) : null}

                        {/* Dropdown Menu for More Actions */}
                        <DropdownMenu onOpenChange={setIsMenuOpen}>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "hover:bg-muted border border-input p-2 rounded-lg transition-colors flex items-center justify-center transition-all",
                                    isMenuOpen ? "bg-[#EEF2FF] text-[#6366F1] border-transparent" : "bg-background text-foreground"
                                )}>
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {!isOwnProfile && (
                                    <ConnectionButton
                                        asMenuItem
                                        userId={user.id}
                                        isFollowing={user.is_following || false}
                                        isFollowedBy={user.is_followed_by || false}
                                        connectionRequestStatus={user.connection_request_status}
                                        connectionRequestId={user.connection_request_id}
                                        connectionRequestSender={user.connection_request_sender}
                                    />
                                )}
                                <DropdownMenuItem onClick={() => setIsShareModalOpen(true)} className="cursor-pointer">
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success("Profile link copied");
                                    }}
                                    className="cursor-pointer"
                                >
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                    Copy Profile Link
                                </DropdownMenuItem>
                                {!isOwnProfile && (
                                    <>
                                        <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="cursor-pointer">
                                            <Flag className="w-4 h-4 mr-2" />
                                            Report Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowBlockDialog(true)} className="text-destructive focus:text-destructive cursor-pointer">
                                            <Ban className="w-4 h-4 mr-2" />
                                            Block User
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h1 className="text-2xl font-semibold text-foreground">{user.name}</h1>
                        <CheckCircle className="w-5 h-5 text-primary fill-primary/10 flex-shrink-0" />
                        {user.connectionStatus !== "none" && (
                            <span className="text-sm text-muted-foreground">
                                · {user.connectionStatus === "connected" ? "1st" : "2nd"}
                            </span>
                        )}
                    </div>

                    {user.account_name && (
                        <p className="text-sm text-muted-foreground mb-1.5 truncate max-w-xs">@{user.account_name}</p>
                    )}

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

                    <p className="text-base mb-2 text-foreground">
                        {(() => {
                            const words = (user.headline || "").split(/\s+/).filter(Boolean);
                            if (words.length > 200) {
                                return words.slice(0, 200).join(" ") + "...";
                            }
                            return user.headline;
                        })()}
                    </p>

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

            <CocpitShareModel
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                users={shareUsers}
                profileId={user?.id}
                onShare={(selectedIds) => {
                    console.log("Shared profile with:", selectedIds);
                    setIsShareModalOpen(false);
                }}
            />

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType="USER"
                targetId={user.id}
            />
        </div>
    );
});
