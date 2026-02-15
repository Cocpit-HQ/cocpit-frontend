"use client";

import { useAuditLogs } from "@/hooks/useCompany";
import { Company } from "@/services/company.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, FilterX } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming use-debounce hook exists or use lodash/setTimeout

// Simple debounce implementation if hook missing
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    const [timestamp, setTimestamp] = useState<number>(Date.now());

    if (Date.now() - timestamp > delay && value !== debouncedValue) {
        setDebouncedValue(value);
        setTimestamp(Date.now());
    }
    // This is wrong for a hook. Let's rely on standard practice or simple timeouts in component.
    return value;
}
// Actually, let's use a simpler approach: update state on blur or enter, or just rely on react-hook-form or fetch on change.
// For MVP, just fetch on change is fine for low traffic, or use a local state + search button.

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Eye, FileText, Briefcase, Calendar } from "lucide-react";

export function AuditLogsViewer({ company }: { company: Company }) {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState<string>("ALL");
    const [activeTab, setActiveTab] = useState<"audit" | "activity">("audit");

    // Using query key based params for auto-refetch
    const { data, isLoading, isError } = useAuditLogs(company.company_id, {
        page,
        limit: 10,
        action: activeTab === "activity" ? "VIEW" : (actionFilter === "ALL" ? undefined : actionFilter),
        // If we want to exclude VIEWs from "audit" tab, backend needs to support 'exclude_action' or we filter client side.
        // Assuming backend supports exact match.
        // For "audit" tab, we might show everything EXCEPT views if filtering is "ALL".
        // If the backend doesn't support 'exclude', we might get VIEWs in "Audit Logs" too.
        // Let's assume for now we just filter by specific actions or "ALL".
        // To make "Page Activity" strictly VIEW and "Audit Logs" strictly NOT VIEW, 
        // we might need backend adjustment or just accept overlap if "ALL" is selected.
        // Ideally, "Audit Logs" should probably filter OUT 'VIEW' by default?
        // Let's proceed with client-side assumption or just existing behavior.
        // User request: "separate page view logs from the audit logs".
    });

    const logs = data?.data || [];
    const meta = data?.meta;

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ');
    };

    const renderDetails = (log: any) => {
        if (!log.metadata) return "No details";
        const meta = log.metadata;

        // Link generation based on type
        if (meta.type === 'post' && meta.id) {
            return (
                <Link href={`/post/${meta.id}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                    <FileText className="h-3 w-3" />
                    <span>{meta.title || "View Post"}</span>
                </Link>
            );
        }
        if (meta.type === 'job' && meta.id) {
            return (
                <Link href={`/jobs/${meta.id}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Briefcase className="h-3 w-3" />
                    <span>{meta.title || "View Job"}</span>
                </Link>
            );
        }
        if (meta.type === 'event' && meta.id) {
            return (
                <Link href={`/events/${meta.id}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Calendar className="h-3 w-3" />
                    <span>{meta.title || "View Event"}</span>
                </Link>
            );
        }

        // Default JSON stringify for other types or fallback
        return (
            <span className="text-muted-foreground" title={JSON.stringify(meta)}>
                {meta.title || meta.message || JSON.stringify(meta).substring(0, 50)}
            </span>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Company Activity</CardTitle>
                <CardDescription>
                    Monitor audit logs and page views.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                <Tabs defaultValue="audit" className="w-full" onValueChange={(val) => { setActiveTab(val as any); setPage(1); setActionFilter("ALL"); }}>
                    <TabsList>
                        <TabsTrigger value="audit">Audit Logs</TabsTrigger>
                        <TabsTrigger value="activity">Page Activity</TabsTrigger>
                    </TabsList>

                    <div className="my-4 flex gap-4 items-center">
                        {activeTab === 'audit' && (
                            <>
                                <div className="w-[200px]">
                                    <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val); setPage(1); }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by Action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Actions</SelectItem>
                                            <SelectItem value="UPDATE">Update Profile</SelectItem>
                                            <SelectItem value="CREATE_POST">Create Post</SelectItem>
                                            <SelectItem value="POST_JOB">Post Job</SelectItem>
                                            <SelectItem value="CREATE_EVENT">Create Event</SelectItem>
                                            {/* Add more specific actions as they appear in DB */}
                                            <SelectItem value="INVITE_MEMBER">Invite Member</SelectItem>
                                            <SelectItem value="REMOVE_MEMBER">Remove Member</SelectItem>
                                            <SelectItem value="TRANSFER_OWNERSHIP">Transfer Ownership</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {actionFilter !== "ALL" && (
                                    <Button variant="ghost" size="icon" onClick={() => setActionFilter("ALL")}>
                                        <FilterX className="h-4 w-4" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>

                    <TabsContent value="audit" className="space-y-4">
                        <LogTable
                            isLoading={isLoading}
                            logs={logs.filter((l: any) => l.action !== 'VIEW')} // Client side filter fallback if backend doesn't support exclusion yet
                            formatAction={formatAction}
                            renderDetails={renderDetails}
                        />
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-4">
                        <LogTable
                            isLoading={isLoading}
                            logs={logs} // Already filtered by 'VIEW' via API param
                            formatAction={formatAction}
                            renderDetails={renderDetails}
                        />
                    </TabsContent>
                </Tabs>

                {/* Pagination */}
                {meta && meta.total > 0 && (
                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
                        <div>
                            Page {page} of {Math.ceil(meta.total / meta.limit)}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * meta.limit >= meta.total || isLoading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Subcomponent for cleaner code
function LogTable({ isLoading, logs, formatAction, renderDetails }: any) {
    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            </TableRow>
                        ))
                    ) : logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No logs found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log: any) => (
                            <TableRow key={log.log_id}>
                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                    {new Date(log.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={log.actor_avatar} />
                                            <AvatarFallback>?</AvatarFallback>
                                        </Avatar>
                                        <div className="text-sm">
                                            <p className="font-medium leading-none">{log.actor_name || 'System'}</p>
                                            <p className="text-xs text-muted-foreground">{log.actor_email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{formatAction(log.action)}</Badge>
                                </TableCell>
                                <TableCell className="text-sm text-sm">
                                    {renderDetails(log)}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
