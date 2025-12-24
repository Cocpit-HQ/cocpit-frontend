"use client"

import React, { useState } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { mockNotifications, Notification } from "@/constants/notifications"

export function NotificationPopover() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
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
              key={notification.id}
              className={`p-4 flex gap-3 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? "bg-muted/30" : ""}`}
            >
              <div className={`w-10 h-10 rounded-full flex-shrink-0 ${notification.avatarColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-popover-foreground">
                  {notification.text}
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {notification.time}
                </p>
              </div>
              {!notification.read && (
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
