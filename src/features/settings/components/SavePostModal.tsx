"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Plus } from 'lucide-react'
import { SavedFolder } from '@/types/entities'
import { getSavedFolders, toggleSavePost } from '@/features/settings/api/savedPost'
import { CreateFolderModal } from './CreateFolderModal'
import { toast } from 'sonner'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { Icon } from '@iconify/react'
import { useQueryClient } from '@tanstack/react-query'
import { SAVED_FOLDERS_QUERY_KEY } from '@/features/settings/hooks/useSavedFolders'

const isValidImageUrl = (url?: string | null): boolean => !!url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:'));

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
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 isolate">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 15 }}
                    transition={{ type: "spring", damping: 28, stiffness: 350 }}
                    className="relative w-full max-w-[420px] bg-ds-surface-2 border border-ds-border rounded-2xl shadow-2xl z-20 flex flex-col p-6 animate-in fade-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Close Button */}
                    <div className="flex justify-end w-full mb-1">
                        <button
                            onClick={onClose}
                            aria-label="Close dialog"
                            className="p-1.5 rounded-lg text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-surface-1 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex flex-col items-center w-full flex-1 gap-4">
                        {/* Title & Subtitle */}
                        <div className="flex flex-col items-center gap-1 text-center">
                            <h3 className="ds-text-body-2 text-ds-text-primary">
                                Save post
                            </h3>
                            <p className="ds-text-small text-ds-text-secondary">
                                Choose a collection to save this post
                            </p>
                        </div>

                        {/* General Item */}
                        <div className="w-full">
                            <button
                                onClick={() => handleSaveToFolder(null)}
                                disabled={!!savingToFolderId}
                                className="w-full flex items-center justify-between px-3.5 h-12 bg-ds-surface-1 hover:bg-ds-surface-1/80 border border-ds-border rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-ds-surface-2 border border-ds-border flex items-center justify-center">
                                        <Icon icon="solar:folder-linear" className="w-4 h-4 text-ds-text-primary" />
                                    </div>
                                    <span className="ds-text-body-1 text-ds-text-primary">General</span>
                                </div>
                                {savingToFolderId === 'all' && (
                                    <Loader2 className="w-4 h-4 text-ds-accent animate-spin" />
                                )}
                            </button>
                        </div>

                        {/* Collections List */}
                        <div className="w-full flex flex-col items-start gap-2">
                            <span className="ds-text-small-1 text-ds-text-secondary">Collections</span>

                            <div className="w-full max-h-[180px] overflow-y-auto space-y-2 pr-1">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="w-5 h-5 text-ds-accent animate-spin" />
                                    </div>
                                ) : (
                                    folders.map((folder) => (
                                        <button
                                            key={folder.folder_id}
                                            onClick={() => handleSaveToFolder(folder.folder_id)}
                                            disabled={!!savingToFolderId}
                                            className="w-full flex items-center justify-between px-3.5 h-12 bg-ds-surface-1/60 hover:bg-ds-surface-1 border border-ds-border rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-ds-surface-2 border border-ds-border flex-shrink-0 flex items-center justify-center">
                                                    {isValidImageUrl(folder.cover_image) ? (
                                                        <img src={folder.cover_image!} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Icon icon="solar:folder-linear" className="w-4 h-4 text-ds-text-muted" />
                                                    )}
                                                </div>
                                                <span className="ds-text-body-1 text-ds-text-primary truncate max-w-[220px]">
                                                    {folder.name}
                                                </span>
                                            </div>
                                            {savingToFolderId === folder.folder_id && (
                                                <Loader2 className="w-4 h-4 text-ds-accent animate-spin flex-shrink-0" />
                                            )}
                                        </button>
                                    ))
                                )}

                                {!isLoading && folders.length === 0 && (
                                    <p className="py-4 text-center ds-text-small text-ds-text-muted italic">
                                        No custom collections yet.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* New Collection Button */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="ds-btn ds-btn-secondary ds-text-body-1 w-full h-9 mt-2 flex items-center justify-center gap-2 border border-ds-border hover:border-ds-accent hover:text-ds-accent transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New collection</span>
                        </button>
                    </div>
                </motion.div>

                <CreateFolderModal
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
