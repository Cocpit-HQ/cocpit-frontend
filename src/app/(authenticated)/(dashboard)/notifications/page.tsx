'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Notification } from '@/types/social'
import { getNotifications, deleteNotifications, markAllNotificationsRead } from '@/services/api/notifications'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotificationCard } from '@/components/notifications/NotificationCard'
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { ArrowLeft, Bell, CircleAlert } from 'lucide-react'

type EmptyStateProps = {
  title: string
  description: string
}

const EmptyState = ({ title, description }: EmptyStateProps) => (
  <div className="min-h-[420px] md:min-h-[500px] flex items-center justify-center px-4">
    <div className="w-full max-w-[280px] flex flex-col items-center text-center">
      <Bell className="w-16 h-16 text-foreground mb-4" strokeWidth={1.5} />
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-6">{description}</p>
    </div>
  </div>
)

export default function NotificationsPage() {
  const router = useRouter()
  const { activeProfile, isCompany } = useActiveProfile()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const { data: session } = useSession()
  const user = session?.user

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setHasError(false)
        const companyId = (isCompany && activeProfile) ? activeProfile.id : undefined;

        const notifsData = await getNotifications(companyId)
        setNotifications(notifsData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
        setHasError(true)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, activeProfile, isCompany])

  const handleRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.notification_id === id ? { ...n, is_read: true } : n
    ))
  }

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.notification_id !== id))
  }

  const handleMarkAllAsRead = async () => {
    try {
      const companyId = (isCompany && activeProfile) ? activeProfile.id : undefined;
      await markAllNotificationsRead(companyId);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  const handleClearAll = async () => {
    try {
      let idsToDelete: string[] = []
      if (activeTab === "all") {
        idsToDelete = notifications.map(n => n.notification_id)
      } else if (activeTab === "mentions") {
        idsToDelete = mentions.map(n => n.notification_id)
      } else if (activeTab === "jobs") {
        idsToDelete = jobs.map(n => n.notification_id)
      }
      // Assuming events don't have notifications yet based on the placeholder UI
      
      if (idsToDelete.length > 0) {
        await deleteNotifications(idsToDelete)
        setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.notification_id)))
      }
    } catch (error) {
      console.error("Failed to clear notifications:", error)
    }
  }

  // Filter helpers
  const mentions = notifications.filter(n =>
    n.type === 'mention' || n.type === 'reply' || n.type === 'comment' || n.type.includes('tag')
  )

  const jobs = notifications.filter(n =>
    n.type === 'organization_job' || n.type === 'job_offer' || n.type.includes('job')
  )

  // Show "Mark all as read" only when there are unread notifications in the current tab
  const hasUnread =
    (activeTab === 'all' && notifications.some(n => !n.is_read)) ||
    (activeTab === 'mentions' && mentions.some(n => !n.is_read)) ||
    (activeTab === 'jobs' && jobs.some(n => !n.is_read))

  return (
    <div className="flex flex-col h-[calc(100dvh-128px)] md:h-[calc(100dvh-56px)] bg-white dark:bg-background text-foreground overflow-hidden font-poppins">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full">

        {/* Tabs with Fixed Header */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full w-full">
          <div className="flex-none bg-white dark:bg-background pt-6 pb-4 px-4 md:px-6 border-b border-transparent z-10">
            {/* Header */}
            <div className="mb-6 flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.back()}
                  className="rounded-full h-12 w-12 border-border/80"
                >
                  <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                </Button>
                <div className="flex flex-col">
                    <h1
                      className="font-poppins text-black dark:text-white text-left"
                      style={{
                        width: '114px',
                        height: '26px',
                        fontStyle: 'normal',
                        fontWeight: 500,
                        fontSize: '18px',
                        lineHeight: '26px',
                        color: 'currentColor',
                        flex: 'none',
                        order: 0,
                        flexGrow: 0,
                      }}
                    >
                      Notifications
                    </h1>
                    <p className="text-xs text-muted-foreground">Stay update with your account activity</p>
                </div>
              </div>
              <div className="flex gap-2">
                {hasUnread && (
                  <button
                    className="text-sm text-indigo-400 font-medium"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            <TabsList className="flex flex-row justify-start bg-transparent p-0 gap-3 border-none h-auto overflow-x-auto pb-2 -mb-2 scrollbar-hide no-scrollbar">
            <TabsTrigger 
              value="all" 
              className="rounded-full px-5 py-2 border transition-all data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:border-primary data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border data-[state=active]:shadow-none data-[state=inactive]:shadow-none hover:bg-muted/10 dark:hover:bg-white/5"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="mentions" 
              className="rounded-full px-5 py-2 border transition-all data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:border-primary data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border data-[state=active]:shadow-none data-[state=inactive]:shadow-none hover:bg-muted/10 dark:hover:bg-white/5"
            >
              Mentions
            </TabsTrigger>
            <TabsTrigger 
              value="jobs" 
              className="rounded-full px-5 py-2 border transition-all data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:border-primary data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border data-[state=active]:shadow-none data-[state=inactive]:shadow-none hover:bg-muted/10 dark:hover:bg-white/5"
            >
              Jobs
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="rounded-full px-5 py-2 border transition-all data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:border-primary data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border data-[state=active]:shadow-none data-[state=inactive]:shadow-none hover:bg-muted/10 dark:hover:bg-white/5"
            >
              Events
            </TabsTrigger>
          </TabsList>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 scrollbar-hide">
          {hasError ? (
            <div className="min-h-[420px] md:min-h-[500px] flex items-center justify-center px-4">
              <div className="w-full max-w-[280px] flex flex-col items-center text-center">
                <CircleAlert className="w-12 h-12 text-foreground mb-4" strokeWidth={1.75} />
                <h3 className="text-lg font-semibold text-foreground mb-1">Unable to load notifications</h3>
                <p className="text-sm text-muted-foreground">Please try again in a moment</p>
              </div>
            </div>
          ) : (
            <>

          <TabsContent value="all" className="space-y-4">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : notifications.length > 0 ? (
                <div>
                  {notifications.map(notification => (
                    <NotificationCard
                      key={notification.notification_id}
                      notification={notification}
                      onRead={handleRead}
                      onDelete={handleDeleteNotification}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="You're all caught up."
                  description="We'll notify you when there's activity on your account"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="mentions">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
              {mentions.length > 0 ? (
                <div>
                  {mentions.map(notification => (
                    <NotificationCard
                      key={notification.notification_id}
                      notification={notification}
                      onRead={handleRead}
                      onDelete={handleDeleteNotification}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="You're all caught up."
                  description="We'll notify you when there's activity on your account"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="jobs">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
              {jobs.length > 0 ? (
                <div>
                  {jobs.map(notification => (
                    <NotificationCard
                      key={notification.notification_id}
                      notification={notification}
                      onRead={handleRead}
                      onDelete={handleDeleteNotification}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No job updates yet"
                  description="We'll notify you when there's activity on your job applications"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
              <EmptyState
                title="No event updates yet"
                description="You'll see event activity here when it happens"
              />
            </div>
          </TabsContent>

          {/* Sticky Clear All — sits right after list when short, pins to bottom when list overflows */}
          {((activeTab === 'all' && notifications.length > 0) ||
            (activeTab === 'mentions' && mentions.length > 0) ||
            (activeTab === 'jobs' && jobs.length > 0)) && (
            <div className="sticky bottom-0 bg-white dark:bg-background border-t border-border/40 backdrop-blur-sm bg-opacity-80">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-3.5 text-sm text-primary hover:text-primary/80 transition-colors font-semibold"
              >
                Clear all
              </button>
            </div>
          )}
            </>
          )}
          </div>
        </Tabs>

      </div>
      {/* Clear all confirmation dialog */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="w-[300px] bg-card rounded-[24px] p-4 flex flex-col gap-2 shadow-xl border border-border"
            onClick={e => e.stopPropagation()}
          >
            {/* Text block */}
            <div className="flex flex-col items-center justify-center p-2 gap-2 rounded-[24px] bg-card">
              <p className="font-poppins font-normal text-sm text-center text-foreground m-0">
                Clear all notifications?
              </p>
              <p className="font-poppins font-normal text-[12px] leading-4 text-center text-muted-foreground m-0 max-w-[240px]">
                This will remove all your notifications. You can&apos;t undo this action.
              </p>
            </div>

            {/* Buttons row */}
            <div className="flex flex-row gap-4 w-full px-2 mt-2">
              {/* Cancel */}
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 h-10 bg-transparent border border-primary rounded-full font-poppins font-normal text-sm text-primary hover:bg-primary/5 transition-colors"
              >
                Cancel
              </button>
              {/* Clear all */}
              <button
                onClick={async () => {
                  setShowClearConfirm(false)
                  await handleClearAll()
                }}
                className="flex-1 h-10 bg-destructive border border-transparent rounded-full font-poppins font-normal text-sm text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
