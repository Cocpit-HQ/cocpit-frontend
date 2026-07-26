"use client";

import { useCompanyMembers, useInviteMember, useRemoveMember, useLeaveCompany } from "@/components/organizations/hooks/use-company";
import { Company } from "@/services/organization.service";
import { useCompanyPermissions } from "@/components/organizations/hooks/use-company";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, UserPlus, LogOut, Trash2 } from "lucide-react";

interface MembersTabProps {
    company: Company;
}

export function MembersTab({ company }: MembersTabProps) {
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useCompanyMembers(company.company_id);

    const members = data?.pages.flatMap((page: any) => page.data) || [];
    const { canManageMembers, isOwner, isAdmin, priority: myPriority } = useCompanyPermissions(company);

    // Invite State
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("EDITOR");
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const inviteMutation = useInviteMember();
    const removeMutation = useRemoveMember();
    const leaveMutation = useLeaveCompany();

    const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

    const { data: session } = useSession();
    const currentUserId = session?.user?.id;

    const handleInvite = async () => {
        try {
            const data = await inviteMutation.mutateAsync({
                companyId: company.company_id,
                email: inviteEmail,
                role: inviteRole
            });
            if (data?.token) {
                const link = `${window.location.origin}/organization/invite/accept?token=${data.token}`;
                setLastInviteLink(link);
            }
            setIsInviteOpen(false);
            setInviteEmail("");
        } catch (e) {
            // Error handled by hook
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                {/* Header Logic Remains Same */}
                <div>
                    <h3 className="text-lg font-medium">Team Members</h3>
                    <p className="text-sm text-muted-foreground">Manage who has access to this page.</p>
                </div>
                <div className="flex gap-2">
                    {!isOwner && (
                        <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => {
                            if (confirm("Are you sure you want to leave this company?")) {
                                leaveMutation.mutate({ companyId: company.company_id });
                            }
                        }}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Leave
                        </Button>
                    )}
                    {canManageMembers && (
                        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Invite Member
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Invite Member</DialogTitle>
                                    <DialogDescription>
                                        Send an email invitation to join your company page.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <Input
                                            placeholder="colleague@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select value={inviteRole} onValueChange={setInviteRole}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                                <SelectItem value="EDITOR">Editor</SelectItem>
                                                <SelectItem value="RECRUITER">Recruiter</SelectItem>
                                                <SelectItem value="ANALYST">Analyst</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
                                        {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Send Invite
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    <Dialog open={!!lastInviteLink} onOpenChange={() => setLastInviteLink(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invitation Sent</DialogTitle>
                                <DialogDescription>
                                    Share this link with your team member to let them join.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2">
                                <Input value={lastInviteLink || ''} readOnly />
                                <Button size="sm" onClick={() => {
                                    navigator.clipboard.writeText(lastInviteLink || '');
                                    // toast.success("Copied!"); 
                                }}>
                                    Copy
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="border rounded-lg divide-y">
                {members.map((member: any) => {
                    const memberPriority = member.priority || 0;
                    const isSelf = member.user_id === currentUserId;
                    // Allow owners to edit anyone except self; others can edit strictly lower priority
                    const canEditMember = !isSelf && (isOwner || (myPriority || 0) > memberPriority);

                    return (
                        <div key={member.user_id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={member.avatar_url} />
                                    <AvatarFallback>{member.full_name?.slice(0, 1).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{member.full_name} {member.role === 'OWNER' && "(Owner)"}</p>
                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-muted-foreground capitalize">{member.role.toLowerCase()}</div>
                                {canManageMembers && canEditMember && member.role !== 'OWNER' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => {
                                            if (confirm(`Remove ${member.full_name}?`)) {
                                                removeMutation.mutate({ companyId: company.company_id, userId: member.user_id });
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {members.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No members found.
                    </div>
                )}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading more...
                            </>
                        ) : (
                            "Load More"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
