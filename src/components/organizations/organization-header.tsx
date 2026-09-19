"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { EditAvatarModal, EditCoverPhoto } from "@/shared/commonComponents/Cocpitprofileupload";
import { Skeleton } from "@/components/ui/skeleton";
import { Company, companyService } from "@/services/organization.service";
import { BadgeCheck, MapPin, Globe, Users, PenBox, UserPlus, UserMinus, Loader2, LayoutDashboard, Eye, Network } from "lucide-react";
import Link from "next/link";
import { getProfileViewCount } from "@/services/api/dashboard";
import { useCompanyPermissions } from "@/components/organizations/hooks/use-company";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useSocial } from "@/context/SocialContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OrganizationFollowersModal } from "@/components/organizations/OrganizationFollowersModal";
import { OrganizationNotificationBell } from "@/components/organizations/OrganizationNotificationBell";
import { UniversalShareModal } from "@/components/share/UniversalShareModal";
import { EnrollmentRequestModal } from "@/components/organizations/EnrollmentRequestModal";
import { MoreHorizontal, Share2, Link as LinkIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrganizationHeaderProps {
    company?: Company;
    isLoading: boolean;
}

export function OrganizationHeader({ company, isLoading }: OrganizationHeaderProps) {
    const { isOwner, isAdmin, checkPermission } = useCompanyPermissions(company);
    const { activeProfile } = useActiveProfile();
    const { syncFollowStatus } = useSocial();
    const queryClient = useQueryClient();
    const [isEditAvatarOpen, setIsEditAvatarOpen] = useState(false);
    const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Permission check for editing
    const canManageCompany = isOwner || checkPermission("MANAGE_SETTINGS");

    const { data: relationship, isLoading: isRelationshipLoading } = useQuery({
        queryKey: ["company_relationship", company?.company_id || company?.org_id],
        queryFn: () => companyService.getRelationship((company!.company_id || company!.org_id)!),
        enabled: !!(company?.company_id || company?.org_id),
    });

    const { data: viewCountData } = useQuery({
        queryKey: ['companyViewCount', company?.company_id || company?.org_id],
        queryFn: () => getProfileViewCount((company?.company_id || company?.org_id)!, 'organization'),
        enabled: !!(company?.company_id || company?.org_id),
    });

    const followMutation = useMutation({
        mutationFn: () => {
            const id = company?.company_id || company?.org_id;
            if (!id) throw new Error("Company ID missing");
            return companyService.followCompany(id);
        },
        onSuccess: () => {
            const id = company?.company_id || company?.org_id;
            if (id) syncFollowStatus(id, true);
            queryClient.invalidateQueries({ queryKey: ["company_relationship", id] });
            queryClient.invalidateQueries({ queryKey: ["company_followers", id] });
            if (company?.slug) {
                queryClient.invalidateQueries({ queryKey: ["company", company.slug] });
            }
            queryClient.invalidateQueries({ queryKey: ["profileStats"] });
            queryClient.invalidateQueries({ queryKey: ["following"] });
            toast.success(`Followed ${company?.name}`);
        },
        onError: (err: any) => {
            toast.error(companyService.normalizeError(err));
        }
    });

    const unfollowMutation = useMutation({
        mutationFn: () => {
            const id = company?.company_id || company?.org_id;
            if (!id) throw new Error("Company ID missing");
            return companyService.unfollowCompany(id);
        },
        onSuccess: () => {
            const id = company?.company_id || company?.org_id;
            if (id) syncFollowStatus(id, false);
            queryClient.invalidateQueries({ queryKey: ["company_relationship", id] });
            queryClient.invalidateQueries({ queryKey: ["company_followers", id] });
            if (company?.slug) {
                queryClient.invalidateQueries({ queryKey: ["company", company.slug] });
            }
            queryClient.invalidateQueries({ queryKey: ["profileStats"] });
            queryClient.invalidateQueries({ queryKey: ["following"] });
            toast.success(`Unfollowed ${company?.name}`);
        },
        onError: (err: any) => {
            toast.error(companyService.normalizeError(err));
        }
    });

    const isFollowing = relationship?.isFollowing;
    const followerCount = relationship?.followerCount || 0;
    const isActionLoading = followMutation.isPending || unfollowMutation.isPending;
    const isOrgActor = activeProfile?.type === "COMPANY";

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-[160px] w-full rounded-b-lg" />
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col md:flex-row gap-6 relative">
                        <div className="-mt-16 relative">
                            <Skeleton className="h-32 w-32 rounded-xl border-4 border-background" />
                        </div>
                        <div className="flex-1 space-y-2 pt-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="pt-2 flex gap-2">
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!company) return null;

    // Resolve company ID: backend returns org_id, interface declares company_id
    const companyId = company.company_id || company.org_id || "";

    const handleLogoUpload = async (file: File) => {
        const formData = new FormData();
        formData.append("avatar", file); // Backend expects 'avatar' field for uploadAvatar middleware
        await companyService.uploadLogo(companyId, formData);
        queryClient.invalidateQueries({ queryKey: ["company_relationship", companyId] });
        // Also invalidate company details to refresh logo
        queryClient.invalidateQueries({ queryKey: ["company", company.slug] });
    };

    const handleLogoDelete = async () => {
        await companyService.deleteLogo(companyId);
        queryClient.invalidateQueries({ queryKey: ["company", company.slug] });
    };

    const handleCoverUpload = async (formData: FormData) => {
        const res = await companyService.uploadCover(companyId, formData);
        queryClient.invalidateQueries({ queryKey: ["company", company.slug] });
        return { coverUrl: res.url };
    };

    const handleCoverDelete = async () => {
        await companyService.deleteCover(companyId);
        queryClient.invalidateQueries({ queryKey: ["company", company.slug] });
    };

    const ActionButtons = ({ className }: { className?: string }) => {
        const canAccessDashboard = isOwner ||
            checkPermission("MANAGE_COMPANY") ||
            checkPermission("MANAGE_ROLES") ||
            checkPermission("VIEW_MEMBERS") ||
            checkPermission("MANAGE_MEMBERS");

        // Note: The frontend uses the Company interface, but at runtime it contains entity_type
        const isInstitution = (company as any)?.entity_type === 'INSTITUTION';
        const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);

        return (
            <div className={`flex gap-2 ${className}`}>
                {canAccessDashboard ? (
                    <Button asChild variant="outline" size="sm" className="w-full md:w-auto">
                        <Link href={`/organization/${company?.slug}/dashboard`}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                ) : (
                    <>
                        {!isOrgActor && isInstitution && !company?.viewer_role_data && (
                            <Button
                                onClick={() => setIsEnrollmentModalOpen(true)}
                                size="sm"
                                className="w-full md:w-auto font-semibold bg-primary"
                            >
                                Join as Student
                            </Button>
                        )}
                        {!isOrgActor && (
                            <>
                                <Button
                                    onClick={() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
                                    variant={isFollowing ? "outline" : "default"}
                                    disabled={isActionLoading || isRelationshipLoading}
                                    className="w-full md:w-auto min-w-[120px]"
                                    size="sm"
                                >
                                    {isActionLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : isFollowing ? (
                                        <UserMinus className="mr-2 h-4 w-4" />
                                    ) : (
                                        <UserPlus className="mr-2 h-4 w-4" />
                                    )}
                                    {isFollowing ? "Unfollow" : "Follow"}
                                </Button>
                                {isFollowing && companyId && (
                                    <OrganizationNotificationBell
                                        companyId={companyId}
                                        isFollowing={true}
                                    />
                                )}
                            </>
                        )}

                        {!isOrgActor && isInstitution && company && (
                            <EnrollmentRequestModal
                                key="enrollment-modal"
                                isOpen={isEnrollmentModalOpen}
                                onClose={() => setIsEnrollmentModalOpen(false)}
                                orgId={companyId}
                                orgName={company.name}
                            />
                        )}
                    </>
                )}

                {/* Common Action Menu (Share/Copy) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-muted">
                            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => setIsShareModalOpen(true)} className="cursor-pointer">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success("Profile link copied");
                            }}
                            className="cursor-pointer"
                        >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Copy URL
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    };

    return (
        <div id="profile-card" className="w-full relative group mt-0 md:mt-6 mb-6">
            {/* Cover Image */}
            <div className="h-[160px] w-full relative bg-muted group/cover rounded-[24px] overflow-hidden">
                {canManageCompany ? (
                    <EditCoverPhoto
                        coverImage={company?.cover_url || null}
                        setCoverImage={() => { }} // State handled by query invalidation
                        onUpload={handleCoverUpload}
                        onDelete={handleCoverDelete}
                        portalContainerId="profile-card"
                    >
                        <div className="h-[160px] w-full bg-muted relative">
                        </div>
                    </EditCoverPhoto>
                ) : (
                    <div className="h-[160px] w-full bg-muted relative">
                        {company?.cover_url ? (
                            <img src={company.cover_url} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <img src="/assets/coverphoto.jpg" alt="Default Cover" className="w-full h-full object-cover" />
                        )}
                    </div>
                )}
            </div>

            <div className="px-4 md:px-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Logo & Mobile Actions - Row on mobile */}
                    <div className="-mt-[60px] w-full md:w-auto flex justify-between items-end relative z-10">
                        <div className="relative group ml-[14px]">
                            <Avatar className="h-[120px] w-[120px] rounded-xl border-4 border-background bg-background shadow-md cursor-pointer" onClick={() => canManageCompany && setIsEditAvatarOpen(true)}>
                                <AvatarImage src={company?.logo_url} className="object-cover" />
                                <AvatarFallback className="text-4xl font-bold rounded-xl text-primary/70 bg-muted">
                                    {company?.name?.slice(0, 1).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            {canManageCompany && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditAvatarOpen(true);
                                    }}
                                    className="absolute bottom-1 right-1 p-2 bg-background border border-border rounded-full text-muted-foreground hover:text-foreground shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                    aria-label="Edit Logo"
                                >
                                    <PenBox className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Mobile Actions - Visible on mobile, hidden on desktop */}
                        <ActionButtons className="md:hidden mb-1" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-2 pt-2 pb-6">
                        <div className="flex flex-col md:flex-row items-start md:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{company?.name}</h1>
                                    {(company?.verification_status === 'DOMAIN_VERIFIED' || company?.verification_status === 'VERIFIED') && (
                                        <BadgeCheck className="h-6 w-6 text-white bg-blue-500 rounded-full p-[2px]" />
                                    )}
                                </div>
                                <p className="text-muted-foreground text-lg mt-1">
                                    {(company as any)?.entity_type === 'INSTITUTION' ? (
                                        <>
                                            {company?.institution_type ? `${company.institution_type} • ` : ''}
                                            {company?.member_count || 0} members
                                        </>
                                    ) : (
                                        <>
                                            {company?.headline ? `${company.headline} • ` : ''}
                                            {company?.industry} • {company?.size}{company?.size && !company.size.toLowerCase().includes('employee') ? ' employees' : ''}
                                        </>
                                    )}
                                </p>
                                {company?.slogan && (
                                    <p className="text-muted-foreground/80 text-sm italic mt-1">
                                        &ldquo;{company.slogan}&rdquo;
                                    </p>
                                )}
                            </div>

                            {/* Desktop Actions - Hidden on mobile, visible on desktop */}
                            <ActionButtons className="hidden md:flex" />
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-foreground/80 justify-start pt-2">
                            {company?.parent_org && (
                                <Link href={`/organization/${company.parent_org.slug}`}>
                                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer">
                                        <Network className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Part of <span className="font-medium text-foreground">{company.parent_org.name}</span></span>
                                    </div>
                                </Link>
                            )}
                            {company?.location && (
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    {company.location}
                                </div>
                            )}
                            {company?.website && (
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline">
                                        Website
                                    </a>
                                </div>
                            )}
                            <div
                                className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md cursor-pointer hover:bg-muted transition-colors"
                                onClick={() => setIsFollowersModalOpen(true)}
                            >
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {isRelationshipLoading ? (
                                    <Skeleton className="h-4 w-12" />
                                ) : (
                                    <span className="font-medium">{followerCount.toLocaleString()} followers</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                {viewCountData === undefined ? (
                                    <Skeleton className="h-4 w-12" />
                                ) : (
                                    <span className="font-medium">{(viewCountData?.totalViews || 0).toLocaleString()} views</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {canManageCompany && (
                <EditAvatarModal
                    isOpen={isEditAvatarOpen}
                    onClose={() => setIsEditAvatarOpen(false)}
                    currentAvatarUrl={company.logo_url || null}
                    onUpload={handleLogoUpload}
                    onDelete={handleLogoDelete}
                    portalContainerId="profile-card"
                />
            )}

            <OrganizationFollowersModal
                isOpen={isFollowersModalOpen}
                onClose={() => setIsFollowersModalOpen(false)}
                companyId={companyId}
                companyName={company.name}
                canManage={canManageCompany}
            />

            <UniversalShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                entityId={companyId}
                entityType="company"
                entityName={company.name}
                entityUrl={`/organization/${company.slug}`}
                entityAvatar={company.logo_url}
                entityHeadline={company.headline || company.institution_type || company.industry}
                entityLocation={company.location}
            />
        </div>
    );
}
