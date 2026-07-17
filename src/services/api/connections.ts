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

// ─── Suggestions ──────────────────────────────────────────────────────────────

/**
 * Fetch "People You May Know" suggestions using the 4-signal algorithm
 * (2nd-degree connections, same company, shared skills, same city).
 * @param limit  Max items to return (default 8, max 20)
 */
export const getConnectionSuggestions = async (
  limit = 8,
): Promise<SuggestionsResponse> => {
  const { data } = await api.get('/connections/suggestions', { params: { limit } });
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
