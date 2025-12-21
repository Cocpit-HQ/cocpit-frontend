import React, { useState } from "react"
import { Eye, MessageCircle, Play, Share2, ThumbsUp, X, Send } from "lucide-react"
import { StoryDetail } from "@/types/showcase"

type StoryModalProps = {
  story: StoryDetail
  onClose: () => void
  isDark: boolean
}

export function StoryModal({ story, onClose, isDark }: StoryModalProps) {
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
            className={`${isDark ? "bg-background hover:bg-[#2d3548]" : "bg-gray-100 hover:bg-gray-200"} rounded-full p-2 ${isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors`}
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
                      ? "bg-background text-gray-400 hover:text-white hover:bg-[#2d3548]"
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
                      ? "bg-background text-gray-400 hover:text-white hover:bg-[#2d3548]"
                      : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                {showComments && <span>Comments</span>}
              </button>
              <button
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg ${
                  isDark
                    ? "bg-background text-gray-400 hover:text-white hover:bg-[#2d3548]"
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
                        ? "bg-background border-[#2d3548] text-white placeholder-gray-400"
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
                      <div key={index} className={`${isDark ? "bg-background" : "bg-gray-50"} rounded-lg p-4`}>
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
                    <div key={idx} className={`${isDark ? "bg-background" : "bg-gray-50"} rounded-lg p-4`}>
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
