"use client"

import React, { useState, useEffect } from "react"
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
import { CreatePostModal } from "@/components/home/CreatePostModal"
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
}

type ShareMode = "options" | "message" | "notification" | "success"

const getAvatarGradient = (avatar: string) => {
    return (avatarGradients as any)[avatar] || "from-gray-400 to-gray-500";
}

export function UniversalShareModal({
    isOpen,
    onClose,
    entityId,
    entityType,
    entityName,
    entityUrl,
    postCategory
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
            console.error("Failed to share", error);
            const errorMessage = error?.response?.data?.message || "Could not share. Please try again.";
            toast({
                title: "Share failed",
                description: errorMessage,
                variant: "destructive",
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

    const handleShareToStory = () => {
        router.push(`/stories/create?shared_post_id=${entityId}`);
        onClose();
    }

    const handleRepost = () => {
        if (postCategory === 'Personal') {
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
                sharedPostId={entityId}
            />
        )
    }

    const OptionsView = (
        <div className="p-4 space-y-2">
            {entityType === 'post' && (
                <>
                    <Button
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-12 ${postCategory === 'Personal' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleRepost}
                    >
                        <Rss className="w-5 h-5" />
                        <div className="flex flex-col items-start text-left">
                            <span className="font-medium">Share to Feed</span>
                            <span className="text-xs text-muted-foreground">
                                {postCategory === 'Personal' ? 'Personal posts cannot be reposted' : 'Repost this to your feed'}
                            </span>
                        </div>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={handleShareToStory}>
                        <PlusCircle className="w-5 h-5" />
                        <div className="flex flex-col items-start">
                            <span className="font-medium">Share to Story</span>
                            <span className="text-xs text-muted-foreground">Add to your daily story</span>
                        </div>
                    </Button>
                </>
            )}

            <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => setMode('message')}>
                <MessageSquare className="w-5 h-5" />
                <div className="flex flex-col items-start">
                    <span className="font-medium">Send via Message</span>
                    <span className="text-xs text-muted-foreground">Send to friends or groups</span>
                </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => setMode('notification')}>
                <Bell className="w-5 h-5" />
                <div className="flex flex-col items-start">
                    <span className="font-medium">Share via Notification</span>
                    <span className="text-xs text-muted-foreground">Send a notification to a user</span>
                </div>
            </Button>

            <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={handleCopyLink}>
                <LinkIcon className="w-5 h-5" />
                <div className="flex flex-col items-start">
                    <span className="font-medium">Copy Link</span>
                    <span className="text-xs text-muted-foreground">Copy URL to clipboard</span>
                </div>
            </Button>
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
        <div className="flex flex-col h-full md:h-auto max-h-[80vh]">
            <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setMode('options')} className="-ml-2">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <span className="font-medium">{mode === 'message' ? 'Send to...' : 'Notify...'}</span>
            </div>

            <div className="px-4 py-3 border-b border-border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={mode === 'message' ? "Search conversations" : "Search users"}
                        className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[200px]">
                {mode === 'message' ? (
                    isLoadingConvs ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                        conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(conv => {
                            const isSelected = conv.otherUserId ? selectedTargetIds.includes(conv.otherUserId) : false
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => conv.otherUserId && toggleTarget(conv.otherUserId)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"}`}
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
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"}`}
                                >
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{user.full_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.headline}</p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="p-8 text-center text-muted-foreground text-sm">{searchQuery.length > 1 ? "No users found" : "Type to search users"}</div>
                    )
                )}
            </div>

            <div className="p-4 border-t border-border bg-background">
                <Input
                    placeholder="Write a message..."
                    className="mb-4"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <Button
                    className="w-full gap-2"
                    disabled={selectedTargetIds.length === 0 || isSending}
                    onClick={handleSend}
                >
                    {isSending ? "Sending..." : <><Send className="w-4 h-4" /> Send</>}
                </Button>
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
                <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader className="text-left border-b border-border pb-4">
                        <DrawerTitle>Share {entityType}</DrawerTitle>
                    </DrawerHeader>
                    <Content />
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-4 py-3 border-b border-border">
                    <DialogTitle>Share {entityType}</DialogTitle>
                    <div className="sr-only">
                        <DialogDescription>Select an option to share this {entityType}.</DialogDescription>
                    </div>
                </DialogHeader>
                <Content />
            </DialogContent>
        </Dialog>
    )
}
