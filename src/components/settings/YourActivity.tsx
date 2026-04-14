"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  History,
  Heart,
  MessageSquare,
  Repeat2,
  PieChart,
  Briefcase,
  Search,
  Calendar,
  Trash2,
  ChevronRight,
  Loader2,
  Clock,
  Eye
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getActivity, clearActivity, ActivityLog } from "@/services/api/activity"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import Image from "next/image"
import Link from "next/link"

export function YourActivity() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const filterParam = searchParams.get('filter')

  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [postFilter, setPostFilter] = useState(filterParam || "all") // all, likes, comments, reposts

  const [initialSyncDone, setInitialSyncDone] = useState(false)

  // Sync state back to URL
  useEffect(() => {
    if (!initialSyncDone) return

    const currentTab = searchParams.get('tab')
    const currentFilter = searchParams.get('filter')
    
    if (currentTab === activeTab && (activeTab !== 'posts' || currentFilter === postFilter)) return

    const params = new URLSearchParams(window.location.search)
    params.set('tab', activeTab)
    if (activeTab === 'posts') {
      params.set('filter', postFilter)
    } else {
      params.delete('filter')
    }
    router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false })
  }, [activeTab, postFilter, router, initialSyncDone, searchParams])

  // Sync from URL on mount
  useEffect(() => {
    if (tabParam) setActiveTab(tabParam)
    if (filterParam) setPostFilter(filterParam)
    setInitialSyncDone(true)
  }, [tabParam, filterParam])




  const observer = useRef<IntersectionObserver | null>(null)
  const lastActivityRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    })
    if (node) observer.current.observe(node)
  }, [isLoading, hasMore])

  const fetchActivities = async (tab: string, isInitial = true) => {
    try {
      if (isInitial) setIsLoading(true)

      const typeMap: Record<string, string> = {
        posts: "posts",
        jobs: "jobs",
        events: "events",
        likes: "likes",
        comments: "comments",
        reposts: "reposts"
      }

      // If activeTab is posts, use the sub-tab filter
      const effectiveType = tab === 'posts' && postFilter !== 'all' ? postFilter : typeMap[tab]


      const response = await getActivity(
        effectiveType || undefined, 
        20, 
        isInitial ? undefined : cursor || undefined
      )


      const items = response.activities || []
      const more = response.hasMore || false
      const nextCursor = response.nextCursor || null

      if (isInitial) {
        setActivities(items)
      } else {
        setActivities(prev => [...(prev || []), ...items])
      }

      setCursor(nextCursor)
      setHasMore(more)
    } catch (err) {
      console.error("Fetch activity error:", err)
      toast.error("Failed to load activity")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities(activeTab, true)
  }, [activeTab, postFilter])


  const loadMore = () => {
    fetchActivities(activeTab, false)
  }

  const handleClearHistory = async () => {
    try {
      setIsClearing(true)
      const typeMap: Record<string, string> = {
        posts: "posts",
        jobs: "jobs",
        events: "events"
      }
      await clearActivity(typeMap[activeTab])
      setActivities([])
      setHasMore(false)
      toast.success("History cleared")
    } catch (err) {
      toast.error("Failed to clear history")
    } finally {
      setIsClearing(false)
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'like_post': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />
      case 'comment_post': return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'repost_post': return <Repeat2 className="w-4 h-4 text-green-500" />
      case 'vote_poll': return <PieChart className="w-4 h-4 text-purple-500" />
      case 'view_job': return <Eye className="w-4 h-4 text-orange-500" />
      case 'search_job': return <Search className="w-4 h-4 text-gray-500" />
      case 'attend_event': return <Calendar className="w-4 h-4 text-indigo-500" />
      default: return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getActionLink = (activity: ActivityLog) => {
    switch (activity.entity_type) {
      case 'post': return `/post/${activity.entity_id}`
      case 'job': 
        if (activity.action_type === 'search_job') return `/jobs`
        return `/jobs/${activity.entity_id}`
      case 'event': return `/events/${activity.entity_id}`
      default: return '#'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Your Activity
          </h2>
          <p className="text-sm text-muted-foreground">Manage your history and interactions on Cocpit</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear History
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear Activity History?</DialogTitle>
              <DialogDescription>
                This will permanently delete your {activeTab === 'all' ? 'entire' : activeTab} activity history. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { }}>Cancel</Button>
              <Button variant="destructive" onClick={handleClearHistory} disabled={isClearing}>
                {isClearing ? "Clearing..." : "Yes, Clear History"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
          <TabsTrigger value="posts" className="rounded-lg">Posts</TabsTrigger>
          <TabsTrigger value="jobs" className="rounded-lg">Jobs</TabsTrigger>
          <TabsTrigger value="events" className="rounded-lg">Events</TabsTrigger>
        </TabsList>

        {activeTab === 'posts' && (
          <div className="mt-4 px-1">

            <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-lg w-fit">
              {[
                { id: 'all', label: 'All Posts' },
                { id: 'likes', label: 'Likes' },
                { id: 'comments', label: 'Comments' },
                { id: 'reposts', label: 'Reposts' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setPostFilter(sub.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    postFilter === sub.id 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}


        <div className="mt-6 space-y-3">
          {isLoading && activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Loading your activity...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-2xl bg-muted/20">
              <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No history yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                When you interact with posts, jobs, or events, they'll show up here.
              </p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={`${activity.id}-${index}`}

                ref={index === activities.length - 1 ? lastActivityRef : null}
                className="group p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all hover:shadow-md"
              >
                <div className="flex gap-4 items-start">
                  <div className="mt-1 p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                    {getActionIcon(activity.action_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {activity.action_type === 'like_post' && "Liked a post"}
                          {activity.action_type === 'comment_post' && "Commented on a post"}
                          {activity.action_type === 'repost_post' && "Reposted a post"}
                          {activity.action_type === 'vote_poll' && "Voted in a poll"}
                          {activity.action_type === 'view_job' && "Viewed a job"}
                          {activity.action_type === 'search_job' && "Searched for jobs"}
                          {activity.action_type === 'attend_event' && "Registered for an event"}
                        </p>

                        {/* Summary Content */}
                        <div className="mt-1">
                          {activity.entity_type === 'post' && (
                            <div className="flex items-center gap-2">
                              {activity.post_author_avatar && (
                                <img src={activity.post_author_avatar} className="w-4 h-4 rounded-full object-cover" alt="" />
                              )}
                              <span className="text-xs text-muted-foreground truncate">
                                {activity.post_author_name ? `Post by ${activity.post_author_name}` : "View post"}
                              </span>
                            </div>
                          )}
                          {activity.entity_type === 'job' && (
                            <span className="text-xs text-muted-foreground">
                              {activity.job_title ? `${activity.job_title} @ ${activity.job_company_name}` : activity.metadata?.query || "Job search"}
                            </span>
                          )}
                          {activity.entity_type === 'event' && (
                            <span className="text-xs text-muted-foreground">
                              {activity.event_title || "Event details"}
                            </span>
                          )}
                        </div>

                        {activity.metadata?.comment && (
                          <div className="mt-2 text-xs italic text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-primary/30">
                            "{activity.metadata.comment}"
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2 hover:bg-primary/5" asChild>
                        <Link href={getActionLink(activity)}>
                          View Details <ChevronRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {hasMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      </Tabs>
    </div>
  )
}
