'use client'

import React, { useEffect, useState } from 'react'
import SuggestionsPanel from '@/components/SuggestionsPanel'
import { StoryDetail, StoryGroup } from '@/types/showcase'
import { MobileStoryViewer } from '@/components/showcase/MobileStoryViewer'
import { StoryModal } from '@/components/showcase/StoryModal'
import { CreateStoryForm } from '@/components/showcase/CreateStoryForm'
import { X } from 'lucide-react'
import { HomeHeader } from './HomeHeader'
import { FeedSection } from './FeedSection'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { useStoryGroups } from '@/hooks/use-story-groups'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('recent')

  // Story State
  const [storyLoading, setStoryLoading] = useState(true)
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [mobileSelectedGroupId, setMobileSelectedGroupId] = useState<string | number | null>(null)

  const {
    groups,
    setGroups,
    selectedStory,
    setSelectedStory,
    handleCreateStory,
    handleStoryUpdate
  } = useStoryGroups()

  const { activeProfile } = useActiveProfile();

  useEffect(() => {
    setMounted(true)
    const fetchStories = async () => {
      try {
        const { showcaseService } = await import('@/services/showcase.service');
        const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
        const data = await showcaseService.getGroupedStories(companyId)
        setGroups(data)
      } catch (error) {
        console.error("Failed to fetch stories", error)
      } finally {
        setStoryLoading(false)
      }
    }
    fetchStories()
  }, [activeProfile?.id, activeProfile?.type])



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

            {/* Suggestions */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 md:top-28">
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
