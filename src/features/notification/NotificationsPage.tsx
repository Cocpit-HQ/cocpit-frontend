
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Notification } from '@/types/social'
import { getNotifications, deleteNotifications, markAllNotificationsRead, markNotificationAsRead } from '@/features/notification/api'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotificationCard } from '@/features/notification/components/NotificationCard'
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { ArrowLeft, ChevronLeft, Bell, CircleAlert, Info } from 'lucide-react'
import { useSocket } from '@/context/SocketContext'

type EmptyStateProps = {
  title: string
  description: string
}

const EmptyState = ({ title, description }: EmptyStateProps) => (
  <div className="min-h-[420px] md:min-h-[500px] flex items-center justify-center px-4">
    <div className="flex flex-col items-center gap-[16px]">
      <Bell className="w-[80px] h-[80px] text-[#000000] dark:text-white" strokeWidth={1.5} />
      <div className="flex flex-col items-center gap-[8px]">
        <h3 className="w-[166px] h-[24px] text-center font-poppins font-medium text-[16px] leading-[24px] text-[#000000] dark:text-white">{title}</h3>
        <p className="w-[318px] h-[16px] text-center font-poppins font-normal text-[12px] leading-[16px] text-[#6B7280] dark:text-muted-foreground">{description}</p>
      </div>
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
  const { socket } = useSocket()

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setHasError(false)
        const companyId = (isCompany && activeProfile) ? activeProfile.id : undefined;

        const notifsData = await getNotifications(companyId)
        const filteredData = notifsData.filter((n: any) => n.type !== 'message' && n.type !== 'new_message');
        
        const sortedData = [...filteredData].sort((a, b) => {
          if (a.is_read === b.is_read) return 0;
          return a.is_read ? 1 : -1;
        });
        setNotifications(sortedData)
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

  // Real-time updates via Socket
  useEffect(() => {
    if (!user || !socket) return;

    const handleNewNotification = (newNotif: any) => {
      // Do not add standard chat messages to the Notification Center
      if (newNotif.type === 'message' || newNotif.type === 'new_message') return;
      
      setNotifications(prev => {
        // Prevent duplicates
        if (prev.some(n => n.notification_id === newNotif.notification_id)) return prev;
        
        // Normalize the notification
        const normalized = {
          ...newNotif,
          actor_name: newNotif.actor_name || newNotif.senderName,
          actor_avatar: newNotif.actor_avatar || newNotif.senderAvatar,
          is_read: newNotif.is_read ?? false,
          created_at: newNotif.created_at || new Date().toISOString(),
        };

        // If it's a company notification and we're not that company, ignore
        if (normalized.recipient_company_id) {
          if (!isCompany || activeProfile?.id !== normalized.recipient_company_id) return prev;
        } else {
          if (isCompany) return prev;
        }

        const updated = [normalized, ...prev];
        // Keep the sorting logic consistent with initial fetch
        return updated.sort((a, b) => {
          if (a.is_read === b.is_read) return 0;
          return a.is_read ? 1 : -1;
        });
      });
    };

    socket.on("notification", handleNewNotification);
    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [user, isCompany, activeProfile?.id]);

  const handleRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.notification_id === id ? { ...n, is_read: true } : n
    ));
    window.dispatchEvent(new CustomEvent('notifications-updated'));
  }

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.notification_id !== id));
    window.dispatchEvent(new CustomEvent('notifications-updated'));
  }

  const handleMarkAllAsRead = async () => {
    try {
      const companyId = (isCompany && activeProfile) ? activeProfile.id : undefined;
      
      if (activeTab === 'jobs') {
        const unreadJobs = jobs.filter(n => !n.is_read);
        if (unreadJobs.length === 0) return;
        
        await Promise.all(
          unreadJobs.map(n => markNotificationAsRead(n.notification_id, companyId))
        );
        
        setNotifications(prev => prev.map(n => 
          unreadJobs.some(uj => uj.notification_id === n.notification_id) 
            ? { ...n, is_read: true } 
            : n
        ));
      } else {
        await markAllNotificationsRead(companyId);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
      
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  const handleClearAll = async () => {
    try {
      let idsToDelete: string[] = []
      if (activeTab === "all") {
        idsToDelete = notifications.map(n => n.notification_id)
      } else if (activeTab === "jobs") {
        idsToDelete = jobs.map(n => n.notification_id)
      }

      if (idsToDelete.length > 0) {
        await deleteNotifications(idsToDelete)
        setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.notification_id)))
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      }
    } catch (error) {
      console.error("Failed to clear notifications:", error)
    }
  }

  // Filter helpers
  const jobs = notifications.filter(n =>
    n.type === 'organization_job' || n.type === 'job_offer' || n.type.includes('job') || n.type.includes('application') || n.type.includes('offer')
  )

  // Show "Mark all as read" only when there are unread notifications in the current tab
  const hasUnread =
    (activeTab === 'all' && notifications.some(n => !n.is_read)) ||
    (activeTab === 'jobs' && jobs.some(n => !n.is_read))

  const tabClass = isCompany
    ? "h-[40px] px-4 rounded-[24px] border transition-all font-poppins text-[12px] leading-[16px] data-[state=active]:font-medium data-[state=active]:!bg-[#E5F0FF] data-[state=active]:!text-[#2563EB] data-[state=active]:border-[#E5F0FF] dark:data-[state=active]:!bg-[#4D9CFF]/20 dark:data-[state=active]:!text-[#4D9CFF] dark:data-[state=active]:border-transparent data-[state=inactive]:font-normal data-[state=inactive]:bg-[#FFFFFF] dark:data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#4D9CFF] data-[state=inactive]:border-[#4D9CFF] shadow-none hover:bg-muted/10 dark:hover:bg-white/5"
    : "h-[40px] px-4 rounded-[24px] border transition-all font-poppins text-[12px] leading-[16px] data-[state=active]:font-medium data-[state=active]:!bg-[#EEF2FF] data-[state=active]:!text-[#6366F1] data-[state=active]:border-[#EEF2FF] dark:data-[state=active]:!bg-[#6366F1]/20 dark:data-[state=active]:!text-[#818CF8] dark:data-[state=active]:border-transparent data-[state=inactive]:font-normal data-[state=inactive]:bg-[#FFFFFF] dark:data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#818CF8] data-[state=inactive]:border-[#818CF8] shadow-none hover:bg-muted/10 dark:hover:bg-white/5";

  const markReadClass = isCompany
    ? "flex flex-row justify-center items-center w-[144px] h-[36px] bg-[#FFFFFF] dark:bg-transparent rounded-[24px] font-poppins font-normal text-[14px] leading-[20px] text-center text-[#4D9CFF]"
    : "flex flex-row justify-center items-center w-[144px] h-[36px] bg-[#FFFFFF] dark:bg-transparent rounded-[24px] font-poppins font-normal text-[14px] leading-[20px] text-center text-[#818CF8]";

  return (
    <div className="flex flex-col h-[calc(100dvh-128px)] md:h-[calc(100dvh-56px)] bg-white dark:bg-background text-foreground overflow-hidden font-poppins">
      <div className="max-w-[998px] mx-auto w-full flex flex-col h-full">

        {/* Tabs with Fixed Header */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full w-full">
          <div className="flex-none bg-white dark:bg-background pt-6 pb-4 px-4 md:px-0 border-b border-transparent z-10">
            {/* Header */}
            <div className="mb-6 flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center justify-center w-12 h-12 rounded-full border border-[#DADADA] dark:border-border/80 backdrop-blur-[12px] bg-transparent flex-none transition-colors hover:bg-muted/10"
                >
                  <ChevronLeft className="h-6 w-6 text-[#6B7280] dark:text-muted-foreground" strokeWidth={1.5} />
                </button>
                <div className="flex flex-col items-start w-[232px] h-[42px]">
                    <h1 className="w-[114px] h-[26px] text-center font-poppins font-medium text-[18px] leading-[26px] text-[#000000] dark:text-white">
                      Notifications
                    </h1>
                    <p className="w-[232px] h-[16px] text-center font-poppins font-normal text-[12px] leading-[16px] text-[#6B7280] dark:text-muted-foreground">
                      Stay update with your account activity
                    </p>
                </div>
              </div>
              <div className="flex gap-2">
                {hasUnread && (
                  <button
                    className={markReadClass}
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
              className={tabClass}
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="jobs"
              className={tabClass}
            >
              Jobs
            </TabsTrigger>
          </TabsList>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-0 pt-4 scrollbar-hide">
          {hasError ? (
            <div className="flex flex-col items-center mx-auto w-[222px] gap-[16px] mt-[282px]">
              <div className="w-[80px] h-[80px] flex-none">
                <Info className="w-full h-full text-[#000000] dark:text-white" strokeWidth={1} />
              </div>
              <div className="flex flex-col items-center gap-[8px] w-[222px]">
                <h3 className="w-[222px] h-[24px] font-poppins font-medium text-[16px] leading-[24px] text-center text-[#000000] dark:text-white flex items-center justify-center m-0">
                  Unable to load notifications
                </h3>
                <p className="w-[177px] h-[16px] font-poppins font-normal text-[12px] leading-[16px] text-center text-[#6B7280] dark:text-muted-foreground flex items-center justify-center m-0">
                  Please try again in a moment
                </p>
              </div>
            </div>
          ) : (
            <>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="bg-card rounded-xl overflow-hidden flex flex-col">
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="bg-card rounded-xl overflow-hidden flex flex-col">
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
          </TabsContent>

          <TabsContent value="jobs" className="flex-1 overflow-y-auto px-4 md:px-6 pb-20 pt-2 data-[state=active]:flex data-[state=active]:flex-col">
            {jobs.length > 0 ? (
              <div className="bg-card rounded-xl overflow-hidden flex flex-col">
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
          </TabsContent>

        </>
          )}
          </div>

          {((activeTab === 'all' && notifications.length > 0) ||
            (activeTab === 'jobs' && jobs.length > 0)) && (
            <div className="flex-shrink-0 flex justify-center w-full pt-4 pb-[40px] bg-white dark:bg-background z-10 border-t border-transparent">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="font-poppins font-normal text-[14px] leading-[20px] text-[#6366F1]"
              >
                Clear all
              </button>
            </div>
          )}
        </Tabs>

      </div>
      {/* Clear all confirmation dialog */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="w-[300px] bg-[#FFFFFF] dark:bg-background rounded-[24px] pt-[24px] px-[16px] pb-[16px] flex flex-col items-center gap-[8px] shadow-xl border border-border"
            onClick={e => e.stopPropagation()}
          >
            {/* Text block */}
            <div className="flex flex-col justify-center items-center p-0 gap-[10px] w-[268px] bg-[#FFFFFF] dark:bg-transparent rounded-[24px]">
              <p className="w-[156px] h-[20px] font-poppins font-normal text-[14px] leading-[20px] text-center text-[#000000] dark:text-white m-0 flex-none order-0 flex-grow-0">
                Clear all notifications?
              </p>
              <p className="w-[268px] h-[32px] font-poppins font-normal text-[12px] leading-[16px] text-center text-[#6B7280] dark:text-muted-foreground m-0 flex-none order-1 self-stretch flex-grow-0">
                This will remove all your notifications. You can&apos;t undo this action.
              </p>
            </div>

            {/* Buttons row */}
            <div className="flex flex-row items-start p-0 gap-[16px] w-[268px] h-[40px] flex-none order-1 self-stretch flex-grow-0">
              {/* Cancel */}
              <button
                onClick={() => setShowClearConfirm(false)}
                className="box-border flex flex-row justify-center items-center py-[8px] px-[16px] gap-[10px] w-[126px] h-[40px] bg-[#FFFFFF] dark:bg-transparent border border-[#818CF8] rounded-[24px] flex-none order-0 flex-grow hover:opacity-80 transition-opacity"
              >
                <span className="w-[50px] h-[20px] font-poppins font-normal text-[14px] leading-[20px] text-center text-[#818CF8] flex-none order-0 flex-grow-0">Cancel</span>
              </button>
              {/* Clear all */}
              <button
                onClick={async () => {
                  setShowClearConfirm(false)
                  await handleClearAll()
                }}
                className="box-border flex flex-row justify-center items-center py-[8px] px-[16px] gap-[10px] w-[126px] h-[40px] bg-[#FF6B6B] border border-[#FFFFFF] dark:border-transparent rounded-[24px] flex-none order-1 flex-grow hover:opacity-90 transition-opacity"
              >
                <span className="w-[58px] h-[20px] font-poppins font-normal text-[14px] leading-[20px] text-center text-[#FFFFFF] flex-none order-0 flex-grow-0">Clear all</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
