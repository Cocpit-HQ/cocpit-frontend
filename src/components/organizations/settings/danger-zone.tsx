"use client";

import { useDeleteCompany, useTransferOwnership } from "@/components/organizations/hooks/use-company";
import { Company } from "@/services/organization.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DangerZoneProps {
    company: Company;
}

export function DangerZone({ company }: DangerZoneProps) {
    const [confirmDelete, setConfirmDelete] = useState("");
    const [transferUserId, setTransferUserId] = useState("");
    const [deletePassword, setDeletePassword] = useState("");
    const [transferPassword, setTransferPassword] = useState("");
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    const deleteMutation = useDeleteCompany();
    const transferMutation = useTransferOwnership();

    const handleDelete = () => {
        if (confirmDelete !== company.slug) return;
        deleteMutation.mutate({ companyId: company.company_id, password: deletePassword });
    };

    const handleTransfer = () => {
        if (!transferUserId) return;
        transferMutation.mutate({ companyId: company.company_id, newOwnerId: transferUserId });
    };

    return (
        <div className="space-y-6">
            <Card className="border-destructive/20">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Irreversible actions. Tread carefully.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div>
                            <h4 className="font-semibold">Transfer Ownership</h4>
                            <p className="text-sm text-muted-foreground">Transfer this company to another user. You will be demoted to Admin.</p>
                        </div>
                        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">Transfer</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Transfer Ownership</DialogTitle>
                                    <DialogDescription>
                                        Enter the User ID of an active member to make them the new owner.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label>New Owner ID</Label>
                                        <Input
                                            value={transferUserId}
                                            onChange={(e) => setTransferUserId(e.target.value)}
                                            placeholder="UUID"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleTransfer} disabled={transferMutation.isPending || !transferUserId}>
                                        {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Transfer
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-destructive">Delete Company</h4>
                            <p className="text-sm text-muted-foreground">Permanently delete this company and all its data.</p>
                        </div>
                        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">Delete Company</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="h-5 w-5" />
                                        Delete {company.name}?
                                    </DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This will permanently delete <strong>{company.name}</strong>.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Type <strong>{company.slug}</strong> to confirm</Label>
                                        <Input
                                            value={confirmDelete}
                                            onChange={(e) => setConfirmDelete(e.target.value)}
                                            placeholder={company.slug}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Current Password</Label>
                                        <Input
                                            type="password"
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDelete}
                                        disabled={confirmDelete !== company.slug || !deletePassword || deleteMutation.isPending}
                                    >
                                        {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirm Delete
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
