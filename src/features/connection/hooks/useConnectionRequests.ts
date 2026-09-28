// src/features/connection/hooks/useConnectionRequests.ts
import { useQuery } from '@tanstack/react-query';
import {
  getConnectionRequests,
  getChannelInvitations,
} from '@/services/api/connections';
import type { ConnectionTab, InvitationSubTab, ConnectionRequest, ConnectionRequestsResponse } from '../types';
import { getUserPendingInvites } from '@/features/manage-team/services/team.service';

const EMPTY_RESPONSE: ConnectionRequestsResponse = { data: [], totalCount: 0, page: 1, limit: 10 };

export const useConnectionRequests = (tab: ConnectionTab, subTab?: InvitationSubTab, page = 1) =>
  useQuery({
    queryKey: ['connection-requests', tab, subTab, page],
    queryFn: async (): Promise<ConnectionRequestsResponse> => {
      // ── Connection tabs (received / sent) ────────────────────────────────
      if (tab !== 'invitations') {
        return getConnectionRequests(tab, page, 10);
      }

      // ── Invitations — Teams sub-tab ───────────────────────────────────────
      if (subTab === 'teams') {
        const teamInvites = await getUserPendingInvites();
        const mapped: ConnectionRequest[] = teamInvites.map((invite) => ({
          id:               invite.token, // Use token as ID so we can pass it to accept/decline
          sender_id:        invite.org_id,
          receiver_id:      '',             // not needed for UI
          created_at:       invite.invited_at,
          status:           'pending',
          reason_tag:       null,
          isCompanyRequest: true,
          mutuals:          { count: 0, avatars: [] },
          user: {
            name:     invite.org_name,
            avatar:   invite.org_logo || '',
            headline: `Role: ${invite.role}`,
            slug:     null,
          },
        }));
        return { data: mapped, totalCount: mapped.length, page: 1, limit: 50 };
      }

      // ── Invitations — Channels sub-tab (Disabled per request) ─────────────
      /*
      const res = await getChannelInvitations();
      const mapped: ConnectionRequest[] = (res.data ?? []).map((item) => ({
        id:               item.inviteId,
        sender_id:        item.senderOrgId,
        receiver_id:      '',             // not needed for UI
        created_at:       item.createdAt,
        status:           'pending',
        reason_tag:       null,
        isCompanyRequest: true,
        mutuals:          { count: 0, avatars: [] },
        user: {
          name:     item.companyName,
          avatar:   item.logoUrl ?? '',
          headline: 'Channel invitation',
          slug:     item.companySlug ?? null,
        },
      }));
      return { data: mapped, totalCount: mapped.length, page: 1, limit: 50 };
      */
      return EMPTY_RESPONSE;
    },
    // Only fetch invitations when actually on an invitations sub-tab.
    // For other tabs (received/sent), always enabled.
    enabled: tab !== 'invitations' || subTab === 'channels' || subTab === 'teams',
    staleTime: 0, // Always fetch fresh data on mount to avoid stale UI when navigating
    retry: 1,
  });

