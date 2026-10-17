"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, MessageCircle, Play, Share2, ThumbsUp, X, Plus, Search, Layers } from "lucide-react"

import SuggestionsPanel from "@/components/home/SuggestionsPanel"
import { AppShell } from "@/components/layout/AppShell"
import type { Page } from "@/types/common"
import type { StoryDetail, StoryGroup } from "../types/showcase"
import { CreateStoryForm } from "../components/CreateStoryForm"
import { AuthorBadge } from "../components/AuthorBadge"
import { StoryModal } from "../components/StoryModal"
import { MobileStoryViewer } from "../components/MobileStoryViewer"
import { StoryCard } from "../components/StoryCard"
import { showcaseService } from "../services/showcase.service"
import { useStoryGroups } from "../hooks/use-story-groups"

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
  const [mobileSelectedGroupId, setMobileSelectedGroupId] = useState<string | number | null>(null)

  const {
    groups,
    setGroups,
    selectedStory,
    setSelectedStory,
    handleCreateStory,
    handleStoryUpdate,
    markStoryViewed
  } = useStoryGroups();
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const stories = await showcaseService.getStories();

        // Group stories by author locally to satisfy StoryCard and Modal requirements
        const groupedMap = new Map<string | number, StoryGroup>();

        stories.forEach(story => {
          const authorId = story.author?.id || 'unknown';
          if (!groupedMap.has(authorId)) {
            groupedMap.set(authorId, {
              author: story.author,
              is_current_user: story.isAuthor || false,
              latest_story_at: story.created_at || new Date().toISOString(),
              stories: []
            });
          }
          const group = groupedMap.get(authorId)!;
          group.stories.push(story);

          // Update latest_story_at if current story is newer
          if (story.created_at && (!group.latest_story_at || new Date(story.created_at) > new Date(group.latest_story_at))) {
            group.latest_story_at = story.created_at;
          }
        });

        setGroups(Array.from(groupedMap.values()));
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
    const sortedStoriesGroups = result.map(group => {
      if (!group.stories || group.stories.length === 0) return group;

      // Create a shallow copy of stories to sort safely (ascending / oldest first)
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

    const getUserIsUnseen = (user: StoryGroup) => {
      if (user.stories && Array.isArray(user.stories)) {
        return user.stories.some(story => !story.is_seen);
      }
      return false;
    };

    const getLatestStoryTime = (user: StoryGroup) => {
      if (user.stories && Array.isArray(user.stories)) {
        return Math.max(...user.stories.map(s => 
          new Date(s.created_at || '').getTime()
        ));
      }
      return new Date(user.latest_story_at || '').getTime();
    };

    // 3. Sort groups: Unseen first then seen, newest first within each group
    const sortedShowcases = [...sortedStoriesGroups].sort((a, b) => {
      // Keep current user first
      if (a.is_current_user && !b.is_current_user) return -1;
      if (!a.is_current_user && b.is_current_user) return 1;

      const aUnseen = getUserIsUnseen(a);
      const bUnseen = getUserIsUnseen(b);

      // unseen before seen
      if (aUnseen && !bUnseen) return -1;
      if (!aUnseen && bUnseen) return 1;

      // within same group: newest first
      const aTime = getLatestStoryTime(a);
      const bTime = getLatestStoryTime(b);
      return bTime - aTime;
    });

    return sortedShowcases;
  }, [groups, searchQuery]);

  // Helper to find the group of the currently selected story
  const selectedStoryGroup = useMemo(() => {
    if (!selectedStory) return null;
    return processedGroups.find(g => g.stories.some(s => s.id === selectedStory.id)) || null;
  }, [selectedStory, processedGroups]);

  // formatCompactNumber moved to utils



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
        {/* Commented out for view-only experience
        <div className="mb-6 md:mb-8 flex items-center justify-between">
          <button
            onClick={() => setShowCreateStory(true)}
            className="bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 text-sm md:text-base"
          >
            <Plus className="w-5 h-5" />
            Create Story
          </button>
        </div>
        */}

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
                           // Find the first unseen story, or the first one if all viewed
                           const sortedStories = group.stories
                           const firstUnseen = sortedStories.find(s => !s.is_seen) || sortedStories[0];
                           const selected = { ...firstUnseen, author: group.author };
                           console.log("Opening StoryViewer with:", selected);
                           setSelectedStory(selected)
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
          onStoryViewed={markStoryViewed}
          groupStories={selectedStoryGroup.stories}
            onNext={() => {
              const currentIndex = selectedStoryGroup.stories.findIndex(s => s.id === selectedStory.id);
              if (currentIndex < selectedStoryGroup.stories.length - 1) {
                setSelectedStory({ ...selectedStoryGroup.stories[currentIndex + 1], author: selectedStoryGroup.author });
              } else {
                const currentGroupIndex = processedGroups.findIndex(g => g.author.id === selectedStoryGroup.author.id);
                if (currentGroupIndex !== -1 && currentGroupIndex < processedGroups.length - 1) {
                  const nextUser = processedGroups[currentGroupIndex + 1];
                  if (nextUser && nextUser.stories.length > 0) {
                    const nextSorted = [...nextUser.stories].sort(
                      (a, b) => new Date(a.created_at || new Date()).getTime() - new Date(b.created_at || new Date()).getTime()
                    );
                    const firstUnseenIdx = nextSorted.findIndex(s => !s.is_seen);
                    const startStory = firstUnseenIdx !== -1 ? nextSorted[firstUnseenIdx] : nextSorted[0];
                    setSelectedStory({ ...startStory, author: nextUser.author });
                  } else {
                    setSelectedStory(null);
                  }
                } else {
                  setSelectedStory(null);
                }
              }
            }}
            onPrev={() => {
              const currentIndex = selectedStoryGroup.stories.findIndex(s => s.id === selectedStory.id);
              if (currentIndex > 0) {
                setSelectedStory({ ...selectedStoryGroup.stories[currentIndex - 1], author: selectedStoryGroup.author });
              } else {
                const currentGroupIndex = processedGroups.findIndex(g => g.author.id === selectedStoryGroup.author.id);
                if (currentGroupIndex > 0) {
                  const prevGroup = processedGroups[currentGroupIndex - 1];
                  if (prevGroup.stories.length > 0) {
                    const prevSorted = [...prevGroup.stories].sort(
                      (a, b) => new Date(a.created_at || new Date()).getTime() - new Date(b.created_at || new Date()).getTime()
                    );
                    setSelectedStory({ ...prevSorted[prevSorted.length - 1], author: prevGroup.author });
                  }
                }
              }
            }}
            hasNext={
              selectedStoryGroup.stories.findIndex(s => s.id === selectedStory.id) < selectedStoryGroup.stories.length - 1 ||
              processedGroups.findIndex(pg => pg.author.id === selectedStoryGroup.author.id) < processedGroups.length - 1
            }
            hasPrev={
              selectedStoryGroup.stories.findIndex(s => s.id === selectedStory.id) > 0 ||
              processedGroups.findIndex(g => g.author.id === selectedStoryGroup.author.id) > 0
            }
        />
      )}

      {mobileSelectedGroupId !== null && (
        <MobileStoryViewer
          groups={processedGroups}
          initialGroupId={mobileSelectedGroupId}
          onClose={() => setMobileSelectedGroupId(null)}
          onStoryUpdate={handleStoryUpdate}
          onStoryViewed={markStoryViewed}
        />
      )}

      {/* Commented out for view-only experience
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
              <CreateStoryForm
                onCancel={() => setShowCreateStory(false)}
                onCreated={(newStory) => {
                  handleCreateStory(newStory);
                  setShowCreateStory(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
      */}
    </div>
  )
}
