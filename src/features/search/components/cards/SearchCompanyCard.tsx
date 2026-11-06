'use client';

import React from 'react';
import Link from 'next/link';
import Avatar from '@/components/shared/Avatar';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { SearchCompanyItem } from '../../types/search.types';
import { SearchActionButton } from '../buttons/SearchActionButton';

interface SearchCompanyCardProps {
  company: SearchCompanyItem;
  returnTo?: string;
}

export const SearchCompanyCard: React.FC<SearchCompanyCardProps> = ({ company, returnTo }) => {
  const { isCompany } = useActiveProfile();
  const orgUrl = `/organization/${company.slug || company.id}` + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '');
  const isEmploymentSignal = Boolean(
    company.context_signal && (
      company.context_signal.includes('work here') ||
      company.context_signal.includes('worked here')
    )
  );
  const subtitle = isCompany
    ? (company.headline || (!isEmploymentSignal ? company.context_signal : null) || company.industry || 'Company')
    : (company.context_signal || company.headline || company.industry || 'Company');

  return (
    <div className="flex items-center justify-between w-full rounded-2xl py-2 group transition-colors">
      <Link href={orgUrl} className="flex items-center gap-2 min-w-0 flex-1">
        <Avatar
          src={company.logo || company.logo_url || ''}
          name={company.name}
          isCompany={true}
          className="size-8 rounded-lg shrink-0 object-cover"
        />
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-sm font-normal text-ds-text-primary font-dm-sans group-hover:text-ds-accent transition-colors truncate">
            {company.name}
          </span>
          <span className="text-xs text-ds-text-secondary font-dm-sans truncate">
            {subtitle}
          </span>
        </div>
      </Link>

      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <SearchActionButton
          entityType="company"
          targetId={company.id}
          targetName={company.name}
          isFollowing={company.is_following}
          messagePermission={company.message_permission}
          messagesEnabled={company.messages_enabled}
          isSelf={company.is_self}
        />
      </div>
    </div>
  );
};
