'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { X } from 'lucide-react'
import { FeedSection } from './FeedSection'
import { useStories } from '@/context/StoriesContext'
import TrendingHashtags from './TrendingHashtags'
import UpdatesPanel from './UpdatesPanel'

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
import { useUIStore } from '@/store/ui.store';

import InlineArticleEditor from './InlineArticleEditor';

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const { loading: isFeedLoading } = useFeed(true);
  
  // Render control: Block scroll setting until Feed Data is verified and DOM is rendered (mounted)
  useScrollRestoration(mounted && !isFeedLoading);

  const { activeTab, setActiveTab } = useFeedUIStore();
  const { isArticleMode } = useUIStore();

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
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])



  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pt-4 md:pt-6 pb-4 md:pb-8">
        <div className="mx-auto w-full max-w-[1128px] px-0 md:px-4 xl:px-0">
          <div className="flex w-full flex-col gap-6 md:gap-8 lg:flex-row lg:items-start lg:justify-center">
            {isArticleMode ? (
              <InlineArticleEditor />
            ) : (
              <>
                {/* Feed Section */}
                <FeedSection
                  groups={groups}
                  storyLoading={storyLoading}
                  setShowCreateStory={setShowCreateStory}
                  setMobileSelectedGroupId={setMobileSelectedGroupId}
                  setSelectedStory={setSelectedStory}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />

                {/* Sideboards */}
                <aside className="w-full min-w-0 space-y-6 px-0 md:px-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:w-[406px] lg:shrink-0 lg:self-start lg:overflow-y-auto">
                  <div className="space-y-6">
                    <UpdatesPanel />
                    <TrendingHashtags />
                  </div>
                </aside>
              </>
            )}
          </div>
        </div>
      </div>

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
