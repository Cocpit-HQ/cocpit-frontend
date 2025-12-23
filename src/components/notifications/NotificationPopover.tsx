"use client"

import React, { useState } from "react"
import { Bell } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Notification = {
  id: number
  text: string
  time: string
  read: boolean
  avatarColor: string
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    text: "Sarah Chen liked your story",
    time: "2m ago",
    read: false,
    avatarColor: "bg-blue-400",
  },
  {
    id: 2,
    text: "Michael Torres commented on your post",
    time: "1h ago",
    read: false,
    avatarColor: "bg-purple-400",
  },
  {
    id: 3,
    text: "New job alert: Product Designer",
    time: "3h ago",
    read: true,
    avatarColor: "bg-green-400",
  },
  {
    id: 4,
    text: "Jessica Williams viewed your profile",
    time: "5h ago",
    read: true,
    avatarColor: "bg-yellow-400",
  },
]

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
      </PopoverContent>
    </Popover>
  )
}
