import React from 'react'
import Link from 'next/link'
import { Plus, Play } from 'lucide-react'
import { StoryDetail } from '@/types/showcase'
import { AuthorBadge } from '@/components/showcase/AuthorBadge'

type StoryRailProps = {
  isDark: boolean
  stories: StoryDetail[]
  onCreateClick: () => void
  onStoryClick: (story: StoryDetail) => void
}

export function StoryRail({ isDark, stories, onCreateClick, onStoryClick }: StoryRailProps) {
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

        {/* Story Cards */}
        {stories.map((story) => (
          <button
            key={story.id}
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

            <div className="absolute bottom-2 left-2 right-2 flex flex-col items-center">
               <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-br from-blue-400 to-purple-500 mb-1">
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
        ))}
      </div>
    </div>
  )
}
