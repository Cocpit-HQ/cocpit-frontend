"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { companyService, Company } from "@/services/company.service";
import { companyRolesService, CompanyRole } from "@/services/company.roles.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, MoreVertical, ShieldAlert, Trash2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useCompanyPermissions } from "@/hooks/useCompany";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MembersManagementProps {
    company: Company;
}

export function MembersManagement({ company }: MembersManagementProps) {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;
    const { company_id: companyId } = company;

    const { checkPermission, isOwner, priority: myPriority } = useCompanyPermissions(company);
    const canManageMembers = checkPermission("MANAGE_MEMBERS") || checkPermission("REMOVE_MEMBERS");
    const canInvite = checkPermission("INVITE_MEMBERS");

    const [isInviteOpen, setIsInviteOpen] = useState(false);

    // Fetch Roles for mapping
    const { data: roles } = useQuery({
        queryKey: ["companyRoles", companyId],
        queryFn: () => companyRolesService.getRoles(companyId),
    });

    const { data: membersData, isLoading } = useQuery({
        queryKey: ["companyMembers", companyId],
        queryFn: () => companyService.getMembers(companyId),
    });

    const inviteMutation = useMutation({
        mutationFn: (data: { email: string; role: string }) => companyService.inviteMember(companyId, data.email, data.role),
        onSuccess: () => {
            setIsInviteOpen(false);
            toast.success("Invitation sent successfully");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Failed to send invitation"),
    });

    const removeMutation = useMutation({
        mutationFn: (userId: string) => companyService.removeMember(companyId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["companyMembers", companyId] });
            toast.success("Member removed");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Failed to remove member"),
    });

    const changeRoleMutation = useMutation({
        mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => companyRolesService.assignRole(companyId, userId, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["companyMembers", companyId] });
            toast.success("Role updated");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update role"),
    });

    const getRoleColor = (roleName: string) => {
        return roles?.find((r: any) => r.name === roleName)?.color || "#808080";
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    const members = membersData?.data || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Team Members</h3>
                    <p className="text-sm text-muted-foreground">Manage your team and their access levels.</p>
                </div>
                {canInvite && (
                    <Button onClick={() => setIsInviteOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                    </Button>
                )}
            </div>

            <div className="grid gap-4">
                {members.map((member: any) => {
                    const memberPriority = member.priority || 0;
                    const isSelf = member.user_id === currentUserId;
                    // Allow Owners to edit anyone (except self)
                    // Allow others to edit strictly lower priority
                    const canEditMember = !isSelf && (isOwner || myPriority > memberPriority);

                    return (
                        <Card key={member.user_id} className="overflow-hidden">
                            <div className="flex items-center justify-between p-4 bg-card hover:bg-muted/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={member.avatar_url} />
                                        <AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium">{member.full_name}</div>
                                            {member.status !== 'ACTIVE' && (
                                                <Badge variant="outline" className="text-[10px] h-5 border-yellow-500 text-yellow-600 bg-yellow-50">{member.status}</Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{member.email}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {member.expires_at && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {new Date(member.expires_at) < new Date() ? "Expired" : "Temporary"}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Expires: {new Date(member.expires_at).toLocaleDateString()}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}

                                    <Badge
                                        style={{
                                            backgroundColor: member.role_color || getRoleColor(member.role),
                                            color: "#fff"
                                        }}
                                    >
                                        {member.role}
                                    </Badge>

                                    {canManageMembers && canEditMember && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {roles?.filter((r: any) => r.priority < myPriority || isOwner).map((role: any) => (
                                                    <DropdownMenuItem
                                                        key={role.role_id}
                                                        onClick={() => changeRoleMutation.mutate({ userId: member.user_id, roleId: role.role_id })}
                                                        disabled={role.name === member.role}
                                                    >
                                                        Set as {role.name}
                                                    </DropdownMenuItem>
                                                ))}
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => {
                                                        if (confirm("Remove this member?")) removeMutation.mutate(member.user_id);
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Remove Member
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <InviteDialog
                open={isInviteOpen}
                onOpenChange={setIsInviteOpen}
                roles={roles || []}
                onSubmit={(data: any) => inviteMutation.mutate(data)}
                isLoading={inviteMutation.isPending}
            />
        </div>
    );
}

function InviteDialog({ open, onOpenChange, roles, onSubmit, isLoading }: any) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ email, role });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Send an invitation email to add a new member to your company.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="colleague@company.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={setRole} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((r: any) => (
                                        <SelectItem key={r.role_id} value={r.name}>
                                            <span className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                                                {r.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? "Send Invite" : "Send Invite"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
