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
  if (reasonSignal === 'mutual' && mutuals.count > 0) {
    return (
      <div className="conn-suggest-card__mutuals">
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
        <p className="conn-suggest-card__meta">
          {mutuals.count} mutual{mutuals.count !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }

  // 2. Company / city
  if ((reasonSignal === 'company' || reasonSignal === 'city') && worksAt) {
    return (
      <div className="conn-suggest-card__meta-row">
        <Icon icon="hugeicons:job-search" className="conn-suggest-card__meta-icon" />
        <p className="conn-suggest-card__meta-text">Works at {worksAt}</p>
      </div>
    );
  }

  // 3. Shared skills — show actual skill names as chips
  if (reasonSignal === 'skill' && sharedSkills.length > 0) {
    return (
      <p className="conn-suggest-card__meta">
        {sharedSkills.join(' • ')}
      </p>
    );
  }

  // 4. School / university
  if (studiedAt) {
    return (
      <p className="conn-suggest-card__meta conn-suggest-card__meta--icon">
        <GraduationIcon />
        {studiedAt}
      </p>
    );
  }

  // 5. Fallback — works at if available but signal was something else
  if (worksAt) {
    return (
      <div className="conn-suggest-card__meta-row">
        <Icon icon="hugeicons:job-search" className="conn-suggest-card__meta-icon" />
        <p className="conn-suggest-card__meta-text">Works at {worksAt}</p>
      </div>
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
    <div className="conn-suggest-card">
      {/* Avatar */}
      <Link href={`/profile/${user.id}`} className="conn-profile-link" tabIndex={-1}>
        {showAvatar ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={80}
            height={80}
            className="conn-suggest-card__avatar"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="conn-suggest-card__avatar--initials" aria-hidden="true">
            {getInitials(user.name)}
          </div>
        )}
      </Link>

      <div className="conn-suggest-card__text-group">
        <div className="conn-suggest-card__name-group">
          <Link href={`/profile/${user.id}`} className="conn-profile-link conn-profile-link--name">
            <p className="conn-suggest-card__name">{user.name}</p>
          </Link>
          <p className="conn-suggest-card__headline">{user.headline}</p>
        </div>
        <MetaRow user={user} />
      </div>

      <button
        className={`conn-btn ${isRequested ? 'conn-btn--following' : 'conn-btn--follow'}`}
        disabled={isLoading || isRequested}
        onClick={() => !isRequested && connect.mutate(user.id)}
        aria-label={isRequested ? `Request sent to ${user.name}` : `Connect with ${user.name}`}
        aria-pressed={isRequested}
      >
        {isLoading
          ? <span className="conn-btn__spinner" />
          : isRequested ? 'Requested' : 'Connect'}
      </button>
    </div>
  );
}
