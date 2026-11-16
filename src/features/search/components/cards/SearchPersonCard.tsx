'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/shared/Avatar';
import { UserIcon } from '@/components/icons';
import { formatImgSrc } from '@/lib/utils';
import { SearchPersonItem } from '../../types/search.types';
import { SearchActionButton } from '../buttons/SearchActionButton';

interface SearchPersonCardProps {
  person: SearchPersonItem;
  returnTo?: string;
}

// ── MutualAvatar — matching connection component mutual avatar with UserIcon fallback ───
function MutualAvatar({ src, index }: { src?: string | null; index: number }) {
  const [error, setError] = useState(false);

  const isGradient = Boolean(src && src.startsWith('gradient-'));
  const isValidUrl = Boolean(
    src &&
      !isGradient &&
      src.trim().length > 0 &&
      !src.includes('via.placeholder.com') &&
      src !== '/assets/pngegg.png' &&
      src !== '/images/companyonboarding/companyprofileDefault.jpg'
  );

  if (!isValidUrl || error) {
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
      src={formatImgSrc(src)}
      alt="Mutual connection"
      className="w-4 h-4 rounded-full border border-ds-surface-2 object-cover shrink-0"
      style={{ zIndex: 10 - index }}
      onError={() => setError(true)}
    />
  );
}

export const SearchPersonCard: React.FC<SearchPersonCardProps> = ({ person, returnTo }) => {
  const profileUrl =
    (person.account_name ? `/profile/${person.account_name}` : `/profile/${person.id}`) +
    (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '');

  const mutualCount = person.mutual_connections || 0;
  const hasMutuals = mutualCount > 0;
  const avatarsToShow = Math.min(mutualCount, 3);
  const mutualAvatars = person.mutual_avatars || [];
  const subtitle =
    person.context_signal ||
    (person.location_city ? `Based in ${person.location_city}` : null);

  return (
    <div className="flex flex-row justify-between items-center py-[8px] w-full max-w-[488px] h-[56px] rounded-[16px] group">
      <Link href={profileUrl} className="flex flex-row items-center gap-[8px] min-w-0 max-w-[360px] overflow-hidden">
        {/* Avatar: 32px x 32px */}
        <Avatar
          src={person.avatar_url || ''}
          name={person.name}
          className="w-[32px] h-[32px] rounded-full shrink-0"
        />

        {/* Info Container with strict boundary to prevent overlapping button */}
        <div className="flex flex-col justify-center items-start gap-[4px] min-w-0 max-w-[340px] overflow-hidden">
          {/* Top Row: Name + Dot + Headline (bounded to ~280px so it truncates exactly at the designated vertical line) */}
          <div className="flex flex-row items-center gap-[8px] h-[20px] max-w-[290px] overflow-hidden min-w-0">
            <span className="text-[14px] leading-[20px] text-ds-text-primary group-hover:text-ds-accent transition-colors shrink-0 max-w-[180px] truncate">
              {person.name}
            </span>
            {person.headline && (
              <>
                <div className="w-[4px] h-[4px] bg-ds-text-muted rounded-full shrink-0" />
                <span className="text-[12px] leading-[16px] text-ds-text-secondary truncate max-w-[180px] shrink min-w-0">
                  {person.headline}
                </span>
              </>
            )}
          </div>

          {/* Subtitle / Mutuals Component */}
          {hasMutuals ? (
            <div className="flex flex-row items-center gap-[4px] h-[16px] rounded-[16px] shrink-0">
              <div className="flex items-center -space-x-1 shrink-0" aria-hidden="true">
                {Array.from({ length: avatarsToShow }).map((_, idx) => (
                  <MutualAvatar
                    key={idx}
                    src={mutualAvatars[idx]}
                    index={idx}
                  />
                ))}
              </div>
              <span className="text-[12px] font-medium leading-[16px] text-ds-text-secondary text-center">
                {mutualCount === 1 ? '1 mutual' : `${mutualCount} mutuals`}
              </span>
            </div>
          ) : subtitle ? (
            <span className="text-[12px] font-medium leading-[16px] text-ds-text-secondary truncate max-w-[250px]">
              {subtitle}
            </span>
          ) : null}
        </div>
      </Link>

      {/* Action Button: Connect (<500), Follow (>=500), Pending, Accept, Message */}
      <div className="shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
        <SearchActionButton
          entityType="person"
          targetId={person.id}
          targetName={person.name}
          isFollowing={person.is_following}
          connectionStatus={person.connection_status}
          connectionsCount={person.connections_count}
          pendingRequestId={person.pending_request_id}
          isSelf={person.is_self}
        />
      </div>
    </div>
  );
};
