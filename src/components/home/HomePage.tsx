'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Search, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import FeedPost from './FeedPost'
import PostSkeleton from './PostSkeleton'
import CreatePost from './CreatePost'
import SuggestionsPanel from '@/components/SuggestionsPanel'
import { AppShell } from '@/components/layout/AppShell'
import { useActionModal } from '@/context/ActionModalContext'
import { useFeed } from '@/context/FeedContext'
import { StoryRail } from './StoryRail'
import { FeedTabs } from './FeedTabs'
import { CreateStoryForm } from '@/components/showcase/CreateStoryForm'
import { StoryModal } from '@/components/showcase/StoryModal'
import { MobileStoryViewer } from '@/components/showcase/MobileStoryViewer'
import { NotificationPopover } from '@/components/notifications/NotificationPopover'
import { Post, Comment } from '@/types/entities';
import { storiesSeed } from '@/constants/stories'
import { StoryDetail } from '@/types/showcase'
import { X } from 'lucide-react'

/* -------------------- Component -------------------- */

export default function HomePage() {
  const router = useRouter()
  const { resolvedTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { openModal } = useActionModal()
  const { posts } = useFeed()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = useMemo(() => resolvedTheme === 'dark', [resolvedTheme])

  const [loading, setLoading] = useState(false)
  const [stories, setStories] = useState<StoryDetail[]>(storiesSeed)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [selectedStory, setSelectedStory] = useState<StoryDetail | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const handleCreateStory = (newStory: StoryDetail) => {
    setStories((prev) => [newStory, ...prev])
    setShowCreateStory(false)
  }

  /* -------------------- Derived State -------------------- */

  const filteredPosts = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return posts.filter(
      (p) =>
        p.author.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    )
  }, [posts, searchQuery])

  /* -------------------- Navigation -------------------- */

  const navigateTo = (page: string) => {
    const routes: Record<string, string> = {
      home: '/feed',
      network: '/showcase',
      events: '/events',
      profile: '/profile',
      settings: '/settings',
      jobs: '/jobs',
      analytics: '/analytics',
      achievements: '/achievements',
    }

    router.push(routes[page] ?? '/feed')
  }

  /* -------------------- Render -------------------- */

  if (!mounted) {
    return null
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#171c28]' : 'bg-[#F3F2EF]'}`}>
      <AppShell currentPage="home" navigateTo={navigateTo}>
        {/* Top Search Bar */}
        <header
          className={`sticky top-0 z-20 border-b px-4 py-3 md:py-4 ${
            isDark
              ? 'bg-[#171c28] border-[#2d3548]'
              : 'bg-[#F3F2EF] border-gray-200'
          }`}
        >
          <div className="max-w-5xl mx-auto">
            {/* --- Desktop Header (Visible from md screens up) --- */}
            <div className="hidden md:flex items-center gap-4">
              {/* Desktop Search Bar */}
              <div
                className={`flex-1 flex items-center gap-3 max-w-2xl transition-all duration-300 ${
                  isSearchFocused ? 'md:max-w-2xl' : ''
                }`}
              >
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts, professionals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:border-[#5B7CFF] ${
                    isDark
                      ? 'bg-[#242b3d] text-white placeholder-gray-500 border-[#2d3548]'
                      : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                  }`}
                />
              </div>

              {/* Desktop Icons */}
              <div className="flex items-center gap-1 sm:gap-2">
                <NotificationPopover isDark={isDark} />
                <Link
                  href="/messaging"
                  className={`p-2 rounded-full transition-colors ${
                    isDark
                      ? 'hover:bg-[#2d3548] text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <MessageCircle className="w-6 h-6" />
                </Link>
              </div>
            </div>

            {/* --- Mobile Header (Hidden from md screens up) --- */}
            <div className="md:hidden relative flex items-center">
              {/* Mobile Search Bar */}
              <div className="flex-1 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:border-[#5B7CFF] pr-20 ${
                    isDark
                      ? 'bg-[#242b3d] text-white placeholder-gray-500 border-[#2d3548]'
                      : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                  }`}
                />
              </div>

              {/* Mobile Icons (Absolutely Positioned) */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-1">
                <NotificationPopover isDark={isDark} />
                <Link
                  href="/messaging"
                  className={`p-2 rounded-full transition-colors ${
                    isDark
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`}
                >
                  <MessageCircle className="w-6 h-6" />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-4 md:pt-6 pb-4 md:pb-8">
          <div className="max-w-5xl mx-auto px-0 md:px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              {/* Feed */}
              <section className="lg:col-span-8">
                {/* Mobile Story Rail */}
                <div className="md:hidden">
                  <StoryRail
                    isDark={isDark}
                    stories={stories}
                    onCreateClick={() => setShowCreateStory(true)}
                    onStoryClick={(story) => setSelectedStory(story)}
                  />
                </div>

                {/* Feed Tabs */}
                <div className="md:hidden">
                  <FeedTabs isDark={isDark} />
                </div>

                {/* Create Post */}
                <div className="hidden md:block">
                  <CreatePost onOpenModal={openModal} />
                </div>

                {/* Posts */}
                <div className="space-y-3 md:space-y-4">
                  {loading &&
                    Array.from({ length: 2 }).map((_, i) => (
                      <PostSkeleton key={i} />
                    ))}

                  {!loading &&
                    filteredPosts.map((post) => (
                      <FeedPost
                        key={post.id}
                        {...post}
                        initialComments={post.commentData}
                        isDark={isDark}
                      />
                    ))}

                  {!loading && searchQuery && filteredPosts.length === 0 && (
                    <p
                      className={`text-center py-12 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      No posts found matching "{searchQuery}"
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
        </main>
      </AppShell>

      {/* Modals */}
      {selectedStory && (
        <>
          <div className="md:hidden">
            <MobileStoryViewer
              stories={stories}
              initialStoryId={selectedStory.id}
              onClose={() => setSelectedStory(null)}
              isDark={isDark}
            />
          </div>
          <div className="hidden md:block">
            <StoryModal
              story={selectedStory}
              onClose={() => setSelectedStory(null)}
              isDark={isDark}
            />
          </div>
        </>
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
              <CreateStoryForm
                isDark={isDark}
                onCancel={() => setShowCreateStory(false)}
                onCreated={handleCreateStory}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
