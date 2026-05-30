"use client"

import React, { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Notification } from "@/types/social"
import { getNotifications, markNotificationAsRead, markAllNotificationsRead } from "@/services/api/notifications"
import { useSession } from "next-auth/react"
import { formatDistanceToNowStrict, isToday, format } from "date-fns"

const formatShortTime = (dateString?: string) => {
  if (!dateString) return "Just now";
  try {
    const date = new Date(dateString);
    if (isToday(date)) {
      const distance = formatDistanceToNowStrict(date);
      return distance
        .replace(/ seconds?/, 's')
        .replace(/ minutes?/, 'm')
        .replace(/ hours?/, 'h')
        .replace(/ days?/, 'd')
        .replace(/ months?/, 'mo')
        .replace(/ years?/, 'y') + " ago";
    } else {
      return format(date, "d MMM");
    }
  } catch (e) {
    return "Just now";
  }
}
import { useSocket } from "@/context/SocketContext"
import Avatar from "@/components/shared/Avatar"
import { useActiveProfile } from "@/context/ActiveProfileContext"

export function NotificationPopover({
  className = "relative p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground",
  icon = <Bell className="w-6 h-6" />,
  onOpenChange,
}: {
  className?: string;
  icon?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()
  const user = session?.user

  const { socket } = useSocket()
  const { activeProfile, isCompany } = useActiveProfile()

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const companyId = (isCompany && activeProfile) ? activeProfile.id : undefined;
        const data = await getNotifications(companyId)
        // Take only first 5 for the popover
        setNotifications(data.slice(0, 3))
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
      }
    }

    if (user) {
      fetchNotifications()
    }
  }, [isOpen, user, activeProfile, isCompany])

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotification: Notification) => {
      const normalizedNotification: Notification = {
        ...newNotification,
        notification_id: newNotification.notification_id || `temp-${Date.now()}-${Math.random()}`,
        reference_id:
          newNotification.reference_id ||
          (newNotification as any).referenceId ||
          ((newNotification as any).metadata?.post_id ?? null),
        actor_name: newNotification.actor_name || (newNotification as any).senderName,
        actor_avatar: newNotification.actor_avatar || (newNotification as any).senderAvatar,
        is_read: newNotification.is_read ?? false,
        created_at: newNotification.created_at || new Date().toISOString(),
      };

      // Filter: only show notifications relevant to the current active profile
      const notif = normalizedNotification as any;
      if (notif.recipient_company_id) {
        // This notification is for a company — only show if we're viewing that company
        if (!isCompany || activeProfile?.id !== notif.recipient_company_id) return;
      } else {
        // This notification is for the user — only show if we're in user mode
        if (isCompany) return;
      }
      setNotifications(prev => [normalizedNotification, ...prev].slice(0, 5));
    };

    socket.on("notification", handleNewNotification);
    return () => {
      socket.off("notification", handleNewNotification);
    }
  }, [socket, isCompany, activeProfile?.id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkAsRead = async (id: string) => {
    try {
      const companyId = (isCompany && activeProfile) ? activeProfile.id : undefined;
      await markNotificationAsRead(id, companyId)
      setNotifications(prev => prev.map(n =>
        n.notification_id === id ? { ...n, is_read: true } : n
      ))
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const companyId = (isCompany && activeProfile) ? activeProfile.id : undefined;
      await markAllNotificationsRead(companyId);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) handleMarkAsRead(notification.notification_id)

    if (notification.type === 'like' && notification.reference_id) {
      router.push(`/post/${notification.reference_id}`)
      setIsOpen(false)
    } else if (notification.type === 'follow' && notification.reference_id) {
      const url = notification.is_company_actor
        ? `/organization/${notification.actor_slug}`
        : `/profile/${notification.reference_id}`;
      router.push(url);
      setIsOpen(false);
    } else if (notification.type === 'repost' && notification.reference_id) {
      router.push(`/post/${notification.reference_id}`)
      setIsOpen(false)
    } else if ((notification.type === 'connection_accepted' || notification.type === 'connection_request') && notification.reference_id) {
      const url = notification.is_company_actor
        ? `/organization/${notification.actor_slug}`
        : `/profile/${notification.reference_id}`;
      router.push(url);
      setIsOpen(false);
    } else if ((notification.type === 'comment' || notification.type === 'mention' || notification.type === 'reply' || notification.type === 'post_tag') && notification.reference_id) {
      // Extract comment_id from metadata if available (it might be stringified)
      let commentId;
      try {
        if (typeof notification.metadata === 'string') {
          const meta = JSON.parse(notification.metadata);
          commentId = meta.comment_id;
        } else if (typeof notification.metadata === 'object') {
          // @ts-ignore
          commentId = notification.metadata?.comment_id;
        }
      } catch (e) { console.error("Error parsing metadata", e) }

      const url = (notification.type !== 'post_tag' && commentId)
        ? `/post/${notification.reference_id}?commentId=${commentId}`
        : `/post/${notification.reference_id}`;

      router.push(url);
      setIsOpen(false);
    } else if (notification.type === 'company_invite') {
      // Navigate to invite accept page
      let inviteLink = '/';
      try {
        const meta = typeof notification.metadata === 'string'
          ? JSON.parse(notification.metadata)
          : notification.metadata;
        inviteLink = meta?.inviteLink || '/';
      } catch (e) { console.error("Error parsing invite metadata", e); }
      router.push(inviteLink);
      setIsOpen(false);
    } else if (notification.type === 'company_job' && notification.reference_id) {
      router.push(`/jobs/${notification.reference_id}`);
      setIsOpen(false);
    } else if (notification.type === 'company_event' && notification.reference_id) {
      router.push(`/events/${notification.reference_id}`);
      setIsOpen(false);
    } else if (notification.type === 'company_post' && notification.reference_id) {
      router.push(`/post/${notification.reference_id}`);
      setIsOpen(false);
    } else if (notification.type === 'profile_share' && notification.reference_id) {
      let profileType = 'user';
      let slug: string | undefined;
      let accountName: string | undefined;
      try {
        const meta = typeof notification.metadata === 'string'
          ? JSON.parse(notification.metadata)
          : notification.metadata;
        profileType = meta?.profileType || 'user'; // eslint-disable-line @typescript-eslint/no-unsafe-member-access
        slug = meta?.slug;
        accountName = meta?.account_name;
      } catch (e) { console.error("Error parsing share metadata", e); }

      let url: string;
      if (profileType.toLowerCase() === 'company') {
        // Use slug for company navigation, fall back to reference_id
        url = `/organization/${slug || notification.reference_id}`;
      } else {
        // Use account_name for user profile, fall back to reference_id
        url = `/profile/${accountName || notification.reference_id}`;
      }
      router.push(url);
      setIsOpen(false);
    } else if (notification.type === 'share') {
      // Universal share notification — route based on entity_type
      let entityType = notification.entity_type;
      let entityId = notification.entity_id || notification.reference_id;
      let slug: string | undefined;
      let accountName: string | undefined;
      try {
        const meta = typeof notification.metadata === 'string'
          ? JSON.parse(notification.metadata)
          : notification.metadata;
        entityType = entityType || meta?.entityType;
        entityId = entityId || meta?.entityId;
        slug = meta?.slug;
        accountName = meta?.account_name;
      } catch (e) { console.error("Error parsing share metadata", e); }

      let url = '/';
      if (entityType === 'company') {
        url = `/organization/${slug || entityId}`;
      } else if (entityType === 'profile') {
        url = `/profile/${accountName || entityId}`;
      } else if (entityType === 'post') {
        url = `/post/${entityId}`;
      } else if (entityType === 'job') {
        url = `/jobs/${entityId}`;
      } else if (entityType === 'event') {
        url = `/events/${entityId}`;
      }
      router.push(url);
      setIsOpen(false);
    }
  }

  const todayNotifications = notifications.filter(n => n.created_at && isToday(new Date(n.created_at)));
  const olderNotifications = notifications.filter(n => !n.created_at || !isToday(new Date(n.created_at)));

  const renderNotificationItem = (notification: Notification) => (
    <div
      key={notification.notification_id}
      onClick={() => handleNotificationClick(notification)}
      className="flex items-start justify-between gap-3 py-3 cursor-pointer group hover:bg-muted/30 transition-colors rounded-xl px-2 -mx-2"
    >
      <div className="flex gap-3 min-w-0">
        <div className="flex-shrink-0 pt-0.5">
          <Avatar
            url={notification.actor_avatar || undefined}
            name={notification.actor_name || 'User'}
            size="md"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-foreground leading-tight truncate">
            {notification.actor_name}
          </p>
          <p className="text-[14px] text-muted-foreground leading-tight mt-1 truncate">
            {notification.text ? notification.text.replace(notification.actor_name || '', '').trim() : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
        <span className="text-xs text-muted-foreground font-medium">
          {formatShortTime(notification.created_at)}
        </span>
        <div className={`w-1.5 h-1.5 rounded-full ${!notification.is_read ? 'bg-blue-600' : 'bg-transparent'}`} />
      </div>
    </div>
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={className}
        >
          <div className="relative inline-flex">
            {icon}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#6366F1] rounded-full border-background" />
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[340px] p-5 overflow-hidden bg-background border border-border/40 shadow-xl rounded-3xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary hover:underline font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-[350px] overflow-y-auto pr-1 scrollbar-hide">
          {todayNotifications.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs text-muted-foreground/70 font-semibold mb-2 uppercase tracking-wider">Today</h4>
              <div className="flex flex-col gap-1">
                {todayNotifications.map(renderNotificationItem)}
              </div>
            </div>
          )}

          {olderNotifications.length > 0 && (
            <div className="mb-2">
              <h4 className="text-xs text-muted-foreground/70 font-semibold mb-2 uppercase tracking-wider">Older</h4>
              <div className="flex flex-col gap-1">
                {olderNotifications.map(renderNotificationItem)}
              </div>
            </div>
          )}

          {notifications.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          )}
        </div>
        <div className="pt-4 pb-1 mt-2 flex justify-center">
          <Link
            href="/notifications"
            className="text-[14px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            See all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
