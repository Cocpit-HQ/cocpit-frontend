'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import SuggestionsPanel from '@/components/home/SuggestionsPanel'
import { StoryGroup } from '@/types/showcase'
import { X } from 'lucide-react'
import { HomeHeader } from './HomeHeader'
import { FeedSection } from './FeedSection'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { useStories } from '@/context/StoriesContext'
import TrendingHashtags from './TrendingHashtags'

// Lazy-load heavy modal/overlay components (saves ~230KB from initial bundle)
const MobileStoryViewer = dynamic(
  () => import('@/components/showcase/MobileStoryViewer').then(mod => mod.MobileStoryViewer),
  { ssr: false }
)
const StoryModal = dynamic(
  () => import('@/components/showcase/StoryModal').then(mod => mod.StoryModal),
  { ssr: false }
)
const CreateStoryForm = dynamic(
  () => import('@/components/showcase/CreateStoryForm').then(mod => mod.CreateStoryForm),
  { ssr: false }
)

import { useScrollRestoration } from '@/hooks/use-scroll-restoration';
import { useFeed } from '@/hooks/use-feed';
import { useFeedUIStore } from '@/store/feed.store'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const { loading: isFeedLoading } = useFeed(true);
  
  // Render control: Block scroll setting until Feed Data is verified and DOM is rendered (mounted)
  useScrollRestoration(mounted && !isFeedLoading);

  const { activeTab, setActiveTab } = useFeedUIStore();

  // UI State
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [mobileSelectedGroupId, setMobileSelectedGroupId] = useState<string | number | null>(null)

  const {
    groups,
    isLoading: storyLoading,
    selectedStory,
    setSelectedStory,
    handleCreateStory,
    handleStoryUpdate
  } = useStories()

  useEffect(() => {
    setMounted(true)
  }, [])



  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <HomeHeader />

      <main className="pt-4 md:pt-6 pb-4 md:pb-8">
        <div className="max-w-5xl mx-auto px-0 md:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            {/* Feed Section */}
            <FeedSection
              groups={groups}
              storyLoading={storyLoading}
              setShowCreateStory={setShowCreateStory}
              setMobileSelectedGroupId={setMobileSelectedGroupId}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Sideboards */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="sticky top-24 md:top-28 space-y-6">
                <TrendingHashtags />
                <SuggestionsPanel />
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Modals & Overlays */}
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
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
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
    </div>
  )
}
