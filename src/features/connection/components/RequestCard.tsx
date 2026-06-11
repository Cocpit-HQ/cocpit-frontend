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
    <article className="conn-card" aria-label={`Connection request ${mode === 'received' ? 'from' : 'to'} ${user.name}`}>
      <div className="conn-card__info-group">
        <Link href={`/profile/${profileId}`} className="conn-profile-link" tabIndex={-1}>
          {showAvatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={40}
              height={40}
              className="conn-avatar"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="conn-avatar--initials" aria-hidden="true">
              {getInitials(user.name)}
            </div>
          )}
        </Link>

        {/* Body */}
        <div className="conn-card__body">
          <Link href={`/profile/${profileId}`} className="conn-profile-link conn-profile-link--name">
            <p className="conn-card__name">{user.name}</p>
          </Link>
          <p className="conn-card__headline">{user.headline}</p>

          {/* Reason tag chip — only if present */}
          {reason_tag && (
            <span className="conn-chip" title={reason_tag}>
              {reason_tag}
            </span>
          )}

          {/* Mutuals row — only if > 0 mutual connections */}
          {hasMutuals && (
            <div className="conn-mutuals">
              {mutuals.avatars.length > 0 && (
                <div className="conn-mutuals__avatars" aria-hidden="true">
                  {mutuals.avatars.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="conn-mutuals__avatar"
                      style={{ zIndex: mutuals.avatars.length - i }}
                    />
                  ))}
                </div>
              )}
              <span className="conn-mutuals__text">
                {mutuals.count} mutual connection{mutuals.count !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="conn-card__actions">
        {mode === 'received' && (
          <>
            <button
              className="conn-btn conn-btn--decline"
              disabled={isActing}
              onClick={() => onDecline?.(request.id)}
              aria-label={`Decline request from ${user.name}`}
            >
              {isActing ? <span className="conn-btn__spinner" /> : 'Decline'}
            </button>
            <button
              className="conn-btn conn-btn--accept"
              disabled={isActing}
              onClick={() => onAccept?.(request.id)}
              aria-label={`Accept request from ${user.name}`}
            >
              {isActing ? <span className="conn-btn__spinner" /> : 'Accept'}
            </button>
          </>
        )}

        {mode === 'sent' && (
          <button
            className="conn-btn conn-btn--undo"
            disabled={isActing}
            onClick={() => onUndo?.(request.id)}
            aria-label={`Withdraw request to ${user.name}`}
          >
            {isActing ? <span className="conn-btn__spinner" /> : 'Undo'}
          </button>
        )}
      </div>
    </article>
  );
}
