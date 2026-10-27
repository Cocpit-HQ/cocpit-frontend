"use client"

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Plus } from 'lucide-react'
import { SavedFolder } from '@/types/entities'
import { getSavedFolders, toggleSavePost } from '@/features/settings/api/savedPost'
import { CreateCollectionModal } from './CreateCollectionModal'
import { toast } from 'sonner'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { Icon } from '@iconify/react'
import { useQueryClient } from '@tanstack/react-query'
import { SAVED_FOLDERS_QUERY_KEY } from '@/features/settings/hooks/useSavedFolders'
import { MobileSafeBackdrop } from '@/components/shared/MobileSafeBackdrop'

export interface SavePostModalProps {
    isOpen: boolean
    onClose: () => void
    postId: string
    onSaved: (isSaved: boolean) => void
}

export function SavePostModal({ isOpen, onClose, postId, onSaved }: SavePostModalProps) {
    const [folders, setFolders] = useState<SavedFolder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [savingToFolderId, setSavingToFolderId] = useState<string | null>(null)
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
    const isSavingRef = useRef(false)
    const queryClient = useQueryClient()

    const { isCompany, activeProfile } = useActiveProfile()

    useEffect(() => {
        if (isOpen) {
            fetchFolders()
            // Prevent background scrolling
            document.body.style.overflow = 'hidden'
            document.documentElement.style.overflow = 'hidden'
            return () => {
                document.body.style.overflow = 'unset'
                document.documentElement.style.overflow = 'unset'
            }
        } else {
            isSavingRef.current = false
            setSavingToFolderId(null)
        }
    }, [isOpen, activeProfile?.id])

    const fetchFolders = async () => {
        setIsLoading(true)
        try {
            const companyId = isCompany ? activeProfile?.id : undefined;
            const response = await getSavedFolders(companyId)
            if (response.success) {
                setFolders(response.folders)
            }
        } catch (error) {
            console.error("Failed to fetch folders:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveToFolder = async (folderId: string | null | undefined) => {
        if (isSavingRef.current) return
        isSavingRef.current = true
        setSavingToFolderId(folderId || 'all')
        try {
            const companyId = isCompany ? activeProfile?.id : undefined;
            const response = await toggleSavePost(postId, folderId, companyId)
            if (response.success) {
                toast.success(folderId ? "Saved to folder" : "Saved to All Posts")
                queryClient.invalidateQueries({ queryKey: SAVED_FOLDERS_QUERY_KEY })
                queryClient.invalidateQueries({ queryKey: ['orgPosts'] })
                queryClient.invalidateQueries({ queryKey: ['orgPostsFallback'] })
                queryClient.invalidateQueries({ queryKey: ['orgPostsPreview'] })
                onSaved(true)
                onClose()
            }
        } catch (error) {
            console.error("Failed to save to folder:", error)
            toast.error("Failed to save")
        } finally {
            isSavingRef.current = false
            setSavingToFolderId(null)
        }
    }

    const handleCreateFolder = (newFolder: SavedFolder) => {
        setFolders(prev => [newFolder, ...prev])
        setSelectedFolderId(newFolder.folder_id)
    }

    if (!isOpen) return null

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center sm:px-4 isolate">
                {/* Backdrop */}
                <MobileSafeBackdrop 
                    onClose={onClose} 
                    isAnimated={true} 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 350 }}
                    className="relative w-full sm:w-[356px] bg-ds-bg border border-ds-border rounded-t-[16px] sm:rounded-[16px] shadow-2xl z-20 flex flex-col items-center p-[12px] gap-[12px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Frame 2609536 - Close Row */}
                    <div className="w-full flex flex-row justify-end items-center h-[20px] shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close save modal"
                            className="w-[20px] h-[20px] flex items-center justify-center rounded-full hover:bg-ds-surface-1 transition-colors duration-[var(--motion-quick)]"
                        >
                            <X className="w-[16px] h-[16px] text-ds-text-primary" strokeWidth={2} />
                        </button>
                    </div>

                    {/* Save Title */}
                    <h3 className="ds-text-body-1 text-ds-text-primary text-center shrink-0">
                        Save
                    </h3>

                    {/* Frame 2609538 - List */}
                    <div className="w-full flex flex-col items-start p-0 gap-[8px] flex-1 overflow-y-auto max-h-[352px] overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {/* Frame 2608718 - General */}
                        <button
                            type="button"
                            onClick={() => setSelectedFolderId(null)}
                            disabled={!!savingToFolderId}
                            className="w-full flex flex-row justify-between items-center px-[12px] py-[8px] gap-[8px] h-[40px] hover:bg-ds-surface-1 rounded-[8px] transition-colors duration-[var(--motion-quick)] disabled:opacity-40 disabled:pointer-events-none shrink-0"
                        >
                            {/* Frame 2609537 */}
                            <div className="flex flex-row items-center gap-[8px] h-[24px]">
                                <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0">
                                    <Icon icon="solar:folder-linear" className="w-[20px] h-[20px] text-ds-text-primary" />
                                </div>
                                <span className="ds-text-body text-ds-text-primary flex items-center">
                                    General
                                </span>
                            </div>
                            <div className="w-[20px] h-[20px] flex justify-center items-center shrink-0">
                                {selectedFolderId === null ? (
                                    <div className="w-[20px] h-[20px] rounded-full border-[1.5px] border-ds-accent flex items-center justify-center box-border">
                                        <div className="w-[8px] h-[8px] rounded-full bg-ds-accent" />
                                    </div>
                                ) : (
                                    <div className="w-[20px] h-[20px] border-[1.5px] border-ds-text-muted rounded-full box-border" />
                                )}
                            </div>
                        </button>

                        {(isLoading || folders.length > 0) && (
                            <>
                                {/* Collection */}
                                <span className="ds-text-small text-ds-text-secondary shrink-0">
                                    Collection
                                </span>

                                {isLoading ? (
                                    <div className="flex items-center justify-center py-[12px] w-full shrink-0">
                                        <Loader2 className="w-[20px] h-[20px] text-ds-text-secondary animate-spin" />
                                    </div>
                                ) : (
                                    folders.map((folder) => {
                                        const isSelected = selectedFolderId === folder.folder_id
                                        return (
                                            <button
                                                type="button"
                                                key={folder.folder_id}
                                                onClick={() => setSelectedFolderId(folder.folder_id)}
                                                disabled={!!savingToFolderId}
                                                className="w-full flex flex-row justify-between items-center px-[12px] py-[8px] gap-[8px] h-[40px] hover:bg-ds-surface-1 rounded-[8px] transition-colors duration-[var(--motion-quick)] disabled:opacity-40 disabled:pointer-events-none shrink-0"
                                            >
                                                {/* Frame 2609537 */}
                                                <div className="flex flex-row items-center gap-[8px] h-[24px] overflow-hidden">
                                                    <div className="w-[20px] h-[20px] flex items-center justify-center shrink-0">
                                                        <Icon icon="solar:folder-linear" className="w-[20px] h-[20px] text-ds-text-primary" />
                                                    </div>
                                                    <span className="ds-text-body text-ds-text-primary flex items-center truncate">
                                                        {folder.name}
                                                    </span>
                                                </div>
                                                <div className="w-[20px] h-[20px] flex justify-center items-center shrink-0">
                                                    {isSelected ? (
                                                        <div className="w-[20px] h-[20px] rounded-full border-[1.5px] border-ds-accent flex items-center justify-center box-border">
                                                            <div className="w-[8px] h-[8px] rounded-full bg-ds-accent" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-[20px] h-[20px] border-[1.5px] border-ds-text-muted rounded-full box-border" />
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })
                                )}
                            </>
                        )}
                    </div>

                    {/* Frame 2609873 - Bottom Actions */}
                    <div className="w-full flex flex-row justify-center items-center gap-[8px] h-[36px] shrink-0">
                        <button
                            type="button"
                            onClick={() => handleSaveToFolder(selectedFolderId)}
                            disabled={!!savingToFolderId}
                            className="w-[162px] h-[36px] flex flex-row justify-center items-center px-[12px] py-[6px] gap-[10px] bg-ds-accent hover:opacity-90 active:scale-[0.98] rounded-[100px] transition-all duration-[var(--motion-quick)] disabled:opacity-50 disabled:active:scale-100"
                        >
                            {savingToFolderId ? (
                                <Loader2 className="w-[16px] h-[16px] text-ds-text-primary animate-spin shrink-0" />
                            ) : (
                                <span className="ds-text-body-1 text-ds-text-primary whitespace-nowrap">
                                    Save
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-[162px] h-[36px] flex flex-row justify-center items-center px-[12px] py-[6px] gap-[10px] border border-ds-border rounded-[100px] hover:bg-ds-surface-1 active:scale-[0.98] transition-all duration-[var(--motion-quick)]"
                        >
                            <Plus className="w-[16px] h-[16px] text-ds-text-primary shrink-0" strokeWidth={2} />
                            <span className="ds-text-body-1 text-ds-text-primary whitespace-nowrap">
                                New collection
                            </span>
                        </button>
                    </div>
                </motion.div>

                <CreateCollectionModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={handleCreateFolder}
                />
            </div>
        </AnimatePresence>
    )

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body)
}
