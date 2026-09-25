import React from 'react';
import { Notification } from '@/types/social';
import { NotificationItem } from './NotificationItem';

interface NotificationGroupProps {
  notifications: Notification[];
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotificationGroup: React.FC<NotificationGroupProps> = ({
  notifications,
  onRead,
  onDelete,
}) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="rounded-[8px] bg-ds-surface-1 flex flex-col gap-3 transition-all font-['DM_Sans'] overflow-hidden">
      {notifications.map((notif) => (
        <NotificationItem
          key={notif.notification_id}
          notification={notif}
          onRead={onRead}
          onDelete={onDelete}
          isInsideGroup={true}
        />
      ))}
    </div>
  );
};
