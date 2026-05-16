'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Notification, ConnectionRequest } from '@/types/social'
import { getNotifications, deleteNotifications, markAllNotificationsRead } from '@/services/api/notifications'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { NotificationCard } from '@/components/notifications/NotificationCard'
import { ConnectionRequestList } from '@/components/notifications/ConnectionRequestList'
import { getPendingRequests, getConnectionRequestHistory } from '@/services/api/social'
import { format } from 'date-fns'
import Avatar from '@/components/shared/Avatar'
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
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([])
  const [history, setHistory] = useState<ConnectionRequest[]>([])
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

        // Connections are currently user-only features
        const [notifsData, pendingData, historyData] = await Promise.all([
          getNotifications(companyId),
          getPendingRequests(),
          getConnectionRequestHistory()
        ])
        setNotifications(notifsData)
        setPendingRequests(pendingData)
        setHistory(historyData)
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

  // When a request is accepted/rejected in the list, update local state
  // ideally ConnectionRequestCard calls onAction with the status, but current logic is slightly different.
  // We need to refactor this slightly or just fetch history again? 
  // Let's simply remove from pending. History update is tricky without the full object return from action.
  // For now, removing from pending is enough to sync badge.
  const handleRequestAction = (requestId: string) => {
    setPendingRequests(prev => prev.filter(req => req.id !== requestId))
    // Optionally fetch history again to show the new item
    getConnectionRequestHistory().then(setHistory).catch(console.error)
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
                    <h1 className="text-lg font-medium tracking-tight text-foreground text-left">Notifications</h1>
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

            <TabsList className="flex flex-row justify-start bg-transparent p-0 gap-3 border-none h-auto overflow-x-auto pb-2 -mb-2 scrollbar-hide">
            <TabsTrigger 
              value="all" 
              className="rounded-full px-5 py-2 border data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-500 data-[state=active]:border-indigo-50 data-[state=inactive]:bg-background data-[state=inactive]:text-indigo-400 data-[state=inactive]:border-indigo-400 data-[state=active]:shadow-none data-[state=inactive]:shadow-none"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              className="rounded-full px-5 py-2 border data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-500 data-[state=active]:border-indigo-50 data-[state=inactive]:bg-background data-[state=inactive]:text-indigo-400 data-[state=inactive]:border-indigo-400 data-[state=active]:shadow-none data-[state=inactive]:shadow-none relative"
            >
              Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="mentions" 
              className="rounded-full px-5 py-2 border data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-500 data-[state=active]:border-indigo-50 data-[state=inactive]:bg-background data-[state=inactive]:text-indigo-400 data-[state=inactive]:border-indigo-400 data-[state=active]:shadow-none data-[state=inactive]:shadow-none"
            >
              Mentions
            </TabsTrigger>
            <TabsTrigger 
              value="jobs" 
              className="rounded-full px-5 py-2 border data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-500 data-[state=active]:border-indigo-50 data-[state=inactive]:bg-background data-[state=inactive]:text-indigo-400 data-[state=inactive]:border-indigo-400 data-[state=active]:shadow-none data-[state=inactive]:shadow-none"
            >
              Jobs
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="rounded-full px-5 py-2 border data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-500 data-[state=active]:border-indigo-50 data-[state=inactive]:bg-background data-[state=inactive]:text-indigo-400 data-[state=inactive]:border-indigo-400 data-[state=active]:shadow-none data-[state=inactive]:shadow-none"
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
            <div className="bg-card rounded-xl border border-transparent shadow-none overflow-hidden">
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

          <TabsContent value="requests" className="space-y-8">
            {/* Pending Requests */}
            <div className="bg-card rounded-xl border border-border/40 shadow-none p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4">Connection Requests</h2>
              <ConnectionRequestList
                requests={pendingRequests}
                loading={loading}
                onAction={handleRequestAction}
              />
            </div>

            {/* Request History */}
            <div className="bg-card rounded-xl border border-border/40 shadow-none p-4 md:p-6 opacity-90">
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">History</h2>
              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map(req => {
                    const userDisplay = req.otherUser || req.sender;
                    if (!userDisplay) return null;

                    const isIncoming = req.direction === 'incoming';
                    const isAccepted = req.status === 'accepted' || req.status === 'connected';

                    return (
                      <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar
                            url={userDisplay.avatar || undefined}
                            name={userDisplay.name}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-sm text-foreground">{userDisplay.name}</p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {req.direction && (
                                <span className={isIncoming ? "text-blue-500 font-medium" : "text-amber-500 font-medium"} title={isIncoming ? "Received Request" : "Sent Request"}>
                                  {isIncoming ? "↙ Received" : "↗ Sent"}
                                </span>
                              )}
                              <span className="text-muted-foreground/50">•</span>
                              <span>
                                {req.updated_at ? format(new Date(req.updated_at), 'PPP p') : format(new Date(req.created_at), 'PPP p')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline"
                            className={`gap-1.5 px-2.5 py-0.5 border-0 ${isAccepted
                              ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                              : 'bg-red-500/15 text-red-700 dark:text-red-400'}`}>
                            {isAccepted ? (
                              <>
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Connected
                              </>
                            ) : (
                              <>
                                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                Rejected
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                  No history available
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mentions">
            <div className="bg-card rounded-xl border border-transparent shadow-none overflow-hidden">
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
            <div className="bg-card rounded-xl border border-transparent shadow-none overflow-hidden">
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
            <div className="bg-card rounded-xl border border-transparent shadow-none overflow-hidden">
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
            <div className="sticky bottom-0 bg-white dark:bg-background">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-3.5 text-sm text-indigo-400 hover:text-indigo-500 transition-colors font-medium"
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
            style={{
              width: 300,
              background: '#FFFFFF',
              borderRadius: 24,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Text block */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8px 0',
              gap: 10,
              borderRadius: 24,
              background: '#FFFFFF',
            }}>
              <p style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 400,
                fontSize: 14,
                lineHeight: '20px',
                textAlign: 'center',
                color: '#000000',
                margin: 0,
              }}>
                Clear all notifications?
              </p>
              <p style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 400,
                fontSize: 12,
                lineHeight: '16px',
                textAlign: 'center',
                color: '#6B7280',
                margin: 0,
                width: 268,
              }}>
                This will remove all your notifications. You can&apos;t undo this action.
              </p>
            </div>

            {/* Buttons row */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              width: 268,
              alignSelf: 'center',
            }}>
              {/* Cancel */}
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1,
                  height: 40,
                  background: '#FFFFFF',
                  border: '1px solid #818CF8',
                  borderRadius: 24,
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 400,
                  fontSize: 14,
                  color: '#818CF8',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              {/* Clear all */}
              <button
                onClick={async () => {
                  setShowClearConfirm(false)
                  await handleClearAll()
                }}
                style={{
                  flex: 1,
                  height: 40,
                  background: '#FF6B6B',
                  border: '1px solid #FFFFFF',
                  borderRadius: 24,
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 400,
                  fontSize: 14,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
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
