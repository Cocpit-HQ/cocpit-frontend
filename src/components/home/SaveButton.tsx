"use client"

import React, { useState } from 'react'
import { toast } from 'sonner'
import { toggleSavePost } from '@/services/api/savedPost'
import { cn } from '@/lib/utils'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { Icon } from '@iconify/react'

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

    const { isCompany, activeProfile } = useActiveProfile()

    const handleToggleSave = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isLoading) return

        if (onToggle && !isSaved) {
            onToggle()
            return
        }

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
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 group",
                isSaved ? "text-primary hover:opacity-80" : "text-foreground hover:text-primary",
                className
            )}
        >
            <div className="flex items-center justify-center w-[24px] h-[24px]">
                <div className="relative">
                    <Icon 
                        icon={isSaved ? "solar:bookmark-bold" : "solar:bookmark-linear"}
                        className="w-6 h-6"
                        aria-hidden="true"
                    />
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                            <svg className="animate-spin h-3 w-3 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
