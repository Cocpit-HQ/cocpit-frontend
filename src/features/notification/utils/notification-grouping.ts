import { Notification } from '@/types/social';
import { DisplayNotification } from '../types';

interface GroupableNotificationMeta {
  metadata?: {
    group_id?: string;
    [key: string]: unknown;
  };
  group_id?: string;
  referenceId?: string;
}

/**
 * Derives a grouping key for a notification if it can be grouped with adjacent related items.
 */
const getGroupingKey = (notification: Notification): string | null => {
  const ext = notification as unknown as GroupableNotificationMeta;
  // If explicitly tagged in metadata
  const metaGroupId = ext.metadata?.group_id || ext.group_id;
  if (metaGroupId) return `meta-${metaGroupId}`;

  // Group by actor + type + reference_id
  const actor = notification.actor_name || notification.sender_id || '';
  const type = notification.type || '';
  const ref = notification.reference_id || ext.referenceId || '';

  // Only group if there is a meaningful actor or reference
  if (!actor && !ref) return null;

  // Avoid grouping single-instance security/login alerts
  if (type === 'new_device_login' || type === 'password_changed' || type === 'email_changed') {
    return null;
  }

  return `${type}:${actor}:${ref}`;
};

/**
 * Groups consecutive unread notifications into an unread group box.
 * Read notifications remain independent items.
 */
export const groupNotifications = (notifications: Notification[]): DisplayNotification[] => {
  if (!notifications || notifications.length === 0) return [];

  const result: DisplayNotification[] = [];
  let unreadGroup: Notification[] = [];

  const flushUnread = () => {
    if (unreadGroup.length === 0) return;

    if (unreadGroup.length === 1) {
      const item = unreadGroup[0];
      result.push({
        id: item.notification_id,
        isGroup: false,
        item,
        is_read: false,
        created_at: item.created_at,
      });
    } else {
      const first = unreadGroup[0];
      result.push({
        id: `unread-group-${first.notification_id}-${unreadGroup.length}`,
        isGroup: true,
        groupKey: `unread-${first.notification_id}`,
        items: [...unreadGroup],
        is_read: false,
        created_at: first.created_at,
      });
    }
    unreadGroup = [];
  };

  for (const notif of notifications) {
    if (!notif.is_read) {
      unreadGroup.push(notif);
    } else {
      flushUnread();
      result.push({
        id: notif.notification_id,
        isGroup: false,
        item: notif,
        is_read: true,
        created_at: notif.created_at,
      });
    }
  }

  flushUnread();
  return result;
};
