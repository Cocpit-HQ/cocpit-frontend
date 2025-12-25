'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MessageCircle, X } from 'lucide-react'
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
import { users } from '@/lib/data/users';

/* -------------------- Component -------------------- */

export default function HomePage() {
  const router = useRouter()
  // Removed useTheme logic - relying on CSS variables
  const [mounted, setMounted] = useState(false)
  const { openModal } = useActionModal()
  const { posts, currentUser, deletePost, togglePostVisibility } = useFeed()

  useEffect(() => {
    setMounted(true)
  }, [])

  const [loading, setLoading] = useState(false)
  const [stories, setStories] = useState<StoryDetail[]>(storiesSeed)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [selectedStory, setSelectedStory] = useState<StoryDetail | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [activeTab, setActiveTab] = useState('recent');

  const handleCreateStory = (newStory: StoryDetail) => {
    setStories((prev) => [newStory, ...prev])
    setShowCreateStory(false)
  }

  /* -------------------- Derived State -------------------- */

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.headline.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.toLowerCase()
    let filtered = posts.filter(
      (p) =>
        p.author.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );

    if (activeTab === 'top') {
      // Sort by likes, converting '10k' to 10000
      filtered.sort((a, b) => {
        const likesA = parseFloat(a.likes.replace('k', '')) * (a.likes.includes('k') ? 1000 : 1);
        const likesB = parseFloat(b.likes.replace('k', '')) * (b.likes.includes('k') ? 1000 : 1);
        return likesB - likesA;
      });
    }
    // For 'recent', no extra sorting is needed as new posts are prepended.

    return filtered;
  }, [posts, searchQuery, activeTab])

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
    }

    router.push(routes[page] ?? '/feed')
  }

  /* -------------------- Render -------------------- */

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="home" navigateTo={navigateTo}>
        {/* Top Search Bar */}
        <header
          className="sticky top-0 z-20 border-b px-4 py-3 md:py-4 bg-background border-border"
        >
          <div className="max-w-5xl mx-auto">
            {/* --- Desktop Header (Visible from md screens up) --- */}
            <div className="hidden md:flex items-center gap-4">
              {/* Desktop Search Bar */}
              <div
                className={`relative flex-1 flex items-center gap-3 max-w-2xl transition-all duration-300 ${
                  isSearchFocused ? 'md:max-w-2xl' : ''
                }`}
              >
                <Search className="w-5 h-5 text-muted-foreground absolute left-3" />
                <input
                  type="text"
                  placeholder="Search posts, professionals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                     setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:border-primary bg-card text-foreground placeholder-muted-foreground border-border"
                />

                {/* Search Dropdown */}
                {isSearchFocused && searchQuery && filteredUsers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            People
                        </div>
                        {filteredUsers.map(user => (
                            <Link
                                key={user.id}
                                href={`/profile/${user.id}`}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                            >
                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.headline}</p>
                                    {user.mutualConnections > 0 && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5">{user.mutualConnections} mutual connections</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
              </div>

              {/* Desktop Icons */}
              <div className="flex items-center gap-1 sm:gap-2">
                <NotificationPopover />
                <Link
                  href="/messaging"
                  className="p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground"
                >
                  <MessageCircle className="w-6 h-6" />
                </Link>
              </div>
            </div>

            {/* --- Mobile Header (Hidden from md screens up) --- */}
            <div className="md:hidden flex items-center gap-2 relative">
              {/* Mobile Search Bar */}
              <div className="flex-1 flex items-center gap-3 relative">
                <Search className="w-5 h-5 text-muted-foreground absolute left-3" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                     setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:border-primary bg-card text-foreground placeholder-muted-foreground border-border"
                />

                {/* Mobile Search Dropdown */}
                {isSearchFocused && searchQuery && filteredUsers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            People
                        </div>
                        {filteredUsers.map(user => (
                            <Link
                                key={user.id}
                                href={`/profile/${user.id}`}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                            >
                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.headline}</p>
                                    {user.mutualConnections > 0 && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5">{user.mutualConnections} mutual connections</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
              </div>

              {/* Mobile Icons */}
              {!isSearchFocused && (
                <div className="flex items-center gap-1">
                  <NotificationPopover />
                  <Link
                    href="/messaging"
                    className="p-2 rounded-full transition-colors text-muted-foreground"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </Link>
                </div>
              )}
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
                <div className="md:hidden border-b border-border">
                  <StoryRail
                    stories={stories}
                    onCreateClick={() => setShowCreateStory(true)}
                    onStoryClick={(story) => setSelectedStory(story)}
                  />
                </div>

                {/* Feed Tabs */}
                <div className="md:hidden mt-4">
                  <FeedTabs activeTab={activeTab} setActiveTab={setActiveTab} />
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
                        isOwnPost={post.author === currentUser.name}
                        onDelete={deletePost}
                        onToggleVisibility={togglePostVisibility}
                      />
                    ))}

                  {!loading && searchQuery && filteredPosts.length === 0 && (
                    <p
                      className="text-center py-12 text-muted-foreground"
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
            />
          </div>
          <div className="hidden md:block">
            <StoryModal
              story={selectedStory}
              onClose={() => setSelectedStory(null)}
            />
          </div>
        </>
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
              <CreateStoryForm
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
