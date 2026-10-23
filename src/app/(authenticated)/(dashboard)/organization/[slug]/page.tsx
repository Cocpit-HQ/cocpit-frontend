"use client";

import React, { useState } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/organization.service";
import { recordProfileView } from "@/services/api/dashboard";
import { useSession } from "next-auth/react";
import { BusinessProfilePage } from "@/features/businessProfile";
import { FeatureGuard } from "@/components/feature-flags";

export default function CompanyPage() {
    const params = useParams();
    const slug = params.slug as string;
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const currentTab = searchParams.get("tab") || "home";

    const handleTabChange = (value: string) => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set("tab", value);
        router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    };
    const sourcePostId = searchParams.get('sourcePostId') || undefined;

    const { data: company, isLoading, error } = useQuery({
        queryKey: ["company", slug, sourcePostId],
        queryFn: () => companyService.getCompany(slug, sourcePostId, { skipAuditLog: true }),
        retry: false,
    });

    const { data: session } = useSession();

    // Record organization profile view
    React.useEffect(() => {
        if (company?.org_id) {
            recordProfileView(company.org_id, 'organization', sourcePostId).catch(console.error);
        }
    }, [company?.org_id, sourcePostId]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                <h2 className="text-2xl font-bold text-foreground">Company not found</h2>
                <p className="text-muted-foreground mt-2">The company you are looking for does not exist or has been removed.</p>
            </div>
        );
    }

    const isExplicitPublic = searchParams?.get("view") === "public" || searchParams?.get("mode") === "public" || searchParams?.get("preview") === "true";
    const isMember = !isExplicitPublic && !!company?.viewer_role_data;

    return (
        <FeatureGuard featureKey="enableOrganizations" moduleName="Organizations Showcase">
            <BusinessProfilePage isOwnProfile={isMember} />
        </FeatureGuard>
    );
}
