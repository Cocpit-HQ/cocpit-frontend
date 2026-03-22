import React from "react"
import { Play, Layers, Eye, ThumbsUp } from "lucide-react"
import { AuthorBadge } from "@/components/showcase/AuthorBadge"
import { formatCompactNumber } from "@/lib/utils"
import type { StoryGroup, StoryDetail } from "@/types/showcase"
import { getStoryThumbnailUrl } from "@/lib/story-media"

interface StoryCardProps {
    group: StoryGroup
    onClick: () => void
}

export function StoryCard({ group, onClick }: StoryCardProps) {
    const sortedStories = group.stories // Assuming already sorted by parent or we just take the list
    const latestStory = sortedStories[sortedStories.length - 1]
    const storiesCount = group.stories.length
    const previewImage = latestStory ? getStoryThumbnailUrl(latestStory) : undefined
    const fallbackBackground = latestStory?.story_metadata?.type === "job"
        ? latestStory.story_metadata?.backgroundStyle || ""
        : latestStory?.story_metadata?.backgroundStyle || "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"

    if (!latestStory) return null

    // Check if there are any unviewed stories in the group (excluding own)
    const hasUnviewed = group.stories.some(s => !s.has_viewed) && !group.is_current_user

    // Direct click to open
    const handleClick = (e: React.MouseEvent) => {
        onClick()
    }

    return (
        <div
            className={`rounded-xl overflow-hidden border transition-all group cursor-pointer bg-card relative ${group.is_current_user
                ? 'border-blue-500'
                : hasUnviewed
                    ? 'border-primary ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
            onClick={handleClick}
        >
            <div className="relative h-48 overflow-hidden">
                {/* Content Wrapper that gets blurred */}
                <div className={`w-full h-full transition-all duration-500 filter blur-xl group-hover:blur-lg`}>
                    {/* Background Image/Color */}
                    <div className="w-full h-full absolute inset-0">
                        {previewImage ? (
                            <img
                                src={previewImage}
                                alt={latestStory.title}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        ) : (
                            <div className={`w-full h-full ${fallbackBackground}`} />
                        )}
                    </div>

                    {/* Video Icon - Now Blurred */}
                    {latestStory.isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-10">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <Play className="w-8 h-8 text-white ml-1" />
                            </div>
                        </div>
                    )}

                    {/* Author Badge - Now Blurred */}
                    <div className="relative z-10">
                        <AuthorBadge story={{ ...latestStory, author: group.author }} />
                    </div>

                    {/* Top Right Story Count Badge - Now Blurred */}
                    {storiesCount > 1 && (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1 z-10 border border-white/10">
                            <Layers className="w-3 h-3" />
                            {storiesCount}
                        </div>
                    )}
                </div>

                {/* Overhead Overlay text - Sharp */}
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">Tap to view</span>
                </div>
            </div>

            <div className="p-3 relative z-10 bg-card">
                <h3
                    className="mb-1 group-hover:text-primary transition-colors text-foreground"
                >
                    {group.is_current_user ? "Your Story" : group.author.name}
                </h3>
                <div className="flex flex-wrap items-center justify-between text-xs gap-y-1 text-muted-foreground">
                    <span>{latestStory.timeAgo}</span>
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{formatCompactNumber(latestStory.views)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{formatCompactNumber(latestStory.likes)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
