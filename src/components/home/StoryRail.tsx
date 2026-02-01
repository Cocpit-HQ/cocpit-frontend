import React, { useMemo } from 'react'
import Link from 'next/link'
import { Plus, Play } from 'lucide-react'
import { StoryDetail, StoryGroup } from '@/types/showcase'

type StoryRailProps = {
  groups: StoryGroup[]
  onCreateClick: () => void
  onStoryClick: (story: StoryDetail) => void
  isLoading?: boolean
}

// Helper to determine image source
function getStoryImage(story: StoryDetail): string | null {
  if (story.thumbnail_url) return story.thumbnail_url;

  if (story.media_type === 'video' || (story.image && (story.image.endsWith('.mp4') || story.image.endsWith('.mov')))) {
    if (story.image && story.image.includes('cloudinary')) {
      return story.image.replace(/\.[^/.]+$/, ".jpg");
    }
    return null;
  }
  return story.image || null;
}

export function StoryRail({ groups, onCreateClick, onStoryClick, isLoading }: StoryRailProps) {

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3 px-4 md:px-0">
        <h2 className="font-semibold text-lg text-foreground">Stories</h2>
        <Link href="/showcase" className="text-primary text-sm hover:underline">
          View All
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-0">
        {isLoading ? (
          // Skeleton Loader
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-28 h-40 rounded-xl bg-muted animate-pulse border border-border"
            >
              <div className="w-full h-full relative">
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-2 bg-muted-foreground/20 rounded-full" />
              </div>
            </div>
          ))
        ) : (
          groups.map((group) => {
            const isMyGroup = group.is_current_user;

            // 1. My Story (with create button)
            if (isMyGroup) {
              if (group.stories.length === 0) {
                return (
                  <button
                    key="my-empty"
                    onClick={onCreateClick}
                    className="flex-shrink-0 w-28 h-40 rounded-xl relative overflow-hidden group text-left bg-muted hover:bg-muted/80"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <span className="text-foreground text-xs font-medium absolute bottom-2 left-0 w-full text-center">Add Story</span>
                  </button>
                )
              }

              const story = group.stories[group.stories.length - 1];
              const displayImage = getStoryImage(story);

              return (
                <div key="my-story" className="flex-shrink-0 w-28 h-40 relative border-2 border-blue-500 rounded-xl overflow-hidden">
                  <button
                    onClick={() => onStoryClick(story)}
                    className="w-full h-full rounded-xl overflow-hidden group bg-black"
                  >
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={story.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2 left-0 w-full text-white text-xs font-medium truncate text-center shadow-black drop-shadow-md">
                      Your Story
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateClick();
                    }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-4 border-background z-10 hover:bg-primary/90 transition-colors"
                    aria-label="Add new story"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              )
            }

            // 2. Other users' stories
            if (group.stories.length === 0) return null;

            const story = group.stories[group.stories.length - 1];
            const hasUnviewed = group.stories.some(s => !s.has_viewed && !s.isAuthor);
            const displayImage = getStoryImage(story);

            return (
              <button
                key={group.author.id}
                onClick={() => onStoryClick(story)}
                className={`flex-shrink-0 w-28 h-40 rounded-xl relative overflow-hidden group bg-black`}
              >
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={story.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-800" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {story.media_type === 'video' && (
                  <div className="absolute top-2 right-2">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                )}

                {group.stories.length > 1 && (
                  <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm rounded px-1.5 py-0.5">
                    <span className="text-[10px] text-white font-medium">{group.stories.length}</span>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 right-2 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full p-0.5 bg-gradient-to-br from-blue-400 to-purple-500 mb-1 ${hasUnviewed ? 'animate-pulse' : ''}`}>
                    {group.author.avatar ? (
                      <img
                        src={group.author.avatar}
                        alt={group.author.name}
                        className="w-full h-full rounded-full object-cover border-2 border-white"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-500 border-2 border-white" />
                    )}
                  </div>
                  <span className="text-white text-xs font-medium truncate w-full text-center shadow-black drop-shadow-md">
                    {group.author.name}
                  </span>
                </div>
              </button>
            )
          }))}
      </div>
    </div>
  )
}
