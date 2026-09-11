'use client';

import React from 'react';
import { useConnectionStore } from '@/store/connection.store';
import { useConnectionActions } from '../hooks/useConnectionActions';
import { RequestCard } from './RequestCard';
import type { ConnectionRequest, ConnectionTab, InvitationSubTab } from '../types';

interface RequestListProps {
  requests: ConnectionRequest[];
  mode: ConnectionTab;
  subTab?: InvitationSubTab;
}

export function RequestList({ requests, mode, subTab }: RequestListProps) {
  const { removedRequestIds } = useConnectionStore();
  const {
    accept,
    decline,
    undo,
    acceptInvitation,
    declineInvitation,
    acceptTeamInvitation,
    declineTeamInvitation,
  } = useConnectionActions();

  // Filter out optimistically removed cards
  const visible = requests.filter((r) => !removedRequestIds.includes(r.id));

  if (visible.length === 0) return null;

  const isInvitation = mode === 'invitations';

  return (
    <div
      className="flex flex-col bg-transparent"
      role="list"
      aria-label={
        mode === 'received'
          ? 'Received connection requests'
          : mode === 'sent'
          ? 'Sent connection requests'
          : 'Page invitations'
      }
    >
      {visible.map((request) => {
        // Check if this specific card's action is in-flight
        const isActing =
          (accept.isPending && accept.variables === request.id) ||
          (decline.isPending && decline.variables === request.id) ||
          (undo.isPending && undo.variables === request.id) ||
          (acceptInvitation.isPending && acceptInvitation.variables === request.id) ||
          (declineInvitation.isPending && declineInvitation.variables === request.id) ||
          (acceptTeamInvitation.isPending && acceptTeamInvitation.variables === request.id) ||
          (declineTeamInvitation.isPending && declineTeamInvitation.variables === request.id);

        return (
          <div key={request.id} role="listitem">
            <RequestCard
              request={request}
              mode={mode}
              isActing={isActing}
              onAccept={
                mode === 'received'
                  ? (id) => accept.mutate(id)
                  : isInvitation
                  ? (id) =>
                      subTab === 'teams'
                        ? acceptTeamInvitation.mutate(id)
                        : acceptInvitation.mutate(id)
                  : undefined
              }
              onDecline={
                mode === 'received'
                  ? (id) => decline.mutate(id)
                  : isInvitation
                  ? (id) =>
                      subTab === 'teams'
                        ? declineTeamInvitation.mutate(id)
                        : declineInvitation.mutate(id)
                  : undefined
              }
              onUndo={mode === 'sent' ? (id) => undo.mutate(id) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
export default RequestList;
