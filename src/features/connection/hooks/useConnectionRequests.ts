// src/features/connection/hooks/useConnectionRequests.ts
import { useQuery } from '@tanstack/react-query';
import {
  getConnectionRequests,
  getChannelInvitations,
} from '@/services/api/connections';
import type { ConnectionTab, InvitationSubTab, ConnectionRequest, ConnectionRequestsResponse } from '../types';

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
      // Team invitations not built yet — return empty without an API call.
      if (subTab === 'teams') {
        return EMPTY_RESPONSE;
      }

      // ── Invitations — Channels sub-tab ────────────────────────────────────
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
    },
    // Only fetch invitations when actually on the channels sub-tab.
    // For other tabs (received/sent), always enabled.
    enabled: tab !== 'invitations' || subTab === 'channels',
    staleTime: tab === 'invitations' ? 60_000 : 30_000,
    retry: 1,
  });

