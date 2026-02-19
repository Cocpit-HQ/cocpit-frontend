"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/company.service";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MessageSquare, Clock, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatAuditTabProps {
    companyId: string;
    members: any[];
}

export function ChatAuditTab({ companyId, members }: ChatAuditTabProps) {
    const [page, setPage] = useState(1);
    const [memberId, setMemberId] = useState<string>("all");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["chatSessionHistory", companyId, page, memberId, startDate, endDate],
        queryFn: () =>
            companyService.getChatSessionHistory(companyId, {
                page,
                limit: 20,
                memberId: memberId === "all" ? undefined : memberId,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            }),
    });

    const sessions = data?.sessions || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / 20);

    const handleClearFilters = () => {
        setMemberId("all");
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Chat Session Audit</CardTitle>
                <CardDescription>
                    Review customer support sessions handled by your team.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="space-y-2 w-full md:w-1/3">
                        <Label>Team Member</Label>
                        <Select value={memberId} onValueChange={setMemberId}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Members" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Members</SelectItem>
                                {members.map((m) => (
                                    <SelectItem key={m.user_id} value={m.user_id}>
                                        {m.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 w-full md:w-1/4">
                        <Label>Start Date</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2 w-full md:w-1/4">
                        <Label>End Date</Label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-auto pb-0.5">
                        <Button variant="ghost" onClick={handleClearFilters}>
                            Clear
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Handler</TableHead>
                                <TableHead>Started At</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Messages</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : sessions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No sessions found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sessions.map((session: any) => (
                                    <TableRow key={session.session_id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{session.handler_name_snapshot}</span>
                                                <span className="text-xs text-muted-foreground">{session.handler_role_name_snapshot}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(session.started_at), "MMM d, HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            {session.ended_at
                                                ? formatDuration(new Date(session.started_at), new Date(session.ended_at))
                                                : <span className="text-green-600 font-medium">Active</span>}
                                        </TableCell>
                                        <TableCell>{session.message_count}</TableCell>
                                        <TableCell>
                                            <Badge variant={session.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                {session.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {session.end_reason || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedSessionId(session.session_id)}
                                            >
                                                <MessageSquare className="h-3 w-3 mr-2" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <span className="py-2 text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </CardContent>

            <SessionTranscriptDialog
                sessionId={selectedSessionId}
                open={!!selectedSessionId}
                onOpenChange={(open) => !open && setSelectedSessionId(null)}
            />
        </Card>
    );
}

function formatDuration(start: Date, end: Date) {
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}

function SessionTranscriptDialog({ sessionId, open, onOpenChange }: { sessionId: string | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { data: messages, isLoading } = useQuery({
        queryKey: ["sessionMessages", sessionId],
        queryFn: () => sessionId ? companyService.getSessionMessages(sessionId) : Promise.resolve([]),
        enabled: !!sessionId && open
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Session Transcript</DialogTitle>
                    <DialogDescription>
                        Messages exchanged during this session.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4 mt-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No messages recorded in this session.
                        </div>
                    ) : (
                        <div className="space-y-4 pb-4">
                            {messages?.map((msg: any) => (
                                <div key={msg.id} className={`flex gap-3 ${msg.sender_type === 'COMPANY' ? 'flex-row-reverse' : ''}`}>
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarImage src={msg.sender_avatar} />
                                        <AvatarFallback>
                                            {msg.sender_name?.[0] || (msg.sender_type === 'COMPANY' ? 'C' : 'U')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`flex flex-col max-w-[80%] ${msg.sender_type === 'COMPANY' ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium">{msg.sender_name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(msg.created_at), "HH:mm")}
                                            </span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-lg text-sm ${msg.sender_type === 'COMPANY'
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-muted rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
