"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/organization.service";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Network, Building2 } from "lucide-react";

interface OrgSubOrganizationsProps {
    orgId: string;
}

export function OrgSubOrganizations({ orgId }: OrgSubOrganizationsProps) {
    const { data: children, isLoading, error } = useQuery({
        queryKey: ["company-children", orgId],
        queryFn: () => companyService.getOrgChildren(orgId),
    });

    if (isLoading) {
        return (
            <div className="bg-card border shadow-sm rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Sub-Organizations</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !children || children.length === 0) {
        return null;
    }

    return (
        <div className="bg-card border shadow-sm rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
                <Network className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Sub-Organizations <span className="text-muted-foreground text-base font-normal">({children.length})</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {children.map((child) => (
                    <Link key={child.org_id} href={`/organization/${child.slug}`}>
                        <div className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors group cursor-pointer">
                            <Avatar className="h-12 w-12 rounded-lg border bg-background">
                                <AvatarImage src={child.logo_url} />
                                <AvatarFallback className="rounded-lg">
                                    <Building2 className="h-6 w-6 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-medium truncate group-hover:text-primary transition-colors">
                                    {child.name}
                                </span>
                                <span className="text-sm text-muted-foreground truncate">
                                    {(child as any).entity_type === 'INSTITUTION' ? 'Institution' : 'Company'} • {child.member_count || 0} members
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
