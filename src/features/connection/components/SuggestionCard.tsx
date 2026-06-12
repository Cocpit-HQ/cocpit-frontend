'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useConnectionActions } from '../hooks/useConnectionActions';
import { useConnectionStore } from '@/store/connection.store';
import { Icon } from '@iconify/react';
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

// ── Inline SVG icons ─────────────────────────────────────────────────────────

const GraduationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

// ── MetaRow — contextual info below headline ──────────────────────────────────
function MetaRow({ user }: { user: SuggestedUser }) {
  const { reasonSignal, mutuals, worksAt, studiedAt, sharedSkills } = user;

  // 1. Mutuals
  if (mutuals.count > 0) {
    return (
      <div className="flex items-center gap-1.5 mt-2 justify-center">
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
        <p className="text-xs text-foreground">
          {mutuals.count} mutual{mutuals.count !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }

  // 2. Company / Workplace
  if (worksAt) {
    return (
      <div className="flex items-center justify-center gap-1 mt-2 text-xs text-foreground">
        <Icon icon="hugeicons:job-search" className="w-3.5 h-3.5" />
        <p className="truncate max-w-[120px]">Works at {worksAt}</p>
      </div>
    );
  }

  // 3. Shared skills / Interests
  if (sharedSkills.length > 0) {
    return (
      <p className="text-xs text-foreground mt-2 truncate w-full px-2">
        {sharedSkills.join(' • ')}
      </p>
    );
  }

  // 4. Education / School
  if (studiedAt) {
    return (
      <p className="flex items-center justify-center gap-1 mt-2 text-xs text-foreground truncate w-full px-2">
        <GraduationIcon />
        {studiedAt}
      </p>
    );
  }

  return null;
}

// ── SuggestionCard ────────────────────────────────────────────────────────────
export function SuggestionCard({ user }: SuggestionCardProps) {
  const [imgError, setImgError] = useState(false);
  const { connect } = useConnectionActions();
  const { followedUserIds } = useConnectionStore();

  const isRequested = followedUserIds.has(user.id);
  const isLoading   = connect.isPending && connect.variables === user.id;
  const showAvatar  = !!user.avatarUrl && !imgError;

  return (
    <div className="flex flex-col items-center text-center gap-2 p-4 h-full bg-card rounded-[24px] border border-border shadow-sm transition hover:shadow-md">
      {/* Avatar */}
      <Link href={`/profile/${user.id}`} className="shrink-0 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-primary" tabIndex={-1}>
        {showAvatar ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={80}
            height={80}
            className="w-[100px] h-[100px] rounded-full object-cover bg-primary/10"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center justify-center w-[100px] h-[100px] rounded-full bg-primary/10 text-primary text-3xl font-medium tracking-wide" aria-hidden="true">
            {getInitials(user.name)}
          </div>
        )}
      </Link>

      <div className="flex flex-col w-full flex-1">
        <div className="flex flex-col items-center min-h-[40px]">
          <Link href={`/profile/${user.id}`} className="shrink-0 outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-primary group max-w-[90%]">
            <p className="text-base font-medium text-foreground leading-6 truncate w-full group-hover:text-primary transition-colors">{user.name}</p>
          </Link>
          <p className="text-[13px] text-muted-foreground leading-4 line-clamp-2 mt-1 w-full">{user.headline}</p>
        </div>
        <MetaRow user={user} />
      </div>

      <button
        className={`inline-flex items-center justify-center h-10 w-full rounded-full text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none mt-auto ${
          isRequested 
            ? 'bg-muted text-foreground border border-border' 
            : 'bg-transparent text-primary border border-primary hover:bg-[var(--primary-tint)]'
        }`}
        disabled={isLoading || isRequested}
        onClick={() => !isRequested && connect.mutate(user.id)}
        aria-label={isRequested ? `Request sent to ${user.name}` : `Connect with ${user.name}`}
        aria-pressed={isRequested}
      >
        {isLoading
          ? <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          : isRequested ? 'Requested' : 'Connect'}
      </button>
    </div>
  );
}
