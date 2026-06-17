// src/features/connection/hooks/useConnectionActions.ts
// All mutations for the connection section with optimistic UI + rollback on error.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  sendConnectionRequest,
} from '@/services/api/connections';
import { useConnectionStore } from '@/store/connection.store';


export const useConnectionActions = () => {
  const queryClient = useQueryClient();
  const { removeRequest, restoreRequest, setFollowed } = useConnectionStore();

  /** Invalidate both list and counts so tabs + badges refresh */
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
    queryClient.invalidateQueries({ queryKey: ['connection-counts'] });
  };

  // ─── Accept ───────────────────────────────────────────────────────────────
  const accept = useMutation({
    mutationFn: (requestId: string) => {
      removeRequest(requestId);           // optimistic — hide card immediately
      return acceptConnectionRequest(requestId);
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Connected!');
    },
    onError: (_err, requestId) => {
      restoreRequest(requestId);          // rollback — show card again
      toast.error('Failed to accept. Please try again.');
    },
  });

  // ─── Decline ──────────────────────────────────────────────────────────────
  const decline = useMutation({
    mutationFn: (requestId: string) => {
      removeRequest(requestId);
      return declineConnectionRequest(requestId);
    },
    onSuccess: () => {
      invalidateAll();
    },
    onError: (_err, requestId) => {
      restoreRequest(requestId);
      toast.error('Failed to decline. Please try again.');
    },
  });

  // ─── Undo (cancel sent request) ───────────────────────────────────────────
  const undo = useMutation({
    mutationFn: (requestId: string) => {
      removeRequest(requestId);
      return cancelConnectionRequest(requestId);
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Request withdrawn.');
    },
    onError: (_err, requestId) => {
      restoreRequest(requestId);
      toast.error('Failed to withdraw. Please try again.');
    },
  });

  // ─── Connect (suggestions grid — two-way connection request) ──────────────
  const connect = useMutation({
    mutationFn: (userId: string) => sendConnectionRequest(userId),
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
      const serverMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(serverMsg || 'Failed to send request. Please try again.');
    },
  });

  return { accept, decline, undo, connect };
};
