'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { X } from 'lucide-react'
import { FeedSection } from './FeedSection'
import { useStories } from '@/context/StoriesContext'
// TrendingHashtags removed per ID-295

// Lazy-load heavy modal/overlay components (saves ~230KB from initial bundle)
const MobileStoryViewer = dynamic(
  () => import('@/features/showcase/components/MobileStoryViewer').then(mod => mod.MobileStoryViewer),
  { ssr: false }
)
const StoryModal = dynamic(
  () => import('@/features/showcase/components/StoryModal').then(mod => mod.StoryModal),
  { ssr: false }
)
const CreateStoryForm = dynamic(
  () => import('@/features/showcase/components/CreateStoryForm').then(mod => mod.CreateStoryForm),
  { ssr: false }
)

import { useRouter } from 'next/navigation';
import { useFeed } from '@/hooks/use-feed';
import { useFeedUIStore } from '@/store/feed.store'
import { useUIStore } from '@/store/ui.store';

import InlineArticleEditor from '@/features/feed/components/create-post/shared/InlineArticleEditor';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sessionArticle, setSessionArticle] = useState(false);
  const { loading: isFeedLoading } = useFeed(true);

  const { activeTab, setActiveTab } = useFeedUIStore();
  const { isArticleMode } = useUIStore();

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('cocpit_is_article_mode') === 'true') {
      setSessionArticle(true);
      router.replace('/article/create');
    }
  }, [router]);

  useEffect(() => {
    if (isArticleMode) {
      router.replace('/article/create');
    }
  }, [isArticleMode, router]);

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

  if (isArticleMode || sessionArticle) {
    return <InlineArticleEditor />;
  }

  return (
    <div className="min-h-screen bg-transparent text-foreground md:pr-[253px]">
      <div className="pb-4 md:pb-8">
        <div className="mx-auto max-w-[1128px] px-0 md:px-4 xl:px-0">
          <div className="mx-auto max-w-[998px] w-full flex flex-col items-center">
            <FeedSection
              groups={groups}
              storyLoading={storyLoading}
              setShowCreateStory={setShowCreateStory}
              setMobileSelectedGroupId={setMobileSelectedGroupId}
              setSelectedStory={setSelectedStory}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
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

      {/* Commented out for view-only experience
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
      */}
    </div>
  )
}
