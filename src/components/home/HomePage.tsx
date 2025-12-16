'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import FeedPost from './FeedPost'
import PostSkeleton from './PostSkeleton'
import DarkSidebar from '@/components/DarkSidebar'
import SuggestionsPanel from '@/components/SuggestionsPanel'

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
  const isDark = true

  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [searchQuery, setSearchQuery] = useState('')

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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#171c28]' : 'bg-[#F3F2EF]'}`}>
      <DarkSidebar
        navigateTo={navigateTo}
        currentPage="home"
        theme={isDark ? 'dark' : 'light'}
      />

      <div className="ml-64">
        {/* Top Search Bar */}
        <header
          className={`fixed top-0 left-64 right-0 z-20 border-b p-4 ${
            isDark
              ? 'bg-[#171c28] border-[#2d3548]'
              : 'bg-[#F3F2EF] border-gray-200'
          }`}
        >
          <div className="max-w-5xl mx-auto px-4">
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
        <main className="pt-20">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Feed */}
              <section className="lg:col-span-8">
                {/* Create Post */}
                <div
                  className={`rounded-xl border p-6 mb-6 ${
                    isDark
                      ? 'bg-[#242b3d] border-[#2d3548]'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500">
                      <img
                        src="/assets/egg.png"
                        alt="profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Share your professional insights..."
                      className={`flex-1 px-4 py-3 rounded-lg border resize-none focus:outline-none focus:border-[#5B7CFF]
                        ${
                          isDark
                            ? 'bg-[#1a1f2e] text-white placeholder-gray-500 border-[#2d3548]'
                            : 'bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-300'
                        }`}
                    />
                  </div>

                  <div
                    className={`flex justify-between items-center pt-4 border-t ${
                      isDark ? 'border-[#2d3548]' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex gap-4 text-gray-400">
                      <button>Photo</button>
                      <button>Video</button>
                      <button>Poll</button>
                    </div>
                    <button className="bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white px-6 py-2.5 rounded-lg">
                      Post
                    </button>
                  </div>
                </div>

                {/* Posts */}
                <div className="space-y-6">
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
                <div className="sticky top-28">
                  <SuggestionsPanel theme={isDark ? 'dark' : 'light'} />
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
