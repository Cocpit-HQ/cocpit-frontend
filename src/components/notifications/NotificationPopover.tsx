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
import { formatDistanceToNow } from "date-fns"
import { useSocket } from "@/context/SocketContext"
import Avatar from "@/components/shared/Avatar"
import { useActiveProfile } from "@/context/ActiveProfileContext"

export function NotificationPopover({ 
  className = "relative p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground",
  icon = <Bell className="w-6 h-6" />
}: { 
  className?: string;
  icon?: React.ReactNode;
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
        setNotifications(data.slice(0, 5))
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
      // Filter: only show notifications relevant to the current active profile
      const notif = newNotification as any;
      if (notif.recipient_company_id) {
        // This notification is for a company — only show if we're viewing that company
        if (!isCompany || activeProfile?.id !== notif.recipient_company_id) return;
      } else {
        // This notification is for the user — only show if we're in user mode
        if (isCompany) return;
      }
      setNotifications(prev => [newNotification, ...prev].slice(0, 5));
    };

    socket.on("notification", handleNewNotification);
    return () => {
      socket.off("notification", handleNewNotification);
    }
  }, [socket, isCompany, activeProfile?.id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={className}
        >
          {icon}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 overflow-hidden bg-popover border-border"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-popover-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary hover:underline font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.notification_id}
              onClick={() => {
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
                } else if ((notification.type === 'comment' || notification.type === 'mention' || notification.type === 'reply') && notification.reference_id) {
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

                  const url = commentId
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
              }}
              className={`p-4 flex gap-3 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.is_read ? "bg-muted/30" : ""}`}
            >
              <div className="flex-shrink-0">
                <Avatar
                  url={notification.actor_avatar || undefined}
                  name={notification.actor_name || 'User'}
                  size="md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-popover-foreground">
                  <span className="font-bold">{notification.actor_name}</span> {notification.text ? notification.text.replace(notification.actor_name || '', '').trim() : ''}
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {(() => {
                    try {
                      return notification.created_at
                        ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
                        : "Just now";
                    } catch (e) {
                      return "Just now";
                    }
                  })()}
                </p>
              </div>
              {!notification.is_read && (
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          )}
        </div>
        <div className="p-3 border-t border-border bg-muted/20">
          <Link
            href="/notifications"
            className="block w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
