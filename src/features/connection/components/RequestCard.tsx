'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { ConnectionRequest } from '../types';

interface RequestCardProps {
  request: ConnectionRequest;
  mode: 'received' | 'sent' | 'invitations';
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onUndo?: (id: string) => void;
  isActing?: boolean;
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
  const hasMutuals = mutuals && mutuals.count > 0;
  const isCompany = request.isCompanyRequest || mode === 'invitations';
  const profileId = mode === 'received' ? request.sender_id : request.receiver_id;
  const targetHref = isCompany
    ? `/organization/${user.slug || profileId}`
    : `/profile/${profileId}`;

  return (
    <article
      className="w-full min-h-[68px] flex flex-col sm:flex-row sm:items-center justify-between py-2 px-0 sm:px-2 border-b border-ds-border last:border-b-0 hover:bg-ds-surface-1/30 transition-colors gap-2 rounded-2xl font-dm-sans"
      aria-label={`Connection request ${mode === 'received' ? 'from' : 'to'} ${user.name}`}
    >
      {/* Left: Avatar + Details */}
      <div className="w-full flex-1 min-w-0 min-h-[52px] flex items-center gap-2">
        <Link
          href={targetHref}
          className="shrink-0 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-ds-accent"
          tabIndex={-1}
          aria-hidden="true"
        >
          {showAvatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={32}
              height={32}
              className={`w-8 h-8 object-cover shrink-0 bg-ds-surface-1 border border-ds-border ${
                isCompany ? 'rounded-[8px]' : 'rounded-full'
              }`}
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className={`flex items-center justify-center w-8 h-8 shrink-0 bg-ds-surface-1 text-ds-text-primary text-[12px] font-medium tracking-wide border border-ds-border ${
                isCompany ? 'rounded-[8px]' : 'rounded-full'
              }`}
              aria-hidden="true"
            >
              {getInitials(user.name || 'User')}
            </div>
          )}
        </Link>

        {/* Text stack */}
        <div className="flex flex-col justify-center items-start gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0 w-full">
            <Link
              href={targetHref}
              className="outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm group shrink-0"
            >
              <span className="font-dm-sans font-normal text-[14px] leading-5 text-ds-text-primary group-hover:text-ds-accent transition-colors whitespace-nowrap">
                {user.name}
              </span>
            </Link>
            {user.headline && (
              <>
                <span className="text-ds-text-muted text-[13px] shrink-0" aria-hidden="true">•</span>
                <span className="text-ds-text-secondary text-xs leading-4 font-normal truncate min-w-0 max-w-[160px] sm:max-w-[180px]">
                  {user.headline}
                </span>
              </>
            )}
          </div>

          {/* Contextual Capsule Badge Pill (adaptive content-driven width) */}
          {hasMutuals ? (
            <div className="w-fit max-w-full h-6 inline-flex items-center px-2.5 py-1 gap-2 bg-ds-surface-2 rounded-xl text-[12px] leading-4 font-normal text-ds-text-primary">
              {mutuals.avatars && mutuals.avatars.length > 0 && (
                <div className="flex items-center -space-x-1.5 shrink-0" aria-hidden="true">
                  {mutuals.avatars.slice(0, 3).map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-4 h-4 rounded-full border border-ds-bg object-cover"
                      style={{ zIndex: 10 - i }}
                    />
                  ))}
                </div>
              )}
              <span className="truncate">
                {mutuals.count} mutual{mutuals.count !== 1 ? 's' : ''}
              </span>
            </div>
          ) : reason_tag ? (
            <div className="w-fit max-w-full h-6 inline-flex items-center px-2.5 py-1 gap-2 bg-ds-surface-2 rounded-xl text-[12px] leading-4 font-normal text-ds-text-primary">
              <span className="truncate">{reason_tag}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end mt-1 sm:mt-0">
        {(mode === 'received' || mode === 'invitations') && (
          <>
            <button
              type="button"
              disabled={isActing}
              onClick={() => onAccept?.(request.id)}
              aria-label={`Accept request from ${user.name}`}
              className="flex-1 sm:w-[89px] sm:flex-none inline-flex items-center justify-center h-9 px-3 py-1.5 gap-2.5 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary font-dm-sans font-medium text-[16px] leading-6 transition-all cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isActing ? (
                <Loader2 className="w-4 h-4 animate-spin text-ds-text-primary" />
              ) : (
                'Accept'
              )}
            </button>

            <button
              type="button"
              disabled={isActing}
              onClick={() => onDecline?.(request.id)}
              aria-label={`Decline request from ${user.name}`}
              className="flex-1 sm:w-[89px] sm:flex-none inline-flex items-center justify-center h-9 px-3 py-1.5 gap-2.5 rounded-full border border-ds-border bg-transparent hover:bg-ds-surface-1 active:scale-95 text-ds-text-primary font-dm-sans font-medium text-[16px] leading-6 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isActing ? (
                <Loader2 className="w-4 h-4 animate-spin text-ds-text-primary" />
              ) : (
                'Decline'
              )}
            </button>
          </>
        )}

        {mode === 'sent' && (
          <button
            type="button"
            disabled={isActing}
            onClick={() => onUndo?.(request.id)}
            aria-label={`Withdraw request to ${user.name}`}
            className="flex-1 sm:w-[89px] sm:flex-none inline-flex items-center justify-center h-9 px-3 py-1.5 gap-2.5 rounded-full border border-ds-border bg-transparent hover:bg-ds-surface-1 active:scale-95 text-ds-text-primary font-dm-sans font-medium text-[16px] leading-6 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isActing ? (
              <Loader2 className="w-4 h-4 animate-spin text-ds-text-primary" />
            ) : (
              'Withdraw'
            )}
          </button>
        )}
      </div>
    </article>
  );
}
export default RequestCard;
