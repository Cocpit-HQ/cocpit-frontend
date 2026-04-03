import React, { useState, useRef, useEffect } from "react"
import Link from 'next/link'
import { Eye, MessageCircle, Play, Share2, ThumbsUp, X, Send, Smile, Search, Check, MoreVertical, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { StoryAuthor, StoryDetail } from "@/types/showcase"
import { showcaseService } from "@/services/showcase.service"
import { StoryMetadata } from "@/types/story-editor"
import { VirtualLayerCanvas } from "./ViewerLayerItem"
import { SharedPostCard } from "./SharedPostCard"
import { JobStoryCard } from "../jobs/JobStoryCard"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { useStorySync } from "@/components/showcase/hooks/use-story-sync"
import { useStories } from '@/context/StoriesContext'
import { getStoryImageUrl, getStoryThumbnailUrl, getStoryVideoUrl, parseStoryMetadata } from "@/lib/story-media"
import { formatTimeAgo } from "@/lib/utils"
import { useFeed } from "@/hooks/use-feed"

type StoryModalProps = {
  story: StoryDetail
  onClose: () => void
  isDark?: boolean
  onStoryUpdate?: (story: StoryDetail) => void
  onStoryViewed?: (storyId: number) => void
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

interface StoryComment {
  comment_id?: string | number;
  avatar_url?: string | null;
  full_name?: string;
  created_at?: string;
  content?: string;
}

type StoryLayer = {
  id: string;
  type: "image" | "video";
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  zIndex: number;
  style: Record<string, unknown>;
};

type StoryModalMetadata = ReturnType<typeof parseStoryMetadata> & {
  type?: string;
  scale?: number;
  backgroundStyle?: string;
  background?: unknown;
  layers?: StoryLayer[];
};

type JobStoryMetadata = React.ComponentProps<typeof JobStoryCard>["metadata"];

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

export function StoryModal({ story, onClose, onStoryUpdate, onStoryViewed, onNext, onPrev, hasNext, hasPrev }: StoryModalProps) {
  const { activeProfile, isCompany } = useActiveProfile();
  const { currentUser } = useFeed();
  const [isLiked, setIsLiked] = useState(!!story.isLiked)
  const [comment, setComment] = useState("")

  const activeAccount = React.useMemo(() => (
    isCompany && activeProfile
      ? { name: activeProfile.name, image: activeProfile.avatar_url }
      : currentUser
  ), [isCompany, activeProfile, currentUser]);

  // Real Data State
  const [activeTab, setActiveTab] = useState<'comments' | 'viewers' | 'likes'>('comments')
  const [realComments, setRealComments] = useState<StoryComment[] | null>(null)
  const loadingComments = realComments === null

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

  const { setIsStoryViewerOpen, markStoryViewed } = useStories();

  // View Story effect & Fetch Details if Author
  useEffect(() => {
    const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
    // Optimistically mark as viewed so the blue ring disappears immediately
    markStoryViewed(story.id);
    if (onStoryViewed) onStoryViewed(story.id);
    showcaseService.viewStory(story.id, companyId).catch(err => console.error("View story failed", err));

    if (story.isAuthor) {
      showcaseService.getStoryDetails(story.id, companyId).then(data => {
        setDetails(data);
      }).catch(err => console.error("Failed to fetch details", err));
    }
  }, [story.id, story.isAuthor, activeProfile]);

  // Fetch comments
  useEffect(() => {
    showcaseService.getStoryComments(story.id)
      .then(data => setRealComments(data))
      .catch(err => console.error("Failed to fetch comments", err))
      .finally(() => {
        setRealComments((prev) => prev ?? [])
      })
  }, [story.id])

  // Real-time synchronization
  useStorySync(story.id, {
    onCommentAdded: (newComment) => {
      setRealComments(prev => {
        if (!prev) return [newComment];
        if (prev.some(c => c.comment_id === newComment.comment_id)) return prev;
        return [...prev, newComment];
      });
    },
    onReactionUpdated: ({ likeCount }) => {
      if (onStoryUpdate) {
        onStoryUpdate({ ...story, likes: likeCount });
      }
    }
  });

  const currentViewCount = details?.viewerCount ?? story.views;
  const currentLikeCount = details ? details.likers.length : (story.likes ?? 0);
  const uploader = story.author;

  const storyTimestamp = React.useMemo(() => {
    return formatTimeAgo(story.created_at, story.timeAgo);
  }, [story.created_at, story.timeAgo]);

  const storyImageSrc = React.useMemo(() => getStoryImageUrl(story), [story]);
  const storyThumbnailSrc = React.useMemo(() => getStoryThumbnailUrl(story), [story]);
  const storyVideoSrc = React.useMemo(() => getStoryVideoUrl(story), [story]);
  const parsedStoryMetadata = React.useMemo<StoryModalMetadata>(
    () => parseStoryMetadata(story.story_metadata) as StoryModalMetadata,
    [story.story_metadata]
  );
  const isJobStory = parsedStoryMetadata?.type === "job";
  const commentsCount = realComments?.length ?? 0;

  const metadata = React.useMemo(() => {
    const meta = parsedStoryMetadata;
    const layers = Array.isArray(meta?.layers) ? [...meta.layers] : [];

    // Legacy Support: If no layers, create one from the base media
    if (layers.length === 0) {
      if (story.isVideo || story.media_type === 'video') {
        const legacyVideoLayer: StoryLayer = {
          id: 'legacy-video',
          type: 'video',
          src: storyVideoSrc || '',
          x: 50, y: 50, width: 100, height: 100, rotation: 0, scale: 1, zIndex: 0,
          style: {}
        };
        layers.push(legacyVideoLayer);
      } else if (storyImageSrc || storyThumbnailSrc) {
        const legacyImageLayer: StoryLayer = {
          id: 'legacy-image',
          type: 'image',
          src: storyImageSrc || storyThumbnailSrc || '',
          x: 50, y: 50, width: 100, height: 100, rotation: 0, scale: 1, zIndex: 0,
          style: {}
        };
        layers.push(legacyImageLayer);
      }
    }

    return { ...meta, layers };
  }, [parsedStoryMetadata, story, storyImageSrc, storyThumbnailSrc, storyVideoSrc]);
  const jobMetadata = metadata as unknown as JobStoryMetadata;
  const backgroundClass = !storyImageSrc && !storyVideoSrc && typeof metadata?.backgroundStyle === "string"
    ? metadata.backgroundStyle
    : "";

  const handleDeleteStory = async () => {
    if (confirm("Are you sure you want to delete this story?")) {
      try {
        const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
        await showcaseService.deleteStory(story.id, companyId);
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
        const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
        const newComment = await showcaseService.addStoryComment(story.id, comment, companyId);
        setRealComments(prev => [...(prev ?? []), {
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
        className="w-full max-w-6xl h-[85vh] bg-card rounded-2xl overflow-hidden flex shadow-2xl relative"
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
            <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none">
              <div
                className="px-3 pb-1.5 pt-3 flex items-center justify-between gap-3"
                style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 border border-white/30 shrink-0">
                    <img
                      src={(story.isAuthor && activeAccount?.image) ? activeAccount.image : (uploader?.avatar || "/assets/pngegg.png")}
                      alt={uploader?.name || "Story uploader"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/pngegg.png";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex items-center gap-2">
                    <p className="text-white text-sm font-semibold truncate">{uploader?.name || "Unknown"}</p>
                    {storyTimestamp && (
                      <p className="text-white/75 text-xs whitespace-nowrap">{storyTimestamp}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                  {story.isAuthor && (
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStory();
                      }}
                      aria-label="Delete story"
                      title="Delete story"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsStoryViewerOpen(false);
                      onClose();
                    }}
                    aria-label="Close story"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Snapshot-based for images, VirtualLayerCanvas for videos (needs layer overlays) */}
            <div className={`w-full h-full relative ${backgroundClass}`}>
              {story.media_type === 'video' ? (
                <VirtualLayerCanvas
                  layers={metadata.layers}
                  isActive
                  background={metadata.background as string | undefined}
                />
              ) : storyImageSrc ? (
                <img
                  src={storyImageSrc}
                  alt={story.title || 'Story'}
                  className="w-full h-full object-contain"
                />
              ) : null}

              {/* Shared Post Overlay */}
              {isJobStory ? (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto p-8">
                  <div style={{ transform: `scale(${typeof metadata.scale === 'number' ? metadata.scale : 1.5})` }} className={parsedStoryMetadata?.is_baked ? "opacity-0" : ""}>
                    <JobStoryCard metadata={jobMetadata} onAction={onClose} />
                  </div>
                </div>
              ) : story.shared_post ? (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none p-8">
                  <div style={{ transform: `scale(${metadata.scale || 0.9})` }} className={`transition-transform duration-200 ${parsedStoryMetadata?.is_baked ? "opacity-0" : ""}`}>
                    <SharedPostCard sharedPost={story.shared_post} />
                  </div>
                </div>
              ) : null}

              {story.media_type !== 'video' && !isJobStory && !storyImageSrc && !story.shared_post && (
                <div className="flex items-center justify-center h-full text-white/50 flex-col gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                  <p className="text-sm font-medium">No content to display</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Sidebar */}
        <div className="w-[400px] flex flex-col bg-card border-l border-border relative">
          {/* Sidebar Header */}
          {/* Sidebar Header - Removed as requested */}
          <div className="p-4 flex items-center justify-between bg-card/50 backdrop-blur-xl">
            {/* Profile and menu actions removed for clean UI */}
            <div className="flex items-center gap-1">
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
                  Comments ({commentsCount})
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
                      Comments ({commentsCount})
                    </h4>
                  )}

                  {loadingComments ? (
                    <div className="text-center py-4 text-muted-foreground text-xs">Loading comments...</div>
                  ) : commentsCount === 0 ? (
                    <div className="text-center py-8 text-muted-foreground/50 italic text-sm">
                      No comments yet. Be the first to say something!
                    </div>
                  ) : (
                    (realComments ?? []).map((c, idx) => (
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
                              <span className="text-[10px] text-muted-foreground">{c.created_at ? formatTimeAgo(c.created_at) : ''}</span>
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
                  const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
                  showcaseService.reactToStory(story.id, newLiked, companyId).catch(err => {
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
