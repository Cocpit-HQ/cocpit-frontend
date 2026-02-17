"use client"

import React, { useState } from 'react'
import { Bookmark, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { toggleSavePost } from '@/services/api/savedPost'
import { cn } from '@/lib/utils'

interface SaveButtonProps {
    postId: string
    initialIsSaved?: boolean
    className?: string
    onSaveChange?: (isSaved: boolean) => void
    onToggle?: () => void
}

export function SaveButton({ postId, initialIsSaved = false, className, onSaveChange, onToggle }: SaveButtonProps) {
    const [isSaved, setIsSaved] = useState(initialIsSaved)
    const [isLoading, setIsLoading] = useState(false)

    // Sync state with props
    React.useEffect(() => {
        setIsSaved(initialIsSaved)
    }, [initialIsSaved])

    const handleToggleSave = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isLoading) return

        if (onToggle) {
            onToggle()
            return
        }

        // Optimistic Update
        const previousState = isSaved
        setIsSaved(!previousState)
        setIsLoading(true)

        try {
            const response = await toggleSavePost(postId)

            // Sync with server response
            setIsSaved(response.saved)
            if (onSaveChange) onSaveChange(response.saved)

            if (response.saved) {
                toast.success("Post saved")
            } else {
                toast.info("Post removed from saved")
            }
        } catch (error) {
            console.error("Save Error:", error)
            toast.error("Something went wrong")
            // Revert on error
            setIsSaved(previousState)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleToggleSave}
            disabled={isLoading}
            aria-label={isSaved ? "Remove from saved" : "Save post"}
            className={cn(
                "flex flex-col items-center justify-center gap-0.5 transition-all duration-200 flex-1 py-1.5 rounded-xl hover:bg-muted/50 active:scale-95 group",
                isSaved ? "text-blue-500" : "text-muted-foreground hover:text-primary",
                className
            )}
        >
            <div className="relative">
                <Bookmark
                    className={cn(
                        "w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 group-hover:scale-110",
                        isSaved && "fill-current"
                    )}
                />
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    </div>
                )}
            </div>
        </button>
    )
}
