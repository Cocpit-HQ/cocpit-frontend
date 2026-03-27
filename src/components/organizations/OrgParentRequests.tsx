"use client";

import React from "react";
import { companyService } from "@/services/organization.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Network, Building2, User, Check, X, Loader2 } from "lucide-react";

interface OrgParentRequestsProps {
    orgId: string;
}

export function OrgParentRequests({ orgId }: OrgParentRequestsProps) {
    const queryClient = useQueryClient();

    const { data: requests, isLoading } = useQuery({
        queryKey: ["company-parent-requests", orgId],
        queryFn: () => companyService.getPendingParentRequests(orgId),
    });

    const respondMutation = useMutation({
        mutationFn: ({ requestId, action }: { requestId: string; action: 'ACCEPT' | 'REJECT' }) => 
            companyService.respondToParentRequest(orgId, requestId, action),
        onSuccess: (data, variables) => {
            toast.success(data.message || `Request ${variables.action.toLowerCase()}ed successfully`);
            queryClient.invalidateQueries({ queryKey: ["company-parent-requests", orgId] });
            queryClient.invalidateQueries({ queryKey: ["company-children", orgId] });
        },
        onError: (err: any) => {
            const errString = companyService.normalizeError(err).toLowerCase();
            if (err.response?.status === 409 || errString.includes("cycle") || errString.includes("circular")) {
                toast.error("Cannot approve this request, as it would create a circular hierarchy.");
            } else {
                toast.error(companyService.normalizeError(err));
            }
        }
    });

    if (isLoading) {
        return (
            <div className="bg-card border shadow-sm rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Pending Sub-Organization Requests</h3>
                </div>
                <div className="animate-pulse space-y-3">
                    <div className="h-20 bg-muted/60 rounded-md"></div>
                    <div className="h-20 bg-muted/60 rounded-md"></div>
                </div>
            </div>
        );
    }

    if (!requests || requests.length === 0) {
        return null; // Do not render section if there are no pending requests to keep settings clean
    }

    return (
        <div className="bg-card border shadow-sm rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
                <Network className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Pending Sub-Organization Requests</h3>
            </div>
            <div className="space-y-3">
                {requests.map((req: any) => (
                    <div key={req.request_id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-md items-start md:items-center justify-between bg-muted/20">
                        <div className="flex gap-4 items-start w-full">
                            <Avatar className="h-12 w-12 border bg-background mt-1">
                                <AvatarImage src={req.child_org?.logo_url} />
                                <AvatarFallback><Building2 className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                            </Avatar>
                            <div className="space-y-1 flex-1">
                                <div className="font-medium text-base">
                                    {req.child_org?.name}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" /> Requested by {req.requested_by_user?.full_name}
                                </div>
                                {req.message && (
                                    <div className="text-sm mt-2 p-2 bg-muted/50 rounded-md italic border-l-2 border-l-primary">
                                        "{req.message}"
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 justify-end">
                            <Button 
                                variant="outline" 
                                size="sm"
                                disabled={respondMutation.isPending}
                                onClick={() => respondMutation.mutate({ requestId: req.request_id, action: 'REJECT' })}
                                className="text-destructive hover:bg-destructive/10"
                            >
                                <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                            <Button 
                                size="sm"
                                disabled={respondMutation.isPending}
                                onClick={() => respondMutation.mutate({ requestId: req.request_id, action: 'ACCEPT' })}
                            >
                                {respondMutation.isPending && respondMutation.variables?.action === 'ACCEPT' ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4 mr-1" />
                                )}
                                Accept
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
