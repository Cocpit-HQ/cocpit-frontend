import React, { useState, useRef, useEffect } from "react"
import { Eye, MessageCircle, Play, Share2, ThumbsUp, X, Send, Smile, Search, Check } from "lucide-react"
import { StoryDetail } from "@/types/showcase"

type StoryModalProps = {
  story: StoryDetail
  onClose: () => void
  isDark?: boolean // Marked optional for backward compatibility during refactor
}

const PREDEFINED_EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "😭", "😡", "🤯",
  "👍", "👎", "👏", "🎉", "🔥", "❤️", "🚀", "👀",
  "💯", "✨", "🤔", "😴"
]

const SHARE_USERS = [
  { id: 1, name: "Alice Freeman", role: "Product Designer" },
  { id: 2, name: "Bob Smith", role: "Frontend Developer" },
  { id: 3, name: "Charlie Rose", role: "Project Manager" },
  { id: 4, name: "David Green", role: "UX Researcher" },
  { id: 5, name: "Eva White", role: "Marketing Lead" },
]

export function StoryModal({ story, onClose }: StoryModalProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<string[]>([])
  const [showDescription, setShowDescription] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareSearch, setShareSearch] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [shareMessage, setShareMessage] = useState("")

  const inputRef = useRef<HTMLInputElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAddComment = () => {
    if (comment.trim()) {
      setComments((prev) => [...prev, comment])
      setComment("")
      setShowEmojiPicker(false)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current
    if (!input) return

    const start = input.selectionStart || 0
    const end = input.selectionEnd || 0
    const nextText = comment.substring(0, start) + emoji + comment.substring(end)

    setComment(nextText)
    setShowEmojiPicker(false)

    setTimeout(() => {
      input.focus()
      const newCursorPos = start + emoji.length
      input.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const toggleUserSelection = (id: number) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    )
  }

  const handleShare = () => {
    // Mock share action
    console.log("Sharing to:", selectedUsers, "Message:", shareMessage)
    setShowShareModal(false)
    setSelectedUsers([])
    setShareMessage("")
    setShareSearch("")
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border-border rounded-2xl border overflow-hidden w-full max-w-7xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex-shrink-0">
              <img src={story.author.avatar} alt={story.author.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-foreground">{story.author.name}</h3>
              {story.authorTitle && <p className="text-sm text-muted-foreground">{story.authorTitle}</p>}
            </div>
          </div>
          <button
            className="bg-muted hover:bg-muted/80 rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
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
                    <Play className="w-10 h-10 text-black ml-1" />
                  </div>
                </div>
              )}
            </div>

            <div
              className={`relative px-6 py-4 transition-all duration-300 cursor-pointer ${
                showDescription ? "bg-muted/50" : "bg-transparent"
              }`}
              onClick={() => setShowDescription((prev) => !prev)}
            >
              <p
                className={`text-foreground transition-all duration-300 ${
                  showDescription ? "opacity-100" : "opacity-30"
                }`}
              >
                {story.description}
              </p>
              {!showDescription && (
                <div className="text-xs mt-2 text-muted-foreground">Click to read description</div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
            className={`border-l border-border flex flex-col transition-all duration-500 ${
              showComments ? "w-1/2" : "w-auto"
            }`}
          >
            <div
              className={`flex ${showComments ? "flex-col p-6 gap-3" : "flex-col p-4 gap-3"} border-b border-border`}
            >
              <button
                onClick={() => setIsLiked((prev) => !prev)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                  isLiked
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                {showComments && <span>{isLiked ? "Liked" : "Like"}</span>}
              </button>
              <button
                onClick={() => setShowComments((prev) => !prev)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                  showComments
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                {showComments && <span>Comments</span>}
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
              >
                <Share2 className="w-5 h-5" />
                {showComments && <span>Share</span>}
              </button>
            </div>

            {showComments && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <h4 className="text-foreground">Comments</h4>

                <div className="flex gap-3 items-end">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-card border-border text-foreground placeholder-muted-foreground border rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:border-primary transition-colors"
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    />
                    <button
                      ref={emojiButtonRef}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    {showEmojiPicker && (
                      <div
                        ref={pickerRef}
                        className="absolute bottom-full right-0 mb-2 z-50 shadow-xl rounded-lg bg-card border border-border p-3 w-64"
                      >
                        <div className="grid grid-cols-5 gap-1">
                          {PREDEFINED_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiSelect(emoji)}
                              className="w-10 h-10 flex items-center justify-center text-xl hover:bg-muted rounded-lg transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAddComment}
                    className="bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {comments.length > 0 && (
                  <div className="space-y-3">
                    {comments.map((commentText, index) => (
                      <div key={index} className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm mb-1 text-foreground">You</p>
                            <p className="text-muted-foreground">{commentText}</p>
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
                    <div key={idx} className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="mb-1 text-foreground">{item.name}</p>
                          <p className="text-muted-foreground">{item.text}</p>
                          <p className="text-muted-foreground/60 text-xs mt-1">{item.time}</p>
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

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation()
            setShowShareModal(false)
          }}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl w-full max-w-md flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">Share to</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={shareSearch}
                  onChange={(e) => setShareSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto max-h-[300px] p-2 space-y-1">
              {SHARE_USERS.filter(
                (u) =>
                  u.name.toLowerCase().includes(shareSearch.toLowerCase()) ||
                  u.role.toLowerCase().includes(shareSearch.toLowerCase())
              ).map((user) => {
                const isSelected = selectedUsers.includes(user.id)
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50" : "hover:bg-blue-50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.role}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <textarea
                placeholder="Write a message..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-20 mb-3 text-slate-900 placeholder:text-slate-400 transition-all"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleShare}
                  disabled={selectedUsers.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
