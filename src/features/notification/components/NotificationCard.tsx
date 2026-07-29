import React from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNowStrict } from 'date-fns'
import { Icon } from '@iconify/react'
import { differenceInDays, differenceInWeeks } from 'date-fns'

const formatShortTime = (dateString?: string): string => {
    if (!dateString) return 'Just now'
    try {
        const date = new Date(dateString)
        const now = new Date()
        const days = differenceInDays(now, date)

        if (days >= 1 && days <= 7) {
            return `${days} day${days > 1 ? 's' : ''}`
        }
        if (days > 7) {
            const weeks = differenceInWeeks(now, date)
            return `${weeks} week${weeks > 1 ? 's' : ''}`
        }

        const distance = formatDistanceToNowStrict(date)
        return distance
            .replace(/ seconds?/, 's')
            .replace(/ minutes?/, 'm')
            .replace(/ hours?/, 'h') + ' ago'
    } catch (e) {
        return 'Just now'
    }
}
import Avatar from '@/components/shared/Avatar'
import { Notification } from '@/types/social'
import { markNotificationAsRead, deleteNotification } from '@/features/notification/api'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useActiveProfile } from "@/context/ActiveProfileContext"

interface NotificationCardProps {
    notification: Notification
    onRead?: (id: string) => void
    onDelete?: (id: string) => void
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onRead, onDelete }) => {
    const router = useRouter()
    const { isCompany } = useActiveProfile()
    
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
        } else if ((notification.type === 'connection_accepted' || notification.type === 'connection_request' || notification.type === 'new_connection') && notification.reference_id) {
            const url = notification.is_company_actor
                ? `/organization/${notification.actor_slug}`
                : `/profile/${notification.reference_id}`;
            router.push(url)
        } else if (notification.type === 'company_connection_accepted' && notification.reference_id) {
            router.push(`/organization/${notification.reference_id}`)
        } else if ((notification.type === 'comment' || notification.type === 'mention' || notification.type === 'reply' || notification.type === 'post_tag') && postReferenceId) {
            let commentId;
            try {
                if (typeof (notification as any).metadata === 'string') {
                    const meta = JSON.parse((notification as any).metadata);
                    commentId = meta.comment_id;
                } else if (typeof (notification as any).metadata === 'object') {
                    commentId = (notification as any).metadata?.comment_id;
                }
            } catch (e) {
                console.error("Error parsing notification metadata", e);
            }

            const url = (notification.type !== 'post_tag' && commentId)
                ? `/post/${postReferenceId}?commentId=${commentId}`
                : `/post/${postReferenceId}`;

            router.push(url);
        } else if (notification.type === 'advocacy' && postReferenceId) {
            router.push(`/post/${postReferenceId}`)
        } else if (notification.type.includes('job') && notification.reference_id) {
            router.push(`/jobs/${notification.reference_id}`)
        } else if (notification.type === 'community_invite') {
            // Channel invitation — open connections page on the channels invitation tab
            router.push('/connections?tab=invitations&sub=channels')
        } else if (notification.type === 'organization_invite' || notification.type === 'ORGANIZATION_INVITE') {
            // Team / Organization invitation — open connections page on the teams invitation tab
            router.push('/connections?tab=invitations&sub=teams')
        }
    }

    return (
        <div
            onClick={handleClick}
            className={cn(
                "p-[16px] flex flex-row items-start justify-between transition-all cursor-pointer rounded-[12px]",
                isCompany ? "hover:bg-[#E5F0FF] dark:hover:bg-muted/50" : "hover:bg-[#EEF2FF] dark:hover:bg-muted/50",
                !notification.is_read
                    ? (isCompany ? "bg-[#E5F0FF]/50 dark:bg-[#4D9CFF]/10" : "bg-indigo-50/30 dark:bg-indigo-900/10")
                    : "bg-[#FFFFFF] dark:bg-transparent"
            )}
        >
            <div className="flex flex-row items-center gap-[8px]">
                <div className="flex-shrink-0">
                    <Avatar
                        url={notification.actor_avatar || undefined}
                        name={notification.actor_name || 'User'}
                        size="md"
                    />
                </div>
                <div className="flex flex-row items-center gap-[4px] flex-wrap">
                    {notification.type !== 'advocacy' && notification.actor_name && (
                        <span className="font-poppins font-medium text-[16px] leading-[24px] text-[#000000] dark:text-white">
                            {notification.actor_name}
                        </span>
                    )}
                    <span className="font-poppins font-normal text-[14px] leading-[20px] text-[#6B7280] dark:text-muted-foreground">
                        {notification.type === 'advocacy'
                            ? notification.text
                            : notification.text.replace(notification.actor_name || '', '').trim()
                        }
                    </span>
                </div>
            </div>

            <div className="flex flex-row items-start gap-[8px] flex-shrink-0">
                <span className="font-poppins font-normal text-[12px] leading-[16px] text-[#000000] dark:text-white mt-1">
                    {formatShortTime(notification.created_at)}
                </span>
                {!notification.is_read && (
                    <div className={cn(
                        "w-[6px] h-[6px] rounded-full mt-1.5",
                        isCompany ? "bg-[#1A73E8]" : "bg-[#6366F1]"
                    )} />
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex justify-center items-center w-[24px] h-[24px] rounded-full hover:bg-muted/50 transition-colors" onClick={(e) => { e.stopPropagation(); }}>
                            <Icon icon="ph:dots-three-outline-vertical-light" width="24" height="24" className="text-[#000000] dark:text-white" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        sideOffset={4}
                        alignOffset={12}
                        className="box-border flex flex-col items-center w-[206px] h-[96px] p-[8px] gap-0 rounded-[24px] rounded-tr-none border border-[#C7D2FE] bg-[#FFFFFF] shadow-none dark:bg-background"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DropdownMenuItem className="box-border flex flex-row justify-between items-center py-[8px] px-[16px] gap-[10px] w-[190px] h-[40px] bg-[#FFFFFF] dark:bg-transparent rounded-[24px] cursor-pointer focus:bg-muted/50 focus:text-inherit" onClick={() => handleMarkAsRead()}>
                            <span className="w-[92px] h-[20px] font-poppins font-normal text-[14px] leading-[20px] text-center text-[#000000] dark:text-white flex-none order-0">Mark as read</span>
                            <div className="w-[24px] h-[24px] flex-none order-1 relative flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    className="text-[#000000] dark:text-white"
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
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="box-border flex flex-row justify-between items-center py-[8px] px-[16px] gap-[10px] w-[190px] h-[40px] bg-[#FFFFFF] dark:bg-transparent rounded-[24px] cursor-pointer focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-inherit" onClick={() => handleDelete()}>
                            <span className="w-[128px] h-[20px] font-poppins font-normal text-[14px] leading-[20px] text-center text-[#FF6B6B] flex-none order-0">Delete notification</span>
                            <div className="w-[24px] h-[24px] flex-none order-1 relative flex items-center justify-center">
                                <Icon icon="hugeicons:delete-02" width="20" height="20" className="text-[#FF6B6B]" />
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
