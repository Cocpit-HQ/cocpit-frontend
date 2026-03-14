import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { companyService, Company, OrganizationTechStack, OrganizationGalleryItem } from '@/services/organization.service';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { actorScopeKey } from "@/lib/actor-context";

export const COMP_KEYS = {
    all: ['companies'] as const,
    detail: (slug: string) => [...COMP_KEYS.all, slug] as const,
    members: (id: string) => [...COMP_KEYS.all, id, 'members'] as const,
    techStack: (slug: string) => [...COMP_KEYS.detail(slug), 'tech-stack'] as const,
    gallery: (slug: string) => [...COMP_KEYS.detail(slug), 'gallery'] as const,
};

export function useCompany(slug: string) {
    return useQuery({
        queryKey: COMP_KEYS.detail(slug),
        queryFn: () => companyService.getCompany(slug),
        enabled: !!slug,
        retry: 1, // Don't retry too much on 404s
    });
}

export function useUserCompanies(options?: { enabled?: boolean }) {
    const { data: session } = useSession();
    return useQuery({
        queryKey: ['user-companies'],
        queryFn: () => companyService.getUserCompanies(),
        enabled: (options?.enabled ?? true) && !!session?.user,
    });
}

// Hook to check slug availability (debounced in UI, but this is the mutation/fetcher)
export function useCheckSlug() {
    return useMutation({
        mutationFn: (slug: string) => companyService.checkSlug(slug),
    });
}

export function useCompanyMembers(companyId: string | undefined) {
    return useInfiniteQuery({
        queryKey: COMP_KEYS.members(companyId!),
        queryFn: ({ pageParam = 1 }) => companyService.getMembers(companyId!, pageParam as number),
        getNextPageParam: (lastPage: any) => {
            const { page, totalPages } = lastPage.meta;
            return page < totalPages ? page + 1 : undefined;
        },
        enabled: !!companyId,
        initialPageParam: 1,
    });
}

export function useInviteMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, email, role }: { companyId: string; email: string; role: string }) =>
            companyService.inviteMember(companyId, email, role),
        onSuccess: (_, { companyId }) => {
            toast.success("Invitation sent");
            // Invalidate members? No, invites are separate table usually, but maybe we show pending?
            // For MVP, just toast is fine. Or if we list pending invites, invalidate that.
            // Backend `getMembers` currently only returns active members.
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}

export function useRemoveMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, userId }: { companyId: string; userId: string }) =>
            companyService.removeMember(companyId, userId),
        onSuccess: (_, { companyId }) => {
            toast.success("Member removed");
            queryClient.invalidateQueries({ queryKey: COMP_KEYS.members(companyId) });
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}

export function useLeaveCompany() {
    const router = useRouter();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId }: { companyId: string }) => companyService.leaveCompany(companyId),
        onSuccess: (_, { companyId }) => {
            toast.success("You left the company");
            queryClient.invalidateQueries({ queryKey: COMP_KEYS.members(companyId) });
            queryClient.invalidateQueries({ queryKey: COMP_KEYS.all }); // Refresh perms
            router.push('/');
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}

export function useVerifyDomain() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, domain, otp }: { companyId: string; domain: string; otp?: string }) =>
            companyService.verifyDomain(companyId, domain, otp),
        onSuccess: (data, { companyId, otp }) => { // otp returned or confirmed
            if (otp) {
                toast.success("Domain successfully verified!");
            } else {
                toast.success(`OTP Sent: ${data.otp}`);
            }
            queryClient.invalidateQueries({ queryKey: COMP_KEYS.all });
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}

export function useTransferOwnership() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, newOwnerId, password }: { companyId: string; newOwnerId: string; password?: string }) =>
            companyService.transferOwnership(companyId, newOwnerId, password),
        onSuccess: (_, { companyId }) => {
            toast.success("Ownership transferred");
            queryClient.invalidateQueries({ queryKey: COMP_KEYS.all });
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}

export function useDeleteCompany() {
    const router = useRouter();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, password }: { companyId: string; password?: string }) =>
            companyService.deleteCompany(companyId, password),
        onSuccess: () => {
            toast.success("Company deleted");
            queryClient.invalidateQueries({ queryKey: COMP_KEYS.all });
            router.push('/');
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}

export function useCreateCompany() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: companyService.createCompany,
        onSuccess: (data) => {
            toast.success('Company created successfully!');
            queryClient.invalidateQueries({ queryKey: COMP_KEYS.all });
            router.push(`/organization/${data.slug}`);
        },
        onError: (err) => {
            toast.error(companyService.normalizeError(err));
        }
    });
}

// Simplified permissions hook
// Allows components to easily check if the current user can perform actions
export function useCompanyPermissions(company?: any | null) {
    if (!company || !company.viewer_role_data) {
        return {
            isOwner: false,
            isAdmin: false,
            isAnalyst: false,
            isRecruiter: false,
            isEditor: false,
            canEdit: false,
            canManageMembers: false,
            canPostJobs: false,
            canCreateContent: false,
            canViewAnalytics: false,
            canManageRoles: false,
            canVerify: false,
            canDelete: false,
            checkPermission: (perm: string) => false
        };
    }

    const { name, permissions, priority } = company.viewer_role_data;
    const roleName = name.toUpperCase();

    // Use permission-based ownership detection for both companies and institutions
    const isOwner = permissions.includes('*');
    const isAdmin = roleName === 'ADMIN';

    // Helper to check specific permission
    const checkPermission = (perm: string) => {
        if (isOwner || isAdmin) return true;
        if (permissions.includes('*')) return true;
        if (permissions.includes(perm)) return true;
        // Hierarchy: MANAGE_X implies VIEW_X
        if (perm.startsWith("VIEW_") && permissions.includes(perm.replace("VIEW_", "MANAGE_"))) return true;
        return false;
    };

    const isAnalyst = roleName === 'ANALYST';
    const isRecruiter = roleName === 'RECRUITER';
    const isEditor = roleName === 'EDITOR'; // or 'MEMBER'? likely EDITOR based on usage

    return {
        role: roleName,
        priority,
        isOwner,
        isAdmin,
        isAnalyst,
        isRecruiter,
        isEditor,
        // Pre-computed common checks for UI convenience
        canEdit: checkPermission('MANAGE_COMPANY_DETAILS'),
        canManageMembers: checkPermission('MANAGE_MEMBERS') || checkPermission('INVITE_MEMBERS') || checkPermission('REMOVE_MEMBERS'),
        canPostJobs: checkPermission('POST_JOBS'),
        canCreateContent: checkPermission('CREATE_CONTENT'),
        canViewAnalytics: checkPermission('VIEW_ANALYTICS'),
        canManageRoles: checkPermission('MANAGE_ROLES'),
        canVerify: isOwner, // Strict
        canDelete: isOwner,
        checkPermission
    };
}

export function useAnalyticsOverview(companyId: string) {
    const { activeProfile } = useActiveProfile();
    const { data: session } = useSession();
    const actorKey = actorScopeKey(activeProfile, session?.user?.id ?? "me");
    const isOrgActor = activeProfile?.type === "COMPANY" && activeProfile.id === companyId;
    return useQuery({
        queryKey: [...COMP_KEYS.detail(companyId), ...actorKey, 'analytics', 'overview'],
        queryFn: () => companyService.getAnalyticsOverview(companyId),
        enabled: !!companyId && isOrgActor,
    });
}

export function useAnalyticsEngagement(companyId: string) {
    const { activeProfile } = useActiveProfile();
    const { data: session } = useSession();
    const actorKey = actorScopeKey(activeProfile, session?.user?.id ?? "me");
    const isOrgActor = activeProfile?.type === "COMPANY" && activeProfile.id === companyId;
    return useQuery({
        queryKey: [...COMP_KEYS.detail(companyId), ...actorKey, 'analytics', 'engagement'],
        queryFn: () => companyService.getAnalyticsEngagement(companyId),
        enabled: !!companyId && isOrgActor,
    });
}

export function useAnalyticsJobs(companyId: string) {
    const { activeProfile } = useActiveProfile();
    const { data: session } = useSession();
    const actorKey = actorScopeKey(activeProfile, session?.user?.id ?? "me");
    const isOrgActor = activeProfile?.type === "COMPANY" && activeProfile.id === companyId;
    return useQuery({
        queryKey: [...COMP_KEYS.detail(companyId), ...actorKey, 'analytics', 'jobs'],
        queryFn: () => companyService.getAnalyticsJobs(companyId),
        enabled: !!companyId && isOrgActor,
    });
}

export function useAuditLogs(companyId: string, params: any = {}) {
    const { activeProfile } = useActiveProfile();
    const { data: session } = useSession();
    const actorKey = actorScopeKey(activeProfile, session?.user?.id ?? "me");
    const isOrgActor = activeProfile?.type === "COMPANY" && activeProfile.id === companyId;
    return useQuery({
        queryKey: [...COMP_KEYS.detail(companyId), ...actorKey, 'audit-logs', params],
        queryFn: () => companyService.getAuditLogs(companyId, params),
        enabled: !!companyId && isOrgActor,
    });
}



// --- Tech Stack Hooks ---

export function useTechStack(slug: string) {
    return useQuery({
        queryKey: COMP_KEYS.techStack(slug),
        queryFn: () => companyService.getTechStack(slug),
        enabled: !!slug,
    });
}

export function useAddTechStack() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, name, category }: { companyId: string; name: string; category?: string }) =>
            companyService.addTechStack(companyId, name, category),
        onSuccess: (_, { companyId }) => {
            toast.success("Technology added");
            // Since we use slug for QueryKey, and we only have ID here... tricky?
            // Usually we might want invalidate all tech stacks or find slug.
            // But wait, the key is based on SLUG. Ideally we should invalidate based on slug.
            // But addTechStack uses ID.
            // Simple fix: Invalidate 'companies' generally or refresh relevant part if we can.
            // Or assume the parent component will handle refetch if needed.
            // Actually, best practice: invalidate detail(slug) -> tech-stack.
            // But we don't have slug here easily unless passed.
            // For now, let's just invalidate all companies queries is too broad.
            // Let's assume we can pass slug to onSuccess or context.
            // Actually, we can just invalidate `['companies']` which is acceptable for now or use `queryClient.invalidateQueries`.
            queryClient.invalidateQueries({ queryKey: COMP_KEYS.all });
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}

export function useRemoveTechStack() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, stackId }: { companyId: string; stackId: string }) =>
            companyService.removeTechStack(companyId, stackId),
        onSuccess: () => {
            toast.success("Technology removed");
            queryClient.invalidateQueries({ queryKey: COMP_KEYS.all });
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}

// --- Gallery Hooks ---

export function useGallery(slug: string) {
    return useQuery({
        queryKey: COMP_KEYS.gallery(slug),
        queryFn: () => companyService.getGallery(slug),
        enabled: !!slug,
    });
}

export function useAddToGallery() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, url, type, caption }: { companyId: string; url: string; type: 'image' | 'video'; caption?: string }) =>
            companyService.addToGallery(companyId, url, type, caption),
        onSuccess: () => {
            toast.success("Added to gallery");
            queryClient.invalidateQueries({ queryKey: COMP_KEYS.all });
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}

export function useRemoveFromGallery() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, galleryId }: { companyId: string; galleryId: string }) =>
            companyService.removeFromGallery(companyId, galleryId),
        onSuccess: () => {
            toast.success("Removed from gallery");
            queryClient.invalidateQueries({ queryKey: COMP_KEYS.all });
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}

// --- Advocacy Hooks ---

export function useNotifyEmployees() {
    return useMutation({
        mutationFn: ({ companyId, postId }: { companyId: string; postId: string }) =>
            companyService.notifyEmployees(companyId, postId),
        onSuccess: (data) => {
            toast.success(data.message || "Employees notified successfully");
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}

export function useOrganizationPosts(companyId: string) {
    return useInfiniteQuery({
        queryKey: ['company-posts', companyId],
        queryFn: ({ pageParam }) => companyService.getOrganizationPosts(companyId, pageParam),
        getNextPageParam: (lastPage) => lastPage.nextCursor ? lastPage.nextCursor : undefined,
        initialPageParam: undefined,
        enabled: !!companyId,
    });
}

// --- Institution Enrollments ---

export function useRequestEnrollment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orgId, data }: { orgId: string; data: { department?: string; batch_year?: number; enrollment_number?: string } }) =>
            companyService.requestEnrollment(orgId, data),
        onSuccess: (_, { orgId }) => {
            toast.success("Enrollment request submitted");
            queryClient.invalidateQueries({ queryKey: COMP_KEYS.detail(orgId) });
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}

export function usePendingEnrollments(orgId: string) {
    const { activeProfile } = useActiveProfile();
    const { data: session } = useSession();
    const actorKey = actorScopeKey(activeProfile, session?.user?.id ?? "me");
    const isOrgActor = activeProfile?.type === "COMPANY" && activeProfile.id === orgId;
    return useQuery({
        queryKey: [...COMP_KEYS.detail(orgId), ...actorKey, 'enrollments', 'pending'],
        queryFn: () => companyService.getPendingEnrollments(orgId),
        enabled: !!orgId && isOrgActor,
    });
}

export function useReviewEnrollment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orgId, enrollmentId, status, notes }: { orgId: string; enrollmentId: string; status: 'VERIFIED' | 'REJECTED'; notes?: string }) =>
            companyService.reviewEnrollment(orgId, enrollmentId, status, notes),
        onSuccess: (_, { orgId }) => {
            toast.success("Enrollment status updated");
            queryClient.invalidateQueries({ queryKey: [...COMP_KEYS.detail(orgId), 'enrollments'] });
            // Optionally invalidate members list if verified
        },
        onError: (err) => toast.error(companyService.normalizeError(err))
    });
}
