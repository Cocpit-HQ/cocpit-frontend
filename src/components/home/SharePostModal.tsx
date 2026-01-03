"use client"

import React, { useState, useEffect } from "react"
import { Send, X, Check, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
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
import { mockChats, avatarGradients } from "@/services/mock/messaging.mock"
import { sharePost } from "@/services/api/share"

interface SharePostModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
}

export function SharePostModal({ isOpen, onClose, postId }: SharePostModalProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Filter users based on search
  const filteredUsers = mockChats.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleUser = (userId: number) => {
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
        targetUserIds: selectedUserIds.map(String),
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
        }, 300)
      }, 1500)
    } catch (error) {
      console.error("Failed to share", error)
    } finally {
      setIsSending(false)
    }
  }

  const Content = isSuccess ? (
    <div className="flex flex-col items-center justify-center h-[300px] p-6 text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
        <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-foreground">Shared successfully</h3>
        <p className="text-muted-foreground mt-1">
          Your post has been sent to {selectedUserIds.length} {selectedUserIds.length === 1 ? 'person' : 'people'}.
        </p>
      </div>
    </div>
  ) : (
    <div className="flex flex-col h-full md:h-auto max-h-[80vh]">
      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search"
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
            const isSelected = selectedUserIds.includes(user.id)
            const gradient = avatarGradients[user.avatar as keyof typeof avatarGradients] || "bg-gray-400"

            return (
              <div
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  isSelected ? "bg-muted" : "hover:bg-muted/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-medium text-sm`}>
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected
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
        </DialogHeader>
        {Content}
      </DialogContent>
    </Dialog>
  )
}
