"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/company.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Settings, Users, Shield, LayoutDashboard, Edit } from "lucide-react";
import { RolesManagement } from "@/components/companies/roles/RolesManagement";
import { MembersManagement } from "@/components/companies/members/MembersManagement";
import { EditCompanyForm } from "@/components/companies/EditCompanyForm";
import { CompanySettings } from "@/components/companies/CompanySettings";
import { AuditLogsViewer } from "@/components/companies/AuditLogsViewer";
import { Separator } from "@/components/ui/separator";

import { useCompany, useCompanyPermissions } from "@/hooks/useCompany";

export default function CompanyDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const slug = params.slug as string;
    const activeTab = searchParams.get("tab") || "overview";

    const { data: company, isLoading, error } = useCompany(slug);
    const { checkPermission, isOwner } = useCompanyPermissions(company);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                <h2 className="text-2xl font-bold">Company not found</h2>
                <Button variant="link" onClick={() => router.push("/feed")}>Go Home</Button>
            </div>
        );
    }

    if (isLoading) {
        return <div className="container p-8"><Skeleton className="h-8 w-64 mb-4" /><Skeleton className="h-64 w-full" /></div>;
    }

    // Basic permission check (Client-side visual only)
    if (!company?.viewer_role_data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view this dashboard.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const canEditCompany = isOwner || checkPermission("MANAGE_COMPANY");
    const canViewMembers = isOwner || checkPermission("VIEW_MEMBERS") || checkPermission("MANAGE_MEMBERS");
    const canManageRoles = isOwner || checkPermission("MANAGE_ROLES");
    const canViewSettings = isOwner || checkPermission("MANAGE_COMPANY");

    // "Intern" Protection: If user has minimal permissions, they might only see Overview
    // or NOTHING if we decide Interns shouldn't access dashboard at all.
    // Assuming "Overview" is safe for all members.

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/company/${slug}`)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{company.name} Dashboard</h1>
                    <p className="text-muted-foreground">Manage your company settings, team, and roles.</p>
                </div>
            </div>

            <Tabs defaultValue={activeTab} className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-64 flex-shrink-0">
                    <TabsList className="flex flex-col h-auto w-full space-y-2 bg-transparent p-0 justify-start">
                        <TabsTrigger
                            value="overview"
                            className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted hover:bg-muted/50 transition-colors"
                        >
                            <LayoutDashboard className="mr-3 h-4 w-4" /> Overview
                        </TabsTrigger>

                        {canEditCompany && (
                            <TabsTrigger
                                value="edit"
                                className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted hover:bg-muted/50 transition-colors"
                            >
                                <Edit className="mr-3 h-4 w-4" /> Edit Details
                            </TabsTrigger>
                        )}

                        {canViewMembers && (
                            <TabsTrigger
                                value="members"
                                className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted hover:bg-muted/50 transition-colors"
                            >
                                <Users className="mr-3 h-4 w-4" /> Members
                            </TabsTrigger>
                        )}

                        {canManageRoles && (
                            <TabsTrigger
                                value="roles"
                                className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted hover:bg-muted/50 transition-colors"
                            >
                                <Shield className="mr-3 h-4 w-4" /> Roles
                            </TabsTrigger>
                        )}

                        {canViewSettings && (
                            <TabsTrigger
                                value="settings"
                                className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted hover:bg-muted/50 transition-colors"
                            >
                                <Settings className="mr-3 h-4 w-4" /> Settings
                            </TabsTrigger>
                        )}

                        {canViewSettings && (
                            <TabsTrigger
                                value="logs"
                                className="w-full justify-start px-4 py-2 data-[state=active]:bg-muted hover:bg-muted/50 transition-colors"
                            >
                                <Shield className="mr-3 h-4 w-4" /> Logs
                            </TabsTrigger>
                        )}
                    </TabsList>
                </aside>

                <div className="flex-1 min-w-0">
                    <TabsContent value="overview" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Company Overview</CardTitle>
                                <CardDescription>Quick insights about your organization.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{company.member_count}</div>
                                        </CardContent>
                                    </Card>
                                    {/* Add more metrics here later (e.g. Active Jobs, Post Views) */}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {canEditCompany && (
                        <TabsContent value="edit" className="mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Edit Company Details</CardTitle>
                                    <CardDescription>Update your public profile information.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <EditCompanyForm company={company} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {canViewMembers && (
                        <TabsContent value="members" className="mt-0">
                            <MembersManagement company={company} />
                        </TabsContent>
                    )}

                    {canManageRoles && (
                        <TabsContent value="roles" className="mt-0">
                            <RolesManagement company={company} />
                        </TabsContent>
                    )}

                    {canViewSettings && (
                        <TabsContent value="settings" className="mt-0">
                            <CompanySettings company={company} />
                        </TabsContent>
                    )}

                    {canViewSettings && (
                        <TabsContent value="logs" className="mt-0">
                            <AuditLogsViewer company={company} />
                        </TabsContent>
                    )}
                </div>
            </Tabs>
        </div>
    );
}
