import React from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNowStrict } from 'date-fns'

const formatShortTime = (dateString?: string): string => {
    if (!dateString) return 'Just now'
    try {
        const distance = formatDistanceToNowStrict(new Date(dateString))
        return distance
            .replace(/ seconds?/, 's')
            .replace(/ minutes?/, 'm')
            .replace(/ hours?/, 'h')
            .replace(/ days?/, 'd')
            .replace(/ months?/, 'mo')
            .replace(/ years?/, 'y') + ' ago'
    } catch (e) {
        return 'Just now'
    }
}
import Avatar from '@/components/shared/Avatar'
import { Notification } from '@/types/social'
import { markNotificationAsRead, deleteNotification } from '@/services/api/notifications'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface NotificationCardProps {
    notification: Notification
    onRead?: (id: string) => void
    onDelete?: (id: string) => void
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onRead, onDelete }) => {
    const router = useRouter()
    const postReferenceId =
        notification.reference_id ||
        (notification as any).referenceId ||
        ((notification as any).metadata?.post_id ?? null)

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

    const handleDelete = async () => {
        try {
            await deleteNotification(notification.notification_id)
            onDelete?.(notification.notification_id)
        } catch (error) {
            console.error("Failed to delete notification:", error)
        }
    }

    const handleClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking buttons or specific interactive elements
        if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) return

        handleMarkAsRead()

        if (notification.type === 'like' && postReferenceId) {
            router.push(`/post/${postReferenceId}`)
        } else if (notification.type === 'follow' && notification.reference_id) {
            router.push(`/profile/${notification.reference_id}`)
        } else if (notification.type === 'repost' && postReferenceId) {
            router.push(`/post/${postReferenceId}`)
        } else if ((notification.type === 'connection_accepted' || notification.type === 'connection_request') && notification.reference_id) {
            router.push(`/profile/${notification.reference_id}`)
        } else if ((notification.type === 'comment' || notification.type === 'mention' || notification.type === 'reply' || notification.type === 'post_tag') && postReferenceId) {
            // Handle comment links (extract post ID if possible, or just go to post)
            // Ideally reference_id for comment is post_id, and we can pass commentId via query param if we had it
            router.push(`/post/${postReferenceId}`)
        } else if (notification.type === 'advocacy' && postReferenceId) {
            router.push(`/post/${postReferenceId}`)
        } else if (notification.type.includes('job') && notification.reference_id) {
            router.push(`/jobs/${notification.reference_id}`)
        }
    }

    return (
        <div
            onClick={handleClick}
            className={cn(
                "p-4 flex flex-row items-start justify-between gap-4 transition-all cursor-pointer rounded-xl",
                "bg-card hover:bg-indigo-50 dark:hover:bg-indigo-300/20"
            )}
        >
            <div className="flex gap-4">
                <div className="flex-shrink-0 pt-0.5">
                    <Avatar
                        url={notification.actor_avatar || undefined}
                        name={notification.actor_name || 'User'}
                        size="md"
                    />
                </div>
                <div className="flex flex-col">
                    {notification.type !== 'advocacy' && (
                        <p className="text-base font-medium text-foreground">
                            {notification.actor_name}
                        </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                        {notification.type === 'advocacy'
                            ? notification.text
                            : notification.text.replace(notification.actor_name || '', '').trim()
                        }
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
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
                {!notification.is_read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-full hover:bg-muted/50 transition-colors ml-1" onClick={(e) => { e.stopPropagation(); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512" className="text-foreground" aria-hidden="true">
                                <path d="M0 0h512v512H0z" fill="none" />
                                <path fill="currentColor" d="M256 144a64 64 0 1 0-64-64a64.07 64.07 0 0 0 64 64m0-96a32 32 0 1 1-32 32a32.036 32.036 0 0 1 32-32m0 320a64 64 0 1 0 64 64a64.07 64.07 0 0 0-64-64m0 96a32 32 0 1 1 32-32a32.036 32.036 0 0 1-32 32m0-272a64 64 0 1 0 64 64a64.07 64.07 0 0 0-64-64m0 96a32 32 0 1 1 32-32a32.036 32.036 0 0 1-32 32" />
                            </svg>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        align="end" 
                        sideOffset={4}
                        alignOffset={12}
                        className="box-border flex flex-col items-center w-[206px] h-[96px] p-2 rounded-[24px] rounded-tr-none border border-[#C7D2FE] bg-white shadow-none dark:bg-white" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DropdownMenuItem className="w-full h-10 grid grid-cols-[1fr_20px] items-center gap-3 cursor-pointer px-5 rounded-xl focus:bg-muted" onClick={() => handleMarkAsRead()}>
                            <span className="text-[14px] font-medium text-foreground leading-none">Mark as read</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                className="text-foreground"
                                aria-hidden="true"
                            >
                                <path d="M0 0h24v24H0z" fill="none" />
                                <path
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.5"
                                    d="M2.5 13.833L6 17.5l1.024-1.073M16.5 6.5l-6.063 6.352m-2.937.981L11 17.5l10.5-11"
                                />
                            </svg>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="w-full h-10 grid grid-cols-[1fr_20px] items-center gap-3 cursor-pointer px-5 rounded-xl focus:bg-red-50 dark:focus:bg-red-500/10" onClick={() => handleDelete()}>
                            <span className="text-[13px] font-medium text-[#FF4D4D] leading-none">Delete notification</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                className="text-[#FF4D4D]"
                                aria-hidden="true"
                            >
                                <path d="M0 0h20v20H0z" fill="none" />
                                <path
                                    fill="currentColor"
                                    d="M8.5 4h3a1.5 1.5 0 0 0-3 0m-1 0a2.5 2.5 0 0 1 5 0h5a.5.5 0 0 1 0 1h-1.054l-1.194 10.344A3 3 0 0 1 12.272 18H7.728a3 3 0 0 1-2.98-2.656L3.554 5H2.5a.5.5 0 0 1 0-1zM5.741 15.23A2 2 0 0 0 7.728 17h4.544a2 2 0 0 0 1.987-1.77L15.439 5H4.561zM8.5 7.5A.5.5 0 0 1 9 8v6a.5.5 0 0 1-1 0V8a.5.5 0 0 1 .5-.5M12 8a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"
                                />
                            </svg>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
