// src/features/connection/hooks/useConnectionActions.ts
// All mutations for the connection section with optimistic UI + rollback on error.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  sendConnectionRequest,
  acceptChannelInvitation,
  declineChannelInvitation,
} from '@/services/api/connections';
import { acceptInvite as acceptTeamInvite, declineInvite as declineTeamInvite } from '@/features/manage-team/services/team.service';
import { useConnectionStore } from '@/store/connection.store';
import { useActiveProfile } from '@/context/ActiveProfileContext';


export const useConnectionActions = () => {
  const queryClient = useQueryClient();
  const { removeRequest, restoreRequest, setFollowed } = useConnectionStore();
  const { refreshCompanies } = useActiveProfile();

  /** Optimistically update the badge counts in cache for instant UI feedback */
  const updateCountsOptimistically = (key: 'received' | 'sent' | 'invitations', delta: number) => {
    queryClient.setQueryData(['connection-counts'], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        [key]: Math.max(0, (old[key] ?? 0) + delta),
      };
    });
  };

  /** Invalidate both list and counts so tabs + badges refresh */
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
    queryClient.invalidateQueries({ queryKey: ['connection-counts'] });
  };

  // ─── Accept ───────────────────────────────────────────────────────────────
  const accept = useMutation({
    mutationFn: (requestId: string) => {
      removeRequest(requestId);           // optimistic — hide card immediately
      updateCountsOptimistically('received', -1);
      return acceptConnectionRequest(requestId);
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Connected!');
    },
    onError: (_err, requestId) => {
      restoreRequest(requestId);          // rollback — show card again
      updateCountsOptimistically('received', +1);
      toast.error('Failed to accept. Please try again.');
    },
  });

  // ─── Decline ──────────────────────────────────────────────────────────────
  const decline = useMutation({
    mutationFn: (requestId: string) => {
      removeRequest(requestId);
      updateCountsOptimistically('received', -1);
      return declineConnectionRequest(requestId);
    },
    onSuccess: () => {
      invalidateAll();
    },
    onError: (_err, requestId) => {
      restoreRequest(requestId);
      updateCountsOptimistically('received', +1);
      toast.error('Failed to decline. Please try again.');
    },
  });

  // ─── Undo (cancel sent request) ───────────────────────────────────────────
  const undo = useMutation({
    mutationFn: (requestId: string) => {
      removeRequest(requestId);
      updateCountsOptimistically('sent', -1);
      return cancelConnectionRequest(requestId);
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Request withdrawn.');
    },
    onError: (_err, requestId) => {
      restoreRequest(requestId);
      updateCountsOptimistically('sent', +1);
      toast.error('Failed to withdraw. Please try again.');
    },
  });

  // ─── Connect (suggestions grid — two-way connection request) ──────────────
  const connect = useMutation({
    mutationFn: (userId: string) => {
      updateCountsOptimistically('sent', +1);
      return sendConnectionRequest(userId);
    },
    onSuccess: (_data, userId) => {
      // Mark as requested for instant UI toggle (Requested state)
      setFollowed(userId);
      invalidateAll();
      // After short delay, refetch suggestions so a new user fills the slot
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['connection-suggestions'] });
      }, 600);
      toast.success('Connection request sent!');
    },
    onError: (err: unknown) => {
      updateCountsOptimistically('sent', -1);
      const serverMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(serverMsg || 'Failed to send request. Please try again.');
    },
  });

  // ─── Accept channel invitation ────────────────────────────────────────────
  const acceptInvitation = useMutation({
    mutationFn: (inviteId: string) => {
      removeRequest(inviteId);           // optimistic — hide card immediately
      updateCountsOptimistically('invitations', -1);
      return acceptChannelInvitation(inviteId);
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('You are now subscribed to this channel!');
    },
    onError: (_err, inviteId) => {
      restoreRequest(inviteId);
      updateCountsOptimistically('invitations', +1);
      toast.error('Failed to accept invitation. Please try again.');
    },
  });

  // ─── Decline channel invitation ───────────────────────────────────────────
  const declineInvitation = useMutation({
    mutationFn: (inviteId: string) => {
      removeRequest(inviteId);
      updateCountsOptimistically('invitations', -1);
      return declineChannelInvitation(inviteId);
    },
    onSuccess: () => {
      invalidateAll();
    },
    onError: (_err, inviteId) => {
      restoreRequest(inviteId);
      updateCountsOptimistically('invitations', +1);
      toast.error('Failed to decline invitation. Please try again.');
    },
  });

  // ─── Accept team invitation ────────────────────────────────────────────
  const acceptTeamInvitation = useMutation({
    mutationFn: (inviteId: string) => {
      removeRequest(inviteId);
      updateCountsOptimistically('invitations', -1);
      return acceptTeamInvite(inviteId);
    },
    onSuccess: () => {
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ['team'] });
      void refreshCompanies();
      toast.success('You have joined the team!');
    },
    onError: (_err, inviteId) => {
      restoreRequest(inviteId);
      updateCountsOptimistically('invitations', +1);
      toast.error('Failed to accept team invitation. Please try again.');
    },
  });

  // ─── Decline team invitation ───────────────────────────────────────────
  const declineTeamInvitation = useMutation({
    mutationFn: (inviteId: string) => {
      removeRequest(inviteId);
      updateCountsOptimistically('invitations', -1);
      return declineTeamInvite(inviteId);
    },
    onSuccess: () => {
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (_err, inviteId) => {
      restoreRequest(inviteId);
      updateCountsOptimistically('invitations', +1);
      toast.error('Failed to decline team invitation. Please try again.');
    },
  });

  return { accept, decline, undo, connect, acceptInvitation, declineInvitation, acceptTeamInvitation, declineTeamInvitation };
};
