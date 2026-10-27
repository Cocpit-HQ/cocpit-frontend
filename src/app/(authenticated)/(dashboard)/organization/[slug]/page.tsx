"use client";

import React, { useState } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/organization.service";
import { recordProfileView } from "@/services/api/dashboard";
import { useSession } from "next-auth/react";
import { BusinessProfilePage } from "@/features/businessProfile";
import { FeatureGuard } from "@/components/feature-flags";
import { BlockIcon } from "@/components/icons";

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
            <div className="min-h-screen w-full bg-[var(--ds-bg)] flex flex-col items-center justify-center p-5 select-none">
                <div className="w-full max-w-[800px] flex flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-200">
                    <div className="w-16 h-16 rounded-full bg-[var(--ds-surface-1)] p-4 flex items-center justify-center shrink-0">
                        <BlockIcon
                            size={32}
                            className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0"
                            fill="var(--ds-text-muted)"
                        />
                    </div>
                    <div className="w-full max-w-[760px] flex flex-col items-center gap-2">
                        <h1 className="text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 text-center">
                            Profile unavailable
                        </h1>
                        <p className="w-full max-w-[360px] text-[var(--ds-text-secondary)] text-sm font-normal font-['DM_Sans'] leading-5 text-center">
                            This profile could not be loaded or does not exist.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push('/feed')}
                        className="h-9 px-3 py-1.5 bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] rounded-[100px] flex items-center justify-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                    >
                        <span className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
                            Back to Feed
                        </span>
                    </button>
                </div>
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
