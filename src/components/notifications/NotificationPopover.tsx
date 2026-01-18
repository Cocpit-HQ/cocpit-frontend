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
import { getNotifications, markNotificationAsRead } from "@/services/api/notifications"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import Avatar from "@/components/shared/Avatar"

export function NotificationPopover() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()
  const user = session?.user

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications()
        // Take only first 5 for the popover
        setNotifications(data.slice(0, 5))
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
      }
    }

    if (isOpen && user) {
      fetchNotifications()
    }
  }, [isOpen, user])

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
    // TODO: Implement bulk mark as read in API
    const unread = notifications.filter(n => !n.is_read)
    for (const n of unread) {
      await handleMarkAsRead(n.notification_id)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground"
        >
          <Bell className="w-6 h-6" />
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
                  router.push(`/profile/${notification.reference_id}`)
                  setIsOpen(false)
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
                  <span className="font-bold">{notification.actor_name}</span> {notification.text.replace(notification.actor_name || '', '').trim()}
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
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
