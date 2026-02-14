"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/company.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MembersTab } from "@/components/companies/settings/members-tab";
import { VerificationTab } from "@/components/companies/settings/verification-tab";
import { CompanyHeader } from "@/components/companies/company-header";
import { GeneralTab } from "@/components/companies/settings/general-tab";
import { AuditLogsViewer } from "@/components/companies/AuditLogsViewer";
import { useCompanyPermissions } from "@/hooks/useCompany";

export default function CompanySettingsPage() {
    const params = useParams();
    const slug = params.slug as string;

    const { data: company, isLoading } = useQuery({
        queryKey: ["company", slug],
        queryFn: () => companyService.getCompany(slug),
    });

    const perms = useCompanyPermissions(company);

    if (isLoading) {
        return <div className="container py-6"><Skeleton className="h-96 w-full" /></div>;
    }

    if (!company) {
        return <div className="container py-6">Company not found</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <CompanyHeader company={company} isLoading={isLoading} />
            <div className="container px-4 md:px-6 py-6">
                <h1 className="text-3xl font-bold mb-6">Company Settings</h1>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                        <TabsTrigger value="verification">Verification</TabsTrigger>
                        {(perms.isOwner || perms.isAdmin) && (
                            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="general">
                        <GeneralTab company={company} />
                    </TabsContent>

                    <TabsContent value="members">
                        <MembersTab company={company} />
                    </TabsContent>

                    <TabsContent value="verification">
                        <VerificationTab company={company} />
                    </TabsContent>

                    {(perms.isOwner || perms.isAdmin) && (
                        <TabsContent value="audit">
                            <AuditLogsViewer company={company} />
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </div>
    );
}
