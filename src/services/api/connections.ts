// src/services/api/connections.ts
// Dedicated API service for the Connection feature.
// Uses the authenticated Axios instance from @/lib/axios.
// NOTE: Do NOT import from social.ts for connection-section concerns —
//       this file is the single source of truth for connection endpoints.

import api from '@/lib/axios';
import type {
  ConnectionRequestsResponse,
  ConnectionCounts,
  SuggestionsResponse,
} from '@/features/connection/types';

// ─── Requests ─────────────────────────────────────────────────────────────────

/**
 * Fetch pending connection requests.
 * @param type  'received' (default) | 'sent'
 * @param page  1-based page number
 * @param limit Items per page (max 50)
 */
export const getConnectionRequests = async (
  type: 'received' | 'sent' = 'received',
  page  = 1,
  limit = 10,
): Promise<ConnectionRequestsResponse> => {
  const { data } = await api.get('/connections/requests', {
    params: { type, page, limit },
  });
  return data;
};

/**
 * Lightweight count endpoint — received and sent pending request counts.
 * Use this for tab badges and InboxCounter without fetching full lists.
 */
export const getConnectionCounts = async (): Promise<ConnectionCounts> => {
  const { data } = await api.get('/connections/counts');
  return data;
};

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Accept a received connection request.
 * Backend: PATCH /connections/:requestId  { status: 'connected' }
 */
export const acceptConnectionRequest = async (requestId: string) => {
  const { data } = await api.patch(`/connections/${requestId}`, { status: 'connected' });
  return data;
};

/**
 * Decline a received connection request.
 * Backend: PATCH /connections/:requestId  { status: 'rejected' }
 */
export const declineConnectionRequest = async (requestId: string) => {
  const { data } = await api.patch(`/connections/${requestId}`, { status: 'rejected' });
  return data;
};

/**
 * Cancel / Undo a sent connection request.
 * Backend: DELETE /connections/:requestId
 */
export const cancelConnectionRequest = async (requestId: string) => {
  const { data } = await api.delete(`/connections/${requestId}`);
  return data;
};

/**
 * Batch accept received connection requests.
 * Backend: PATCH /connections/batch-accept  { requestIds: string[] }
 */
export const batchAcceptConnectionRequests = async (requestIds: string[]) => {
  const { data } = await api.patch('/connections/batch-accept', { requestIds });
  return data;
};

/**
 * Batch decline received connection requests.
 * Backend: PATCH /connections/batch-decline  { requestIds: string[] }
 */
export const batchDeclineConnectionRequests = async (requestIds: string[]) => {
  const { data } = await api.patch('/connections/batch-decline', { requestIds });
  return data;
};

/**
 * Batch withdraw sent connection requests.
 * Backend: DELETE /connections/batch-withdraw  { data: { requestIds: string[] } }
 */
export const batchWithdrawConnectionRequests = async (requestIds: string[]) => {
  const { data } = await api.delete('/connections/batch-withdraw', { data: { requestIds } });
  return data;
};

// ─── Suggestions ──────────────────────────────────────────────────────────────

/**
 * Fetch "People You May Know" suggestions using the 4-tier priority algorithm
 * (Mutual connections > Same Education > Same Experience > Shared Skills/Interests).
 * @param limit   Max items to return (default 12, max 30)
 * @param offset  Pagination offset (default 0)
 * @param exclude Optional array of user IDs to exclude from suggestions
 */
export const getConnectionSuggestions = async (
  limit = 12,
  offset = 0,
  exclude: string[] = [],
): Promise<SuggestionsResponse> => {
  const { data } = await api.get('/connections/suggestions', {
    params: {
      limit,
      offset,
      exclude: exclude.join(','),
    },
  });
  return data;
};

/**
 * Follow a user from the suggestions grid.
 * Backend: POST /users/:userId/follow
 */
export const followSuggestedUser = async (userId: string) => {
  const { data } = await api.post(`/users/${userId}/follow`);
  return data;
};

/**
 * Send a two-way connection request from the suggestions grid.
 * Backend: POST /users/:userId/connect
 */
export const sendConnectionRequest = async (userId: string) => {
  const { data } = await api.post(`/users/${userId}/connect`);
  return data;
};

// ─── Channel / Community Invitations ─────────────────────────────────────────

/**
 * Get all pending channel invitations for the current user (receiver).
 * Backend: GET /communities/invitations
 * Only returns PENDING invitations — accepted/ignored are excluded server-side.
 */
export const getChannelInvitations = async (): Promise<{
  data: Array<{
    inviteId: string;
    createdAt: string;
    senderOrgId: string;
    companyName: string;
    logoUrl: string | null;
    companySlug: string;
  }>;
}> => {
  const { data } = await api.get('/communities/invitations');
  return data;
};

/**
 * Accept a pending channel invitation.
 * Backend: POST /communities/invitations/:inviteId/accept
 * Side-effect: auto-creates a community_subscription record.
 */
export const acceptChannelInvitation = async (inviteId: string) => {
  const { data } = await api.post(`/communities/invitations/${inviteId}/accept`);
  return data;
};

/**
 * Decline (ignore) a pending channel invitation.
 * Backend: POST /communities/invitations/:inviteId/ignore
 * Sets status to IGNORED — user can receive a new invite again later.
 */
export const declineChannelInvitation = async (inviteId: string) => {
  const { data } = await api.post(`/communities/invitations/${inviteId}/ignore`);
  return data;
};
