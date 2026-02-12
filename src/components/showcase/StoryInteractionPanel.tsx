import React, { useState, useEffect } from "react"
import { Eye, Heart, MessageCircle, Send } from "lucide-react"
import { StoryDetail, StoryAuthor } from "@/types/showcase"
import { showcaseService } from "@/services/showcase.service"

interface StoryAnalytics {
    viewerCount: number;
    viewers: StoryAuthor[];
    likers: StoryAuthor[];
}

type StoryInteractionPanelProps = {
    isOpen: boolean
    onClose: () => void
    story: StoryDetail
    isMyStory: boolean
    isDark?: boolean // Optional
}

export function StoryInteractionPanel({ isOpen, onClose, story, isMyStory }: StoryInteractionPanelProps) {
    const [activeTab, setActiveTab] = useState<"views" | "likes" | "comments">(isMyStory ? "views" : "comments")
    const [comment, setComment] = useState("")
    const [comments, setComments] = useState<any[]>([])
    const [details, setDetails] = useState<StoryAnalytics | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingComments, setLoadingComments] = useState(false)

    // Reset details when story changes
    useEffect(() => {
        setDetails(null);
        setComments([]);
    }, [story.id]);

    useEffect(() => {
        if (isOpen) {
            // Fetch Analytics (for My Story)
            if (isMyStory && !details) {
                setLoading(true);
                showcaseService.getStoryDetails(story.id).then(data => {
                    setDetails(data);
                }).catch(err => {
                    console.error("Failed to fetch story details", err);
                }).finally(() => setLoading(false));
            }

            // Fetch Comments (Always)
            if (comments.length === 0) {
                setLoadingComments(true)
                showcaseService.getStoryComments(story.id)
                    .then(data => setComments(data))
                    .catch(err => console.error("Failed to fetch comments", err))
                    .finally(() => setLoadingComments(false))
            }
        }
    }, [isOpen, isMyStory, story.id]);

    // Use details if available, otherwise fallback to story props (which might be empty)
    const currentViewers = details?.viewers || story.viewers || [];
    const currentLikers = details?.likers || story.likers || [];
    const currentViewCount = details?.viewerCount ?? story.views;
    const currentLikeCount = details ? currentLikers.length : story.likes;

    if (!isOpen) return null

    const handleAddComment = async () => {
        if (comment.trim()) {
            try {
                const newComment = await showcaseService.addStoryComment(story.id, comment);
                setComments(prev => [...prev, {
                    ...newComment.comment,
                    full_name: "You", // Or fetch user profile if needed, but 'You' is fine for instant UI
                    avatar_url: null,
                    is_current_user: true
                }])
                setComment("")
            } catch (err) {
                console.error("Failed to post comment", err)
            }
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
                className="w-full rounded-t-2xl overflow-hidden flex flex-col max-h-[70vh] cursor-default bg-card text-foreground"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
            >
                {/* Handle/Grabber */}
                <div className="w-full flex items-center justify-center pt-3 pb-2 cursor-pointer" onClick={onClose}>
                    <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                </div>

                {/* Tabs (Only for My Story) */}
                {isMyStory && (
                    <div className="flex border-b border-border">
                        <button
                            onClick={() => setActiveTab("views")}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2
                            ${activeTab === "views" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                        >
                            <Eye className="w-4 h-4" />
                            <span>{currentViewCount}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("likes")}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2
                            ${activeTab === "likes" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                        >
                            <Heart className="w-4 h-4" />
                            <span>{currentLikeCount}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("comments")}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2
                            ${activeTab === "comments" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>{comments.length}</span>
                        </button>
                    </div>
                )}

                {/* Header for Others (Just counts, no tabs) */}
                {!isMyStory && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="font-semibold text-lg">Comments</h3>
                        <div className="flex gap-4 text-sm text-muted-foreground">
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
                            {loading && <p className="text-center text-sm py-4">Loading views...</p>}
                            {!loading && currentViewers.map((viewer: StoryAuthor, idx: number) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <img src={viewer.avatar || '/assets/pngegg.png'} alt={viewer.name} className="w-10 h-10 rounded-full object-cover" />
                                    <span className="font-medium">{viewer.name}</span>
                                </div>
                            ))}
                            {!loading && (!currentViewers || currentViewers.length === 0) && (
                                <p className="text-center text-muted-foreground py-4">No views yet</p>
                            )}
                        </div>
                    )}

                    {activeTab === "likes" && isMyStory && (
                        <div className="space-y-4">
                            {loading && <p className="text-center text-sm py-4">Loading likes...</p>}
                            {!loading && currentLikers.map((liker: StoryAuthor, idx: number) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <img src={liker.avatar || '/assets/pngegg.png'} alt={liker.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div className="flex-1">
                                        <span className="font-medium">{liker.name}</span>
                                    </div>
                                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                                </div>
                            ))}
                            {!loading && (!currentLikers || currentLikers.length === 0) && (
                                <p className="text-center text-muted-foreground py-4">No likes yet</p>
                            )}
                        </div>
                    )}

                    {(activeTab === "comments" || !isMyStory) && (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 space-y-4 mb-4">
                                {loadingComments && <p className="text-center text-sm py-4">Loading comments...</p>}

                                {!loadingComments && comments.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground/50 italic text-sm">
                                        No comments yet. Be the first to say something!
                                    </div>
                                )}

                                {!loadingComments && comments.map((c, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                            {c.avatar_url ? (
                                                <img src={c.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                                                    {c.full_name?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-3 flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-sm font-semibold">{c.full_name}</p>
                                                <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm">{c.content}</p>
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
                                    className="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:border-primary bg-input border-border"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!comment.trim()}
                                    className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
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
