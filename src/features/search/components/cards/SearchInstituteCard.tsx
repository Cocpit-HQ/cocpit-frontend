'use client';

import React from 'react';
import Link from 'next/link';
import Avatar from '@/components/shared/Avatar';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { SearchInstituteItem } from '../../types/search.types';
import { SearchActionButton } from '../buttons/SearchActionButton';

interface SearchInstituteCardProps {
  institute: SearchInstituteItem;
  returnTo?: string;
}

export const SearchInstituteCard: React.FC<SearchInstituteCardProps> = ({ institute, returnTo }) => {
  const { isCompany } = useActiveProfile();
  const orgUrl = `/organization/${institute.slug || institute.id}` + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '');
  const isEducationSignal = Boolean(
    institute.context_signal && (
      institute.context_signal.includes('studied here') ||
      institute.context_signal.includes('alumni') ||
      institute.context_signal.includes('alumnus')
    )
  );
  const subtitle = isCompany
    ? (institute.headline || (!isEducationSignal ? institute.context_signal : null) || institute.institution_type || 'Education')
    : (institute.context_signal || institute.headline || institute.institution_type || 'Education');

  return (
    <div className="flex items-center justify-between w-full rounded-2xl py-2 group transition-colors">
      <Link href={orgUrl} className="flex items-center gap-2 min-w-0 flex-1">
        <Avatar
          src={institute.logo || institute.logo_url || ''}
          name={institute.name}
          isCompany={true}
          className="size-8 rounded-lg shrink-0 object-cover"
        />
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-sm font-normal text-ds-text-primary font-dm-sans group-hover:text-ds-accent transition-colors truncate">
            {institute.name}
          </span>
          <span className="text-xs text-ds-text-secondary font-dm-sans truncate">
            {subtitle}
          </span>
        </div>
      </Link>

      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <SearchActionButton
          entityType="institute"
          targetId={institute.id}
          targetName={institute.name}
          isFollowing={institute.is_following}
          messagePermission={institute.message_permission}
          messagesEnabled={institute.messages_enabled}
          isSelf={institute.is_self}
        />
      </div>
    </div>
  );
};
