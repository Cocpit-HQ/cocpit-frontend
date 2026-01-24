import React, { useState } from "react"
import { Eye, Heart, MessageCircle, Send } from "lucide-react"
import { StoryDetail } from "@/types/showcase"

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
    const [localComments, setLocalComments] = useState<string[]>([])
    const [details, setDetails] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Lazy load import to avoid circular dependency if any, or just import normally
    // We can just import showcaseService at top
    // But wait, we need to import it. 

    // Reset details when story changes
    React.useEffect(() => {
        setDetails(null);
    }, [story.id]);

    React.useEffect(() => {
        if (isOpen && isMyStory && !details) {
            setLoading(true);
            // We need to import showcaseService. Since it's a component, we can assume it's available or import it.
            // I will add the import in a separate step or just use dynamic import here to be safe and avoid multi-step edit complexity if inconsistent.
            // Actually, let's use global import in the file.
            import("@/services/showcase.service").then(({ showcaseService }) => {
                showcaseService.getStoryDetails(story.id).then(data => {
                    setDetails(data);
                    setLoading(false);
                }).catch(err => {
                    console.error("Failed to fetch story details", err);
                    setLoading(false);
                })
            });
        }
    }, [isOpen, isMyStory, story.id, details]);

    // Use details if available, otherwise fallback to story props (which might be empty)
    const currentViewers = details?.viewers || story.viewers || [];
    const currentLikers = details?.likers || story.likers || [];
    const currentViewCount = details?.viewerCount ?? story.views;
    const currentLikeCount = details ? currentLikers.length : story.likes;

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
                            <span>{(story.comments || 0) + localComments.length}</span>
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
                            {!loading && currentViewers.map((viewer: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <img src={viewer.avatar} alt={viewer.name} className="w-10 h-10 rounded-full object-cover" />
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
                            {!loading && currentLikers.map((liker: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <img src={liker.avatar} alt={liker.name} className="w-10 h-10 rounded-full object-cover" />
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
                                {/* Mock Comments */}
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted" />
                                    <div className="bg-muted/50 rounded-lg p-3 flex-1">
                                        <p className="text-sm font-semibold mb-1">Alice</p>
                                        <p className="text-sm">Great shot! 🔥</p>
                                    </div>
                                </div>
                                {localComments.map((c, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500" />
                                        <div className="bg-muted/50 rounded-lg p-3 flex-1">
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
                                    className="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:border-primary bg-input border-border"
                                />
                                <button
                                    onClick={handleAddComment}
                                    className="p-2 rounded-full bg-primary text-primary-foreground"
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
