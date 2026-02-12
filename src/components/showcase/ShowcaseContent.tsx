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
import { StoryCard } from "@/components/showcase/StoryCard"
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
      <div className="h-48 bg-muted" />
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
  const [mobileSelectedGroupId, setMobileSelectedGroupId] = useState<string | number | null>(null)
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

  // Optimize: Memoize sorting and filtering to prevent expensive recalculations on every render
  const processedGroups = useMemo(() => {
    // 1. Filter first
    let result = groups;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = groups.filter((group) => group.author.name.toLowerCase().includes(q));
    }

    // 2. Sort stories within each group once
    return result.map(group => {
      if (!group.stories || group.stories.length === 0) return group;

      // Create a shallow copy of stories to sort safely
      const sortedStories = [...group.stories].sort(
        (a, b) => new Date(a.created_at || new Date()).getTime() - new Date(b.created_at || new Date()).getTime()
      );

      // Only return a new object if order changed or strict equality fails (optimization)
      // For simplicity here, we return a new group object with sorted stories to ensure downstream consistency
      return {
        ...group,
        stories: sortedStories
      };
    });
  }, [groups, searchQuery]);

  // Helper to find the group of the currently selected story
  const selectedStoryGroup = useMemo(() => {
    if (!selectedStory) return null;
    return processedGroups.find(g => g.stories.some(s => s.id === selectedStory.id)) || null;
  }, [selectedStory, processedGroups]);

  // formatCompactNumber moved to utils

  const handleCreateStory = (newStory: StoryDetail) => {
    setGroups(prevGroups => {
      const myGroupIndex = prevGroups.findIndex(g => g.is_current_user);
      if (myGroupIndex !== -1) {
        // Correctly handle immutability
        const newGroups = [...prevGroups];
        const existingGroup = newGroups[myGroupIndex];

        // Check duplication
        const exists = existingGroup.stories.some(s => s.id === newStory.id);
        if (!exists) {
          // immutably update the specific group and its stories array
          newGroups[myGroupIndex] = {
            ...existingGroup,
            stories: [...existingGroup.stories, newStory]
          };
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
      <header
        className="sticky top-0 z-20 border-b px-4 py-3 md:py-4 bg-background border-border"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="md:hidden absolute left-4 p-2 rounded-full transition-colors hover:bg-muted text-foreground"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="relative max-w-2xl w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search stories by author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:border-primary bg-card text-foreground placeholder-muted-foreground border-border"
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
                processedGroups.map((group) => {
                  if (!group.stories || group.stories.length === 0) return null;

                  return (
                    <StoryCard
                      key={group.author.id || group.author.name}
                      group={group}
                      onClick={() => {
                        const isMobile = window.matchMedia("(max-width: 768px)").matches
                        if (isMobile) {
                          setMobileSelectedGroupId(group.author.id || 0)
                        } else {
                          // Find the first unviewed story, or the first one if all viewed
                          const sortedStories = group.stories
                          const firstUnviewed = sortedStories.find(s => !s.has_viewed) || sortedStories[0];
                          setSelectedStory({ ...firstUnviewed, author: group.author })
                        }
                      }}
                    />
                  )
                })}
              {!loading && searchQuery && processedGroups.length === 0 && (
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
          groups={processedGroups}
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