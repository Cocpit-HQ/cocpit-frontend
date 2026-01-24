'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
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
import { StoryDetail, StoryGroup } from '@/types/showcase'
import { useDebounce } from '@/hooks/use-debounce';
import { searchUsers } from '@/services/api/user';
import { SearchedUser } from '@/types/user';
import { PostType } from './CreatePostModal';
import { useInView } from '@/hooks/use-in-view';

/* -------------------- Component -------------------- */

export default function HomePage() {
  const router = useRouter()
  // Removed useTheme logic - relying on CSS variables
  const [mounted, setMounted] = useState(false)
  const { openModal } = useActionModal()
  const { posts, currentUser, deletePost, togglePostVisibility, loadMorePosts, hasMore, loading: feedLoading } = useFeed()

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (inView && hasMore && !feedLoading) {
      loadMorePosts();
    }
  }, [inView, hasMore, feedLoading, loadMorePosts]);

  useEffect(() => {
    setMounted(true)
  }, [])

  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<StoryGroup[]>([])

  useEffect(() => {
    const fetchStories = async () => {
      try {
        // Dynamic import to avoid SSR issues if necessary, but showcaseService is client side
        const { showcaseService } = await import('@/services/showcase.service');
        const data = await showcaseService.getGroupedStories()
        setGroups(data)
      } catch (error) {
        console.error("Failed to fetch stories", error)
        // Fallback to seed if fetch fails? Or just empty.
        // setStories(storiesSeed) 
      }
    }
    fetchStories()
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [selectedStory, setSelectedStory] = useState<StoryDetail | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [activeTab, setActiveTab] = useState('recent');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Scroll behavior for mobile header
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      let currentScrollY = window.scrollY;

      // If scrolling happens in a container (not window), use its scrollTop
      if (target instanceof HTMLElement) {
        // Ignore small scrollable elements (like dropdowns) to prevent jitter
        if (target.scrollHeight < window.innerHeight) return;
        currentScrollY = target.scrollTop;
      }

      // Always show at the top
      if (currentScrollY <= 60) {
        setIsHeaderVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Ignore small scrolls
      if (Math.abs(lastScrollY.current - currentScrollY) <= 5) return;

      // Scrolling down
      if (currentScrollY > lastScrollY.current) {
        setIsHeaderVisible(false);
      } else { // Scrolling up
        setIsHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    // Use capture: true to detect scroll events on containers (like AppShell)
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const fetchUsers = async () => {
      setSearchLoading(true);
      try {
        const users = await searchUsers(debouncedSearchQuery);
        setSearchResults(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedSearchQuery]);

  const handleCreateStory = (newStory: StoryDetail) => {
    // Optimistic update for "Me" group (Index 0)
    setGroups(prev => {
      const newGroups = [...prev];
      if (newGroups.length > 0 && newGroups[0].is_current_user) {
        newGroups[0].stories.push(newStory);
      }
      return newGroups;
    })
    setShowCreateStory(false)

    // Also update Mobile/Modal?
    setSelectedStory(newStory); // View it?
  }
  const [mobileSelectedGroupId, setMobileSelectedGroupId] = useState<number | null>(null)

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
  }

  /* -------------------- Derived State -------------------- */

  const sortedPosts = useMemo(() => {
    const sorted = [...posts];
    if (activeTab === 'top') {
      // Sort by likes, converting '10k' to 10000
      // Sort by likes (number)
      sorted.sort((a, b) => b.likes - a.likes);
    }
    // For 'recent', no extra sorting is needed as new posts are prepended.

    return sorted;
  }, [posts, activeTab])

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
          className={`sticky top-0 z-20 border-b px-4 py-3 md:py-4 bg-background border-border transition-transform duration-300 ease-in-out ${!isHeaderVisible && !isSearchFocused ? '-translate-y-full' : 'translate-y-0'
            } md:translate-y-0`}
        >
          <div className="max-w-5xl mx-auto">
            {/* --- Desktop Header (Visible from md screens up) --- */}
            <div className="hidden md:flex items-center gap-4">
              {/* Desktop Search Bar */}
              <div
                className={`relative flex-1 flex items-center gap-3 max-w-2xl transition-all duration-300 ${isSearchFocused ? 'md:max-w-2xl' : ''
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
                {isSearchFocused && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      People
                    </div>
                    {searchLoading ? (
                      <div className="p-4 text-center text-muted-foreground">Loading...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(user => (
                        <Link
                          key={user.id}
                          href={`/profile/${user.id}`}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors"
                        >
                          <img src={user.avatar_url || '/assets/pngegg.png'} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.headline || ''}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">No users found.</div>
                    )}
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
              {/* App Logo */}
              <Link href="/feed" className="flex-shrink-0">
                <img
                  src="/assets/logo.PNG"
                  alt="Cockpit Logo"
                  className="h-8 w-auto"
                />
              </Link>
              {/* Mobile Search Bar */}
              <div className="flex-1 flex items-center gap-3 relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  className="w-full pl-9 pr-4 py-1.5 text-sm rounded-full border focus:outline-none focus:border-primary bg-card text-foreground placeholder-muted-foreground border-border"
                />

                {/* Mobile Search Dropdown */}
                {isSearchFocused && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      People
                    </div>
                    {searchLoading ? (
                      <div className="p-4 text-center text-muted-foreground">Loading...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(user => (
                        <Link
                          key={user.id}
                          href={`/profile/${user.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                        >
                          <img src={user.avatar_url || '/assets/pngegg.png'} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.headline || ''}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">No users found.</div>
                    )}
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
                    <MessageCircle className="w-5 h-5" />
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
                    groups={groups}
                    onCreateClick={() => setShowCreateStory(true)}
                    onStoryClick={(story) => {
                      // Find group of this story
                      const group = groups.find(g => g.stories.some(s => s.id === story.id));
                      if (group) {
                        setMobileSelectedGroupId(group.author.id || 0);
                      }
                    }}
                  />
                </div>

                {/* Feed Tabs */}
                <div className="md:hidden mt-4">
                  <FeedTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>

                {/* Create Post */}
                <div className="hidden md:block">
                  <CreatePost onOpenModal={openModal as (type?: PostType) => void} />
                </div>

                {/* Posts */}
                <div className="space-y-2 md:space-y-3">
                  {loading &&
                    Array.from({ length: 2 }).map((_, i) => (
                      <PostSkeleton key={i} />
                    ))}

                  {!loading &&
                    sortedPosts.map((post) => (
                      <FeedPost
                        key={post.id}
                        {...post}
                        initialComments={post.commentData}
                        isOwnPost={post.author === currentUser.name}
                        onDelete={deletePost}
                        onToggleVisibility={togglePostVisibility}
                      />
                    ))}

                  {/* Infinite Scroll Sentinel */}
                  {!loading && hasMore && (
                    <div ref={loadMoreRef} className="py-4 flex justify-center">
                      {feedLoading && <div className="text-muted-foreground text-sm">Loading more...</div>}
                    </div>
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
      {mobileSelectedGroupId !== null && (
        <div className="md:hidden">
          <MobileStoryViewer
            groups={groups}
            initialGroupId={mobileSelectedGroupId || 0}
            onClose={() => setMobileSelectedGroupId(null)}
            onStoryUpdate={handleStoryUpdate}
          />
        </div>
      )}
      {selectedStory && (
        <div className="hidden md:block">
          <StoryModal
            story={selectedStory}
            onClose={() => setSelectedStory(null)}
          />
        </div>
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
