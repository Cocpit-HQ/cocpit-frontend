'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Notification } from '@/types/social';
import {
  getNotifications,
  deleteNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationAsRead,
} from '../api';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useSocket } from '@/context/SocketContext';
import { NotificationTab, DisplayNotification } from '../types';
import { groupNotifications } from '../utils/notification-grouping';

interface RawSocketNotification extends Omit<Notification, 'type'> {
  type?: string;
  senderName?: string;
  senderAvatar?: string;
  recipient_company_id?: string;
}

export const useNotifications = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const { activeProfile, isCompany } = useActiveProfile();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearedTabs, setClearedTabs] = useState<Set<NotificationTab>>(new Set());

  const companyId = isCompany && activeProfile?.id ? activeProfile.id : undefined;

  // Initial Fetch
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setHasError(false);

      const notifsData = await getNotifications(companyId);
      // Filter out chat messages per spec (images 6 & 7)
      const filteredData = notifsData.filter(
        (n: { type?: string }) => n.type !== 'message' && n.type !== 'new_message'
      );

      // Sort: unread first, then by date descending
      const sortedData = [...filteredData].sort((a, b) => {
        if (a.is_read === b.is_read) {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        }
        return a.is_read ? 1 : -1;
      });

      setNotifications(sortedData);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Initial Fetch on mount and when user/company changes
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Real-time updates via Socket
  useEffect(() => {
    if (!user || !socket) return;

    const handleNewNotification = (newNotif: RawSocketNotification) => {
      // Chat messages must not be added to the Notification Center
      if (newNotif.type === 'message' || newNotif.type === 'new_message') return;

      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some((n) => n.notification_id === newNotif.notification_id)) {
          return prev;
        }

        const normalized: Notification = {
          ...newNotif,
          type: (newNotif.type || 'system') as Notification['type'],
          notification_id: newNotif.notification_id || `temp-${Date.now()}-${Math.random()}`,
          actor_name: newNotif.actor_name || newNotif.senderName || 'User',
          actor_avatar: newNotif.actor_avatar || newNotif.senderAvatar || null,
          is_read: newNotif.is_read ?? false,
          created_at: newNotif.created_at || new Date().toISOString(),
        };

        // Multi-tenant check: if company notification, verify current company
        if (newNotif.recipient_company_id) {
          if (!isCompany || activeProfile?.id !== newNotif.recipient_company_id) {
            return prev;
          }
        } else {
          if (isCompany) return prev;
        }

        const updated = [normalized, ...prev];
        return updated.sort((a, b) => {
          if (a.is_read === b.is_read) {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
          }
          return a.is_read ? 1 : -1;
        });
      });
    };

    const handleNotificationRead = (payload: { notificationId?: string; id?: string; companyId?: string }) => {
      const notifId = payload?.notificationId || payload?.id;
      if (!notifId) return;
      if (payload?.companyId) {
        if (!isCompany || activeProfile?.id !== payload.companyId) return;
      } else if (isCompany) {
        return;
      }
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notifId ? { ...n, is_read: true } : n))
      );
    };

    const handleNotificationDeleted = (payload: { notificationId?: string; id?: string; companyId?: string }) => {
      const notifId = payload?.notificationId || payload?.id;
      if (!notifId) return;
      if (payload?.companyId) {
        if (!isCompany || activeProfile?.id !== payload.companyId) return;
      } else if (isCompany) {
        return;
      }
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notifId));
    };

    const handleAllNotificationsRead = (payload?: { companyId?: string }) => {
      if (payload?.companyId) {
        if (!isCompany || activeProfile?.id !== payload.companyId) return;
      } else if (isCompany) {
        return;
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    };

    const handleNotificationsCleared = (payload?: { tab?: string; companyId?: string }) => {
      const tab = payload?.tab;
      if (payload?.companyId) {
        if (!isCompany || activeProfile?.id !== payload.companyId) return;
      } else if (isCompany) {
        return;
      }

      if (tab === 'jobs') {
        setNotifications((prev) =>
          prev.filter(
            (n) =>
              !(
                n.type === 'organization_job' ||
                n.type === 'job_offer' ||
                n.type.includes('job') ||
                n.type.includes('application') ||
                n.type.includes('offer')
              )
          )
        );
        setClearedTabs((prev) => new Set(prev).add('jobs'));
      } else {
        setNotifications([]);
        setClearedTabs(
          (prev) =>
            new Set(prev)
              .add('all')
              .add('jobs')
        );
      }
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    };

    socket.on('notification', handleNewNotification);
    socket.on('notificationRead', handleNotificationRead);
    socket.on('notificationDeleted', handleNotificationDeleted);
    socket.on('allNotificationsRead', handleAllNotificationsRead);
    socket.on('notificationsCleared', handleNotificationsCleared);

    return () => {
      socket.off('notification', handleNewNotification);
      socket.off('notificationRead', handleNotificationRead);
      socket.off('notificationDeleted', handleNotificationDeleted);
      socket.off('allNotificationsRead', handleAllNotificationsRead);
      socket.off('notificationsCleared', handleNotificationsCleared);
    };
  }, [user, socket, isCompany, activeProfile?.id]);

  // Read handler
  const handleRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );

      try {
        await markNotificationAsRead(id, companyId);
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },
    [companyId]
  );

  // Delete handler
  const handleDelete = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));

      try {
        await deleteNotification(id, companyId);
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
    },
    [companyId]
  );

  // Mark all as read handler
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      if (activeTab === 'jobs') {
        const unreadJobs = notifications.filter(
          (n) =>
            !n.is_read &&
            (n.type === 'organization_job' ||
              n.type === 'job_offer' ||
              n.type.includes('job') ||
              n.type.includes('application') ||
              n.type.includes('offer'))
        );
        if (unreadJobs.length === 0) return;

        setNotifications((prev) =>
          prev.map((n) =>
            unreadJobs.some((uj) => uj.notification_id === n.notification_id)
              ? { ...n, is_read: true }
              : n
          )
        );

        await Promise.all(
          unreadJobs.map((n) => markNotificationAsRead(n.notification_id, companyId))
        );
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        await markAllNotificationsRead(companyId);
      }

      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [activeTab, notifications, companyId]);

  // Clear all handler
  const handleClearAll = useCallback(async () => {
    try {
      const currentTab = activeTab;
      let idsToDelete: string[] = [];
      if (currentTab === 'all') {
        idsToDelete = notifications.map((n) => n.notification_id);
        setNotifications([]);
      } else if (currentTab === 'jobs') {
        idsToDelete = notifications
          .filter(
            (n) =>
              n.type === 'organization_job' ||
              n.type === 'job_offer' ||
              n.type.includes('job') ||
              n.type.includes('application') ||
              n.type.includes('offer')
          )
          .map((n) => n.notification_id);
        setNotifications((prev) =>
          prev.filter(
            (n) =>
              !(
                n.type === 'organization_job' ||
                n.type === 'job_offer' ||
                n.type.includes('job') ||
                n.type.includes('application') ||
                n.type.includes('offer')
              )
          )
        );
      }

      setClearedTabs((prev) => new Set(prev).add(currentTab));
      window.dispatchEvent(new CustomEvent('notifications-updated'));

      if (idsToDelete.length > 0) {
        await deleteNotifications(idsToDelete, companyId, currentTab);
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    } finally {
      setShowClearConfirm(false);
    }
  }, [activeTab, notifications, companyId]);

  // Tab filtered notifications
  const tabNotifications = useMemo(() => {
    if (activeTab === 'jobs') {
      return notifications.filter(
        (n) =>
          n.type === 'organization_job' ||
          n.type === 'job_offer' ||
          n.type.includes('job') ||
          n.type.includes('application') ||
          n.type.includes('offer')
      );
    }
    return notifications;
  }, [notifications, activeTab]);

  // Display notifications with safe grouping applied
  const displayedNotifications = useMemo<DisplayNotification[]>(() => {
    return groupNotifications(tabNotifications);
  }, [tabNotifications]);

  const hasUnread = useMemo(() => {
    return tabNotifications.some((n) => !n.is_read);
  }, [tabNotifications]);

  const isCleared = clearedTabs.has(activeTab);

  return {
    notifications: tabNotifications,
    rawNotifications: notifications,
    displayedNotifications,
    activeTab,
    setActiveTab,
    loading,
    hasError,
    hasUnread,
    isCleared,
    showClearConfirm,
    setShowClearConfirm,
    handleRead,
    handleDelete,
    handleMarkAllAsRead,
    handleClearAll,
    refetch: fetchData,
  };
};
