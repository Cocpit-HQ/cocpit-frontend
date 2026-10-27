import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

interface MentionUserData {
  user_id: string;
  full_name: string;
  account_name: string;
  is_company?: boolean;
  type?: string;
  slug?: string;
  account_type?: string;
  org_id?: string;
}

interface DynamicMentionProps {
  displayName: string;
  handle: string;
  mentionedUsers?: MentionUserData[];
  disableLinks?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const DynamicMention = ({ displayName, handle, mentionedUsers, disableLinks, className, style }: DynamicMentionProps) => {
  const isId = isUUID(handle);
  const user = mentionedUsers
    ? isId
      ? mentionedUsers.find((u) => u.user_id === handle || u.org_id === handle)
      : mentionedUsers.find(
          (u) =>
            u.account_name?.toLowerCase() === handle.toLowerCase() ||
            u.slug?.toLowerCase() === handle.toLowerCase()
        )
    : null;

  const isCompany = Boolean(
    user && (
      user.is_company ||
      user.type?.toUpperCase() === 'COMPANY' ||
      user.account_type?.toUpperCase() === 'COMPANY' ||
      Boolean(user.org_id)
    )
  );

  const nameToShow = user?.full_name || displayName;
  const linkHref = isCompany
    ? `/organization/${user?.slug || user?.account_name || user?.org_id || user?.user_id || handle}`
    : user
    ? `/profile/${user?.slug || user?.account_name || user?.user_id || handle}`
    : `/profile/${handle.toLowerCase()}`;
  
  const defaultClassName = "mention-link text-ds-accent text-[var(--ds-accent)] !text-[var(--ds-accent)] font-semibold";
  const finalClassName = cn(defaultClassName, className);
  const finalStyle = style || { color: 'var(--ds-accent)' };

  if (disableLinks) {
    return (
      <span className={finalClassName} style={finalStyle}>
        {nameToShow}
      </span>
    );
  }

  return (
    <Link
      href={linkHref}
      className={cn(finalClassName, "no-underline hover:no-underline cursor-pointer transition-opacity hover:opacity-80")}
      style={finalStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {nameToShow}
    </Link>
  );
};
