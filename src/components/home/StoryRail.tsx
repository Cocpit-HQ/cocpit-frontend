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
      <div className="flex items-center justify-between mb-1 md:mb-3 px-4 md:px-0">
        <h2 className="font-semibold text-lg text-foreground">Stories</h2>
        <Link href="/showcase" className="text-primary text-sm hover:underline hidden md:block">
          View All
        </Link>
      </div>

      <div className="stories-scroll-container">
        <div className="flex gap-3 overflow-x-auto pt-2 pb-2 scrollbar-hide px-4 md:px-0">
          {isLoading ? (
            // Skeleton Loader
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 md:w-28 md:h-40 rounded-full md:rounded-xl bg-muted animate-pulse border border-border overflow-hidden relative">
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent hidden md:block" />
                </div>
                <div className="w-12 h-2 md:absolute md:bottom-3 md:left-1/2 md:-translate-x-1/2 md:w-16 bg-muted-foreground/20 rounded-full" />
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
                      className="flex-shrink-0 flex flex-col items-center gap-2 group text-left"
                    >
                      <div className="w-14 h-14 md:w-28 md:h-40 rounded-full md:rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center border border-border transition-colors">
                        <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Plus className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                        </div>
                      </div>
                      <span className="text-foreground text-[10px] md:text-xs font-medium md:absolute md:bottom-2 md:left-0 md:w-full md:text-center">Add Story</span>
                    </button>
                  )
                }

                const story = group.stories[group.stories.length - 1];
                const displayImage = getStoryImage(story);

                return (
                  <div key="my-story" className="flex-shrink-0 flex flex-col items-center gap-2 group relative">
                    <button
                      onClick={() => onStoryClick(story)}
                      className="w-14 h-14 md:w-28 md:h-40 rounded-full md:rounded-xl border-2 border-primary overflow-hidden bg-black relative p-0.5"
                    >
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={story.title}
                          className="w-full h-full rounded-full md:rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full md:rounded-lg bg-gray-800" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent hidden md:block" />
                      <span className="absolute bottom-2 left-0 w-full text-white text-xs font-medium truncate text-center shadow-black drop-shadow-md hidden md:block">
                        Your Story
                      </span>
                    </button>
                    <span className="text-foreground text-[10px] md:text-xs font-medium md:hidden">Your Story</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateClick();
                      }}
                      className="absolute top-10 md:top-auto md:bottom-8 left-11 md:left-1/2 -translate-x-1/2 w-5 h-5 md:w-10 md:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 md:border-4 border-background z-10 hover:bg-primary/90 transition-colors"
                      aria-label="Add new story"
                    >
                      <Plus className="w-3.5 h-3.5 md:w-6 md:h-6" />
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
                <div key={group.author.id} className="flex-shrink-0 flex flex-col items-center gap-2 group relative">
                  <button
                    onClick={() => onStoryClick(story)}
                    className={`w-14 h-14 md:w-28 md:h-40 rounded-full md:rounded-xl relative overflow-hidden bg-black ${hasUnviewed ? 'ring-2 ring-primary ring-offset-2' : 'border border-border'
                      }`}
                  >
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={story.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent hidden md:block" />

                    {story.media_type === 'video' && (
                      <div className="absolute top-1 right-1 md:top-2 md:right-2">
                        <Play className="w-3 h-3 md:w-4 md:h-4 text-white fill-white" />
                      </div>
                    )}

                    {group.stories.length > 1 && (
                      <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-white/20 backdrop-blur-sm rounded px-1 py-0.5 md:px-1.5 md:py-0.5">
                        <span className="text-[8px] md:text-[10px] text-white font-medium">{group.stories.length}</span>
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 hidden md:flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full p-0.5 bg-gradient-to-br from-blue-400 to-purple-500 mb-1 ${hasUnviewed ? 'animate-pulse' : ''}`}>
                        {group.author.avatar ? (
                          <img
                            src={group.author.avatar}
                            alt={group.author.name}
                            className="w-full h-full rounded-full object-cover border-2 border-white"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gray-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white uppercase">
                            {group.author.name?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <span className="text-white text-xs font-medium truncate w-full text-center shadow-black drop-shadow-md">
                        {group.author.name}
                      </span>
                    </div>
                  </button>
                  <span className="text-foreground text-[10px] md:text-xs font-medium truncate w-16 text-center md:hidden">
                    {group.author.name}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div >
  )
}
