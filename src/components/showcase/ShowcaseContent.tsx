"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Eye, MessageCircle, Play, Share2, ThumbsUp, X, Send, Plus } from "lucide-react"

import SuggestionsPanel from "@/components/SuggestionsPanel"
import { AppShell } from "@/components/layout/AppShell"
import type { Page, Theme } from "@/types/common"
import type { StoryCard, StoryDetail } from "@/types/showcase"
import { CreateStoryForm } from "@/components/showcase/CreateStoryForm"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
  achievements: "/achievements",
}

const storiesSeed: StoryDetail[] = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1709715357520-5e1047a2b691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHRlYW0lMjBtZWV0aW5nfGVufDF8fHx8MTc2NTM5NzQ5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    author: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    },
    title: "Behind the scenes of our design sprint",
    timeAgo: "4h ago",
    views: 1233,
    likes: 89,
    comments: 12,
    authorTitle: "Senior Designer",
    description:
      "What an incredible week! Our design team came together for an intensive 5-day design sprint. From brainstorming sessions to prototyping, we pushed our creative boundaries and developed some amazing solutions. Proud of what we accomplished together! 🚀",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1680459575585-390ed5cfcae0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjBjb2xsYWJvcmF0aW9ufGVufDF8fHx8MTc2NTM1MzY5MHww&ixlib=rb-4.1.0&q=80&w=1080",
    author: {
      name: "Mike Torres",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    },
    title: "Quick demo of our new feature",
    timeAgo: "6h ago",
    views: 847,
    likes: 156,
    comments: 23,
    isVideo: true,
    authorTitle: "Product Lead",
    description:
      "Excited to share a sneak peek of our latest product feature! This has been months in the making and the team has done an incredible job. Can’t wait to hear your thoughts!",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1690192123455-6337e6db4179?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY2VsZWJyYXRpb258ZW58MXx8fHwxNzY1MzU2OTY0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    author: {
      name: "Emma Peterson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    },
    title: "Team celebration after successful launch",
    timeAgo: "8h ago",
    views: 987,
    likes: 203,
    comments: 8,
    authorTitle: "Marketing Director",
    description:
      "Celebrating our biggest product launch to date! Thank you to everyone who made this possible. The hard work and dedication from this team is truly inspiring. Here’s to many more wins! 🎉",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByZXNlbnRhdGlvbnxlbnwxfHx8fDE3NjUzMjU3MjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    author: {
      name: "David Kim",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    },
    title: "Data visualization masterclass",
    timeAgo: "8h ago",
    views: 4421,
    likes: 234,
    comments: 45,
    isVideo: true,
    authorTitle: "Data Analyst",
    description:
      "Sharing some insights from our latest data analysis project. The patterns we discovered are fascinating! Always amazed by what the data reveals when you look closely enough.",
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1650978810653-112cb6018092?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHN0cmF0ZWd5fGVufDF8fHx8MTc2NTQyMTI4OHww&ixlib=rb-4.1.0&q=80&w=1080",
    author: {
      name: "Alex Rivera",
      avatar: "https://images.unsplash.com/photo-1655249481446-25d575f1c054?w=150&h=150&fit=crop",
    },
    title: "Roadmap planning session",
    timeAgo: "12h ago",
    views: 756,
    likes: 65,
    comments: 15,
    authorTitle: "Project Manager",
    description:
      "Strategic planning session for Q2! Love working with such a collaborative team. The ideas flowing in these meetings are what drive our success forward.",
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1746021375246-7dc8ab0583f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzY1Mzg2MDM5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    author: {
      name: "James Wilson",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
    },
    title: "Closing the biggest deal of the quarter",
    timeAgo: "1d ago",
    views: 4567,
    likes: 321,
    comments: 67,
    authorTitle: "Content Creator",
    description:
      "What a moment! After weeks of negotiations, we finally closed the deal. Grateful for the opportunity and the amazing team that supported me throughout this journey. 💼",
  },
]

function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<Theme>("light")

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const updateTheme = (matches: boolean) => setSystemTheme(matches ? "dark" : "light")
    updateTheme(mediaQuery.matches)
    const listener = (event: MediaQueryListEvent) => updateTheme(event.matches)
    mediaQuery.addEventListener("change", listener)
    return () => mediaQuery.removeEventListener("change", listener)
  }, [])

  return systemTheme
}

function ShowcaseSkeletonCard({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`rounded-xl overflow-hidden border animate-pulse ${
        isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
      }`}
    >
      <div className={`h-48 ${isDark ? "bg-[#1f2534]" : "bg-gray-200"}`} />
      <div className="p-4 space-y-3">
        <div
          className={`h-5 rounded w-3/4 ${isDark ? "bg-[#323a4b]" : "bg-gray-200"}`}
        />
        <div
          className={`h-4 rounded w-1/2 ${isDark ? "bg-[#323a4b]" : "bg-gray-200"}`}
        />
        <div
          className={`h-4 rounded w-full ${isDark ? "bg-[#323a4b]" : "bg-gray-200"}`}
        />
      </div>
    </div>
  )
}

function AuthorBadge({ story }: { story: StoryDetail }) {
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

function StoryModal({
  story,
  onClose,
  isDark,
}: {
  story: StoryDetail
  onClose: () => void
  isDark: boolean
}) {
  const [isLiked, setIsLiked] = useState(false)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<string[]>([])
  const [showDescription, setShowDescription] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const handleAddComment = () => {
    if (comment.trim()) {
      setComments((prev) => [...prev, comment])
      setComment("")
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} rounded-2xl border overflow-hidden w-full max-w-7xl max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-[#2d3548]" : "border-gray-200"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex-shrink-0">
              <img src={story.author.avatar} alt={story.author.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className={isDark ? "text-white" : "text-gray-900"}>{story.author.name}</h3>
              {story.authorTitle && <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{story.authorTitle}</p>}
            </div>
          </div>
          <button
            className={`${isDark ? "bg-[#171c28] hover:bg-[#2d3548]" : "bg-gray-100 hover:bg-gray-200"} rounded-full p-2 ${isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className={`flex flex-col transition-all duration-500 ${showComments ? "w-1/2" : "w-full"}`}>
            <div className="relative overflow-hidden bg-black aspect-video">
              <img src={story.image} alt={story.title} className="w-full h-full object-contain" />
              {story.isVideo && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                    <Play className="w-10 h-10 text-[#171c28] ml-1" />
                  </div>
                </div>
              )}
            </div>

            <div
              className={`relative px-6 py-4 transition-all duration-300 cursor-pointer ${
                showDescription ? (isDark ? "bg-[#1a1f2e]" : "bg-gray-50") : "bg-transparent"
              }`}
              onClick={() => setShowDescription((prev) => !prev)}
            >
              <p
                className={`${isDark ? "text-white" : "text-gray-900"} transition-all duration-300 ${
                  showDescription ? "opacity-100" : "opacity-30"
                }`}
              >
                {story.description}
              </p>
              {!showDescription && (
                <div className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Click to read description</div>
              )}
            </div>

            <div className={`px-6 py-4 border-t ${isDark ? "border-[#2d3548]" : "border-gray-200"}`}>
              <div className={`flex items-center gap-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{story.views} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{story.timeAgo}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{isLiked ? (story.likes ?? 0) + 1 : story.likes ?? 0} likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{(story.comments ?? 0) + comments.length} comments</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`border-l ${isDark ? "border-[#2d3548]" : "border-gray-200"} flex flex-col transition-all duration-500 ${
              showComments ? "w-1/2" : "w-auto"
            }`}
          >
            <div
              className={`flex ${showComments ? "flex-col p-6 gap-3" : "flex-col p-4 gap-3"} border-b ${
                isDark ? "border-[#2d3548]" : "border-gray-200"
              }`}
            >
              <button
                onClick={() => setIsLiked((prev) => !prev)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                  isLiked
                    ? "bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white"
                    : isDark
                      ? "bg-[#171c28] text-gray-400 hover:text-white hover:bg-[#2d3548]"
                      : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                {showComments && <span>{isLiked ? "Liked" : "Like"}</span>}
              </button>
              <button
                onClick={() => setShowComments((prev) => !prev)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                  showComments
                    ? "bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white"
                    : isDark
                      ? "bg-[#171c28] text-gray-400 hover:text-white hover:bg-[#2d3548]"
                      : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                {showComments && <span>Comments</span>}
              </button>
              <button
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg ${
                  isDark
                    ? "bg-[#171c28] text-gray-400 hover:text-white hover:bg-[#2d3548]"
                    : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                } transition-all`}
              >
                <Share2 className="w-5 h-5" />
                {showComments && <span>Share</span>}
              </button>
            </div>

            {showComments && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <h4 className={isDark ? "text-white" : "text-gray-900"}>Comments</h4>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className={`flex-1 ${
                      isDark
                        ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                    } border rounded-lg px-4 py-3 focus:outline-none focus:border-[#5B7CFF] transition-colors`}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    className="bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white px-4 py-3 rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {comments.length > 0 && (
                  <div className="space-y-3">
                    {comments.map((commentText, index) => (
                      <div key={index} className={`${isDark ? "bg-[#171c28]" : "bg-gray-50"} rounded-lg p-4`}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0" />
                          <div className="flex-1">
                            <p className={`text-sm mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>You</p>
                            <p className={isDark ? "text-gray-300" : "text-gray-700"}>{commentText}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  {[
                    { name: "Alex Chen", text: "Amazing work! This is really inspiring.", time: "2h ago" },
                    { name: "Sarah Johnson", text: "Great insights! Would love to learn more about this.", time: "3h ago" },
                    { name: "Michael Brown", text: "This is exactly what I needed to see today!", time: "5h ago" },
                  ].map((item, idx) => (
                    <div key={idx} className={`${isDark ? "bg-[#171c28]" : "bg-gray-50"} rounded-lg p-4`}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className={`mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{item.name}</p>
                          <p className={isDark ? "text-gray-300" : "text-gray-700"}>{item.text}</p>
                          <p className="text-gray-500 text-xs mt-1">{item.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ShowcaseContent() {
  const router = useRouter()
  const { resolvedTheme, theme } = useTheme()
  const systemTheme = useSystemTheme()

  const isDark = useMemo(
    () => resolvedTheme === "dark",
    [resolvedTheme]
  )

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const [loading, setLoading] = useState(true)
  const [stories, setStories] = useState<StoryDetail[]>([])
  const [selectedStory, setSelectedStory] = useState<StoryDetail | null>(null)
  const [showCreateStory, setShowCreateStory] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setStories(storiesSeed)
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
      <AppShell currentPage="network" navigateTo={navigateTo} onAdd={() => setShowCreateStory(true)}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div>
              <h1 className={isDark ? "text-white mb-2" : "text-gray-900 mb-2"}>Showcase</h1>
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>Share your professional journey through stories</p>
            </div>
            <button
              onClick={() => setShowCreateStory(true)}
              className="bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 text-sm md:text-base"
            >
              <Plus className="w-5 h-5" />
              Create Story
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 pb-4">
            {/* Stories Grid */}
            <section className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading &&
                  Array.from({ length: 4 }).map((_, idx) => (
                    <ShowcaseSkeletonCard key={idx} isDark={isDark} />
                  ))}

                {!loading &&
                  stories.map((story) => (
                    <div
                      key={story.id}
                      className={`rounded-xl overflow-hidden border transition-all group cursor-pointer ${
                        isDark
                          ? "bg-[#242b3d] border-[#2d3548] hover:border-[#404968]"
                          : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                      }`}
                      onClick={() => setSelectedStory(story)}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={story.image}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {story.isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-white ml-1" />
                            </div>
                          </div>
                        )}
                        <AuthorBadge story={story} />
                      </div>

                      <div className="p-4">
                        <h3
                          className={`mb-2 group-hover:text-[#5B7CFF] transition-colors ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {story.title}
                        </h3>
                        <div className={`flex items-center justify-between text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}>
                          <span>{story.timeAgo}</span>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{story.views.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{story.likes}</span>
                            </div>
                            {story.comments ? (
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{story.comments}</span>
                              </div>
                            ) : null}
                            <button className={`transition-colors ${
                              isDark ? "hover:text-white" : "hover:text-gray-900"
                            }`}>
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* Suggestions */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 md:top-28">
                <SuggestionsPanel theme={isDark ? "dark" : "light"} />
              </div>
            </aside>
          </div>
        </div>
      </AppShell>
      {selectedStory && (
        <StoryModal story={selectedStory} onClose={() => setSelectedStory(null)} isDark={isDark} />
      )}

       {showCreateStory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${isDark ? "bg-[#242b3d]" : "bg-white"} rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
            <div
              className={`sticky top-0 ${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} border-b px-6 py-4 flex items-center justify-between`}
            >
              <h2 className={isDark ? "text-white" : "text-gray-900"}>Create Story</h2>
              <button
                onClick={() => setShowCreateStory(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-[#171c28] text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <CreateStoryForm isDark={isDark} onCancel={() => setShowCreateStory(false)} onCreated={() => setShowCreateStory(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
