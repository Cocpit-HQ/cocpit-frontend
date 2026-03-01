"use client";

import { useCompany } from "@/components/companies/hooks/use-company";
import { useCompanyPermissions } from "@/components/companies/hooks/use-company";
import { Loader2, ShieldAlert, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

interface RequireRoleProps {
    children: React.ReactNode;
    roles: ('OWNER' | 'ADMIN' | 'EDITOR')[];
}

export function RequireRole({ children, roles }: RequireRoleProps) {
    const params = useParams();
    const slug = params?.slug as string;

    const { data: company, isLoading, error } = useCompany(slug);
    const { isOwner, isAdmin, isEditor } = useCompanyPermissions(company);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-center">
                <ShieldAlert className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold">Company Not Found</h2>
                <p className="text-muted-foreground">The company you are looking for does not exist or has been removed.</p>
                <Button asChild variant="outline">
                    <Link href="/">Go Home</Link>
                </Button>
            </div>
        );
    }

    // Determine current user's role string or if they have permission
    let hasPermission = false;
    if (roles.includes('OWNER') && isOwner) hasPermission = true;
    if (roles.includes('ADMIN') && isAdmin) hasPermission = true;
    if (roles.includes('EDITOR') && isEditor) hasPermission = true;

    // Heirarchy check: Owner implies Admin permission usually? 
    // The hook `useCompanyPermissions` returns booleans specifically for the exact role match usually? 
    // Wait, the hook implementation:
    // const role = company.viewer_role;
    // const isOwner = role === 'OWNER';
    // const isAdmin = role === 'ADMIN';
    // const isEditor = role === 'EDITOR';
    // So if roles=['ADMIN'], checks isAdmin.
    // If I am OWNER, do I pass `isAdmin` check? 
    // In `useCompanyPermissions`:
    // canEdit: isOwner || isAdmin,
    // canManageMembers: isOwner || isAdmin,
    // So usually we check capabilities (canManageMembers).
    // But `RequireRole` takes specific roles.
    // It's safer to check:
    // If roles includes ADMIN, we accept OWNER too.
    // If roles includes EDITOR, we accept OWNER and ADMIN too.

    if (isOwner) hasPermission = true; // Owners can do everything basically
    if (isAdmin && (roles.includes('ADMIN') || roles.includes('EDITOR'))) hasPermission = true;
    if (isEditor && roles.includes('EDITOR')) hasPermission = true;


    if (!hasPermission) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-center">
                <Ban className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
                <Button asChild variant="default">
                    <Link href={`/company/${slug}`}>Back to Profile</Link>
                </Button>
            </div>
        );
    }

    return <>{children}</>;
}
