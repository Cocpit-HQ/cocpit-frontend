"use client";

import React, { useState } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/organization.service";
import { OrganizationHeader } from "@/components/organizations/organization-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrganizationTechStack } from "@/components/organizations/organization-tech-stack";
import { OrganizationGallery } from "@/components/organizations/organization-gallery";
import { OrganizationPosts } from "@/components/organizations/organization-posts";
import { CreatePostButton } from "@/components/organizations/CreatePostOrganizationButton";
import { OrganizationEvents } from "@/components/organizations/OrganizationEvents";
import { OrganizationPublicJobs } from "@/components/organizations/OrganizationPublicJobs";
import { HomeRecentPosts } from "@/components/organizations/home-tab/HomeRecentPosts";
import { HomeUpcomingEvents } from "@/components/organizations/home-tab/HomeUpcomingEvents";
import { HomeGalleryPreview } from "@/components/organizations/home-tab/HomeGalleryPreview";
import { OrgSubOrganizations } from "@/components/organizations/OrgSubOrganizations";
import { recordProfileView } from "@/services/api/dashboard";
import { useSession } from "next-auth/react";
import CompanyProfilePage from "@/features/companyprofile/components/view/CompanyProfilePage";


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

    const { data: company, isLoading, error } = useQuery({
        queryKey: ["company", slug],
        queryFn: () => companyService.getCompany(slug),
        retry: false,
    });

    const { data: session } = useSession();

    // Record organization profile view
    React.useEffect(() => {
        if (company?.org_id) {
            recordProfileView(company.org_id, 'organization').catch(console.error);
        }
    }, [company?.org_id]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                <h2 className="text-2xl font-bold text-foreground">Company not found</h2>
                <p className="text-muted-foreground mt-2">The company you are looking for does not exist or has been removed.</p>
            </div>
        );
    }

    const isMember = !!company?.viewer_role_data;

    return (
        <div className="flex flex-col min-h-screen bg-background pb-12">
            <div className="w-full px-0">
                <CompanyProfilePage isOwnProfile={isMember} />
            </div>
        </div>
    );
}
