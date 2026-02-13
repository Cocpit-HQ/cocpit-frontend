"use client";

import { useCompany, useAnalyticsOverview, useAnalyticsEngagement, useAnalyticsJobs, useCompanyPermissions } from "@/hooks/useCompany";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Loader2, TrendingUp, Users, Eye, MessageSquare, Briefcase } from "lucide-react";
import { use } from "react";

// Helper for formatting dates
const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function AnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const { data: company, isLoading: isCompanyLoading } = useCompany(slug);

    // We need companyID for analytics hooks.
    const companyId = company?.company_id;

    const {
        data: overviewData,
        isLoading: isOverviewLoading,
        error: overviewError
    } = useAnalyticsOverview(companyId!);

    const {
        data: engagementData,
        isLoading: isEngagementLoading
    } = useAnalyticsEngagement(companyId!);

    const {
        data: jobsData,
        isLoading: isJobsLoading
    } = useAnalyticsJobs(companyId!);

    const { isOwner, isAdmin, isAnalyst, isRecruiter } = useCompanyPermissions(company);

    if (isCompanyLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

    // Permission Guard UI (Client side, backed by API 403)
    if (!isOwner && !isAdmin && !isAnalyst && !isRecruiter) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>You do not have permission to view analytics for this company.</AlertDescription>
                </Alert>
            </div>
        );
    }

    // Recruiter only sees Jobs?
    // The tabs might control visibility, but API protects data.

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                <p className="text-muted-foreground">
                    Insights into your company's performance, engagement, and recruitment.
                </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="engagement">Engagement</TabsTrigger>
                    <TabsTrigger value="jobs">Recruitment</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-4">
                    {isOverviewLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[1, 2].map(i => <Skeleton key={i} className="h-32" />)}
                        </div>
                    ) : overviewError ? (
                        <Alert variant="destructive"><AlertDescription>Failed to load overview data</AlertDescription></Alert>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{overviewData?.followers.total}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Follower base
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Profile Views (30d)</CardTitle>
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{overviewData?.views.total}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Unique visits
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card className="col-span-1">
                                    <CardHeader>
                                        <CardTitle>Follower Growth (30d)</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pl-2">
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={overviewData?.followers.history}>
                                                    <XAxis
                                                        dataKey="date"
                                                        stroke="#888888"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={formatDate}
                                                    />
                                                    <YAxis
                                                        stroke="#888888"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        allowDecimals={false}
                                                    />
                                                    <Tooltip
                                                        labelFormatter={formatDate}
                                                        contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                                    />
                                                    <Line type="monotone" dataKey="count" stroke="#adfa1d" strokeWidth={2} activeDot={{ r: 8 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="col-span-1">
                                    <CardHeader>
                                        <CardTitle>Profile Views (30d)</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pl-2">
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={overviewData?.views.history}>
                                                    <XAxis
                                                        dataKey="date"
                                                        stroke="#888888"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={formatDate}
                                                    />
                                                    <YAxis
                                                        stroke="#888888"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        allowDecimals={false}
                                                    />
                                                    <Tooltip
                                                        labelFormatter={formatDate}
                                                        contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                                    />
                                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* ENGAGEMENT TAB */}
                <TabsContent value="engagement" className="space-y-4">
                    {isEngagementLoading ? (
                        <Skeleton className="h-64" />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Top Performing Posts</CardTitle>
                                    <CardDescription>
                                        Your most engaging content recently.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {engagementData?.topPosts.map((post: any) => (
                                            <div key={post.post_id} className="flex items-center">
                                                <div className="ml-4 space-y-1">
                                                    <p className="text-sm font-medium leading-none line-clamp-1">{post.content || "Media Post"}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(post.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="ml-auto font-medium flex gap-4">
                                                    <div className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {parseInt(post.like_count) + parseInt(post.comment_count)}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {engagementData?.topPosts.length === 0 && <p className="text-muted-foreground">No posts yet.</p>}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="col-span-3">
                                <CardHeader>
                                    <CardTitle>Interaction Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-8">
                                        <div className="flex items-center">
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">Likes Received</p>
                                                <p className="text-sm text-muted-foreground">Positive reactions</p>
                                            </div>
                                            <div className="ml-auto font-bold">{engagementData?.stats.likes_received}</div>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">Comments Received</p>
                                                <p className="text-sm text-muted-foreground">Community discussions</p>
                                            </div>
                                            <div className="ml-auto font-bold">{engagementData?.stats.comments_received}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* JOBS TAB */}
                <TabsContent value="jobs" className="space-y-4">
                    {isJobsLoading ? (
                        <Skeleton className="h-64" />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{jobsData?.overview.active_jobs || 0}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Open positions
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{jobsData?.overview.total_applications || 0}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Across all jobs
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">--%</div>
                                    <p className="text-xs text-muted-foreground">
                                        Views to Applications
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
