'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/context/SocketContext';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { getNotifications } from '../api';
import { Icon } from '@/components/icons';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
  icon?: React.ReactNode;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = 'group relative w-[40px] h-[40px] p-[8px] flex flex-row items-center justify-center bg-transparent rounded-[24px] transition-colors',
  icon = (
    <Icon
      name="notification"
      className="w-[24px] h-[24px] text-ds-text-primary transition-colors"
    />
  ),
}) => {
  const [hasUnread, setHasUnread] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;
  const { socket } = useSocket();
  const { activeProfile, isCompany } = useActiveProfile();

  const checkUnread = useCallback(async () => {
    try {
      const companyId = isCompany && activeProfile ? activeProfile.id : undefined;
      const rawData = await getNotifications(companyId);
      const filtered = (rawData || []).filter(
        (n: { type?: string }) => n.type !== 'message' && n.type !== 'new_message'
      );
      setHasUnread(filtered.some((n: { is_read?: boolean }) => !n.is_read));
    } catch (error) {
      console.error('Failed to fetch unread notification status:', error);
    }
  }, [activeProfile, isCompany]);

  useEffect(() => {
    if (user) {
      checkUnread();
    }
  }, [user, checkUnread]);

  // Listen for real-time notifications & custom updates
  useEffect(() => {
    const handleUpdate = () => {
      checkUnread();
    };

    window.addEventListener('notifications-updated', handleUpdate);

    if (socket) {
      socket.on('notification', handleUpdate);
      socket.on('notificationRead', handleUpdate);
      socket.on('notificationDeleted', handleUpdate);
      socket.on('allNotificationsRead', handleUpdate);
      socket.on('notificationsCleared', handleUpdate);
    }

    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
      if (socket) {
        socket.off('notification', handleUpdate);
        socket.off('notificationRead', handleUpdate);
        socket.off('notificationDeleted', handleUpdate);
        socket.off('allNotificationsRead', handleUpdate);
        socket.off('notificationsCleared', handleUpdate);
      }
    };
  }, [socket, checkUnread]);

  return (
    <Link
      href="/notifications"
      className={cn('cursor-pointer inline-flex items-center justify-center', className)}
      aria-label="Notifications"
    >
      <div className="relative inline-flex items-center justify-center">
        {icon}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-ds-accent rounded-full pointer-events-none" />
        )}
      </div>
    </Link>
  );
};

export const NotificationPopover = NotificationBell;
export default NotificationBell;
