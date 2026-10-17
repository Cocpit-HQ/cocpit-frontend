import { Notification } from '@/types/social';

export type NotificationTab = 'all' | 'jobs';

export interface GroupedNotificationItem {
  id: string;
  isGroup: true;
  groupKey: string;
  items: Notification[];
  is_read: boolean;
  created_at: string;
}

export interface SingleNotificationItem {
  id: string;
  isGroup: false;
  item: Notification;
  is_read: boolean;
  created_at: string;
}

export type DisplayNotification = SingleNotificationItem | GroupedNotificationItem;

export interface NotificationActionHandlers {
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate?: (notification: Notification) => void;
}
