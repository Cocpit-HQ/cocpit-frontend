"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/company.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, AlertTriangle, CheckCircle, Copy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VerificationTab } from "@/components/companies/settings/verification-tab";

import { Company } from "@/services/company.service"; // Import Company interface

interface CompanySettingsProps {
    company: Company;
    members?: any[]; // Pass members for transfer ownership
}

import { useCompanyPermissions } from "@/hooks/useCompany";

export function CompanySettings({ company }: CompanySettingsProps) {
    const { isOwner, role } = useCompanyPermissions(company);

    // Fetch members for transfer ownership dropdown
    const { data: membersData } = useQuery({
        queryKey: ["companyMembers", company.company_id],
        queryFn: () => companyService.getMembers(company.company_id),
        enabled: isOwner, // Only fetch if owner needs it
    });

    const members = membersData?.data || [];

    return (
        <div className="space-y-6">
            <VerificationTab company={company} />

            {isOwner && (
                <TransferOwnership companyId={company.company_id} members={members} />
            )}

            <DangerZone companyId={company.company_id} isOwner={isOwner} />
        </div>
    );
}

function DomainVerification({ companyId }: { companyId: string }) {
    const [domain, setDomain] = useState("");

    // In a real app, we'd fetch current verification status. 
    // For now, simple input.

    const verifyMutation = useMutation({
        mutationFn: (data: { domain: string }) => companyService.verifyDomain(companyId, data.domain),
        onSuccess: (data) => {
            toast.success("Verification initiated. Check your DNS settings.");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Verification failed"),
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Domain Verification</CardTitle>
                <CardDescription>Verify your company domain to unlock official badges and features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="domain">Company Domain</Label>
                    <div className="flex gap-2">
                        <Input
                            id="domain"
                            placeholder="example.com"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                        />
                        <Button onClick={() => verifyMutation.mutate({ domain })} disabled={verifyMutation.isPending}>
                            {verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify
                        </Button>
                    </div>
                </div>
                <div className="rounded-md bg-muted p-4 text-sm">
                    <p className="font-medium mb-2">DNS Configuration</p>
                    <p className="text-muted-foreground mb-2">Add the following TXT record to your DNS configuration:</p>
                    <div className="flex items-center justify-between bg-background p-2 rounded border">
                        <code className="text-xs">cocpit-verification={companyId.substring(0, 8)}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                            navigator.clipboard.writeText(`cocpit-verification=${companyId.substring(0, 8)}`);
                            toast.success("Copied to clipboard");
                        }}>
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TransferOwnership({ companyId, members }: { companyId: string; members: any[] }) {
    const [selectedMember, setSelectedMember] = useState("");
    const [password, setPassword] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter(); // Error: useRouter must be imported from next/navigation

    const transferMutation = useMutation({
        mutationFn: () => companyService.transferOwnership(companyId, selectedMember, password),
        onSuccess: () => {
            toast.success("Ownership transferred successfully");
            setIsOpen(false);
            window.location.reload(); // Force reload to update permissions
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Transfer failed"),
    });

    const candidate = members.find(m => m.user_id === selectedMember);

    return (
        <Card className="border-orange-500/20 bg-orange-50/50 dark:bg-orange-950/20">
            <CardHeader>
                <CardTitle className="text-orange-700 dark:text-orange-400">Transfer Ownership</CardTitle>
                <CardDescription className="text-orange-600/80 dark:text-orange-300/80">
                    Transfer full ownership of this company to another member. This action is irreversible.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="border-orange-200 hover:bg-orange-50 text-orange-700 dark:border-orange-800 dark:hover:bg-orange-900/20 dark:text-orange-400">
                            Transfer Ownership
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Transfer Company Ownership</DialogTitle>
                            <DialogDescription>
                                You are about to transfer ownership to another member. You will be demoted to Admin.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Select New Owner</Label>
                                <Select value={selectedMember} onValueChange={setSelectedMember}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {members
                                            .filter(m => m.role !== 'OWNER') // Exclude current owner (self) usually, though self isn't in this list if fetched correctly? Actually `members` includes everyone.
                                            .map((member) => (
                                                <SelectItem key={member.user_id} value={member.user_id}>
                                                    {member.full_name} ({member.email})
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {candidate && (
                                <Alert variant="default" className="border-orange-200 bg-orange-50 text-orange-800">
                                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                                    <AlertTitle>Warning</AlertTitle>
                                    <AlertDescription>
                                        {candidate.full_name} will become the new Owner. You will lose Owner privileges.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <Input
                                    type="password"
                                    placeholder="Enter your password to confirm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={() => transferMutation.mutate()}
                                disabled={!selectedMember || !password || transferMutation.isPending}
                            >
                                {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Transfer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}

function DangerZone({ companyId, isOwner }: { companyId: string, isOwner: boolean }) {
    const deleteMutation = useMutation({
        mutationFn: () => companyService.deleteCompany(companyId),
        onSuccess: () => {
            window.location.href = "/feed";
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete company"),
    });

    if (!isOwner) return null;

    return (
        <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
            <CardHeader>
                <CardTitle className="text-destructive font-bold">Danger Zone</CardTitle>
                <CardDescription className="text-destructive/80">
                    Irreversible actions.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-background/50">
                    <div>
                        <h4 className="font-medium text-destructive">Delete Company</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Permanently delete this company and all its data.
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            if (confirm("Are you sure? This cannot be undone.")) deleteMutation.mutate();
                        }}
                    >
                        Delete Company
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}


