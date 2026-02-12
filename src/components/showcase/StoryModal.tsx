import React, { useState, useRef, useEffect } from "react"
import Link from 'next/link'
import { Eye, MessageCircle, Play, Share2, ThumbsUp, X, Send, Smile, Search, Check, MoreVertical, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { StoryAuthor, StoryDetail } from "@/types/showcase"
import { showcaseService } from "@/services/showcase.service"
import { StoryMetadata, StoryLayer } from "@/types/story-editor"
import { useRouter } from "next/navigation"
import { useActiveProfile } from "@/context/ActiveProfileContext"

type StoryModalProps = {
  story: StoryDetail
  onClose: () => void
  isDark?: boolean
  onStoryUpdate?: (story: StoryDetail) => void
  onNext?: () => void
  onPrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
}

interface StoryAnalytics {
  viewerCount: number;
  viewers: StoryAuthor[];
  likers: StoryAuthor[];
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



const ViewerLayerItem = ({ layer, fallbackMedia }: { layer: StoryLayer, fallbackMedia?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  // Handle video playback
  useEffect(() => {
    if (layer.type === 'video' && videoRef.current) {
      const vid = videoRef.current;

      if (layer.trim) {
        vid.currentTime = layer.trim.start;
      }

      vid.play().catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Video play failed:', err);
        }
      });
    }
  }, [layer]);

  const getSource = () => {
    if (layer.type === 'text' || layer.type === 'post') return '';
    // @ts-ignore - we know other types have src
    const src = layer.src;
    if (src && src.startsWith('blob:') && fallbackMedia) {
      return fallbackMedia;
    }
    return src || '';
  };

  const handlePostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (layer.type === 'post' && layer.post_data.id) {
      router.push(`/post/${layer.post_data.id}`);
    }
  };

  return (
    <div
      className={`absolute origin-center ${layer.type === 'post' ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        width: layer.type === 'text' ? 'auto' : `${layer.width}%`,
        height: layer.type === 'text' ? 'auto' : `${layer.height}%`,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
        zIndex: layer.zIndex + 10,
      }}
      onClick={layer.type === 'post' ? handlePostClick : undefined}
    >
      {layer.type === 'text' ? (
        <p style={{
          color: layer.style.color,
          fontSize: `${layer.style.fontSize}px`,
          fontWeight: layer.style.fontWeight,
          fontFamily: layer.style.fontFamily,
          textAlign: layer.style.textAlign,
          whiteSpace: 'nowrap',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          padding: '4px'
        }}>
          {layer.content}
        </p>
      ) : layer.type === 'video' && getSource() ? (
        <video
          ref={videoRef}
          src={getSource()}
          className="w-full h-full object-contain"
          muted={layer.isMuted}
          autoPlay
          loop
          playsInline
          crossOrigin="anonymous"
          onTimeUpdate={(e) => {
            if (layer.trim) {
              const vid = e.currentTarget;
              if (vid.currentTime < layer.trim.start || vid.currentTime >= layer.trim.end) {
                vid.currentTime = layer.trim.start;
              }
            }
          }}
          onLoadedMetadata={(e) => {
            if (layer.trim) {
              e.currentTarget.currentTime = layer.trim.start;
            }
          }}
        />
      ) : layer.type === 'sticker' && getSource() ? (
        <img src={getSource()} className="w-full h-full object-contain" />
      ) : layer.type === 'image' && getSource() ? (
        <img src={getSource()} className="w-full h-full object-contain" />
      ) : layer.type === 'post' ? (
        <div className="w-full h-full bg-white dark:bg-card rounded-xl p-4 shadow-lg border border-border flex flex-col gap-3 overflow-hidden hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-secondary overflow-hidden shrink-0">
              {layer.post_data.author?.avatar ? (
                <img src={layer.post_data.author.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-muted-foreground">
                  {layer.post_data.author?.name?.[0]}
                </div>
              )}
            </div>
            <div className="text-xs font-bold text-gray-900 dark:text-foreground">{layer.post_data.author?.name}</div>
          </div>
          {layer.post_data.content && (
            <p className="text-xs text-gray-800 dark:text-foreground line-clamp-3 leading-relaxed">
              {layer.post_data.content}
            </p>
          )}
          {layer.post_data.media?.[0]?.url && (
            <div className="relative flex-1 min-h-0 w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-muted">
              {layer.post_data.media[0].media_type === 'video' ? (
                <video
                  src={layer.post_data.media[0].url}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img src={layer.post_data.media[0].url} alt="Post media" className="w-full h-full object-cover" />
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export function StoryModal({ story, onClose, onStoryUpdate, onNext, onPrev, hasNext, hasPrev }: StoryModalProps) {
  const [isLiked, setIsLiked] = useState(!!story.isLiked)
  const [comment, setComment] = useState("")

  // Real Data State
  const [activeTab, setActiveTab] = useState<'comments' | 'viewers' | 'likes'>('comments')
  const [realComments, setRealComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)

  // UI State
  const [showDescription, setShowDescription] = useState(false)
  const [showComments, setShowComments] = useState(false) // Keeping for compatibility if used elsewhere, though mostly replaced by activeTab logic
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareSearch, setShareSearch] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [shareMessage, setShareMessage] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const [details, setDetails] = useState<StoryAnalytics | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const { activeProfile } = useActiveProfile();

  // View Story effect & Fetch Details if Author
  useEffect(() => {
    const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
    showcaseService.viewStory(story.id, companyId).catch(err => console.error("View story failed", err));

    if (story.isAuthor) {
      showcaseService.getStoryDetails(story.id).then(data => {
        setDetails(data);
      }).catch(err => console.error("Failed to fetch details", err));
    }
  }, [story.id, story.isAuthor, activeProfile]);

  // Fetch comments
  useEffect(() => {
    setLoadingComments(true)
    showcaseService.getStoryComments(story.id)
      .then(data => setRealComments(data))
      .catch(err => console.error("Failed to fetch comments", err))
      .finally(() => setLoadingComments(false))
  }, [story.id])

  const currentViewCount = details?.viewerCount ?? story.views;
  const currentLikeCount = details ? details.likers.length : (story.likes ?? 0);

  const metadata = React.useMemo(() => {
    const meta = (story.story_metadata as unknown as StoryMetadata) || { layers: [] };
    const layers = meta.layers || [];

    // Legacy Support: If no layers, create one from the base media
    if (layers.length === 0) {
      if (story.shared_post) {
        layers.push({
          id: 'shared-post',
          type: 'post',
          x: 50, y: 50, width: 80, height: 60, rotation: 0, scale: 1, zIndex: 0,
          post_data: {
            id: story.shared_post.post_id,
            content: story.shared_post.content,
            author: {
              name: story.shared_post.author?.full_name || 'Unknown',
              avatar: story.shared_post.author?.avatar_url
            },
            media: story.shared_post.media
          },
          style: {}
        } as any);
      }
      else if (story.isVideo || story.media_type === 'video') {
        layers.push({
          id: 'legacy-video',
          type: 'video',
          src: story.media_url || story.image || '', // Fallback to image if video url missing? No, user needs video. 
          // But actually story.image usually holds thumbnail for video. 
          // If it's video, we need media_url. 
          x: 50, y: 50, width: 100, height: 100, rotation: 0, scale: 1, zIndex: 0,
          style: {}
        } as any);
      } else if (story.image || story.thumbnail_url) {
        layers.push({
          id: 'legacy-image',
          type: 'image',
          src: story.image || story.thumbnail_url || '',
          x: 50, y: 50, width: 100, height: 100, rotation: 0, scale: 1, zIndex: 0,
          style: {}
        } as any);
      }
    }

    return { ...meta, layers };
  }, [story]);

  const handleDeleteStory = async () => {
    if (confirm("Are you sure you want to delete this story?")) {
      try {
        await showcaseService.deleteStory(story.id);
        onClose();
        window.location.reload();
      } catch (error) {
        console.error("Failed to delete story", error);
        alert("Failed to delete story");
      }
    }
  }

  const inputRef = useRef<HTMLInputElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle Emoji Picker
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false)
      }

      // Handle Story Menu
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAddComment = async () => {
    if (comment.trim()) {
      try {
        const newComment = await showcaseService.addStoryComment(story.id, comment);
        setRealComments(prev => [...prev, {
          ...newComment.comment,
          full_name: "You",
          avatar_url: null,
          is_current_user: true
        }])
        setComment("")
        setShowEmojiPicker(false)
      } catch (err) {
        console.error("Failed to post comment", err)
      }
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

    setShowShareModal(false)
    setSelectedUsers([])
    setShareMessage("")
    setShareSearch("")
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-6xl h-[85vh] bg-card rounded-2xl overflow-hidden flex shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >

        {/* Left Side: Story Media */}
        <div className="flex-1 bg-black relative flex items-center justify-center group/media">
          {/* Navigation Buttons */}
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev?.() }}
              className="absolute left-4 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover/media:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext?.() }}
              className="absolute right-4 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover/media:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Story Content (Layers) */}
          <div className="aspect-[9/16] h-full relative overflow-hidden bg-[#1a1a1a]">
            {metadata.layers.map(layer => (
              <ViewerLayerItem key={layer.id} layer={layer} />
            ))}
            {metadata.layers.length === 0 && (
              <div className="flex items-center justify-center h-full text-white/50 flex-col gap-2">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <p className="text-sm font-medium">No content to display</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sidebar */}
        <div className="w-[400px] flex flex-col bg-card border-l border-border relative">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-xl">
            <Link
              href={story.author?.is_company ? `/company/${story.author.id}` : `/profile/${story.author?.id}`}
              className="flex items-center gap-3 group/author"
            >
              <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden border border-border group-hover/author:border-primary transition-colors">
                {story.author?.avatar ? (
                  <img src={story.author.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground group-hover/author:text-primary transition-colors">
                    {story.author?.name?.[0]}
                  </div>
                )}
              </div>
              <div>
                <div className="font-bold text-sm text-foreground group-hover/author:text-primary transition-colors">{story.author?.name}</div>
                <div className="text-xs text-muted-foreground">{new Date(story.created_at || Date.now()).toLocaleDateString()}</div>
              </div>
            </Link>

            {/* Menu/Close Actions */}
            <div className="flex items-center gap-1">
              {story.isAuthor && (
                <div className="relative" ref={menuRef}>
                  <button
                    ref={menuButtonRef}
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={handleDeleteStory}
                        className="w-full text-left px-4 py-2.5 text-red-500 hover:bg-red-500/10 flex items-center gap-2 text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Story
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Body: Description & Analytics Tabs */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col">
            {/* Description Section */}
            {story.description && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Description</h4>
                <p className="text-foreground leading-relaxed text-sm">
                  {story.description}
                </p>
              </div>
            )}

            {/* Analytics Tabs (Only for Author) */}
            {story.isAuthor && (
              <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'comments' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Comments ({realComments.length})
                </button>
                <button
                  onClick={() => setActiveTab('viewers')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'viewers' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Views ({currentViewCount})
                </button>
                <button
                  onClick={() => setActiveTab('likes')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'likes' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Likes ({currentLikeCount})
                </button>
              </div>
            )}

            {/* Content Area Based on Tab */}
            <div className="flex-1">
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {!story.isAuthor && (
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <MessageCircle className="w-3 h-3" />
                      Comments ({realComments.length})
                    </h4>
                  )}

                  {loadingComments ? (
                    <div className="text-center py-4 text-muted-foreground text-xs">Loading comments...</div>
                  ) : realComments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground/50 italic text-sm">
                      No comments yet. Be the first to say something!
                    </div>
                  ) : (
                    realComments.map((c, idx) => (
                      <div key={c.comment_id || idx} className="group relative bg-muted/30 hover:bg-muted/50 transition-colors rounded-2xl p-3 border border-transparent hover:border-border/50">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full border border-border/50 overflow-hidden flex-shrink-0 bg-secondary">
                            {c.avatar_url ? (
                              <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                {c.full_name?.[0] || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-xs font-bold text-foreground truncate">{c.full_name}</p>
                              <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-foreground/90 leading-relaxed">{c.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'viewers' && story.isAuthor && (
                <div className="space-y-3">
                  {(!details?.viewers || details.viewers.length === 0) ? (
                    <div className="text-center py-8 text-muted-foreground/50 italic text-sm">No views yet.</div>
                  ) : (
                    details.viewers.map((viewer, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-xl transition-colors">
                        <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
                          {viewer.avatar ? (
                            <img src={viewer.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (<div className="w-full h-full flex items-center justify-center text-xs font-bold">{viewer.name[0]}</div>)}
                        </div>
                        <div className="text-sm font-medium text-foreground">{viewer.name}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'likes' && story.isAuthor && (
                <div className="space-y-3">
                  {(!details?.likers || details.likers.length === 0) ? (
                    <div className="text-center py-8 text-muted-foreground/50 italic text-sm">No likes yet.</div>
                  ) : (
                    details.likers.map((liker, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-xl transition-colors">
                        <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
                          {liker.avatar ? (
                            <img src={liker.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (<div className="w-full h-full flex items-center justify-center text-xs font-bold">{liker.name[0]}</div>)}
                        </div>
                        <div className="text-sm font-medium text-foreground">{liker.name}</div>
                        <ThumbsUp className="w-4 h-4 ml-auto text-primary fill-primary" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Sidebar Footer: Actions & Input */}
          <div className="p-6 border-t border-border bg-card/90 backdrop-blur-lg sticky bottom-0">
            <div className="flex gap-3 mb-4">
              <button
                disabled={story.isAuthor}
                onClick={() => {
                  if (story.isAuthor) return;
                  const newLiked = !isLiked;
                  setIsLiked(newLiked);
                  const baseCount = (story.likes || 0) - (story.isLiked ? 1 : 0);
                  const newCount = baseCount + (newLiked ? 1 : 0);
                  if (onStoryUpdate) {
                    onStoryUpdate({ ...story, isLiked: newLiked, likes: newCount });
                  }
                  showcaseService.reactToStory(story.id, newLiked).catch(err => {
                    console.error("React failed", err);
                    setIsLiked(!newLiked);
                  });
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-medium ${isLiked
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  } ${story.isAuthor ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <ThumbsUp className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span>{isLiked ? "Liked" : "Like"}</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-300"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            <div className="relative group">
              <input
                ref={inputRef}
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-muted/50 border-border/50 text-foreground placeholder-muted-foreground border rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  ref={emojiButtonRef}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  onClick={handleAddComment}
                  className={`p-1.5 rounded-lg transition-all ${comment.trim() ? "text-primary hover:scale-110" : "text-muted-foreground opacity-30"}`}
                  disabled={!comment.trim()}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {showEmojiPicker && (
                <div
                  ref={pickerRef}
                  className="absolute bottom-full right-0 mb-3 z-50 shadow-2xl rounded-2xl bg-card border border-border p-4 w-72 animate-in fade-in slide-in-from-bottom-4 duration-300"
                >
                  <div className="grid grid-cols-5 gap-2">
                    {PREDEFINED_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="w-10 h-10 flex items-center justify-center text-xl hover:bg-muted hover:scale-125 rounded-xl transition-all"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div >
      </div >

      {/* Share Modal */}
      {
        showShareModal && (
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
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border-primary/20" : "hover:bg-muted"
                        } `}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected
                          ? "bg-primary border-primary text-primary-foreground scale-110"
                          : "border-border"
                          } `}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-muted/30">
                <textarea
                  placeholder="Write a message..."
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  className="w-full bg-card border-border rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none h-20 mb-3 text-foreground placeholder:text-muted-foreground transition-all"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleShare}
                    disabled={selectedUsers.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}
