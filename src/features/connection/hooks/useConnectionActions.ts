// src/features/connection/hooks/useConnectionActions.ts
// All mutations for the connection section with optimistic UI + rollback on error.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  sendConnectionRequest,
} from '@/services/api/connections';
import { useConnectionStore } from '@/store/connection.store';

// ── Minimal toast helper — uses whatever toast library is in the project ──────
// We import dynamically to avoid hard dependency on a specific library.
// Falls back to console if nothing is available.
const toast = {
  success: (msg: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('react-hot-toast').default.success(msg);
    } catch {
      console.info('[toast success]', msg);
    }
  },
  error: (msg: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('react-hot-toast').default.error(msg);
    } catch {
      console.error('[toast error]', msg);
    }
  },
};

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
      // After short delay, refetch suggestions so a new user fills the slot
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['connection-suggestions'] });
      }, 600);
      toast.success('Connection request sent!');
    },
    onError: () => {
      toast.error('Failed to send request. Please try again.');
    },
  });

  return { accept, decline, undo, connect };
};
