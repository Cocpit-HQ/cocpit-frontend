import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

interface DynamicMentionProps {
  displayName: string;
  handle: string;
  mentionedUsers?: { user_id: string; full_name: string; account_name: string }[];
  disableLinks?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const DynamicMention = ({ displayName, handle, mentionedUsers, disableLinks, className, style }: DynamicMentionProps) => {
  const isId = isUUID(handle);
  const user = isId && mentionedUsers ? mentionedUsers.find(u => u.user_id === handle) : null;

  const nameToShow = user?.full_name || displayName;
  const linkHref = user ? `/profile/${user.user_id}` : `/profile/${handle.toLowerCase()}`;
  
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
