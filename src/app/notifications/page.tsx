'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Notification } from '@/types/social'
import { getNotifications, markNotificationAsRead } from '@/services/api/notifications'
import { formatDistanceToNow } from 'date-fns'
import { useSession } from 'next-auth/react'
import Avatar from '@/components/shared/Avatar'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const user = session?.user

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications()
        setNotifications(data)
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchNotifications()
    }
  }, [user])

  const navigateTo = (page: string) => {
    const routes: Record<string, string> = {
      home: '/feed',
      network: '/showcase',
      events: '/events',
      profile: '/profile',
      settings: '/settings',
      jobs: '/jobs',
      analytics: '/analytics',
    }
    router.push(routes[page] ?? '/feed')
  }

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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.notification_id)
    }

    if (notification.type === 'like' && notification.reference_id) {
      router.push(`/post/${notification.reference_id}`)
    } else if (notification.type === 'follow' && notification.reference_id) {
      router.push(`/profile/${notification.reference_id}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="notifications" navigateTo={navigateTo}>
        <div className="max-w-3xl mx-auto py-6 px-4">
          <h1 className="text-2xl font-bold mb-6 text-foreground">Notifications</h1>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 md:p-5 flex gap-4 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.is_read ? "bg-muted/30" : ""
                      }`}
                  >
                    <div className="flex-shrink-0">
                      <Avatar
                        url={notification.actor_avatar || undefined}
                        name={notification.actor_name || 'User'}
                        size="lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-foreground font-medium">
                        <span className="font-bold">{notification.actor_name}</span> {notification.text.replace(notification.actor_name || '', '').trim()}
                      </p>
                      <p className="text-sm mt-1 text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <p>No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </div>
  )
}
