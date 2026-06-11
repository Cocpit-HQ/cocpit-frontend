'use client';

import { useConnectionStore } from '@/store/connection.store';
import { useConnectionActions } from '../hooks/useConnectionActions';
import { RequestCard } from './RequestCard';
import type { ConnectionRequest, ConnectionTab } from '../types';

interface RequestListProps {
  requests: ConnectionRequest[];
  mode:     ConnectionTab;
}

export function RequestList({ requests, mode }: RequestListProps) {
  const { removedRequestIds } = useConnectionStore();
  const { accept, decline, undo } = useConnectionActions();

  // Filter out optimistically removed cards
  const visible = requests.filter((r) => !removedRequestIds.includes(r.id));

  if (visible.length === 0) return null;

  return (
    <div
      className="conn-request-list"
      role="list"
      aria-label={mode === 'received' ? 'Received connection requests' : 'Sent connection requests'}
    >
      {visible.map((request) => {
        // Check if this specific card's action is in-flight
        const isActing =
          accept.isPending  && accept.variables  === request.id ||
          decline.isPending && decline.variables === request.id ||
          undo.isPending    && undo.variables    === request.id;

        return (
          <div key={request.id} role="listitem">
            <RequestCard
              request={request}
              mode={mode}
              isActing={isActing}
              onAccept={mode === 'received' ? (id) => accept.mutate(id)  : undefined}
              onDecline={mode === 'received' ? (id) => decline.mutate(id) : undefined}
              onUndo={mode === 'sent'     ? (id) => undo.mutate(id)    : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
