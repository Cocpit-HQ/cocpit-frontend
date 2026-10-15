"use client"

import React, { useState } from 'react'
import { toast } from 'sonner'
import { toggleSavePost } from '@/features/settings/api/savedPost'
import { cn } from '@/lib/utils'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { Icon } from '@/components/icons'
import { useQueryClient } from '@tanstack/react-query'
import { SAVED_FOLDERS_QUERY_KEY } from '@/features/settings/hooks/useSavedFolders'
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
    const isSavingRef = React.useRef(false)
    const queryClient = useQueryClient()

    // Sync state with props
    React.useEffect(() => {
        setIsSaved(initialIsSaved)
    }, [initialIsSaved])

    const { isCompany, activeProfile } = useActiveProfile()

    const handleToggleSave = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isLoading || isSavingRef.current) return

        if (onToggle && !isSaved) {
            onToggle()
            return
        }

        isSavingRef.current = true

        // Optimistic Update
        const previousState = isSaved
        setIsSaved(!previousState)
        setIsLoading(true)

        try {
            const companyId = isCompany ? activeProfile?.id : undefined;
            const response = await toggleSavePost(postId, undefined, companyId)

            // Sync with server response
            setIsSaved(response.saved)
            if (onSaveChange) onSaveChange(response.saved)

            if (response.saved) {
                toast.success("Post saved")
            } else {
                toast.info("Post removed from saved")
            }
            
            // Invalidate the saved folders query to update the post_count in the UI
            queryClient.invalidateQueries({ queryKey: SAVED_FOLDERS_QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['orgPosts'] })
            queryClient.invalidateQueries({ queryKey: ['orgPostsFallback'] })
            queryClient.invalidateQueries({ queryKey: ['orgPostsPreview'] })
        } catch (error) {
            console.error("Save Error:", error)
            toast.error("Something went wrong")
            // Revert on error
            setIsSaved(previousState)
        } finally {
            isSavingRef.current = false
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleToggleSave}
            disabled={isLoading}
            aria-label={isSaved ? "Remove from saved" : "Save post"}
            className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 group cursor-pointer outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded",
                isSaved ? "text-[var(--ds-accent)]" : "text-ds-text-primary hover:text-ds-text-secondary",
                className
            )}
        >
            <div className="flex items-center justify-center w-[20px] h-[20px] m-auto shrink-0 flex-none">
                <div className="relative w-[20px] h-[20px] flex items-center justify-center shrink-0 flex-none">
                    <Icon 
                        name={isSaved ? "save-filled" : "save"}
                        size={20}
                        className="w-[20px] h-[20px] shrink-0 flex-none"
                        aria-hidden="true"
                    />
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                            <svg className="animate-spin h-3 w-3 text-[var(--ds-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        </button>
    )
}
