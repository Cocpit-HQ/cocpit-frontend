"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, MessageCircle, Play, Share2, ThumbsUp, X, Plus, Search } from "lucide-react"

import SuggestionsPanel from "@/components/SuggestionsPanel"
import { AppShell } from "@/components/layout/AppShell"
import type { Page } from "@/types/common"
import type { StoryDetail } from "@/types/showcase"
import { CreateStoryForm } from "@/components/showcase/CreateStoryForm"
import { storiesSeed } from "@/constants/stories"
import { AuthorBadge } from "@/components/showcase/AuthorBadge"
import { StoryModal } from "@/components/showcase/StoryModal"
import { MobileStoryViewer } from "@/components/showcase/MobileStoryViewer"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
  achievements: "/achievements",
}

function ShowcaseSkeletonCard() {
  return (
    <div
      className="rounded-xl overflow-hidden border animate-pulse bg-card border-border"
    >
      <div className="h-32 bg-muted" />
      <div className="p-3 space-y-3">
        <div
          className="h-5 rounded w-3/4 bg-muted"
        />
        <div
          className="h-4 rounded w-1/2 bg-muted"
        />
        <div
          className="h-4 rounded w-full bg-muted"
        />
      </div>
    </div>
  )
}

export default function ShowcaseContent() {
  const router = useRouter()
  // Removed useTheme

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const [loading, setLoading] = useState(true)
  const [stories, setStories] = useState<StoryDetail[]>([])
  const [selectedStory, setSelectedStory] = useState<StoryDetail | null>(null)
  const [mobileSelectedStoryId, setMobileSelectedStoryId] = useState<number | null>(null)
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setStories(storiesSeed)
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const filteredStories = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) {
      return stories
    }
    return stories.filter((story) =>
      story.author.name.toLowerCase().includes(q)
    )
  }, [stories, searchQuery])

  const formatCompactNumber = (number: number) => {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    }
    if (number >= 1000) {
      return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return number.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="network" navigateTo={navigateTo}>
        <header
          className="sticky top-0 z-20 border-b px-4 py-3 md:py-4 bg-background border-border"
        >
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="md:hidden p-2 rounded-full transition-colors -ml-2 hover:bg-muted text-foreground"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-3 max-w-2xl w-full">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search stories by author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-primary bg-card text-foreground placeholder-muted-foreground border-border"
              />
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            
            <button
              onClick={() => setShowCreateStory(true)}
              className="bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 text-sm md:text-base"
            >
              <Plus className="w-5 h-5" />
              Create Story
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 pb-4">
            {/* Stories Grid */}
            <section className="lg:col-span-8">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6">
                {loading &&
                  Array.from({ length: 4 }).map((_, idx) => (
                    <ShowcaseSkeletonCard key={idx} />
                  ))}

                {!loading &&
                  filteredStories.map((story) => (
                    <div
                      key={story.id}
                      className="rounded-xl overflow-hidden border transition-all group cursor-pointer bg-card border-border hover:border-primary/50"
                      onClick={() => {
                        const isMobile = window.matchMedia("(max-width: 768px)").matches
                        if (isMobile) {
                          setMobileSelectedStoryId(story.id)
                        } else {
                          setSelectedStory(story)
                        }
                      }}
                    >
                      <div className="relative h-32 overflow-hidden">
                        <img
                          src={story.image}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {story.isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-white ml-1" />
                            </div>
                          </div>
                        )}
                        <AuthorBadge story={story} />
                      </div>

                      <div className="p-3">
                        <h3
                          className="mb-1 group-hover:text-primary transition-colors text-foreground"
                        >
                          {story.title}
                        </h3>
                        <div className="flex flex-wrap items-center justify-between text-xs gap-y-1 text-muted-foreground">
                          <span>{story.timeAgo}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{formatCompactNumber(story.views)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{formatCompactNumber(story.likes)}</span>
                            </div>
                            {story.comments ? (
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{formatCompactNumber(story.comments)}</span>
                              </div>
                            ) : null}
                            <button className="transition-colors hover:text-foreground">
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {!loading && searchQuery && filteredStories.length === 0 && (
                    <p
                      className="text-center py-12 text-muted-foreground col-span-2"
                    >
                      No stories found matching "{searchQuery}"
                    </p>
                  )}
              </div>
            </section>

            {/* Suggestions */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 md:top-28">
                <SuggestionsPanel />
              </div>
            </aside>
          </div>
        </div>
      </AppShell>
      {selectedStory && (
        <StoryModal story={selectedStory} onClose={() => setSelectedStory(null)} />
      )}

      {mobileSelectedStoryId !== null && (
        <MobileStoryViewer
          stories={filteredStories}
          initialStoryId={mobileSelectedStoryId}
          onClose={() => setMobileSelectedStoryId(null)}
        />
      )}

       {showCreateStory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div
              className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between"
            >
              <h2 className="text-foreground">Create Story</h2>
              <button
                onClick={() => setShowCreateStory(false)}
                className="p-2 rounded-lg transition-colors hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <CreateStoryForm onCancel={() => setShowCreateStory(false)} onCreated={() => setShowCreateStory(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
