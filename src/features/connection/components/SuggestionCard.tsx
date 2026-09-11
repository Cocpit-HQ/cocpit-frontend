'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Loader2 } from 'lucide-react';
import { useConnectionActions } from '../hooks/useConnectionActions';
import { useConnectionStore } from '@/store/connection.store';
import type { SuggestedUser } from '../types';

interface SuggestionCardProps {
  user: SuggestedUser;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

// ── MetaRow — contextual pill badge below headline ──────────────────────────
function MetaRow({ user }: { user: SuggestedUser }) {
  const { reasonSignal, mutuals, studiedAt, worksAt, sharedSkills } = user;

  // 1. Mutuals (Priority 1)
  if (reasonSignal === 'mutual' || (mutuals && mutuals.count > 0)) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-ds-surface-1 text-[10px] leading-[12px] text-ds-text-secondary border border-ds-border/40 max-w-full truncate">
        {mutuals.avatars && mutuals.avatars.length > 0 && (
          <div className="flex items-center -space-x-1.5 shrink-0" aria-hidden="true">
            {mutuals.avatars.slice(0, 3).map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="w-3.5 h-3.5 rounded-full border border-ds-bg object-cover"
                style={{ zIndex: 10 - i }}
              />
            ))}
          </div>
        )}
        <span className="truncate">
          {mutuals.count} mutual{mutuals.count !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  // 2. Education (Priority 2)
  if (reasonSignal === 'education' || studiedAt) {
    if (studiedAt) {
      return (
        <div className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-ds-surface-1 text-[10px] leading-[12px] text-ds-text-secondary border border-ds-border/40 max-w-full truncate">
          <span className="truncate">Studied at {studiedAt}</span>
        </div>
      );
    }
  }

  // 3. Company / Workplace (Priority 3)
  if (reasonSignal === 'company' || worksAt) {
    if (worksAt) {
      return (
        <div className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-ds-surface-1 text-[10px] leading-[12px] text-ds-text-secondary border border-ds-border/40 max-w-full truncate">
          <span className="truncate">Works at {worksAt}</span>
        </div>
      );
    }
  }

  // 4. Shared skills / Interests (Priority 4)
  if (sharedSkills && sharedSkills.length > 0) {
    return (
      <div className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-ds-surface-1 text-[10px] leading-[12px] text-ds-text-secondary border border-ds-border/40 max-w-full truncate">
        <span className="truncate">{sharedSkills.join(' • ')}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-ds-surface-1 text-[10px] leading-[12px] text-ds-text-secondary border border-ds-border/40 max-w-full truncate">
      <span className="truncate">Active network</span>
    </div>
  );
}

// ── SuggestionCard ────────────────────────────────────────────────────────────
export function SuggestionCard({ user }: SuggestionCardProps) {
  const [imgError, setImgError] = useState(false);
  const { connect, dismiss } = useConnectionActions();
  const { followedUserIds } = useConnectionStore();

  const isRequested = followedUserIds.has(user.id);
  const isLoading = connect.isPending && connect.variables === user.id;
  const showAvatar = !!user.avatarUrl && !imgError;

  return (
    <div className="relative flex flex-col items-center text-center p-3 h-full rounded-[16px] border border-ds-border bg-ds-surface-1/40 hover:border-ds-border/80 transition-all font-dm-sans group select-none">
      {/* Top-Right Dismiss Button */}
      <button
        type="button"
        onClick={() => dismiss(user.id)}
        aria-label={`Dismiss suggestion for ${user.name}`}
        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
      >
        <X className="w-5 h-5" strokeWidth={2} />
      </button>

      {/* Avatar */}
      <Link
        href={`/profile/${user.id}`}
        className="shrink-0 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-ds-accent mb-2 mt-1"
        tabIndex={-1}
        aria-hidden="true"
      >
        {showAvatar ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={56}
            height={56}
            className="w-14 h-14 rounded-full object-cover bg-ds-surface-1 border border-ds-border group-hover:scale-105 transition-transform"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full bg-ds-surface-1 text-ds-text-primary text-lg font-medium tracking-wide border border-ds-border group-hover:scale-105 transition-transform"
            aria-hidden="true"
          >
            {getInitials(user.name || 'User')}
          </div>
        )}
      </Link>

      {/* User Info */}
      <div className="flex flex-col items-center w-full min-h-[44px] mb-3">
        <Link
          href={`/profile/${user.id}`}
          className="outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm group-hover:text-ds-accent transition-colors max-w-full"
        >
          <p className="text-[16px] font-normal text-ds-text-primary leading-[24px] truncate w-full">
            {user.name}
          </p>
        </Link>
        <p className="text-[12px] text-ds-text-secondary leading-[16px] truncate w-full mt-0.5">
          {user.headline || 'Member'}
        </p>
      </div>

      {/* Contextual Capsule Badge */}
      <div className="w-full flex justify-center mb-4">
        <MetaRow user={user} />
      </div>

      {/* Connect Action Button */}
      <button
        type="button"
        disabled={isLoading || isRequested}
        onClick={() => !isRequested && connect.mutate(user.id)}
        aria-label={isRequested ? `Request sent to ${user.name}` : `Connect with ${user.name}`}
        aria-pressed={isRequested}
        className={`w-24 h-[36px] px-3 py-1.5 rounded-full text-[16px] leading-[24px] font-medium font-dm-sans transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent flex items-center justify-center gap-2.5 mt-auto ${
          isRequested
            ? 'bg-ds-surface-1 text-ds-text-secondary border border-ds-border cursor-default opacity-80'
            : 'bg-transparent text-ds-text-primary border border-ds-border hover:border-ds-accent hover:text-ds-accent active:scale-95'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-ds-text-primary" />
        ) : isRequested ? (
          'Requested'
        ) : (
          'Connect'
        )}
      </button>
    </div>
  );
}
export default SuggestionCard;
