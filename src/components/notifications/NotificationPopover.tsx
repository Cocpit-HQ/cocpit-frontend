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

interface NotificationPopoverProps {
  isDark: boolean
}

export function NotificationPopover({ isDark }: NotificationPopoverProps) {
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
          className={`relative p-2 rounded-full transition-colors ${
            isDark ? "hover:bg-[#2d3548] text-gray-400" : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#171c28]" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={`w-80 p-0 overflow-hidden ${
          isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
        }`}
      >
        <div className={`p-4 border-b ${isDark ? "border-[#2d3548]" : "border-gray-200"} flex items-center justify-between`}>
          <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-[#5B7CFF] hover:underline font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 flex gap-3 hover:bg-opacity-50 transition-colors cursor-pointer ${
                isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-50"
              } ${!notification.read ? (isDark ? "bg-[#2d3548]/30" : "bg-blue-50/50") : ""}`}
            >
              <div className={`w-10 h-10 rounded-full flex-shrink-0 ${notification.avatarColor}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  {notification.text}
                </p>
                <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                  {notification.time}
                </p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-[#5B7CFF] mt-2 flex-shrink-0" />
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className={`p-8 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>
              No notifications
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
