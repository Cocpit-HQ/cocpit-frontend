import React, { useMemo } from 'react'
import Link from 'next/link'
import { Plus, Play } from 'lucide-react'
import { StoryDetail } from '@/types/showcase'

type StoryRailProps = {
  isDark: boolean
  stories: StoryDetail[]
  onCreateClick: () => void
  onStoryClick: (story: StoryDetail) => void
}

type UserGroup = {
  authorName: string
  latestStory: StoryDetail
  stories: StoryDetail[]
}

export function StoryRail({ isDark, stories, onCreateClick, onStoryClick }: StoryRailProps) {

  const userGroups = useMemo(() => {
    const groups: UserGroup[] = []

    // Group by author
    stories.forEach(story => {
      const existing = groups.find(g => g.authorName === story.author.name)
      if (existing) {
        existing.stories.push(story)
        // Keep track of latest story for the preview image
        if (story.id > existing.latestStory.id) { // Assuming ID correlates with time or added last
            existing.latestStory = story
        }
      } else {
        groups.push({
          authorName: story.author.name,
          latestStory: story,
          stories: [story]
        })
      }
    })

    // Sort groups by latest story (Newest first)
    // We assume higher ID = newer
    groups.sort((a, b) => b.latestStory.id - a.latestStory.id)

    return groups
  }, [stories])

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Stories</h2>
        <Link href="/showcase" className="text-[#5B7CFF] text-sm hover:underline">
          View All
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {/* Your Update Card */}
        <button
          onClick={onCreateClick}
          className="flex-shrink-0 w-28 h-40 rounded-xl relative overflow-hidden group text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#5B7CFF] to-[#7B5CFF] opacity-90 transition-opacity group-hover:opacity-100" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-sm font-medium mt-auto mb-2">Your Update</span>
          </div>
        </button>

        {/* Story Cards (Grouped by User) */}
        {userGroups.map((group) => {
          const story = group.latestStory // Show latest story as preview
          const hasVideo = group.stories.some(s => s.isVideo) // Show video icon if any story has video? Or just the latest? Let's show for latest.

          return (
            <button
              key={group.authorName}
              onClick={() => onStoryClick(story)}
              className="flex-shrink-0 w-28 h-40 rounded-xl relative overflow-hidden group"
            >
              <img
                src={story.image}
                alt={story.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {story.isVideo && (
                 <div className="absolute top-2 right-2">
                   <Play className="w-4 h-4 text-white fill-white" />
                 </div>
              )}

              {/* Multiple cards indicator if more than 1 story? */}
              {group.stories.length > 1 && (
                  <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm rounded px-1.5 py-0.5">
                      <span className="text-[10px] text-white font-medium">{group.stories.length}</span>
                  </div>
              )}

              <div className="absolute bottom-2 left-2 right-2 flex flex-col items-center">
                 <div className={`w-8 h-8 rounded-full p-0.5 bg-gradient-to-br from-blue-400 to-purple-500 mb-1 ${group.stories.length > 1 ? 'animate-pulse' : ''}`}>
                   <img
                     src={story.author.avatar}
                     alt={story.author.name}
                     className="w-full h-full rounded-full object-cover border-2 border-white"
                   />
                 </div>
                 <span className="text-white text-xs font-medium truncate w-full text-center shadow-black drop-shadow-md">
                   {story.author.name}
                 </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
