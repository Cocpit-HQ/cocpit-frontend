"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Company, companyService } from "@/services/company.service";
import { BadgeCheck, MapPin, Globe, Users, PenBox, UserPlus, UserMinus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCompanyPermissions } from "@/hooks/useCompany";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CompanyHeaderProps {
    company?: Company;
    isLoading: boolean;
}

export function CompanyHeader({ company, isLoading }: CompanyHeaderProps) {
    const { canEdit, isOwner, isAdmin, isEditor } = useCompanyPermissions(company);
    const queryClient = useQueryClient();

    const { data: relationship, isLoading: isRelationshipLoading } = useQuery({
        queryKey: ["company_relationship", company?.company_id],
        queryFn: () => companyService.getRelationship(company!.company_id),
        enabled: !!company?.company_id,
    });

    const followMutation = useMutation({
        mutationFn: () => {
            if (!company?.company_id) throw new Error("Company ID missing");
            return companyService.followCompany(company.company_id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["company_relationship", company?.company_id] });
            toast.success(`Followed ${company?.name}`);
        },
        onError: (err: any) => {
            toast.error(companyService.normalizeError(err));
        }
    });

    const unfollowMutation = useMutation({
        mutationFn: () => {
            if (!company?.company_id) throw new Error("Company ID missing");
            return companyService.unfollowCompany(company.company_id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["company_relationship", company?.company_id] });
            toast.success(`Unfollowed ${company?.name}`);
        },
        onError: (err: any) => {
            toast.error(companyService.normalizeError(err));
        }
    });

    const isFollowing = relationship?.isFollowing;
    const followerCount = relationship?.followerCount || 0;
    const isActionLoading = followMutation.isPending || unfollowMutation.isPending;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-48 w-full rounded-b-lg" />
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

    const ActionButtons = ({ className }: { className?: string }) => (
        <div className={`flex gap-2 ${className}`}>
            {canEdit ? (
                <Button asChild variant="outline" size="sm" className="w-full md:w-auto">
                    <Link href={`/company/${company?.slug}/settings`}>
                        <PenBox className="mr-2 h-4 w-4" />
                        Edit Page
                    </Link>
                </Button>
            ) : (
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
            )}
        </div>
    );

    return (
        <div className="space-y-6 pb-6">
            {/* Cover Image */}
            <div className="h-48 md:h-64 w-full bg-muted relative rounded-b-xl overflow-hidden shadow-sm">
                {company?.cover_url ? (
                    <img src={company.cover_url} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
                )}
            </div>

            <div className="container px-4 md:px-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Logo & Mobile Actions - Row on mobile */}
                    <div className="-mt-16 md:-mt-20 w-full md:w-auto flex justify-between items-end relative z-10">
                        <Avatar className="h-32 w-32 md:h-40 md:w-40 rounded-xl border-4 border-background bg-background shadow-md">
                            <AvatarImage src={company?.logo_url} className="object-cover" />
                            <AvatarFallback className="text-4xl font-bold rounded-xl text-primary/70 bg-muted">
                                {company?.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        {/* Mobile Actions - Visible on mobile, hidden on desktop */}
                        <ActionButtons className="md:hidden mb-1" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-2 pt-2">
                        <div className="flex flex-col md:flex-row items-start md:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{company?.name}</h1>
                                    {company?.verification_status === 'DOMAIN_VERIFIED' && (
                                        <BadgeCheck className="h-6 w-6 text-white bg-blue-500 rounded-full p-[2px]" />
                                    )}
                                </div>
                                <p className="text-muted-foreground text-lg mt-1">
                                    {company?.industry} • {company?.size} employees
                                </p>
                            </div>

                            {/* Desktop Actions - Hidden on mobile, visible on desktop */}
                            <ActionButtons className="hidden md:flex" />
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-foreground/80 justify-start pt-2">
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
                            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {isRelationshipLoading ? (
                                    <Skeleton className="h-4 w-12" />
                                ) : (
                                    <span className="font-medium">{followerCount.toLocaleString()} followers</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
