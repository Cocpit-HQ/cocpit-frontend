'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { mockNotifications, Notification } from '@/constants/notifications'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

  const navigateTo = (page: string) => {
    const routes: Record<string, string> = {
      home: '/feed',
      network: '/showcase',
      events: '/events',
      profile: '/profile',
      settings: '/settings',
      jobs: '/jobs',
      analytics: '/analytics',
      achievements: '/achievements',
    }
    router.push(routes[page] ?? '/feed')
  }

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="home" navigateTo={navigateTo}>
        <div className="max-w-3xl mx-auto py-6 px-4">
          <h1 className="text-2xl font-bold mb-6 text-foreground">Notifications</h1>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {notifications.length > 0 ? (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-4 md:p-5 flex gap-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-muted/30" : ""
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex-shrink-0 ${notification.avatarColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-foreground font-medium">
                        {notification.text}
                      </p>
                      <p className="text-sm mt-1 text-muted-foreground">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
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
