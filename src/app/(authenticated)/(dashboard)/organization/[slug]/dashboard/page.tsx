"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/organization.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Settings, Users, Shield, LayoutDashboard, Edit } from "lucide-react";
import { RolesManagement } from "@/components/organizations/roles/RolesManagement";
import { MembersManagement } from "@/components/organizations/members/MembersManagement";
import { EnrollmentManagement } from "@/components/organizations/EnrollmentManagement";
import { EditOrganizationForm } from "@/components/organizations/EditOrganizationForm";
import { OrganizationSettings } from "@/components/organizations/OrganizationSettings";
import { AuditLogsViewer } from "@/components/organizations/AuditLogsViewer";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { FeatureGuard } from "@/components/feature-flags";

import { useCompany, useCompanyPermissions } from "@/hooks/useOrganization";
import { useActiveProfile } from "@/context/ActiveProfileContext";

export default function CompanyDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const slug = params.slug as string;
    const activeTab = searchParams.get("tab") || "overview";
    const { activeProfile } = useActiveProfile();

    const isMobile = useIsMobile();
    const [currentTab, setCurrentTab] = useState(activeTab);
    // On mobile, we start in 'menu' unless a specific tab (other than overview?) is requested... 
    // actually, let's start in 'menu' normally, unless deep linking? 
    // For now simple: default to menu if isMobile.
    const [mobileView, setMobileView] = useState<"menu" | "detail">("menu");

    // Sync tab with URL
    React.useEffect(() => {
        setCurrentTab(activeTab);
        // If we land on a specific unique tab on mobile via URL, maybe show detail?
        // But 'overview' is default. Let's say if it's NOT overview, maybe show detail.
        if (activeTab !== 'overview' && isMobile) {
            setMobileView("detail");
        }
    }, [activeTab, isMobile]);

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

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                <h2 className="text-2xl font-bold">Company not found</h2>
                <Button variant="link" onClick={() => router.push("/feed")}>Go Home</Button>
            </div>
        );
    }

    const isOrgActor = activeProfile?.type === "COMPANY" && activeProfile.id === (company.org_id || company.company_id);
    if (!isOrgActor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
                <p className="text-muted-foreground">Switch to this organization to view its dashboard.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push(`/organization/${slug}`)}>Back to Profile</Button>
            </div>
        );
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

    // Check if institution
    const isInstitution = (company as any)?.entity_type === 'INSTITUTION';

    const handleTabChange = (value: string) => {
        setCurrentTab(value);
        if (isMobile) {
            setMobileView("detail");
        }
        // Optional: Update URL without full reload? 
        // router.push(`?tab=${value}`, { scroll: false }); 
        // usage: router.replace or shallow update if feasible, but local state is fine for now.
    };

    const handleBackToMenu = () => {
        setMobileView("menu");
    };

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4">
            {/* Header - Visible in Menu view (Mobile) or Always (Desktop) */}
            {(!isMobile || mobileView === "menu") && (
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/organization/${slug}`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{company.name} Dashboard</h1>
                        <p className="text-muted-foreground">Manage your company settings, team, and roles.</p>
                    </div>
                </div>
            )}

            <Tabs value={currentTab} onValueChange={handleTabChange} className="flex flex-col md:flex-row gap-8">
                {/* Sidebar / Menu List */}
                <aside className={`w-full md:w-64 flex-shrink-0 md:sticky md:top-8 md:self-start ${isMobile && mobileView === "detail" ? "hidden" : "block"}`}>
                    <TabsList className="flex flex-col h-auto w-full space-y-2 bg-transparent p-0 justify-start">
                        <TabsTrigger
                            value="overview"
                            className="w-full justify-start px-4 py-3 md:py-2 text-base md:text-sm data-[state=active]:bg-muted hover:bg-muted/50 transition-colors border rounded-lg md:border-0 md:rounded-sm mb-2 md:mb-0"
                        >
                            <LayoutDashboard className="mr-3 h-5 w-5 md:h-4 md:w-4" /> Overview
                        </TabsTrigger>

                        {canEditCompany && (
                            <TabsTrigger
                                value="edit"
                                className="w-full justify-start px-4 py-3 md:py-2 text-base md:text-sm data-[state=active]:bg-muted hover:bg-muted/50 transition-colors border rounded-lg md:border-0 md:rounded-sm mb-2 md:mb-0"
                            >
                                <Edit className="mr-3 h-5 w-5 md:h-4 md:w-4" /> Edit Details
                            </TabsTrigger>
                        )}

                        {canViewMembers && (
                            <TabsTrigger
                                value="members"
                                className="w-full justify-start px-4 py-3 md:py-2 text-base md:text-sm data-[state=active]:bg-muted hover:bg-muted/50 transition-colors border rounded-lg md:border-0 md:rounded-sm mb-2 md:mb-0"

                            >
                                <Users className="mr-3 h-5 w-5 md:h-4 md:w-4" /> Members
                            </TabsTrigger>
                        )}

                        {canViewMembers && isInstitution && (
                            <TabsTrigger
                                value="enrollments"
                                className="w-full justify-start px-4 py-3 md:py-2 text-base md:text-sm data-[state=active]:bg-muted hover:bg-muted/50 transition-colors border rounded-lg md:border-0 md:rounded-sm mb-2 md:mb-0"
                            >
                                <Users className="mr-3 h-5 w-5 md:h-4 md:w-4" /> Enrollments
                            </TabsTrigger>
                        )}

                        {canManageRoles && (
                            <TabsTrigger
                                value="roles"
                                className="w-full justify-start px-4 py-3 md:py-2 text-base md:text-sm data-[state=active]:bg-muted hover:bg-muted/50 transition-colors border rounded-lg md:border-0 md:rounded-sm mb-2 md:mb-0"
                            >
                                <Shield className="mr-3 h-5 w-5 md:h-4 md:w-4" /> Roles
                            </TabsTrigger>
                        )}

                        {canViewSettings && (
                            <TabsTrigger
                                value="settings"
                                className="w-full justify-start px-4 py-3 md:py-2 text-base md:text-sm data-[state=active]:bg-muted hover:bg-muted/50 transition-colors border rounded-lg md:border-0 md:rounded-sm mb-2 md:mb-0"
                            >
                                <Settings className="mr-3 h-5 w-5 md:h-4 md:w-4" /> Settings
                            </TabsTrigger>
                        )}

                        {canViewSettings && (
                            <TabsTrigger
                                value="logs"
                                className="w-full justify-start px-4 py-3 md:py-2 text-base md:text-sm data-[state=active]:bg-muted hover:bg-muted/50 transition-colors border rounded-lg md:border-0 md:rounded-sm mb-2 md:mb-0"
                            >
                                <Shield className="mr-3 h-5 w-5 md:h-4 md:w-4" /> Logs
                            </TabsTrigger>
                        )}
                    </TabsList>
                </aside>

                {/* Main Content / Detail View */}
                <div className={`flex-1 min-w-0 ${isMobile && mobileView === "menu" ? "hidden" : "block"}`}>

                    {/* Mobile Back Button */}
                    {isMobile && (
                        <div className="mb-4 flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent" onClick={handleBackToMenu}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                            {/* Optionally show current tab title here? */}
                        </div>
                    )}

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
                                    <EditOrganizationForm company={company} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {canViewMembers && (
                        <TabsContent value="members" className="mt-0">
                            <MembersManagement company={company} />
                        </TabsContent>
                    )}

                    {canViewMembers && isInstitution && (
                        <TabsContent value="enrollments" className="mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Enrollment Requests</CardTitle>
                                    <CardDescription>Review and approve pending student enrollment requests.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <EnrollmentManagement company={company} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {canManageRoles && (
                        <TabsContent value="roles" className="mt-0">
                            <RolesManagement company={company} />
                        </TabsContent>
                    )}

                    {canViewSettings && (
                        <TabsContent value="settings" className="mt-0">
                            <FeatureGuard featureKey="enableOrgSettingsModule" mode="inline" moduleName="Organization Settings">
                                <OrganizationSettings company={company} />
                            </FeatureGuard>
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
