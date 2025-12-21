import React, { useState } from "react"
import { Eye, Heart, MessageCircle, X, Send, ChevronDown } from "lucide-react"
import { StoryDetail } from "@/types/showcase"

type StoryInteractionPanelProps = {
  isOpen: boolean
  onClose: () => void
  story: StoryDetail
  isMyStory: boolean
  isDark: boolean
}

export function StoryInteractionPanel({ isOpen, onClose, story, isMyStory, isDark }: StoryInteractionPanelProps) {
  const [activeTab, setActiveTab] = useState<"views" | "likes" | "comments">(isMyStory ? "views" : "comments")
  const [comment, setComment] = useState("")
  const [localComments, setLocalComments] = useState<string[]>([])

  // Reset tab when story changes or panel opens
  // Actually standard behavior is to remember or reset. We'll reset to sensible default.
  // If my story -> views, else -> comments.

  if (!isOpen) return null

  const handleAddComment = () => {
    if (comment.trim()) {
      setLocalComments((prev) => [...prev, comment])
      setComment("")
    }
  }

  return (
    <div
        className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm transition-all duration-300"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
    >
        {/* Click outside to close area */}
        <div className="flex-1" />

        <div
            className={`
                w-full rounded-t-2xl overflow-hidden flex flex-col max-h-[70vh] cursor-default
                ${isDark ? "bg-[#242b3d] text-white" : "bg-white text-gray-900"}
            `}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
        >
            {/* Handle/Grabber */}
            <div className="w-full flex items-center justify-center pt-3 pb-2 cursor-pointer" onClick={onClose}>
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Tabs (Only for My Story) */}
            {isMyStory && (
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab("views")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2
                            ${activeTab === "views" ? "border-[#5B7CFF] text-[#5B7CFF]" : "border-transparent text-gray-500"}`}
                    >
                        <Eye className="w-4 h-4" />
                        <span>{story.views}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("likes")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2
                            ${activeTab === "likes" ? "border-[#5B7CFF] text-[#5B7CFF]" : "border-transparent text-gray-500"}`}
                    >
                        <Heart className="w-4 h-4" />
                        <span>{story.likes}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("comments")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2
                            ${activeTab === "comments" ? "border-[#5B7CFF] text-[#5B7CFF]" : "border-transparent text-gray-500"}`}
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>{(story.comments || 0) + localComments.length}</span>
                    </button>
                </div>
            )}

            {/* Header for Others (Just counts, no tabs) */}
            {!isMyStory && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                     <h3 className="font-semibold text-lg">Comments</h3>
                     <div className="flex gap-4 text-sm text-gray-500">
                         <div className="flex items-center gap-1">
                             <Eye className="w-4 h-4" /> {story.views}
                         </div>
                         <div className="flex items-center gap-1">
                             <Heart className="w-4 h-4" /> {story.likes}
                         </div>
                     </div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
                {activeTab === "views" && isMyStory && (
                    <div className="space-y-4">
                        {story.viewers?.map((viewer, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <img src={viewer.avatar} alt={viewer.name} className="w-10 h-10 rounded-full object-cover" />
                                <span className="font-medium">{viewer.name}</span>
                            </div>
                        ))}
                        {(!story.viewers || story.viewers.length === 0) && (
                            <p className="text-center text-gray-500 py-4">No views yet</p>
                        )}
                    </div>
                )}

                {activeTab === "likes" && isMyStory && (
                    <div className="space-y-4">
                        {story.likers?.map((liker, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <img src={liker.avatar} alt={liker.name} className="w-10 h-10 rounded-full object-cover" />
                                <div className="flex-1">
                                    <span className="font-medium">{liker.name}</span>
                                </div>
                                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                            </div>
                        ))}
                        {(!story.likers || story.likers.length === 0) && (
                             <p className="text-center text-gray-500 py-4">No likes yet</p>
                        )}
                    </div>
                )}

                {(activeTab === "comments" || !isMyStory) && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-4 mb-4">
                             {/* Mock Comments */}
                             <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200" />
                                <div className={`${isDark ? "bg-[#171c28]" : "bg-gray-100"} rounded-lg p-3 flex-1`}>
                                    <p className="text-sm font-semibold mb-1">Alice</p>
                                    <p className="text-sm">Great shot! 🔥</p>
                                </div>
                             </div>
                             {localComments.map((c, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500" />
                                    <div className={`${isDark ? "bg-[#171c28]" : "bg-gray-100"} rounded-lg p-3 flex-1`}>
                                        <p className="text-sm font-semibold mb-1">You</p>
                                        <p className="text-sm">{c}</p>
                                    </div>
                                </div>
                             ))}
                        </div>

                        {/* Input Area */}
                        <div className="flex gap-2 mt-auto pt-2">
                             <input
                                type="text"
                                placeholder="Add a comment..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className={`flex-1 px-4 py-2 rounded-full border focus:outline-none focus:border-[#5B7CFF]
                                    ${isDark ? "bg-[#171c28] border-gray-700" : "bg-gray-50 border-gray-300"}
                                `}
                             />
                             <button
                                onClick={handleAddComment}
                                className="p-2 rounded-full bg-[#5B7CFF] text-white"
                             >
                                <Send className="w-5 h-5" />
                             </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  )
}
