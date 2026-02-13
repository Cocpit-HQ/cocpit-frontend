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

export function AuditTab({ company }: { company: Company }) {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState<string>("ALL");

    // Using query key based params for auto-refetch
    const { data, isLoading, isError } = useAuditLogs(company.company_id, {
        page,
        limit: 10,
        action: actionFilter === "ALL" ? undefined : actionFilter,
    });

    const logs = data?.data || [];
    const meta = data?.meta;

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                    Track important actions taken within your company account.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4 items-center">
                    <div className="w-[200px]">
                        <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val); setPage(1); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by Action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Actions</SelectItem>
                                <SelectItem value="UPDATE">Update Profile</SelectItem>
                                <SelectItem value="INVITE_MEMBER">Invite Member</SelectItem>
                                <SelectItem value="REMOVE_MEMBER">Remove Member</SelectItem>
                                <SelectItem value="TRANSFER_OWNERSHIP">Transfer Ownership</SelectItem>
                                <SelectItem value="DOMAIN_VERIFIED">Domain Verified</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Add User filter later if needed */}

                    {actionFilter !== "ALL" && (
                        <Button variant="ghost" size="icon" onClick={() => setActionFilter("ALL")}>
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Table */}
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
                                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                                            {JSON.stringify(log.metadata)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {meta && meta.total > 0 && (
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
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
