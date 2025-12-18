import React from "react"
import { StoryDetail } from "@/types/showcase"

export function AuthorBadge({ story }: { story: StoryDetail }) {
  return (
    <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex-shrink-0">
        <img
          src={story.author.avatar}
          alt={story.author.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="text-white text-xs">{story.author.name}</div>
    </div>
  )
}
