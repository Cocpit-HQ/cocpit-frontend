"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import FeedPost from "@/components/home/FeedPost"
import { getPublicProfilePosts } from "@/services/api/public-profile"
import { mapPublicPostToPost } from "@/lib/mappers/public-profile.mapper"
import { Post } from "@/types/entities"
import type { Page } from "@/types/common"

interface PublicPostsPageProps {
  userId: string;
}

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
}

export default function PublicPostsPage({ userId }: PublicPostsPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'All' | 'Professional' | 'Personal'>('All')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      setPosts([]) // Clear previous posts while loading to avoid confusion
      try {
        const data = await getPublicProfilePosts(userId, activeTab)
        const mappedPosts = data.posts.map(mapPublicPostToPost)
        setPosts(mappedPosts)
      } catch (err) {
        console.error("Failed to fetch public posts:", err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchPosts()
    }
  }, [userId, activeTab])

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="profile" navigateTo={navigateTo}>
        <div className="max-w-2xl mx-auto py-6 md:py-8 pb-20 md:pb-12 px-4">

          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">All Posts</h1>
          </div>

          <div className="flex border-b border-border mb-6 overflow-x-auto hide-scrollbar">
             {['All', 'Professional', 'Personal'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                  )}
                </button>
              ))}
          </div>

          <div className="space-y-4">
            {loading ? (
               <div className="text-center py-12">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                 <p className="text-muted-foreground">Loading posts...</p>
               </div>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <FeedPost key={post.id} {...post} initialComments={post.commentData} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                <p>No posts found in this category.</p>
              </div>
            )}
          </div>

        </div>
      </AppShell>
    </div>
  )
}
