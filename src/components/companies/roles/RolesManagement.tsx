"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyRolesService, CompanyRole, PERMISSIONS_LIST } from "@/services/company.roles.service";
import { Company } from "@/services/company.service";
import { useCompanyPermissions } from "@/components/companies/hooks/use-company";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Trash2, Pencil, Shield } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface RolesManagementProps {
    company: Company;
}

export function RolesManagement({ company }: RolesManagementProps) {
    const queryClient = useQueryClient();
    const { company_id: companyId } = company;
    const { checkPermission, isOwner } = useCompanyPermissions(company);
    const canManageRoles = isOwner || checkPermission("MANAGE_ROLES");

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<CompanyRole | null>(null);

    const { data: roles, isLoading } = useQuery({
        queryKey: ["companyRoles", companyId],
        queryFn: () => companyRolesService.getRoles(companyId),
    });

    const createMutation = useMutation({
        mutationFn: (data: RoleFormData) => companyRolesService.createRole(companyId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["companyRoles", companyId] });
            setIsCreateOpen(false);
            toast.success("Role created successfully");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create role"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ roleId, data }: { roleId: string; data: RoleFormData }) => companyRolesService.updateRole(companyId, roleId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["companyRoles", companyId] });
            setEditingRole(null);
            toast.success("Role updated successfully");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update role"),
    });

    const deleteMutation = useMutation({
        mutationFn: (roleId: string) => companyRolesService.deleteRole(companyId, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["companyRoles", companyId] });
            toast.success("Role deleted successfully");
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete role"),
    });

    const handleDelete = (role: CompanyRole) => {
        if (role.is_system_role) {
            toast.error("Cannot delete system roles");
            return;
        }
        if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
            deleteMutation.mutate(role.role_id);
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;



    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Roles & Permissions</h3>
                    <p className="text-sm text-muted-foreground">Manage hierarchy and access levels for your company members.</p>
                </div>
                {canManageRoles && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Create Role
                    </Button>
                )}
            </div>

            <div className="grid gap-4">
                {roles?.map((role) => (
                    <Card key={role.role_id} className="overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-card hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-3 h-12 rounded-full"
                                    style={{ backgroundColor: role.color }}
                                    title={`Priority: ${role.priority}`}
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold">{role.name}</h4>
                                        {role.is_system_role && <Badge variant="secondary" className="text-xs">System</Badge>}
                                        <Badge variant="outline" className="text-xs">Lvl {role.priority}</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {role.permissions.includes("*") ? (
                                            <span className="text-xs text-muted-foreground flex items-center"><Shield className="w-3 h-3 mr-1" /> Administrator Access</span>
                                        ) : (
                                            role.permissions.slice(0, 3).map(p => (
                                                <span key={p} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded mr-1">
                                                    {PERMISSIONS_LIST.find(pl => pl.id === p)?.label || p}
                                                </span>
                                            ))
                                        )}
                                        {role.permissions.length > 3 && (
                                            <span className="text-xs text-muted-foreground">+{role.permissions.length - 3} more</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {canManageRoles && (
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingRole(role)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    {!role.is_system_role && (
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(role)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Create/Edit Generic Modal */}
            {(isCreateOpen || !!editingRole) && (
                <RoleDialog
                    open={isCreateOpen || !!editingRole}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsCreateOpen(false);
                            setEditingRole(null);
                        }
                    }}
                    role={editingRole}
                    onSubmit={(data) => {
                        if (editingRole) {
                            updateMutation.mutate({ roleId: editingRole.role_id, data });
                        } else {
                            createMutation.mutate(data);
                        }
                    }}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            )}
        </div>
    );
}

interface RoleFormData {
    name: string;
    color: string;
    priority: number;
    permissions: string[];
}

interface RoleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: CompanyRole | null;
    onSubmit: (data: RoleFormData) => void;
    isLoading: boolean;
}

function RoleDialog({ open, onOpenChange, role, onSubmit, isLoading }: RoleDialogProps) {
    const [name, setName] = useState(role?.name || "");
    const [color, setColor] = useState(role?.color || "#808080");
    const [priority, setPriority] = useState<string | number>(role?.priority || 10);
    const [permissions, setPermissions] = useState<string[]>(role?.permissions || []);

    // Reset form when role changes
    React.useEffect(() => {
        setName(role?.name || "");
        setColor(role?.color || "#808080");
        setPriority(role?.priority || 10);
        setPermissions(role?.permissions || []);
    }, [role, open]);

    const handlePermissionToggle = (permId: string) => {
        setPermissions(prev =>
            prev.includes(permId)
                ? prev.filter(p => p !== permId)
                : [...prev, permId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, color, priority: Number(priority), permissions });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{role ? "Edit Role" : "Create New Role"}</DialogTitle>
                    <DialogDescription>
                        Configure the role name, color, and permissions.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2">
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Role Name</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Moderator" required disabled={role?.is_system_role && role.name === 'Owner'} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="color">Role Color</Label>
                                <div className="flex gap-2">
                                    <Input id="color" type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 p-1" />
                                    <Input value={color} onChange={e => setColor(e.target.value)} placeholder="#RRGGBB" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority Level (0-100)</Label>
                            <Input id="priority" type="number" min="0" max="100" value={priority} onChange={e => setPriority(e.target.value)} required />
                            <p className="text-xs text-muted-foreground">Higher priority roles appear higher in lists and can manage lower roles.</p>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label>Permissions</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {PERMISSIONS_LIST.map((perm) => (
                                    <div key={perm.id} className="flex items-start space-x-2 border p-3 rounded-md hover:bg-muted/50">
                                        <Checkbox
                                            id={perm.id}
                                            checked={permissions.includes(perm.id) || permissions.includes("*")}
                                            disabled={permissions.includes("*") && perm.id !== "*" && role?.name === 'Owner'}
                                            onCheckedChange={() => handlePermissionToggle(perm.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor={perm.id}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full select-none"
                                            >
                                                {perm.label}
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Role"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
