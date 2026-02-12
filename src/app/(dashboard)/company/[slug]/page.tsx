"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/company.service";
import { CompanyHeader } from "@/components/companies/company-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <CompanyHeader company={company} isLoading={isLoading} />

            <div className="container px-4 md:px-6">
                <Tabs defaultValue="home" className="w-full">
                    <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none mb-6">
                        <TabsTrigger
                            value="home"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                        >
                            Home
                        </TabsTrigger>
                        <TabsTrigger
                            value="about"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                        >
                            About
                        </TabsTrigger>
                        <TabsTrigger
                            value="jobs"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                        >
                            Jobs
                        </TabsTrigger>
                        <TabsTrigger
                            value="posts"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                        >
                            Posts
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
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="jobs">
                        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
                            No active job listings.
                        </div>
                    </TabsContent>

                    <TabsContent value="posts">
                        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
                            No posts yet.
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
