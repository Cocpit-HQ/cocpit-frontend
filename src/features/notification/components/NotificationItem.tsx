'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types/social';
import Avatar from '@/components/shared/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationLockIcon, OrgAvatarFallbackIcon, UserIcon, Icon } from '@/components/icons';
import {
  formatNotificationTime,
  getNotificationVisualKind,
  parseNotificationText,
  getNotificationRoute,
} from '../utils/notification-helpers';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  isInsideGroup?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onDelete,
  isInsideGroup = false,
}) => {
  const router = useRouter();
  const { activeProfile, isCompany } = useActiveProfile();

  const visualKind = getNotificationVisualKind(notification);
  
  const itemUrl = getNotificationRoute(notification, activeProfile, isCompany);

  const handleItemClick = () => {
    if (itemUrl) {
      if (!notification.is_read && onRead) {
        onRead(notification.notification_id);
      }
      router.push(itemUrl);
    }
  };
  const parsed = parseNotificationText(notification, activeProfile?.name);

  // ── Determine actor profile URL for click redirection ─────────────
  const getActorUrl = (): string | null => {
    const isCompanyActor = Boolean(
      notification.is_company_actor ||
        (notification as unknown as { isCompanyActor?: boolean }).isCompanyActor ||
        (notification as unknown as { actor_type?: string }).actor_type === 'company' ||
        (notification as unknown as { actor_type?: string }).actor_type === 'organization' ||
        notification.type === 'company_connection_accepted' ||
        notification.type === 'company_invite' ||
        notification.type === 'company_job' ||
        notification.type === 'company_event' ||
        notification.type === 'company_post' ||
        notification.type === 'organization_job' ||
        notification.type === 'organization_invite' ||
        notification.type === 'ORGANIZATION_INVITE'
    );

    if (isCompanyActor) {
      const slug =
        notification.actor_slug ||
        ((notification.metadata as Record<string, unknown>)?.org_slug as string);
      if (slug) return `/organization/${slug}`;
      if (
        notification.reference_id &&
        (notification.type === 'company_connection_accepted' ||
          notification.type === 'company_channel_subscriber' ||
          notification.type === 'company_channel_milestone')
      ) {
        return `/organization/${notification.reference_id}`;
      }
      if (notification.sender_id) return `/organization/${notification.sender_id}`;
    }

    const userId =
      notification.sender_id ||
      (notification.type === 'follow' ? notification.reference_id : null) ||
      (notification.type === 'connection_accepted' || notification.type === 'new_connection'
        ? notification.reference_id
        : null);
    if (userId) return `/profile/${userId}`;
    if (notification.actor_slug) return `/profile/${notification.actor_slug}`;
    return null;
  };

  const actorUrl = getActorUrl();

  const handleActorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actorUrl) {
      router.push(actorUrl);
    }
  };

  const handleMarkAsRead = (e?: React.MouseEvent | Event) => {
    if (e && typeof (e as React.MouseEvent).stopPropagation === 'function') {
      (e as React.MouseEvent).stopPropagation();
    }
    if (onRead) {
      onRead(notification.notification_id);
    }
  };

  const handleDelete = (e?: React.MouseEvent | Event) => {
    if (e && typeof (e as React.MouseEvent).stopPropagation === 'function') {
      (e as React.MouseEvent).stopPropagation();
    }
    if (onDelete) {
      onDelete(notification.notification_id);
    }
  };

  // ── Avatar / Icon slot (always 24×24) ──────────────────────────
  const renderIcon = () => {
    if (visualKind === 'security') {
      return (
        <NotificationLockIcon
          className="w-6 h-6 shrink-0 text-ds-text-primary"
          size={24}
          fill="currentColor"
        />
      );
    }

    if (visualKind === 'job' && !notification.actor_avatar) {
      return (
        <div className="w-6 h-6 rounded-full bg-ds-surface-2 border border-ds-border flex items-center justify-center shrink-0">
          <Icon name="jobs" size={14} className="text-ds-text-primary" />
        </div>
      );
    }

    const isCompanyActor = Boolean(
      notification.is_company_actor ||
        (notification as unknown as { isCompanyActor?: boolean }).isCompanyActor
    );

    if (visualKind === 'company' && !notification.actor_avatar) {
      return <OrgAvatarFallbackIcon className="w-6 h-6 shrink-0" size={24} />;
    }

    if (notification.actor_avatar) {
      return (
        <div className="w-6 h-6 shrink-0">
          <Avatar
            url={notification.actor_avatar}
            name={notification.actor_name || 'User'}
            size="xs"
            isCompany={isCompanyActor}
          />
        </div>
      );
    }

    // No avatar — org fallback or user fallback
    if (isCompanyActor) {
      return <OrgAvatarFallbackIcon className="w-6 h-6 shrink-0" size={24} />;
    }

    return (
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-ds-border">
        <UserIcon className="w-3.5 h-3.5 text-ds-text-primary" />
      </div>
    );
  };

  const isUnread = !notification.is_read;

  // ── Notification text content ─────────────────────────────────
  const renderText = () => (
    <div className="ds-text-secondary-2 font-['DM_Sans'] text-ds-text-primary min-w-0 truncate">
      {parsed.prefixText && (
        <span className="font-normal text-ds-text-primary">{parsed.prefixText}</span>
      )}
      {parsed.boldTarget && (
        <span className="font-semibold text-ds-text-primary">{parsed.boldTarget}</span>
      )}
      {parsed.actorName && (
        <span
          onClick={actorUrl ? handleActorClick : undefined}
          className={cn(
            'font-semibold text-ds-text-primary',
            actorUrl && 'cursor-pointer'
          )}
        >
          {parsed.actorName}{' '}
        </span>
      )}
      {parsed.actorSuffix && (
        <span className="font-normal text-ds-text-primary">{parsed.actorSuffix} </span>
      )}
      <span className="font-normal text-ds-text-primary">{parsed.bodyText}</span>
    </div>
  );

  return (
    <div
      onClick={itemUrl ? handleItemClick : undefined}
      className={cn(
        "group flex flex-row items-center w-full font-['DM_Sans'] transition-colors duration-[120ms] h-[48px] p-3 gap-2",
        isInsideGroup
          ? 'bg-transparent rounded-none'
          : isUnread
          ? 'bg-ds-surface-1 rounded-[8px]'
          : 'bg-transparent rounded-[8px]',
        itemUrl && 'cursor-pointer'
      )}
    >
      {/* ── Ellipse 15: Unread dot (4×4px, gap: 8px to inner frame) ── */}
      {/* 4px slot preserves 24px avatar alignment for read notifications */}
      {isUnread ? (
        <span
          className="w-1 h-1 rounded-full shrink-0 bg-ds-accent"
          style={{
            boxShadow: '-1px -1px 4px rgba(255, 236, 230, 0.4), 1px 1px 4px rgba(255, 236, 230, 0.4)',
          }}
          aria-label="Unread notification"
        />
      ) : (
        <span className="w-1 h-1 shrink-0 invisible" aria-hidden="true" />
      )}

      {/* ── Frame 2609748: Inner row (764×24, justify-between) ────── */}
      <div className="flex flex-row items-center justify-between min-w-0 flex-1 h-6">
        {/* Frame 2609542: Left side (avatar + text, gap: 8px, h: 24px) */}
        <div className="flex flex-row items-center gap-2 min-w-0 flex-1 mr-4">
          {/* Rectangle 31: Avatar / Icon (24×24px, rounded 100px) */}
          <div
            onClick={actorUrl ? handleActorClick : undefined}
            className={cn('w-6 h-6 shrink-0', actorUrl && 'cursor-pointer hover:opacity-80 transition-opacity')}
          >
            {renderIcon()}
          </div>

          {/* Notification text — 14px/20px, font-semibold / normal */}
          <div className="min-w-0 flex-1">
            {renderText()}
          </div>
        </div>

        {/* Frame 2609740: Right side (timestamp + menu, gap: 10px, h: 20px) */}
        <div className="flex flex-row items-center gap-[10px] shrink-0 h-5">
          {/* Frame 2608646: Timestamp (12px/400/16px, text-muted #726B67) */}
          <span className="ds-text-small font-['DM_Sans'] text-ds-text-muted select-none whitespace-nowrap">
            {formatNotificationTime(notification.created_at)}
          </span>

          {/* Menu button: 20×20px, icon text-primary #FFECE6 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:text-ds-text-primary/80 transition-colors cursor-pointer outline-none border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                onClick={(e) => e.stopPropagation()}
                aria-label="Notification options"
              >
                <Icon name="menu" size={20} className="w-5 h-5 text-ds-text-primary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={4}
              onCloseAutoFocus={(e) => e.preventDefault()}
              className="!w-[145px] !min-w-[145px] !max-w-[145px] !p-3 !rounded-[16px] !bg-ds-bg !border !border-ds-border !overflow-visible flex flex-col items-start !gap-4 !shadow-none z-[200] font-['DM_Sans']"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onSelect={() => handleMarkAsRead()}
                className="!p-0 !m-0 !h-5 flex-none whitespace-nowrap justify-start text-ds-text-secondary hover:!text-ds-text-primary focus:!text-ds-text-primary data-[highlighted]:!text-ds-text-primary hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent ds-text-secondary font-['DM_Sans'] cursor-pointer outline-none transition-colors border-none"
              >
                Mark as read
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleDelete()}
                className="!p-0 !m-0 !h-5 flex-none whitespace-nowrap justify-start text-ds-text-secondary hover:!text-ds-text-primary focus:!text-ds-text-primary data-[highlighted]:!text-ds-text-primary hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent ds-text-secondary font-['DM_Sans'] cursor-pointer outline-none transition-colors border-none"
              >
                Delete notification
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
