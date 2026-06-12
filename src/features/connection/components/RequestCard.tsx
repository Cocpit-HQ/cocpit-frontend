'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ConnectionRequest } from '../types';

interface RequestCardProps {
  request:   ConnectionRequest;
  mode:      'received' | 'sent';
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onUndo?:   (id: string) => void;
  isActing?: boolean;   // true while any mutation for this card is in-flight
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function RequestCard({
  request,
  mode,
  onAccept,
  onDecline,
  onUndo,
  isActing = false,
}: RequestCardProps) {
  const { user, reason_tag, mutuals } = request;
  const [imgError, setImgError] = useState(false);

  const showAvatar = !!user.avatar && !imgError;
  const hasMutuals = mutuals.count > 0;
  const profileId = mode === 'received' ? request.sender_id : request.receiver_id;

  return (
    <article className="flex items-center justify-between py-2 px-4 bg-card min-h-[92px] rounded-xl transition-all hover:bg-[var(--primary-tint)] border-b border-border last:border-b-0" aria-label={`Connection request ${mode === 'received' ? 'from' : 'to'} ${user.name}`}>
      <div className="flex items-center gap-3 w-[calc(100%-230px)]">
        <Link href={`/profile/${profileId}`} className="shrink-0 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-primary" tabIndex={-1}>
          {showAvatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover bg-primary/10"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary text-[15px] font-medium tracking-wide" aria-hidden="true">
              {getInitials(user.name)}
            </div>
          )}
        </Link>

        {/* Body */}
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <Link href={`/profile/${profileId}`} className="shrink-0 outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-primary group">
            <p className="text-base font-medium text-foreground leading-6 truncate group-hover:text-primary transition-colors">{user.name}</p>
          </Link>
          <p className="text-sm text-muted-foreground leading-5 truncate">{user.headline}</p>

          {/* Contextual Signal (Priority: 1. Mutuals, 2. Reason Tag) */}
          {hasMutuals ? (
            <div className="flex items-center gap-1.5 mt-1">
              {mutuals.avatars.length > 0 && (
                <div className="flex items-center -space-x-1.5" aria-hidden="true">
                  {mutuals.avatars.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-4 h-4 rounded-full border border-card object-cover"
                      style={{ zIndex: mutuals.avatars.length - i }}
                    />
                  ))}
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {mutuals.count} mutual{mutuals.count !== 1 ? 's' : ''}
              </span>
            </div>
          ) : reason_tag ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 h-6 rounded-xl bg-primary/5 text-primary text-xs max-w-[260px] truncate mt-2 w-max" title={reason_tag}>
              {reason_tag}
            </span>
          ) : null}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 shrink-0">
        {mode === 'received' && (
          <>
            <button
              className="inline-flex items-center justify-center h-10 w-[100px] rounded-[24px] text-sm font-medium transition-all bg-transparent text-primary/70 border border-primary/70 hover:bg-[var(--primary-tint)] hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none"
              disabled={isActing}
              onClick={() => onDecline?.(request.id)}
              aria-label={`Decline request from ${user.name}`}
            >
              {isActing ? <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : 'Decline'}
            </button>
            <button
              className="inline-flex items-center justify-center h-10 w-[100px] rounded-[24px] text-sm font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-[1px] shadow-[0_1px_2px_rgba(99,102,241,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none"
              disabled={isActing}
              onClick={() => onAccept?.(request.id)}
              aria-label={`Accept request from ${user.name}`}
            >
              {isActing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Accept'}
            </button>
          </>
        )}

        {mode === 'sent' && (
          <button
            className="inline-flex items-center justify-center h-10 w-[100px] rounded-[24px] text-sm font-medium transition-all bg-transparent text-primary/70 border border-primary/70 hover:bg-[var(--primary-tint)] hover:text-primary hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none"
            disabled={isActing}
            onClick={() => onUndo?.(request.id)}
            aria-label={`Withdraw request to ${user.name}`}
          >
            {isActing ? <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : 'Undo'}
          </button>
        )}
      </div>
    </article>
  );
}
