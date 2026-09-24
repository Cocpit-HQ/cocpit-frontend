"use client"
import React, { useState, useEffect } from "react"
import { Icon } from "@iconify/react"
import { Send, X, Check, Search, Rss, PlusCircle, Link as LinkIcon, Bell, ArrowLeft, CheckCircle2, MessageSquare } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { universalShare } from "@/services/api/shareService"
import { useQuery } from "@tanstack/react-query"
import { getConversations } from "@/services/api/messaging"
import { mapBackendChatToChatThread } from "@/lib/mappers/messaging.mapper"
import { avatarGradients } from "@/constants/messaging"
import { CreatePostModal } from "@/features/feed/components/create-post"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import api from "@/lib/axios"

interface UniversalShareModalProps {
    isOpen: boolean
    onClose: () => void
    entityId: string
    entityType: 'post' | 'profile' | 'company' | 'job' | 'event'
    entityName?: string // Optional for display
    entityUrl?: string // Optional for "Copy Link" fallback
    postCategory?: string // Specific to posts for repost restriction
    entityAvatar?: string
    entityHeadline?: string
    entityLocation?: string
}

type ShareMode = "options" | "message" | "notification" | "success"

const getAvatarGradient = (avatar?: string) => {
    return (avatar && (avatarGradients as any)[avatar]) || "from-gray-400 to-gray-500";
}

export function UniversalShareModal({
    isOpen,
    onClose,
    entityId,
    entityType,
    entityName,
    entityUrl,
    postCategory,
    entityAvatar,
    entityHeadline,
    entityLocation
}: UniversalShareModalProps) {
    const [mode, setMode] = useState<ShareMode>("options")
    const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([])
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isMobile, setIsMobile] = useState(false)
    const [isRepostModalOpen, setIsRepostModalOpen] = useState(false)
    const [users, setUsers] = useState<any[]>([])
    const [isLoadingUsers, setIsLoadingUsers] = useState(false)

    const router = useRouter()
    const { toast } = useToast()
    const { activeProfile } = useActiveProfile()

    // Fetch conversations for "Message" mode
    const { data: conversations = [], isLoading: isLoadingConvs } = useQuery({
        queryKey: ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'],
        queryFn: async () => {
            const params = activeProfile?.type === 'COMPANY' ? { companyId: activeProfile.id } : {};
            const backendChats = await getConversations(params);
            return backendChats.map(mapBackendChatToChatThread);
        },
        enabled: mode === 'message'
    });

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setMode("options")
                setSelectedTargetIds([])
                setMessage("")
                setSearchQuery("")
            }, 300)
        }
    }, [isOpen])

    // Search users for "Notification" mode
    useEffect(() => {
        if (mode === 'notification' && searchQuery.trim().length > 1) {
            const searchUsers = async () => {
                setIsLoadingUsers(true)
                try {
                    const res = await api.get(`/users/search`, { params: { q: searchQuery, limit: 10 } });
                    setUsers(res.data || []);
                } catch (err) {
                    console.error("Search users error:", err);
                } finally {
                    setIsLoadingUsers(false)
                }
            }
            const timer = setTimeout(searchUsers, 300)
            return () => clearTimeout(timer)
        }
    }, [mode, searchQuery])

    const toggleTarget = (id: string) => {
        if (mode === 'notification') {
            setSelectedTargetIds([id]); // Only one for notification usually
        } else {
            setSelectedTargetIds(prev =>
                prev.includes(id)
                    ? prev.filter(tid => tid !== id)
                    : [...prev, id]
            )
        }
    }

    const handleSend = async () => {
        if (selectedTargetIds.length === 0) return

        setIsSending(true)
        try {
            const senderCompanyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
            const shareMethod = mode === 'message' ? 'message' : 'notification';

            await Promise.all(
                selectedTargetIds.map(targetId => {
                    let targetType: 'user' | 'company' = 'user';
                    if (mode === 'notification') {
                        const userObj = users.find(u => u.id === targetId);
                        if (userObj?.type === 'COMPANY') targetType = 'company';
                    } else if (mode === 'message') {
                        const convObj = conversations.find(c => c.otherUserId === targetId);
                        if (convObj?.otherUserType === 'COMPANY') targetType = 'company';
                    }

                    return universalShare({
                        entityType,
                        entityId,
                        shareMethod,
                        targetId,
                        targetType,
                        message: message.trim() || undefined,
                        senderCompanyId,
                    })
                })
            )

            setMode("success")
            setTimeout(() => {
                onClose()
            }, 1500)
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || "Could not share. Please try again.";
            const isCompanyShareRestriction = errorMessage === "Users cannot share content with company accounts.";

            toast({
                title: isCompanyShareRestriction ? "Share Restricted" : "Share failed",
                description: errorMessage,
                variant: isCompanyShareRestriction ? "default" : "destructive",
            });
        } finally {
            setIsSending(false)
        }
    }

    const handleCopyLink = () => {
        const url = entityUrl ? `${window.location.origin}${entityUrl}` : `${window.location.origin}/${entityType}/${entityId}`;
        navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Copied to clipboard" });
        onClose();
    }

    const handleShareToStory = async () => {
        if (entityType === 'job') {
            router.push(`/stories/create?shared_job_id=${entityId}`);
            onClose();
            return;
        }

        router.push(`/stories/create?shared_post_id=${entityId}`);
        onClose();
    }

    const handleRepost = () => {
        if (entityType === 'post' && postCategory === 'Personal') {
            toast({
                title: "Share restricted",
                description: "Personal posts cannot be reposted to the feed.",
                variant: "destructive"
            });
            return;
        }
        setIsRepostModalOpen(true);
    }

    if (isRepostModalOpen) {
        return (
            <CreatePostModal
                isOpen={true}
                onClose={() => {
                    setIsRepostModalOpen(false)
                    onClose()
                }}
                sharedPostId={entityType === 'post' ? entityId : undefined}
                sharedJobId={entityType === 'job' ? entityId : undefined}
                initialSharedPost={entityType === 'job' ? {
                    isJob: true,
                    jobId: entityId,
                    jobTitle: entityName,
                    jobLocation: entityLocation,
                    jobCompany: entityHeadline,
                    jobLogo: entityAvatar
                } : undefined}
            />
        )
    }

    const OptionsView = (
        <div className="flex flex-col pt-2">
            <div className="text-center mb-6 relative px-4">
                <DialogTitle className="text-[18px] leading-[26px] font-semibold font-[family-name:var(--font-poppins)] text-[#000000] mb-1">
                    Share
                </DialogTitle>
                <p className="text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
                    Share your {entityType} your way
                </p>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {(entityType === 'post' || entityType === 'job') && (
                    <button
                        onClick={handleRepost}
                        disabled={postCategory === 'Personal'}
                        className={`flex items-center gap-4 w-full h-[56px] px-6 rounded-[24px] bg-white border border-[#F8FAFC] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:bg-slate-50 transition-colors ${postCategory === 'Personal' ? 'opacity-50 cursor-default' : ''}`}
                    >
                        <Icon icon="solar:feed-linear" className="w-[24px] h-[24px] text-[#6366F1]" />
                        <span className="text-[14px] leading-[20px] font-medium font-[family-name:var(--font-poppins)] text-[#000000]">Share to Feed</span>
                    </button>
                )}

                <button
                    onClick={handleShareToStory}
                    className="flex items-center gap-4 w-full h-[56px] px-6 rounded-[24px] bg-white border border-[#F8FAFC] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:bg-slate-50 transition-colors"
                >
                    <Icon icon="solar:add-circle-linear" className="w-[24px] h-[24px] text-[#6366F1]" />
                    <span className="text-[14px] leading-[20px] font-medium font-[family-name:var(--font-poppins)] text-[#000000]">Share in story</span>
                </button>

                <button
                    onClick={() => setMode('message')}
                    className="flex items-center gap-4 w-full h-[56px] px-6 rounded-[24px] bg-white border border-[#F8FAFC] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:bg-slate-50 transition-colors"
                >
                    <Icon icon="solar:chat-line-linear" className="w-[24px] h-[24px] text-[#6366F1]" />
                    <span className="text-[14px] leading-[20px] font-medium font-[family-name:var(--font-poppins)] text-[#000000]">Share in chat</span>
                </button>

                {(entityType === 'profile' || entityType === 'post') && (
                    <button
                        onClick={() => toast({ title: "Coming soon", description: "Sharing to business page will be available soon." })}
                        className="flex items-center gap-4 w-full h-[56px] px-6 rounded-[24px] bg-white border border-[#F8FAFC] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:bg-slate-50 transition-colors"
                    >
                        <Icon icon="solar:case-linear" className="w-[24px] h-[24px] text-[#6366F1]" />
                        <span className="text-[14px] leading-[20px] font-medium font-[family-name:var(--font-poppins)] text-[#000000]">Share on business page</span>
                    </button>
                )}

                <button
                    onClick={() => setMode('notification')}
                    className="flex items-center gap-4 w-full h-[56px] px-6 rounded-[24px] bg-white border border-[#F8FAFC] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:bg-slate-50 transition-colors"
                >
                    <Icon icon="solar:bell-linear" className="w-[24px] h-[24px] text-[#6366F1]" />
                    <span className="text-[14px] leading-[20px] font-medium font-[family-name:var(--font-poppins)] text-[#000000]">Share via Notification</span>
                </button>

                <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-4 w-full h-[56px] px-6 rounded-[24px] bg-white border border-[#F8FAFC] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:bg-slate-50 transition-colors"
                >
                    <Icon icon="solar:copy-linear" className="w-[24px] h-[24px] text-[#6366F1]" />
                    <span className="text-[14px] leading-[20px] font-medium font-[family-name:var(--font-poppins)] text-[#000000]">Copy link</span>
                </button>
            </div>
        </div>
    )

    const SuccessView = (
        <div className="flex flex-col items-center justify-center h-[300px] p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
                <h3 className="text-xl font-semibold text-foreground">Shared successfully</h3>
                <p className="text-muted-foreground mt-1">
                    Your {entityType} has been shared.
                </p>
            </div>
        </div>
    )

    const SelectionView = (
        <div className="flex flex-col h-full md:h-auto max-h-[85vh] md:max-h-[80vh]">
            <div className="px-5 py-3 border-b border-border flex items-center sticky top-0 bg-background z-10">
                <Button variant="ghost" size="sm" onClick={() => setMode('options')} className="flex items-center gap-2 -ml-2 hover:bg-muted/60 text-foreground font-semibold text-sm rounded-lg px-2">
                    <ArrowLeft className="w-4 h-4 text-muted-foreground mr-1" />
                    {mode === 'message' ? 'Send to...' : 'Notify...'}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto" tabIndex={-1}>
                <div className="p-5 space-y-4 border-b border-border">
                    {/* Entity Preview Header */}
                    {(entityType === 'profile' || entityType === 'company' || entityType === 'job') && entityName && (
                        <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12 border rounded-full shrink-0">
                                <AvatarImage src={entityAvatar} className="object-cover" />
                                <AvatarFallback>{entityName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-bold text-sm text-foreground truncate">{entityName}</span>
                                {entityHeadline && (
                                    <span className="text-xs text-foreground/90 truncate">{entityHeadline}</span>
                                )}
                                {entityLocation && (
                                    <span className="text-[11px] text-muted-foreground truncate mt-0.5">{entityLocation}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mr-2" />
                        <Input
                            placeholder={mode === 'message' ? "Search users or conversations..." : "Search users..."}
                            className="pl-9 h-10 bg-muted/40 border-border/50 rounded-lg text-sm transition-colors focus-visible:ring-1 focus-visible:ring-primary/30"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Selected Users Chips */}
                    {selectedTargetIds.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selected</span>
                            <div className="flex flex-wrap gap-2">
                                {selectedTargetIds.map(id => {
                                    let name = "";
                                    let avatar = "";
                                    if (mode === 'notification') {
                                        const u = users.find(u => u.id === id);
                                        name = u ? u.full_name : "User";
                                        avatar = u?.avatar_url;
                                    } else {
                                        const c = conversations.find(c => c.otherUserId === id);
                                        name = c?.name || "Chat";
                                        avatar = c?.avatar || "";
                                    }

                                    return (
                                        <div
                                            key={id}
                                            className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                                            onClick={() => toggleTarget(id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    toggleTarget(id);
                                                }
                                            }}
                                            tabIndex={0}
                                            role="button"
                                            aria-label={`Remove ${name}`}
                                        >
                                            {avatar ? (
                                                <img src={avatar} className="w-4 h-4 rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px]">{name.charAt(0)}</div>
                                            )}
                                            {name.split(' ')[0]}
                                            <X className="w-3 h-3 ml-1 opacity-70 hover:opacity-100" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-2 min-h-[250px] pb-4">
                    {mode === 'message' ? (
                        isLoadingConvs ? (
                            <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center h-40">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                                Loading...
                            </div>
                        ) : conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                            conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(conv => {
                                const isSelected = conv.otherUserId ? selectedTargetIds.includes(conv.otherUserId) : false
                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => conv.otherUserId && toggleTarget(conv.otherUserId)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                conv.otherUserId && toggleTarget(conv.otherUserId);
                                            }
                                        }}
                                        tabIndex={0}
                                        role="checkbox"
                                        aria-checked={isSelected}
                                        aria-label={conv.name}
                                        className={`flex items-center gap-3 p-3 mx-1 my-0.5 rounded-xl cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${isSelected ? "bg-muted/80 shadow-sm" : "hover:bg-muted/60"}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-br ${getAvatarGradient(conv.avatar)} flex items-center justify-center text-white font-medium text-sm`}>
                                            {(conv.name || "?").charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{conv.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{conv.role || conv.lastMessage}</p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="p-8 text-center text-muted-foreground text-sm">No results found</div>
                        )
                    ) : (
                        isLoadingUsers ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">Searching...</div>
                        ) : users.length > 0 ? (
                            users.map(user => {
                                const isSelected = selectedTargetIds.includes(user.id)
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleTarget(user.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                toggleTarget(user.id);
                                            }
                                        }}
                                        tabIndex={0}
                                        role="checkbox"
                                        aria-checked={isSelected}
                                        aria-label={user.full_name}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${isSelected ? "bg-muted" : "hover:bg-muted/50"}`}
                                    >
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={user.avatar_url} />
                                            <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-foreground truncate">{user.full_name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.headline}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center h-40">{searchQuery.length > 1 ? "No users found" : "Type to search users"}</div>
                        )
                    )}
                </div>
            </div>

            <div className="p-5 border-t border-border bg-background shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-10">
                <div className="flex flex-col space-y-3">
                    <div className="space-y-1.5">
                        <Input
                            placeholder="optional message"
                            className="bg-muted/40 border-border/50 transition-colors focus-visible:ring-1 focus-visible:ring-primary/30"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                    <Button
                        className="w-full gap-2 h-11 font-semibold rounded-lg shadow-sm"
                        disabled={selectedTargetIds.length === 0 || isSending}
                        onClick={handleSend}
                    >
                        {isSending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-1" />
                                Send
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )

    const Content = () => {
        switch (mode) {
            case 'options': return OptionsView;
            case 'success': return SuccessView;
            case 'message':
            case 'notification': return SelectionView;
            default: return OptionsView;
        }
    }

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DrawerContent className="max-h-[85vh] p-0 bg-transparent border-none shadow-none outline-none">
                    <div className="relative bg-white rounded-t-[24px] p-[24px] w-full shadow-sm flex flex-col outline-none max-h-[85vh] overflow-hidden">
                        {mode === 'options' && (
                            <button
                                onClick={() => onClose()}
                                className="absolute top-6 right-6 p-1 text-[#F87171] rounded-full transition-colors z-10 focus:outline-none focus-visible:outline-none"
                            >
                                <X className="w-5 h-5" strokeWidth={1.5} />
                            </button>
                        )}
                        <Content />
                    </div>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[400px] sm:rounded-[24px] [&>button]:hidden outline-none">
                <div className="relative bg-white rounded-[24px] p-[24px] sm:p-[32px] w-full shadow-sm flex flex-col outline-none max-h-[85vh] overflow-hidden">
                    {mode === 'options' && (
                        <button
                            onClick={() => onClose()}
                            className="absolute top-6 right-6 p-1 text-[#F87171] rounded-full transition-colors z-10 focus:outline-none focus-visible:outline-none"
                        >
                            <X className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                    )}
                    <Content />
                </div>
            </DialogContent>
        </Dialog>
    )
}
