'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Search } from 'lucide-react'

import FeedPost from './FeedPost'
import PostSkeleton from './PostSkeleton'
import CreatePost from './CreatePost'
import SuggestionsPanel from '@/components/SuggestionsPanel'
import { AppShell } from '@/components/layout/AppShell'
import { useActionModal } from '@/context/ActionModalContext'
import { StoryRail } from './StoryRail'
import { FeedTabs } from './FeedTabs'
import { CreateStoryForm } from '@/components/showcase/CreateStoryForm'
import { StoryModal } from '@/components/showcase/StoryModal'
import { MobileStoryViewer } from '@/components/showcase/MobileStoryViewer'
import { storiesSeed } from '@/constants/stories'
import { StoryDetail } from '@/types/showcase'
import { X } from 'lucide-react'

/* -------------------- Types -------------------- */

type Post = {
  id: number
  author: string
  title: string
  timeAgo: string
  content: string
  imageSrc: string
  likes: string
  comments: string
  shares: string
}

/* -------------------- Component -------------------- */

export default function HomePage() {
  const router = useRouter()
  const { resolvedTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { openModal } = useActionModal()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = useMemo(() => resolvedTheme === 'dark', [resolvedTheme])

  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [stories, setStories] = useState<StoryDetail[]>(storiesSeed)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [selectedStory, setSelectedStory] = useState<StoryDetail | null>(null)

  const handleCreateStory = (newStory: StoryDetail) => {
    setStories((prev) => [newStory, ...prev])
    setShowCreateStory(false)
  }

  /* -------------------- Effects -------------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setPosts([
        {
          id: 1,
          author: 'Sarah Chen',
          title: 'UX Designer at Design Studio',
          timeAgo: '2h',
          content:
            '🎨 Just launched our new design system! Working with an amazing team to create consistent, accessible experiences across all our products.',
          imageSrc: '/assets/pngegg.png',
          likes: '10k',
          comments: '18',
          shares: '2',
        },
        {
          id: 2,
          author: 'Michael Torres',
          title: 'Product Manager at TechCorp',
          timeAgo: '5h',
          content:
            'Excited to announce that our team just shipped a major feature update! 🚀',
          imageSrc: '/assets/pngegg.png',
          likes: '8.5k',
          comments: '42',
          shares: '5',
        },
      ])
      setLoading(false)
    }, 1100)

    return () => clearTimeout(timer)
  }, [])

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
          className={`sticky top-0 z-20 border-b px-4 py-4 md:px-4 ${
            isDark
              ? 'bg-[#171c28] border-[#2d3548]'
              : 'bg-[#F3F2EF] border-gray-200'
          }`}
        >
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 max-w-2xl">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts, professionals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:border-[#5B7CFF]
                  ${
                    isDark
                      ? 'bg-[#242b3d] text-white placeholder-gray-500 border-[#2d3548]'
                      : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                  }`}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-4 md:pt-6 pb-4 md:pb-8">
          <div className="max-w-5xl mx-auto px-4 md:px-4">
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
                <div className="space-y-4 md:space-y-6">
                  {loading &&
                    Array.from({ length: 2 }).map((_, i) => (
                      <PostSkeleton key={i} />
                    ))}

                  {!loading &&
                    filteredPosts.map((post) => (
                      <FeedPost
                        key={post.id}
                        {...post}
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
