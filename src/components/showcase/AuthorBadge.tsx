import React from "react"
import { StoryDetail } from "@/types/showcase"

export function AuthorBadge({ story }: { story: StoryDetail }) {
  return (
    <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex-shrink-0">
        {story.author?.avatar ? (
          <img
            src={story.author.avatar}
            alt={story.author.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
            {story.author?.name?.[0]}
          </div>
        )}
      </div>
      <div className="text-white text-xs font-medium">{story.author?.name}</div>
    </div>
  )
}
