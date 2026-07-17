// src/features/connection/hooks/useConnectionRequests.ts
import { useQuery } from '@tanstack/react-query';
import { getConnectionRequests } from '@/services/api/connections';
import type { ConnectionTab, InvitationSubTab, ConnectionRequest } from '../types';

export const useConnectionRequests = (tab: ConnectionTab, subTab?: InvitationSubTab, page = 1) =>
  useQuery({
    queryKey: ['connection-requests', tab, subTab, page],
    queryFn:  async () => {
      if (tab === 'invitations') {
        const dummyData: ConnectionRequest[] = subTab === 'teams' ? [
          {
            id: 'dummy-team-1',
            sender_id: 'sys',
            receiver_id: 'me',
            created_at: new Date().toISOString(),
            status: 'pending',
            reason_tag: null,
            isCompanyRequest: true,
            mutuals: { count: 0, avatars: [] },
            user: {
              name: 'Nexus Global Systems',
              avatar: '/images/default-avatar.png', // Fallback, could use an external placeholder if needed
              headline: 'SaaS & Fintech Solutions',
              slug: 'nexus-global',
            }
          }
        ] : [
          {
            id: 'dummy-channel-1',
            sender_id: 'sys',
            receiver_id: 'me',
            created_at: new Date().toISOString(),
            status: 'pending',
            reason_tag: null,
            isCompanyRequest: true,
            mutuals: { count: 0, avatars: [] },
            user: {
              name: 'Nexus Global Systems',
              avatar: '/images/default-avatar.png',
              headline: '989 subscribers',
              slug: 'nexus-global-channel',
            }
          }
        ];
        return { data: dummyData, totalCount: 1, page: 1, limit: 10 };
      }
      return getConnectionRequests(tab, page, 10);
    },
    staleTime: 30_000,
    retry: 1,
  });
