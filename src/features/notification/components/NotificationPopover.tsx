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
import { getNotifications, markNotificationAsRead, markAllNotificationsRead } from "@/features/notification/api"
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
    } else if (notification.type === 'community_invite') {
      // Channel invitation — open connections page on the channels invitation tab
      router.push('/connections?tab=invitations&sub=channels')
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

    const renderNotificationItem = (notification: Notification) => {
    const text = notification.text ? notification.text.replace(notification.actor_name || '', '').trim() : '';
    const isCompanyActor = Boolean(
      notification.is_company_actor ||
      (notification as any).isCompanyActor ||
      (notification as any).actor_type === 'company' ||
      (notification as any).actor_type === 'organization' ||
      notification.type === 'company_connection_accepted' ||
      notification.type === 'company_invite' ||
      notification.type === 'company_job' ||
      notification.type === 'company_event' ||
      notification.type === 'company_post' ||
      notification.type === 'organization_job' ||
      notification.type === 'organization_invite' ||
      notification.type === 'ORGANIZATION_INVITE'
    );
    return (
      <div
        key={notification.notification_id}
        onClick={() => handleNotificationClick(notification)}
        className="w-full flex flex-row justify-between items-center px-4 bg-white dark:bg-background hover:bg-[#EEF2FF] dark:hover:bg-[#1e1b4b]/50 transition-colors cursor-pointer select-none"
        style={{
          height: '60px',
          flex: 'none',
          alignSelf: 'stretch',
          flexGrow: 0,
        }}
      >
        {/* Frame 2608774 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            gap: '8px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
          }}
        >
          {/* Ellipse 24 */}
          <div
            style={{
              width: '40px',
              height: '40px',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            <Avatar
              url={notification.actor_avatar || undefined}
              name={notification.actor_name || 'User'}
              size="md"
              isCompany={isCompanyActor}
            />
          </div>

          {/* Frame 2608715 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0px',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}
          >
            {/* Sarah chen */}
            <span
              className="font-poppins text-black dark:text-white truncate"
              style={{
                width: '93px',
                height: '24px',
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '24px',
                color: 'currentColor',
                textAlign: 'center',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}
            >
              {notification.actor_name}
            </span>
            {/* Sent a photo */}
            <span
              className="font-poppins text-muted-foreground truncate max-w-[170px]"
              style={{
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#6B7280',
                flex: 'none',
                order: 1,
                flexGrow: 0,
              }}
            >
              {text}
            </span>
          </div>
        </div>

        {/* Frame 2608646 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            gap: '8px',
            flex: 'none',
            order: 1,
            flexGrow: 0,
          }}
        >
          {/* 42m ago */}
          <span
            className="font-poppins text-black dark:text-white"
            style={{
              width: '54px',
              height: '16px',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '16px',
              color: 'currentColor',
              display: 'flex',
              alignItems: 'center',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            {formatShortTime(notification.created_at)}
          </span>

          {/* Ellipse 15 */}
          {!notification.is_read && (
            <div
              style={{
                width: '6px',
                height: '6px',
                background: '#6366F1',
                borderRadius: '50%',
                flex: 'none',
                order: 1,
                flexGrow: 0,
              }}
            />
          )}
        </div>
      </div>
    );
  };

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
        className="w-[375px] h-[366px] overflow-hidden notification-popover-custom border shadow-none rounded-[24px_0px_24px_24px] flex flex-col items-start relative py-4 px-0"
        style={{
          boxSizing: 'border-box',
          gap: '16px',
        }}
      >
        {/* Frame 2608712 */}
        <div
          className="w-full flex flex-row items-center justify-between px-4"
          style={{
            height: '26px',
            gap: '10px',
            flex: 'none',
            order: 0,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}
        >
          <h3
            className="font-poppins text-black dark:text-white"
            style={{
              width: '114px',
              height: '26px',
              fontStyle: 'normal',
              fontWeight: 500,
              fontSize: '18px',
              lineHeight: '26px',
              color: 'currentColor',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            Notifications
          </h3>

        </div>

        {/* Scrollable area for notifications */}
        <div className="w-full flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-4">
          {todayNotifications.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0px',
                gap: '8px',
                width: '100%',
                flex: 'none',
                order: 1,
                alignSelf: 'stretch',
                flexGrow: 0,
              }}
            >
              {/* Frame 2608713 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '0px 16px',
                  gap: '10px',
                  width: '100%',
                  height: '16px',
                  flex: 'none',
                  order: 0,
                  alignSelf: 'stretch',
                  flexGrow: 0,
                }}
              >
                {/* Today */}
                <span
                  className="font-poppins text-[#6B7280]"
                  style={{
                    width: '38px',
                    height: '16px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: '#6B7280',
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                  }}
                >
                  Today
                </span>
              </div>

              {/* Today list */}
              <div className="flex flex-col gap-2 w-full">
                {todayNotifications.map(renderNotificationItem)}
              </div>
            </div>
          )}

          {olderNotifications.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0px',
                gap: '8px',
                width: '100%',
                flex: 'none',
                order: 2,
                alignSelf: 'stretch',
                flexGrow: 0,
              }}
            >
              {/* Frame 2608716 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '0px 16px',
                  gap: '10px',
                  width: '100%',
                  height: '16px',
                  flex: 'none',
                  order: 0,
                  alignSelf: 'stretch',
                  flexGrow: 0,
                }}
              >
                {/* Older */}
                <span
                  className="font-poppins text-[#6B7280]"
                  style={{
                    width: '33px',
                    height: '16px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: '#6B7280',
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                  }}
                >
                  Older
                </span>
              </div>

              {/* Older list */}
              <div className="flex flex-col gap-2 w-full">
                {olderNotifications.map(renderNotificationItem)}
              </div>
            </div>
          )}

          {notifications.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground w-full">
              No notifications
            </div>
          )}
        </div>

        {/* Frame 2608719 */}
        <div
          className="w-full flex flex-row justify-center items-center px-4"
          style={{
            height: '24px',
            gap: '10px',
            flex: 'none',
            order: 3,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}
        >
          {/* See all */}
          <Link
            href="/notifications"
            className="font-poppins text-[#6366F1] hover:text-[#6366F1]/80 transition-colors"
            style={{
              width: '53px',
              height: '24px',
              fontStyle: 'normal',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '24px',
              color: '#6366F1',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
            onClick={() => setIsOpen(false)}
          >
            See all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
