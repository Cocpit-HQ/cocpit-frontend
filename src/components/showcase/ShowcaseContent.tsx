"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Eye, MessageCircle, Play, Share2, ThumbsUp, X, Send, Plus } from "lucide-react"

import SuggestionsPanel from "@/components/SuggestionsPanel"
import { AppShell } from "@/components/layout/AppShell"
import type { Page, Theme } from "@/types/common"
import type { StoryCard, StoryDetail } from "@/types/showcase"
import { CreateStoryForm } from "@/components/showcase/CreateStoryForm"
import { storiesSeed } from "@/constants/stories"
import { AuthorBadge } from "@/components/showcase/AuthorBadge"
import { StoryModal } from "@/components/showcase/StoryModal"

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

function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<Theme>("light")

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const updateTheme = (matches: boolean) => setSystemTheme(matches ? "dark" : "light")
    updateTheme(mediaQuery.matches)
    const listener = (event: MediaQueryListEvent) => updateTheme(event.matches)
    mediaQuery.addEventListener("change", listener)
    return () => mediaQuery.removeEventListener("change", listener)
  }, [])

  return systemTheme
}

function ShowcaseSkeletonCard({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`rounded-xl overflow-hidden border animate-pulse ${
        isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
      }`}
    >
      <div className={`h-48 ${isDark ? "bg-[#1f2534]" : "bg-gray-200"}`} />
      <div className="p-4 space-y-3">
        <div
          className={`h-5 rounded w-3/4 ${isDark ? "bg-[#323a4b]" : "bg-gray-200"}`}
        />
        <div
          className={`h-4 rounded w-1/2 ${isDark ? "bg-[#323a4b]" : "bg-gray-200"}`}
        />
        <div
          className={`h-4 rounded w-full ${isDark ? "bg-[#323a4b]" : "bg-gray-200"}`}
        />
      </div>
    </div>
  )
}

export default function ShowcaseContent() {
  const router = useRouter()
  const { resolvedTheme, theme } = useTheme()
  const systemTheme = useSystemTheme()

  const isDark = useMemo(
    () => resolvedTheme === "dark",
    [resolvedTheme]
  )

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const [loading, setLoading] = useState(true)
  const [stories, setStories] = useState<StoryDetail[]>([])
  const [selectedStory, setSelectedStory] = useState<StoryDetail | null>(null)
  const [showCreateStory, setShowCreateStory] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setStories(storiesSeed)
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
      <AppShell currentPage="network" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div>
              <h1 className={isDark ? "text-white mb-2" : "text-gray-900 mb-2"}>Showcase</h1>
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>Share your professional journey through stories</p>
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading &&
                  Array.from({ length: 4 }).map((_, idx) => (
                    <ShowcaseSkeletonCard key={idx} isDark={isDark} />
                  ))}

                {!loading &&
                  stories.map((story) => (
                    <div
                      key={story.id}
                      className={`rounded-xl overflow-hidden border transition-all group cursor-pointer ${
                        isDark
                          ? "bg-[#242b3d] border-[#2d3548] hover:border-[#404968]"
                          : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                      }`}
                      onClick={() => setSelectedStory(story)}
                    >
                      <div className="relative h-48 overflow-hidden">
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

                      <div className="p-4">
                        <h3
                          className={`mb-2 group-hover:text-[#5B7CFF] transition-colors ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {story.title}
                        </h3>
                        <div className={`flex items-center justify-between text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}>
                          <span>{story.timeAgo}</span>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{story.views.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{story.likes}</span>
                            </div>
                            {story.comments ? (
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{story.comments}</span>
                              </div>
                            ) : null}
                            <button className={`transition-colors ${
                              isDark ? "hover:text-white" : "hover:text-gray-900"
                            }`}>
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
        <StoryModal story={selectedStory} onClose={() => setSelectedStory(null)} isDark={isDark} />
      )}

       {showCreateStory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${isDark ? "bg-[#242b3d]" : "bg-white"} rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
            <div
              className={`sticky top-0 ${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} border-b px-6 py-4 flex items-center justify-between`}
            >
              <h2 className={isDark ? "text-white" : "text-gray-900"}>Create Story</h2>
              <button
                onClick={() => setShowCreateStory(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-[#171c28] text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <CreateStoryForm isDark={isDark} onCancel={() => setShowCreateStory(false)} onCreated={() => setShowCreateStory(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
