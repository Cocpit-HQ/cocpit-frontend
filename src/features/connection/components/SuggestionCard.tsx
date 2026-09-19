'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Loader2 } from 'lucide-react';
import { UserIcon } from '@/components/icons';
import { useConnectionActions } from '../hooks/useConnectionActions';
import { useConnectionStore } from '@/store/connection.store';
import type { SuggestedUser } from '../types';
import { FeatureDisabledTooltip } from '@/components/feature-flags';

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

// ── MutualAvatar — avatar for mutuals with fallback ─────────────────────────
function MutualAvatar({ src, index }: { src: string; index: number }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className="w-4 h-4 rounded-full border border-ds-surface-2 bg-ds-surface-1 flex items-center justify-center shrink-0"
        style={{ zIndex: 10 - index }}
      >
        <UserIcon className="w-2.5 h-2.5 text-ds-text-primary" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="w-4 h-4 rounded-full border border-ds-surface-2 object-cover"
      style={{ zIndex: 10 - index }}
      onError={() => setError(true)}
    />
  );
}

// ── MetaRow — contextual pill badge below headline ──────────────────────────
function MetaRow({ user }: { user: SuggestedUser }) {
  const { reasonSignal, mutuals, studiedAt, worksAt, sharedSkills } = user;

  // 1. Mutuals (Priority 1)
  if (reasonSignal === 'mutual' || (mutuals && mutuals.count > 0)) {
    return (
      <div className="inline-flex items-center gap-1.5 px-1 py-0.5 text-[10px] leading-[12px] font-medium text-ds-text-secondary max-w-full truncate">
        <span className="truncate">
          {mutuals.count} mutual{mutuals.count !== 1 ? 's' : ''}
        </span>
        {mutuals.avatars && mutuals.avatars.length > 0 && (
          <div className="flex items-center -space-x-1 shrink-0" aria-hidden="true">
            {/* Mutual avatar with 1px #222228 stroke per Figma spec */}
            {mutuals.avatars.slice(0, 3).map((src, i) => (
              <MutualAvatar key={i} src={src} index={i} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. Education (Priority 2)
  if (reasonSignal === 'education' || studiedAt) {
    if (studiedAt) {
      return (
        <div className="inline-flex items-center justify-center px-1 py-0.5 text-[10px] leading-[12px] font-medium text-ds-text-secondary max-w-full truncate">
          <span className="truncate">Studied at {studiedAt}</span>
        </div>
      );
    }
  }

  // 3. Company / Workplace (Priority 3)
  if (reasonSignal === 'company' || worksAt) {
    if (worksAt) {
      return (
        <div className="inline-flex items-center justify-center px-1 py-0.5 text-[10px] leading-[12px] font-medium text-ds-text-secondary max-w-full truncate">
          <span className="truncate">Works at {worksAt}</span>
        </div>
      );
    }
  }

  // 4. Shared skills / Interests (Priority 4)
  if (sharedSkills && sharedSkills.length > 0) {
    return (
      <div className="inline-flex items-center justify-center px-1 py-0.5 text-[10px] leading-[12px] font-medium text-ds-text-secondary max-w-full truncate">
        <span className="truncate">{sharedSkills.join(' • ')}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center justify-center px-1 py-0.5 text-[10px] leading-[12px] font-medium text-ds-text-secondary max-w-full truncate">
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

  // Suggestion card with bg-ds-bg background and 182x216px dimensions per Figma spec
  return (
    <div className="relative flex flex-col items-center text-center p-3 w-[182px] h-[216px] rounded-[16px] border border-ds-border bg-ds-bg hover:border-ds-border/80 transition-all font-dm-sans group select-none">
      {/* Top-Right Dismiss Button per Figma spec (32x32px, absolute top-3 right-3) */}
      <button
        type="button"
        onClick={() => dismiss(user.id)}
        aria-label={`Dismiss suggestion for ${user.name}`}
        className="absolute top-3 right-3 w-8 h-8 rounded-full p-[6px] flex items-center justify-center bg-ds-surface-1 text-ds-text-primary hover:bg-ds-surface-2 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
      >
        <X className="w-5 h-5 text-ds-text-primary" strokeWidth={2} />
      </button>

      {/* Avatar per Figma spec: 60x60px */}
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
            width={60}
            height={60}
            className="w-[60px] h-[60px] rounded-full object-cover bg-ds-surface-1 border border-ds-border group-hover:scale-105 transition-transform"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="flex items-center justify-center w-[60px] h-[60px] rounded-full bg-ds-surface-1 text-ds-text-primary p-3 border border-ds-border group-hover:scale-105 transition-transform"
            aria-hidden="true"
          >
            <UserIcon className="w-full h-full text-ds-text-primary" />
          </div>
        )}
      </Link>

      {/* User Info */}
      <div className="flex flex-col items-center w-full min-h-[40px] mb-2 mt-1">
        <Link
          href={`/profile/${user.id}`}
          className="outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-sm no-underline hover:no-underline transition-colors max-w-full"
        >
          <p className="text-[16px] font-normal text-ds-text-primary leading-[24px] truncate w-full">
            {user.name}
          </p>
        </Link>
        {/* Render user headline if present, keeping designated space empty when missing */}
        <p className="text-[12px] text-ds-text-secondary leading-[16px] truncate w-full mt-0.5 min-h-[16px]">
          {user.headline}
        </p>
      </div>

      {/* Contextual Capsule Badge */}
      <div className="w-full flex justify-center mb-2">
        <MetaRow user={user} />
      </div>

      <FeatureDisabledTooltip featureKey="enableConnectionManagement">
      <button
        type="button"
        disabled={isLoading || isRequested}
        onClick={() => !isRequested && connect.mutate(user.id)}
        aria-label={isRequested ? `Request sent to ${user.name}` : `Connect with ${user.name}`}
        aria-pressed={isRequested}
        className={`w-[89px] h-[36px] px-3 py-1.5 rounded-full text-[16px] leading-[24px] font-medium font-dm-sans transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent flex items-center justify-center gap-2 mt-auto ${
          isRequested
            ? 'bg-ds-surface-1 text-ds-text-secondary border border-ds-border cursor-default opacity-80'
            : 'bg-transparent text-ds-text-primary border border-ds-border hover:border-ds-text-primary hover:bg-ds-surface-1 active:scale-95'
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
      </FeatureDisabledTooltip>
    </div>
  );
}
export default SuggestionCard;
