'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Notification, ConnectionRequest } from '@/types/social'
import { getNotifications } from '@/services/api/notifications'
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
import { ArrowLeft } from 'lucide-react'

export default function NotificationsPage() {
  const router = useRouter()
  const { activeProfile, isCompany } = useActiveProfile()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([])
  const [history, setHistory] = useState<ConnectionRequest[]>([])
  const { data: session } = useSession()
  const user = session?.user

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto py-6 px-4 md:px-6">

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground">Settings</Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full mb-6 bg-muted/50 p-1 grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="mentions">Mentions</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : notifications.length > 0 ? (
                <div>
                  {notifications.map(notification => (
                    <NotificationCard
                      key={notification.notification_id}
                      notification={notification}
                      onRead={handleRead}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <p>No notifications yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-8">
            {/* Pending Requests */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4">Connection Requests</h2>
              <ConnectionRequestList
                requests={pendingRequests}
                loading={loading}
                onAction={handleRequestAction}
              />
            </div>

            {/* Request History */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6 opacity-90">
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
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              {mentions.length > 0 ? (
                <div>
                  {mentions.map(notification => (
                    <NotificationCard
                      key={notification.notification_id}
                      notification={notification}
                      onRead={handleRead}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <p>No mentions yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  )
}
