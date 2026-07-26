"use client";

import React, { useState } from "react";
import { LogOut, CheckCircle, MoreVertical, Share2, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { ProfileIdentityChips } from "../components/ProfileIdentityChips";
import { CompanyRolesList } from "../components/CompanyRolesList";
import EditCoverPhoto from "../components/EditCoverPhoto";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileHeaderProps {
    user: any;
    isOwnProfile: boolean;
    coverImage?: string | null;
    setCoverImage?: (url: string | null) => void;
    profileStats: any;
    latestExperience?: any;
    latestEducation?: any;
    
    // Callbacks for parents
    onAvatarClick?: () => void;
    onEditAvatarClick?: () => void;
    onContactInfoClick?: () => void;
    onEditProfileClick?: () => void;
    onShareProfileClick?: () => void;
    onFollowListClick?: (tab: "followers" | "following" | "connections") => void;
    onLogout?: () => void;
    onRoleClick?: (role: any) => void;
    scrollToExperience?: () => void;
    scrollToEducation?: () => void;

    // Public actions & dropdown slots (optional, from publicProfile feature)
    publicActions?: React.ReactNode;
    dropdownActions?: React.ReactNode;
}

export const ProfileHeader = React.memo(function ProfileHeader({
    user,
    isOwnProfile,
    coverImage,
    setCoverImage,
    profileStats,
    latestExperience,
    latestEducation,
    onAvatarClick,
    onEditAvatarClick,
    onContactInfoClick,
    onEditProfileClick,
    onShareProfileClick,
    onFollowListClick,
    onLogout,
    onRoleClick,
    scrollToExperience,
    scrollToEducation,
    publicActions,
    dropdownActions,
}: ProfileHeaderProps) {
    const router = useRouter();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [expImgError, setExpImgError] = useState(false);
    const [eduImgError, setEduImgError] = useState(false);

    const handleLogoutClick = () => {
        if (onLogout) {
            onLogout();
        } else {
            router.push("/");
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Profile link copied");
    };

    const profileIdentity = {
        openTo: user?.open_to || "",
        availability: user?.availability || "",
        workPreference: user?.work_preference || "",
    };

    const visibleRoles = user?.company_roles?.filter((r: any) => r.is_role_visible) || [];

    const coverContent = (
        <div className="h-[160px] relative rounded-b-[24px] overflow-hidden">
            {coverImage ? (
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
                <div
                    className="w-full h-full"
                    style={{ background: 'linear-gradient(186.03deg, #EEF2FF 4.68%, #6366F1 332.65%)' }}
                />
            )}
        </div>
    );

    const [avatarError, setAvatarError] = useState(false);
    const hasValidAvatar = Boolean(user?.avatar && !avatarError);
    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "C";

    return (
        <div className="w-full">
            {isOwnProfile && setCoverImage ? (
                <EditCoverPhoto coverImage={coverImage || null} setCoverImage={setCoverImage} portalContainerId="profile-card">
                    <div className="absolute top-3 right-3 md:hidden z-10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="bg-white/20 backdrop-blur-md text-white p-2 rounded-lg hover:bg-white/30 transition-all border border-white/20 flex items-center justify-center">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-card border-border text-foreground">
                                <DropdownMenuItem onSelect={() => router.push("/settings")}>
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => router.push("/analytics")}>
                                    Analytics
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleLogoutClick}>
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="hidden md:flex absolute top-3 right-3 gap-2 z-10">
                        <button onClick={() => router.push('/analytics')} className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all flex items-center gap-2 text-sm border border-white/20">
                            View Analytics
                        </button>
                    </div>
                    {coverContent}
                </EditCoverPhoto>
            ) : (
                <div className="relative w-full">
                    {coverContent}
                </div>
            )}

            <div className="px-0 pb-0">
                <div className="flex items-start justify-between -mt-[49px] md:-mt-[49px]">
                    <div className="relative group ml-[12px] md:ml-[34px]">
                        <div
                            className="w-[98px] h-[98px] relative cursor-pointer"
                            onClick={onAvatarClick}
                        >
                            {/* Top Half Border Only */}
                            <div className="absolute inset-0 rounded-full border-4 border-white shadow-sm [mask-image:linear-gradient(to_bottom,black_50%,transparent_50%)]" />

                            {/* Avatar Logo */}
                            <div className="absolute inset-[4px] rounded-full overflow-hidden bg-card flex items-center justify-center">
                                {hasValidAvatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user?.name || "Avatar"}
                                        className="w-full h-full object-cover"
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#EEF2FF] text-[#6366F1] font-light text-[48px] leading-none flex items-center justify-center font-[family-name:var(--font-poppins)] select-none">
                                        {userInitial}
                                    </div>
                                )}
                            </div>
                        </div>
                        {isOwnProfile && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onEditAvatarClick) onEditAvatarClick();
                                }}
                                className="absolute -bottom-1 -right-1 cursor-pointer z-10 hidden md:flex"
                                aria-label="Edit Profile Picture"
                            >
                                <div className="w-[28px] h-[28px] md:w-[36px] md:h-[36px] rounded-full bg-[#6366F1] flex items-center justify-center">
                                    <Icon icon="hugeicons:edit-03" className="w-6 h-6 text-white" style={{ strokeWidth: '1.5px' }} />
                                </div>
                            </button>
                        )}
                    </div>

                    {!isOwnProfile ? (
                        <div className="mt-12 mr-4 flex items-center gap-2 md:hidden">
                            <button
                                onClick={onContactInfoClick}
                                className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 outline-none"
                            >
                                <Icon icon="solar:phone-calling-linear" className="w-6 h-6" />
                            </button>
                            {publicActions}
                        </div>
                    ) : (
                        <button
                            onClick={onContactInfoClick}
                            className="md:hidden mt-12 mr-4 text-muted-foreground hover:text-primary transition-colors flex-shrink-0 outline-none"
                        >
                            <Icon icon="solar:phone-calling-linear" className="w-6 h-6" />
                        </button>
                    )}

                    <div className="hidden md:flex flex-col items-end mt-[59px] pr-[16px] gap-2">
                        {isOwnProfile ? (
                            <button
                                onClick={onContactInfoClick}
                                className="text-[14px] font-medium text-muted-foreground hover:text-primary transition-colors font-[family-name:var(--font-poppins)]"
                            >
                                Contact Info
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onContactInfoClick}
                                    className="text-[14px] font-medium text-muted-foreground hover:text-primary transition-colors font-[family-name:var(--font-poppins)]"
                                >
                                    Contact Info
                                </button>
                                {publicActions}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Section */}
                <div className="md:hidden w-full px-4 mt-6">
                    <div className="flex justify-between items-center w-full px-2">
                        <div onClick={() => onFollowListClick?.("following")} className="flex flex-col items-center cursor-pointer">
                            <span className="text-[16px] font-semibold text-primary font-[family-name:var(--font-poppins)]">{profileStats?.following_count || 0}</span>
                            <span className="text-[12px] text-muted-foreground font-[family-name:var(--font-poppins)]">Following</span>
                        </div>
                        <div className="w-[1px] h-8 bg-border"></div>
                        <div onClick={() => onFollowListClick?.("followers")} className="flex flex-col items-center cursor-pointer">
                            <span className="text-[16px] font-semibold text-primary font-[family-name:var(--font-poppins)]">{profileStats?.followers_count || 0}</span>
                            <span className="text-[12px] text-muted-foreground font-[family-name:var(--font-poppins)]">Followers</span>
                        </div>
                        <div className="w-[1px] h-8 bg-border"></div>
                        <div onClick={() => onFollowListClick?.("connections")} className="flex flex-col items-center cursor-pointer">
                            <span className="text-[16px] font-semibold text-primary font-[family-name:var(--font-poppins)]">{profileStats?.connections_count || 0}</span>
                            <span className="text-[12px] text-muted-foreground font-[family-name:var(--font-poppins)]">Connection</span>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex w-full h-[90px] items-center pt-[16px] pr-[16px] pb-[16px] pl-[40px] mt-[16px] mb-0">
                    <div className="flex gap-[16px] items-center w-full">
                        <button
                            onClick={() => onFollowListClick?.("following")}
                            className="flex-1 h-[58px] flex items-center justify-between p-[16px] rounded-[24px] cursor-pointer hover:opacity-90 transition-all bg-primary-tint"
                            style={{ boxShadow: '0px 0px 4px 0px #6366F10D' }}
                        >
                            <span className="text-[14px] leading-[20px] text-foreground font-normal font-[family-name:var(--font-poppins)]">Following</span>
                            <span className="text-[18px] leading-[26px] text-primary-tint-foreground font-medium font-[family-name:var(--font-poppins)]">{profileStats?.following_count || 0}</span>
                        </button>
                        <button
                            onClick={() => onFollowListClick?.("followers")}
                            className="flex-1 h-[58px] flex items-center justify-between p-[16px] rounded-[24px] cursor-pointer hover:opacity-90 transition-all bg-primary-tint"
                            style={{ boxShadow: '0px 0px 4px 0px #6366F10D' }}
                        >
                            <span className="text-[14px] leading-[20px] text-foreground font-normal font-[family-name:var(--font-poppins)]">Followers</span>
                            <span className="text-[18px] leading-[26px] text-primary-tint-foreground font-medium font-[family-name:var(--font-poppins)]">{profileStats?.followers_count || 0}</span>
                        </button>
                        <button
                            onClick={() => onFollowListClick?.("connections")}
                            className="flex-1 h-[58px] flex items-center justify-between p-[16px] rounded-[24px] cursor-pointer hover:opacity-90 transition-all bg-primary-tint"
                            style={{ boxShadow: '0px 0px 4px 0px #6366F10D' }}
                        >
                            <span className="text-[14px] leading-[20px] text-foreground font-normal font-[family-name:var(--font-poppins)]">Connection</span>
                            <span className="text-[18px] leading-[26px] text-primary-tint-foreground font-medium font-[family-name:var(--font-poppins)]">{profileStats?.connections_count || 0}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-start w-full pt-[16px] px-4 md:pr-[16px] pb-[16px] md:pl-[40px] md:gap-[100px]">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1 w-full">
                        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap min-w-0">
                            <h1 className="text-[20px] md:text-[24px] font-semibold text-foreground leading-[28px] md:leading-[32px] font-[family-name:var(--font-poppins)] tracking-tight truncate md:overflow-visible md:text-clip md:whitespace-nowrap">{user?.name}</h1>

                            {visibleRoles.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap md:flex-nowrap min-w-0">
                                    <div className="flex items-center gap-[10px] px-[16px] py-[8px] bg-primary-tint rounded-[24px] border border-transparent flex-shrink-0 w-fit h-[36px]">
                                        <Icon icon="solar:buildings-linear" className="w-5 h-5" style={{ color: 'var(--pill-text-refined)' }} />
                                        <span className="text-[12px] font-normal leading-[16px] font-[family-name:var(--font-poppins)] whitespace-nowrap" style={{ color: 'var(--pill-text-refined)' }}>
                                            {visibleRoles[0].role} at {visibleRoles[0].name}
                                        </span>
                                    </div>

                                    {visibleRoles.length > 1 && (
                                        <span className="text-[12px] font-medium text-muted-foreground whitespace-nowrap bg-muted px-2 py-0.5 rounded-full border border-border">
                                            + {visibleRoles.length - 1} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Three Dots Menu for Mobile */}
                        <div className="md:hidden shrink-0">
                            <DropdownMenu onOpenChange={setIsProfileMenuOpen}>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn(
                                        "flex items-center justify-center w-8 h-8 outline-none border-none focus:outline-none rounded-full transition-colors",
                                        isProfileMenuOpen ? "bg-[#EEF2FF] text-[#6366F1]" : "text-foreground"
                                    )}>
                                        <Icon icon="ph:dots-three-outline-vertical-light" className="w-6 h-6" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    sideOffset={8}
                                    alignOffset={0}
                                    className="w-[180px] border border-[#C7D2FE] p-[8px] bg-card flex flex-col gap-1 rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg"
                                >
                                    {isOwnProfile ? (
                                        <>
                                            <DropdownMenuItem
                                                onClick={onEditProfileClick}
                                                className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-primary-tint focus:text-primary-tint-foreground rounded-xl outline-none group transition-colors"
                                            >
                                                <span className="text-sm font-medium text-foreground group-focus:text-primary-tint-foreground">Edit profile</span>
                                                <Icon icon="hugeicons:edit-03" className="w-6 h-6 text-foreground group-focus:text-primary-tint-foreground transition-colors" style={{ strokeWidth: '1.5px' }} />
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={onShareProfileClick}
                                                className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none group transition-colors"
                                            >
                                                <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Share profile</span>
                                                <Icon icon="fluent:share-16-regular" className="w-6 h-6 text-black group-focus:text-[#6366F1] transition-colors" style={{ strokeWidth: '1.5px' }} />
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={handleCopyLink}
                                                className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none group transition-colors"
                                            >
                                                <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Copy link</span>
                                                <Icon icon="solar:copy-outline" className="w-6 h-6 text-black group-focus:text-[#6366F1] transition-colors" style={{ strokeWidth: '1.5px' }} />
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        dropdownActions
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {user?.headline && (
                        <p className="text-[16px] font-normal text-foreground leading-[24px] font-[family-name:var(--font-poppins)] mb-4">
                            {user?.headline}
                        </p>
                    )}

                    {(user?.location || user?.website) && (
                        <div className="flex flex-col gap-2 mb-4">
                            {user?.location && (
                                <div className="flex items-center gap-2 text-[12px] font-normal text-muted-foreground leading-[16px] font-[family-name:var(--font-poppins)]">
                                    <span>{user?.location}</span>
                                </div>
                            )}
                            {user?.website && (
                                <div className="flex items-center gap-2 text-[12px] font-normal text-primary leading-[16px] font-[family-name:var(--font-poppins)] hover:underline">
                                    <a href={user.website} target="_blank" rel="noopener noreferrer">{user.website}</a>
                                </div>
                            )}
                        </div>
                    )}

                    <ProfileIdentityChips initialIdentity={profileIdentity} readOnly />
                </div>

                <div className="hidden md:flex items-start gap-[24px] pt-0 shrink-0 w-[308px]">
                    <div className="flex flex-col gap-4">
                        {latestExperience && (
                            <div onClick={scrollToExperience} className="flex items-center group cursor-pointer relative w-[260px] h-[40px] hover:bg-secondary/50 rounded-xl transition-colors">
                                <div className="flex items-center gap-[10px]">
                                    <div className={cn(
                                        "w-[56px] h-[40px] rounded-[24px] flex items-center justify-center flex-shrink-0 overflow-hidden",
                                        ((latestExperience.logo_url || latestExperience.company_logo) && !expImgError) ? "bg-secondary" : "bg-[#E0E7FF] px-[16px] py-[8px]"
                                    )}>
                                        {(latestExperience.logo_url || latestExperience.company_logo) && !expImgError ? (
                                            <img
                                                src={latestExperience.logo_url || latestExperience.company_logo}
                                                alt={latestExperience.company_name}
                                                className="w-full h-full object-contain"
                                                onError={() => setExpImgError(true)}
                                            />
                                        ) : (
                                            <Icon icon="lucide:building-2" className="w-6 h-6 text-primary" style={{ strokeWidth: '1.5px' }} />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[16px] font-normal text-foreground leading-[24px] font-[family-name:var(--font-poppins)] truncate w-[180px]">{latestExperience.company_name}</span>
                                        <span className="text-[12px] font-normal text-muted-foreground leading-[16px] font-[family-name:var(--font-poppins)] truncate w-[180px]">{latestExperience.title}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {latestEducation && (
                            <div onClick={scrollToEducation} className="flex items-center group cursor-pointer relative w-[260px] h-[40px] hover:bg-secondary/50 rounded-xl transition-colors">
                                <div className="flex items-center gap-[10px]">
                                    <div className={cn(
                                        "w-[56px] h-[40px] rounded-[24px] flex items-center justify-center flex-shrink-0 overflow-hidden",
                                        (latestEducation.school_logo && !eduImgError) ? "bg-secondary" : "bg-[#E0E7FF] px-[16px] py-[8px]"
                                    )}>
                                        {latestEducation.school_logo && !eduImgError ? (
                                            <img
                                                src={latestEducation.school_logo}
                                                alt="School Logo"
                                                className="w-full h-full object-contain"
                                                onError={() => setEduImgError(true)}
                                            />
                                        ) : (
                                            <Icon icon="qlementine-icons:education-24" className="w-6 h-6 text-primary" style={{ strokeWidth: '1.5px' }} />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[16px] font-normal text-foreground leading-[24px] font-[family-name:var(--font-poppins)] truncate w-[180px]">
                                            {latestEducation.school_name || latestEducation.school || 'University'}
                                        </span>
                                        <span className="text-[12px] font-normal text-muted-foreground leading-[16px] font-[family-name:var(--font-poppins)] truncate w-[180px]">{latestEducation.degree}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="ml-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center justify-center w-6 h-6 text-foreground data-[state=open]:text-primary-tint-foreground data-[state=open]:bg-primary-tint outline-none border-none focus:outline-none rounded-full transition-colors">
                                    <Icon icon="ph:dots-three-outline-vertical-light" className="w-6 h-6" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                sideOffset={8}
                                alignOffset={0}
                                className="w-[180px] border border-[#C7D2FE] p-[8px] bg-card flex flex-col gap-1 rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg"
                            >
                                {isOwnProfile ? (
                                    <>
                                        <DropdownMenuItem
                                            onClick={onEditProfileClick}
                                            className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-primary-tint focus:text-primary-tint-foreground rounded-xl outline-none group transition-colors"
                                        >
                                            <span className="text-sm font-medium text-foreground group-focus:text-primary-tint-foreground">Edit profile</span>
                                            <Icon icon="hugeicons:edit-03" className="w-6 h-6 text-foreground group-focus:text-primary-tint-foreground transition-colors" style={{ strokeWidth: '1.5px' }} />
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={onShareProfileClick}
                                            className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none group transition-colors"
                                        >
                                            <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Share profile</span>
                                            <Icon icon="fluent:share-16-regular" className="w-6 h-6 text-black group-focus:text-[#6366F1] transition-colors" style={{ strokeWidth: '1.5px' }} />
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleCopyLink}
                                            className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none group transition-colors"
                                        >
                                            <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Copy link</span>
                                            <Icon icon="solar:copy-outline" className="w-6 h-6 text-black group-focus:text-[#6366F1] transition-colors" style={{ strokeWidth: '1.5px' }} />
                                        </DropdownMenuItem>
                                    </>
                                ) : (
                                    dropdownActions
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    );
});
