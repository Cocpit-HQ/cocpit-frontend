"use client"

import React, { useState, useEffect } from "react"
import { Send, X, Check, Search, Rss, PlusCircle, Link as LinkIcon, Copy } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { sharePost } from "@/services/api/share"
import { useQuery } from "@tanstack/react-query"
import { getConversations } from "@/services/api/messaging"
import { mapBackendChatToChatThread } from "@/lib/mappers/messaging.mapper"
import { avatarGradients } from "@/constants/messaging"
import { CreatePostModal } from "@/components/home/CreatePostModal"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useActiveProfile } from "@/context/ActiveProfileContext"

interface SharePostModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  postCategory?: string
}

const getAvatarGradient = (avatar: string) => {
  return (avatarGradients as any)[avatar] || "from-gray-400 to-gray-500";
}

export function SharePostModal({ isOpen, onClose, postId, postCategory }: SharePostModalProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'message' | 'options'>('options')
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const { activeProfile } = useActiveProfile()

  // Fetch users from conversations for sharing
  const { data: users = [] } = useQuery({
    queryKey: ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'],
    queryFn: async () => {
      const params = activeProfile?.type === 'COMPANY' ? { companyId: activeProfile.id } : {};
      const backendChats = await getConversations(params);
      return backendChats.map(mapBackendChatToChatThread);
    }
  });


  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  /* Safe navigation for name in case of missing data */
  const filteredUsers = users.filter(user =>
    (user.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSend = async () => {
    if (selectedUserIds.length === 0) return

    setIsSending(true)
    try {
      await sharePost({
        postId,
        targetUserIds: selectedUserIds,
        message: message.trim() || undefined
      })

      setIsSuccess(true)

      // Close after delay
      setTimeout(() => {
        onClose()
        // Reset state after close
        setTimeout(() => {
          setIsSuccess(false)
          setSelectedUserIds([])
          setMessage("")
          setActiveTab('options')
        }, 300)
      }, 1500)
    } catch (error) {
      console.error("Failed to share", error);
      toast({
        title: "Share failed",
        description: "Could not share post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false)
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "Post link copied to clipboard" });
    onClose();
  }

  const handleShareToStory = () => {
    // Navigate to create story page with shared_post_id param
    // Assuming we have a way to pass this state or query param
    router.push(`/stories/create?shared_post_id=${postId}`);
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
        sharedPostId={postId}
      />
    )
  }

  const OptionsView = (
    <div className="p-4 space-y-2">
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
      <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => setActiveTab('message')}>
        <Send className="w-5 h-5" />
        <div className="flex flex-col items-start">
          <span className="font-medium">Send via Message</span>
          <span className="text-xs text-muted-foreground">Send to friends or groups</span>
        </div>
      </Button>
      <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={handleCopyLink}>
        <LinkIcon className="w-5 h-5" />
        <div className="flex flex-col items-start">
          <span className="font-medium">Copy Link</span>
          <span className="text-xs text-muted-foreground">Copy post link to clipboard</span>
        </div>
      </Button>
    </div>
  )

  const MessageView = isSuccess ? (
    <div className="flex flex-col items-center justify-center h-[300px] p-6 text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
        <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-foreground">Shared successfully</h3>
        <p className="text-muted-foreground mt-1">
          Your post has been sent.
        </p>
      </div>
    </div>
  ) : (
    <div className="flex flex-col h-full md:h-auto max-h-[80vh]">
      {/* Header for back */}
      <div className="px-4 py-2 border-b border-border flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setActiveTab('options')} className="-ml-2">Back</Button>
        <span className="font-medium">Send to...</span>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search people"
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[200px]">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => {
            const isSelected = user.otherUserId ? selectedUserIds.includes(user.otherUserId) : false
            const gradient = getAvatarGradient(user.avatar)

            return (
              <div
                key={user.otherUserId || user.id}
                onClick={() => user.otherUserId && toggleUser(user.otherUserId)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"
                  }`}
              >
                <div className={`w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-medium text-sm`}>
                  {(user.name || "?").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                  ? "bg-primary border-primary"
                  : "border-muted-foreground/30"
                  }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No results found
          </div>
        )}
      </div>

      {/* Message Input & Send Button */}
      <div className="p-4 border-t border-border bg-background">
        <Input
          placeholder="Write a message..."
          className="mb-4"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button
          className="w-full gap-2"
          disabled={selectedUserIds.length === 0 || isSending}
          onClick={handleSend}
        >
          {isSending ? (
            "Sending..."
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const Content = activeTab === 'options' ? OptionsView : MessageView;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left border-b border-border pb-4">
            <DrawerTitle>Share to</DrawerTitle>
          </DrawerHeader>
          {Content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <DialogTitle>Share to</DialogTitle>
          <div className="sr-only">
            <DialogDescription>
              Select an option to share this post.
            </DialogDescription>
          </div>
        </DialogHeader>
        {Content}
      </DialogContent>
    </Dialog>
  )
}
