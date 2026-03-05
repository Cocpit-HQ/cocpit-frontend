import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CompanyRole } from "@/types/user";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Pin, Globe, Lock } from "lucide-react";
import { updateMemberRoleSettings } from "@/services/api/organization";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CompanyRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: CompanyRole | null;
    isOwnProfile: boolean;
}

export function CompanyRoleModal({ isOpen, onClose, role, isOwnProfile }: CompanyRoleModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    if (!role) return null;

    const handleVisibilityToggle = async (checked: boolean) => {
        if (!role) return;
        setLoading(true);
        try {
            await updateMemberRoleSettings(role.company_id, { is_role_visible: checked });
            toast.success(checked ? "Role is now visible" : "Role is now hidden");
            window.location.reload();
        } catch (error) {
            toast.error("Failed to update visibility");
        } finally {
            setLoading(false);
        }
    };

    const handleSetPrimary = async () => {
        if (!role) return;
        setLoading(true);
        try {
            await updateMemberRoleSettings(role.company_id, { is_primary_display: true });
            toast.success("Set as primary role");
            window.location.reload();
        } catch (error) {
            toast.error("Failed to update primary role");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Company Details</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                        {role.logo_url ? (
                            <img
                                src={role.logo_url}
                                alt={role.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Building2 className="w-10 h-10 text-muted-foreground" />
                        )}
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-semibold">{role.name}</h3>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                {role.role}
                            </div>
                            {role.is_primary_display && (
                                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-primary bg-primary/10 border-primary/20">
                                    <Pin className="w-3 h-3 fill-current" />
                                    Primary
                                </span>
                            )}
                        </div>
                    </div>

                    {isOwnProfile && (
                        <div className="w-full space-y-4 mt-2 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-0.5">
                                    <Label className="text-base">Public Visibility</Label>
                                    <span className="text-xs text-muted-foreground">
                                        {role.is_role_visible ? "Visible on your profile" : "Hidden from your profile"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {role.is_role_visible ? <Globe className="w-4 h-4 text-muted-foreground" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                                    <Switch
                                        checked={role.is_role_visible}
                                        onCheckedChange={handleVisibilityToggle}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {!role.is_primary_display && (
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    onClick={handleSetPrimary}
                                    disabled={loading}
                                >
                                    <Pin className="w-4 h-4" />
                                    Set as Primary Role
                                </Button>
                            )}
                        </div>
                    )}

                </div>
                <DialogFooter className="sm:justify-center flex-col gap-2 sm:gap-0">
                    <Button
                        type="button"
                        className="w-full"
                        onClick={() => {
                            router.push(`/organization/${role.slug}`);
                            onClose();
                        }}
                    >
                        View Company Profile
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
