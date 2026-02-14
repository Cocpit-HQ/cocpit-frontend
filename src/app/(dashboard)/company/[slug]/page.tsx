"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/company.service";
import { CompanyHeader } from "@/components/companies/company-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyTechStack } from "@/components/companies/company-tech-stack";
import { CompanyGallery } from "@/components/companies/company-gallery";
import { CompanyPosts } from "@/components/companies/company-posts";
import { CreatePostButton } from "@/components/companies/CreatePostCompanyButton";


export default function CompanyPage() {
    const params = useParams();
    const slug = params.slug as string;

    const { data: company, isLoading, error } = useQuery({
        queryKey: ["company", slug],
        queryFn: () => companyService.getCompany(slug),
        retry: false,
    });

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
            <CompanyHeader company={company} isLoading={isLoading} />



            <div className="container max-w-6xl px-4 md:px-6 mx-auto">
                <Tabs defaultValue="home" className="w-full">
                    <TabsList className="w-full justify-start h-auto p-1 bg-muted/40 rounded-lg mb-8 overflow-x-auto flex-nowrap">
                        <TabsTrigger
                            value="home"
                            className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                        >
                            Home
                        </TabsTrigger>
                        <TabsTrigger
                            value="about"
                            className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                        >
                            About
                        </TabsTrigger>
                        <TabsTrigger
                            value="jobs"
                            className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                        >
                            Jobs
                        </TabsTrigger>
                        <TabsTrigger
                            value="posts"
                            className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                        >
                            Posts
                        </TabsTrigger>
                        <TabsTrigger
                            value="tech-stack"
                            className="rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                        >
                            Tech Stack
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="home" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-4/6" />
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">
                                        {company?.description || "No description provided."}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="about">
                        <Card>
                            <CardHeader>
                                <CardTitle>About Us</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {company?.description && (
                                    <div>
                                        <h4 className="font-medium mb-1">Description</h4>
                                        <p className="text-muted-foreground">{company.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {company?.industry && (
                                        <div>
                                            <h4 className="font-medium mb-1">Industry</h4>
                                            <p className="text-muted-foreground">{company.industry}</p>
                                        </div>
                                    )}
                                    {company?.size && (
                                        <div>
                                            <h4 className="font-medium mb-1">Company Size</h4>
                                            <p className="text-muted-foreground">{company.size} employees</p>
                                        </div>
                                    )}
                                    {company?.website && (
                                        <div>
                                            <h4 className="font-medium mb-1">Website</h4>
                                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                {company.website}
                                            </a>
                                        </div>
                                    )}
                                    {company?.location && (
                                        <div>
                                            <h4 className="font-medium mb-1">Headquarters</h4>
                                            <p className="text-muted-foreground">{company.location}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t">
                                    {company ? <CompanyGallery company={company} /> : <Skeleton className="h-40 w-full" />}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="jobs">
                        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
                            No active job listings.
                        </div>
                    </TabsContent>

                    <TabsContent value="posts" className="mt-6">
                        <div className="flex justify-end mb-6">
                            {(isMember) && (
                                <CreatePostButton
                                    companyId={company?.company_id}
                                    companyName={company?.name}
                                    companyLogo={company?.logo_url}
                                />
                            )}
                        </div>
                        {company ? (
                            <CompanyPosts companyId={company.company_id} company={company} />
                        ) : (
                            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
                                Loading posts...
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="tech-stack">
                        <Card>
                            <CardHeader>
                                <CardTitle>Technology Stack</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {company ? <CompanyTechStack company={company} /> : <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-2/3" /></div>}
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}
