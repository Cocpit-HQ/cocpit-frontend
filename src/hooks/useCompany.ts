import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { companyService, Company } from '../services/company.service';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const COMP_KEYS = {
    all: ['companies'] as const,
    detail: (slug: string) => [...COMP_KEYS.all, slug] as const,
    members: (id: string) => [...COMP_KEYS.all, id, 'members'] as const,
};

export function useCompany(slug: string) {
    return useQuery({
        queryKey: COMP_KEYS.detail(slug),
        queryFn: () => companyService.getCompany(slug),
        enabled: !!slug,
        retry: 1, // Don't retry too much on 404s
    });
}

import { useSession } from 'next-auth/react';

export function useUserCompanies() {
    const { data: session } = useSession();
    return useQuery({
        queryKey: ['user-companies'],
        queryFn: () => companyService.getUserCompanies(),
        enabled: !!session?.user,
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
        mutationFn: ({ companyId, newOwnerId }: { companyId: string; newOwnerId: string }) =>
            companyService.transferOwnership(companyId, newOwnerId),
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
        mutationFn: ({ companyId }: { companyId: string }) => companyService.deleteCompany(companyId),
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
            router.push(`/company/${data.slug}`);
        },
        onError: (err) => {
            toast.error(companyService.normalizeError(err));
        }
    });
}

// Simplified permissions hook
// Allows components to easily check if the current user can perform actions
export function useCompanyPermissions(company?: Company | null) {
    if (!company || !company.viewer_role) {
        return {
            isOwner: false,
            isAdmin: false,
            isEditor: false,
            canEdit: false,
            canManageMembers: false,
            canVerify: false,
            canDelete: false,
        };
    }

    const role = company.viewer_role;
    const isOwner = role === 'OWNER';
    const isAdmin = role === 'ADMIN';
    const isEditor = role === 'EDITOR';

    return {
        isOwner,
        isAdmin,
        isEditor,
        canEdit: isOwner || isAdmin,
        canManageMembers: isOwner || isAdmin,
        canVerify: isOwner,
        canDelete: isOwner,
    };
}
