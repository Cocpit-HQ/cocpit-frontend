import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export interface AccountData {
  id?: string;
  primaryEmail?: string;
  recoveryEmail?: string;
  phone?: string | null;
  hasCompanyAccount?: boolean;
  isDeactivated?: boolean;
  hasPassword?: boolean;
  authProvider?: 'email' | 'google' | 'apple' | string;
}

export function useAccountSettings() {
  return useQuery<AccountData>({
    queryKey: ['userAccount'],
    queryFn: async () => {
      const response = await api.get('/user/account');
      return response.data;
    }
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/settings/account/logout');
      return response.data;
    },
  });
}

export function useVerifyCurrentEmailInit() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/settings/account/email/verify-current');
      return response.data;
    },
  });
}

export function useVerifyCurrentEmailConfirm() {
  return useMutation({
    mutationFn: async (data: { otp: string }) => {
      const response = await api.post('/settings/account/email/verify-current/confirm', data);
      return response.data;
    },
  });
}

export function useSubmitNewEmail() {
  return useMutation({
    mutationFn: async (data: { newEmail: string }) => {
      const response = await api.post('/settings/account/email/change', data);
      return response.data;
    },
  });
}

export function useSubmitRecoveryEmail() {
  return useMutation({
    mutationFn: async (data: { recoveryEmail: string }) => {
      const response = await api.post('/settings/account/email/recovery', data);
      return response.data;
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (data: { otp: string }) => {
      const response = await api.post('/settings/account/email/change/confirm', data);
      return response.data;
    },
  });
}

export function useVerifyRecoveryEmail() {
  return useMutation({
    mutationFn: async (data: { otp: string }) => {
      const response = await api.post('/settings/account/email/recovery/confirm', data);
      return response.data;
    },
  });
}

export function useDeleteRecoveryEmail() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.delete('/user/email/recovery');
      return response.data;
    },
  });
}

export function useUpdatePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { currentPassword?: string; newPassword: string }) => {
      const response = await api.put('/user/password', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAccount'] });
    },
  });
}

export function useRequestPasswordResetLink() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/forgot-password-link');
      return response.data;
    },
  });
}

export function useResetLinkStatus() {
  return useQuery({
    queryKey: ['resetLinkStatus'],
    queryFn: async () => {
      const response = await api.get('/auth/reset-link-status');
      return response.data as { hasActiveLink: boolean; remainingSeconds: number };
    },
    refetchOnWindowFocus: true,
  });
}

export function useSetPhone() {
  return useMutation({
    mutationFn: async (data: { phone: string }) => {
      const response = await api.post('/settings/account/phone', data);
      return response.data;
    },
  });
}

export function useConfirmPhone() {
  return useMutation({
    mutationFn: async (data: { otp: string }) => {
      const response = await api.post('/settings/account/phone/confirm', data);
      return response.data;
    },
  });
}

export function useDeletePhone() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.delete('/user/phone');
      return response.data;
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (credential: { password?: string; idToken?: string; companyIdsToDelete?: string[] }) => {
      const { deleteAccount } = await import('../../../services/api/user');
      return deleteAccount(credential);
    },
  });
}

export function useDeactivateAccount() {
  return useMutation({
    mutationFn: async (data: { password?: string }) => {
      const response = await api.patch('/user/account/deactivate', data);
      return response.data;
    },
  });
}
