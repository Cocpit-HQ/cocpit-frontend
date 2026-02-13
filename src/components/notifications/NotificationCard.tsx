import React from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import Avatar from '@/components/shared/Avatar'
import { Notification } from '@/types/social'
import { markNotificationAsRead } from '@/services/api/notifications'
import { cn } from '@/lib/utils'

interface NotificationCardProps {
    notification: Notification
    onRead?: (id: string) => void
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onRead }) => {
    const router = useRouter()

    const handleMarkAsRead = async () => {
        if (!notification.is_read) {
            try {
                await markNotificationAsRead(notification.notification_id)
                onRead?.(notification.notification_id)
            } catch (error) {
                console.error("Failed to mark as read:", error)
            }
        }
    }

    const handleClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking buttons or specific interactive elements
        if ((e.target as HTMLElement).tagName === 'BUTTON') return

        handleMarkAsRead()

        if (notification.type === 'like' && notification.reference_id) {
            router.push(`/post/${notification.reference_id}`)
        } else if (notification.type === 'follow' && notification.reference_id) {
            router.push(`/profile/${notification.reference_id}`)
        } else if (notification.type === 'repost' && notification.reference_id) {
            router.push(`/post/${notification.reference_id}`)
        } else if ((notification.type === 'connection_accepted' || notification.type === 'connection_request') && notification.reference_id) {
            router.push(`/profile/${notification.reference_id}`)
        } else if (notification.type === 'comment' && notification.reference_id) {
            // Handle comment links (extract post ID if possible, or just go to post)
            // Ideally reference_id for comment is post_id, and we can pass commentId via query param if we had it
        } else if (notification.type === 'comment' && notification.reference_id) {
            router.push(`/post/${notification.reference_id}`)
        } else if (notification.type === 'advocacy' && notification.reference_id) {
            router.push(`/post/${notification.reference_id}`)
        }
    }

    return (
        <div
            onClick={handleClick}
            className={cn(
                "p-4 flex gap-4 hover:bg-muted/50 transition-all cursor-pointer border-b border-border last:border-0",
                !notification.is_read ? "bg-muted/20" : ""
            )}
        >
            <div className="flex-shrink-0">
                <Avatar
                    url={notification.actor_avatar || undefined}
                    name={notification.actor_name || 'User'}
                    size="md"
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <p className="text-sm text-foreground">
                        {notification.type !== 'advocacy' && (
                            <span className="font-semibold">{notification.actor_name}</span>
                        )}
                        {" "}
                        <span className="text-muted-foreground">
                            {notification.type === 'advocacy'
                                ? notification.text
                                : notification.text.replace(notification.actor_name || '', '').trim()
                            }
                        </span>
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {(() => {
                            try {
                                return notification.created_at
                                    ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
                                    : "Just now";
                            } catch (e) {
                                return "Just now";
                            }
                        })()}
                    </span>
                </div>
            </div>
            {!notification.is_read && (
                <div className="flex items-center self-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
            )}
        </div>
    )
}
