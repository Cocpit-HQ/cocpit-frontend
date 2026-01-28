"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, MessageCircle, Play, Share2, ThumbsUp, X, Plus, Search, Layers } from "lucide-react"

import SuggestionsPanel from "@/components/SuggestionsPanel"
import { AppShell } from "@/components/layout/AppShell"
import type { Page } from "@/types/common"
import type { StoryDetail, StoryGroup } from "@/types/showcase"
import { CreateStoryForm } from "@/components/showcase/CreateStoryForm"
import { AuthorBadge } from "@/components/showcase/AuthorBadge"
import { StoryModal } from "@/components/showcase/StoryModal"
import { MobileStoryViewer } from "@/components/showcase/MobileStoryViewer"
import { showcaseService } from "@/services/showcase.service"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
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
  const [groups, setGroups] = useState<StoryGroup[]>([])
  const [selectedStory, setSelectedStory] = useState<StoryDetail | null>(null)
  const [mobileSelectedGroupId, setMobileSelectedGroupId] = useState<number | null>(null)
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const data = await showcaseService.getGroupedStories()
        setGroups(data)
      } catch (error) {
        console.error("Failed to fetch stories", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStories()
  }, [])

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) {
      return groups
    }
    return groups.filter((group) => {
      return group.author.name.toLowerCase().includes(q)
    })
  }, [groups, searchQuery])

  // Helper to find the group of the currently selected story
  const selectedStoryGroup = useMemo(() => {
    if (!selectedStory) return null;
    return groups.find(g => g.stories.some(s => s.id === selectedStory.id)) || null;
  }, [selectedStory, groups]);

  const formatCompactNumber = (number: number) => {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    }
    if (number >= 1000) {
      return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return number.toString();
  };

  const handleCreateStory = (newStory: StoryDetail) => {
    setGroups(prevGroups => {
      const myGroupIndex = prevGroups.findIndex(g => g.is_current_user);
      if (myGroupIndex !== -1) {
        const newGroups = [...prevGroups];
        // Check if story already exists to prevent duplicate keys
        const exists = newGroups[myGroupIndex].stories.some(s => s.id === newStory.id);
        if (!exists) {
          newGroups[myGroupIndex].stories.push(newStory);
        }
        return newGroups;
      } else {
        const newGroup: StoryGroup = {
          author: newStory.author,
          is_current_user: true,
          latest_story_at: newStory.created_at || new Date().toISOString(),
          stories: [newStory]
        };
        return [newGroup, ...prevGroups];
      }
    });
    setShowCreateStory(false);
    setSelectedStory(newStory);
  }

  const handleStoryUpdate = (updatedStory: StoryDetail) => {
    setGroups(prevGroups => prevGroups.map(group => {
      const storyIndex = group.stories.findIndex(s => s.id === updatedStory.id)
      if (storyIndex !== -1) {
        const newStories = [...group.stories]
        newStories[storyIndex] = updatedStory
        return { ...group, stories: newStories }
      }
      return group
    }))
    if (selectedStory?.id === updatedStory.id) {
      setSelectedStory(updatedStory)
    }
  }

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
                  filteredGroups.map((group) => {
                    const sortedStories = [...group.stories].sort((a, b) => new Date(a.created_at || new Date()).getTime() - new Date(b.created_at || new Date()).getTime());
                    const latestStory = sortedStories[sortedStories.length - 1];
                    const storiesCount = group.stories.length;

                    // Check if there are any unviewed stories in the group (excluding own)
                    const hasUnviewed = group.stories.some(s => !s.has_viewed) && !group.is_current_user;

                    return (
                      <div
                        key={group.author.id || group.author.name}
                        className={`rounded-xl overflow-hidden border transition-all group cursor-pointer bg-card ${group.is_current_user
                          ? 'border-blue-500'
                          : hasUnviewed
                            ? 'border-primary ring-1 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                          }`}
                        onClick={() => {
                          const isMobile = window.matchMedia("(max-width: 768px)").matches
                          if (isMobile) {
                            setMobileSelectedGroupId(group.author.id || 0)
                          } else {
                            // Find the first unviewed story, or the first one if all viewed
                            const firstUnviewed = sortedStories.find(s => !s.has_viewed) || sortedStories[0];
                            setSelectedStory({ ...firstUnviewed, author: group.author })
                          }
                        }}
                      >
                        <div className="relative h-32 overflow-hidden">
                          {latestStory.image || latestStory.thumbnail_url ? (
                            <img
                              src={latestStory.thumbnail_url || latestStory.image}
                              alt={latestStory.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className={`w-full h-full ${latestStory.story_metadata?.backgroundStyle || 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'}`} />
                          )}

                          {/* Top Right Story Count Badge */}
                          {storiesCount > 1 && (
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1 z-10 border border-white/10">
                              <Layers className="w-3 h-3" />
                              {storiesCount}
                            </div>
                          )}

                          {latestStory.isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <Play className="w-8 h-8 text-white ml-1" />
                              </div>
                            </div>
                          )}
                          <AuthorBadge story={{ ...latestStory, author: group.author }} />
                        </div>

                        <div className="p-3">
                          <h3
                            className="mb-1 group-hover:text-primary transition-colors text-foreground"
                          >
                            {group.is_current_user ? "Your Story" : group.author.name}
                          </h3>
                          <div className="flex flex-wrap items-center justify-between text-xs gap-y-1 text-muted-foreground">
                            <span>{latestStory.timeAgo}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{formatCompactNumber(latestStory.views)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="w-4 h-4" />
                                <span>{formatCompactNumber(latestStory.likes)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                {!loading && searchQuery && filteredGroups.length === 0 && (
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
      {selectedStory && selectedStoryGroup && (
        <StoryModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          onStoryUpdate={handleStoryUpdate}
          onNext={() => {
            const currentIndex = selectedStoryGroup.stories.findIndex(s => s.id === selectedStory.id);
            if (currentIndex < selectedStoryGroup.stories.length - 1) {
              setSelectedStory({ ...selectedStoryGroup.stories[currentIndex + 1], author: selectedStoryGroup.author });
            } else {
              setSelectedStory(null); // Close if end of this user's stories
            }
          }}
          onPrev={() => {
            const currentIndex = selectedStoryGroup.stories.findIndex(s => s.id === selectedStory.id);
            if (currentIndex > 0) {
              setSelectedStory({ ...selectedStoryGroup.stories[currentIndex - 1], author: selectedStoryGroup.author });
            }
          }}
          hasNext={
            selectedStoryGroup.stories.findIndex(s => s.id === selectedStory.id) < selectedStoryGroup.stories.length - 1
          }
          hasPrev={
            selectedStoryGroup.stories.findIndex(s => s.id === selectedStory.id) > 0
          }
        />
      )}

      {mobileSelectedGroupId !== null && (
        <MobileStoryViewer
          groups={filteredGroups}
          initialGroupId={mobileSelectedGroupId}
          onClose={() => setMobileSelectedGroupId(null)}
          onStoryUpdate={handleStoryUpdate}
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