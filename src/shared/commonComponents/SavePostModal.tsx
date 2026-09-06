"use client"

import React, { useState, useEffect } from 'react'
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

interface SavePostModalProps {
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
    const queryClient = useQueryClient()

    const { isCompany, activeProfile } = useActiveProfile()

    useEffect(() => {
        if (isOpen) {
            fetchFolders()
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
        setSavingToFolderId(folderId || 'all')
        try {
            const companyId = isCompany ? activeProfile?.id : undefined;
            const response = await toggleSavePost(postId, folderId, companyId)
            if (response.success) {
                toast.success(folderId ? "Saved to folder" : "Saved to All Posts")
                queryClient.invalidateQueries({ queryKey: SAVED_FOLDERS_QUERY_KEY })
                onSaved(true)
                onClose()
            }
        } catch (error) {
            console.error("Failed to save to folder:", error)
            toast.error("Failed to save")
        } finally {
            setSavingToFolderId(null)
        }
    }

    const handleCreateFolder = (newFolder: SavedFolder) => {
        setFolders(prev => [newFolder, ...prev])
        handleSaveToFolder(newFolder.folder_id)
    }

    if (!isOpen) return null

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center sm:px-4 isolate">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 350 }}
                    className="relative w-full max-w-[300px] bg-ds-surface-2 border border-ds-border rounded-[var(--radius-card-new)] shadow-2xl z-20 flex flex-col p-[16px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header: Title + Close */}
                    <div className="flex items-center justify-between w-full mb-[16px]">
                        <div className="w-[24px]" /> {/* Spacer for centering */}
                        <h3 className="ds-text-body-1 text-ds-text-primary text-center">
                            Save
                        </h3>
                        <button
                            onClick={onClose}
                            aria-label="Close save modal"
                            className="flex items-center justify-center w-[24px] h-[24px] rounded-full hover:bg-ds-surface-1 transition-colors duration-[var(--motion-quick)]"
                        >
                            <X className="w-[16px] h-[16px] text-ds-text-secondary" strokeWidth={2} />
                        </button>
                    </div>

                    {/* General row */}
                    <button
                        onClick={() => handleSaveToFolder(null)}
                        disabled={!!savingToFolderId}
                        className="w-full flex items-center gap-[12px] px-[8px] py-[8px] hover:bg-ds-surface-1 rounded-[var(--radius-card-new)] transition-colors duration-[var(--motion-quick)] disabled:opacity-40 disabled:pointer-events-none"
                    >
                        <div className="w-[20px] h-[20px] flex items-center justify-center flex-shrink-0">
                            <Icon icon="solar:folder-linear" className="w-[20px] h-[20px] text-ds-text-primary" />
                        </div>
                        <span className="ds-text-body text-ds-text-primary flex-1 text-left">General</span>
                        {savingToFolderId === 'all' ? (
                            <Loader2 className="w-[16px] h-[16px] text-ds-text-secondary animate-spin flex-shrink-0" />
                        ) : (
                            <div className="w-[20px] h-[20px] rounded-full border-[2px] border-ds-border flex-shrink-0" />
                        )}
                    </button>

                    {/* Collection section — only shown when folders exist or are loading */}
                    {(isLoading || folders.length > 0) && (
                        <>
                            {/* Collection label */}
                            <span className="ds-text-small text-ds-text-muted px-[8px] mt-[12px] mb-[8px]">
                                Collection
                            </span>

                            {/* Folders list */}
                            <div className="w-full max-h-[160px] overflow-y-auto custom-scrollbar">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-[24px]">
                                        <Loader2 className="w-[20px] h-[20px] text-ds-text-muted animate-spin" />
                                    </div>
                                ) : (
                                    folders.map((folder) => (
                                        <button
                                            key={folder.folder_id}
                                            onClick={() => handleSaveToFolder(folder.folder_id)}
                                            disabled={!!savingToFolderId}
                                            className="w-full flex items-center gap-[12px] px-[8px] py-[8px] hover:bg-ds-surface-1 rounded-[var(--radius-card-new)] transition-colors duration-[var(--motion-quick)] disabled:opacity-40 disabled:pointer-events-none"
                                        >
                                            <div className="w-[20px] h-[20px] flex items-center justify-center flex-shrink-0">
                                                <Icon icon="solar:folder-linear" className="w-[20px] h-[20px] text-ds-text-primary" />
                                            </div>
                                            <span className="ds-text-body text-ds-text-primary flex-1 text-left truncate">
                                                {folder.name}
                                            </span>
                                            {savingToFolderId === folder.folder_id ? (
                                                <Loader2 className="w-[16px] h-[16px] text-ds-text-secondary animate-spin flex-shrink-0" />
                                            ) : (
                                                /* Orange filled radio — allowed per AGENTS.md for radio selected */
                                                <div className="w-[20px] h-[20px] rounded-full border-[2px] border-[var(--ds-accent)] flex items-center justify-center flex-shrink-0">
                                                    <div className="w-[10px] h-[10px] rounded-full bg-[var(--ds-accent)]" />
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {/* + New collection */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full flex items-center gap-[8px] px-[8px] py-[8px] mt-[8px] hover:bg-ds-surface-1 rounded-[var(--radius-card-new)] transition-colors duration-[var(--motion-quick)]"
                    >
                        <div className="w-[20px] h-[20px] flex items-center justify-center flex-shrink-0">
                            <Plus className="w-[16px] h-[16px] text-ds-text-primary" strokeWidth={2} />
                        </div>
                        <span className="ds-text-secondary text-ds-text-primary">New collection</span>
                    </button>
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
