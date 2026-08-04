"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderPlus, Bookmark, Check, Loader2, Folder, Plus } from 'lucide-react'
import { SavedFolder } from '@/types/entities'
import { getSavedFolders, toggleSavePost } from '@/features/settings/api/savedPost'
import { CreateFolderModal } from './CreateFolderModal'
import { toast } from 'sonner'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
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
            // folderId null means "All Saved" (no specific folder), undefined means toggle (legacy)
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
                {/* Overlay with blur */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-md transition-all sm:bg-black/60 sm:backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 350 }}
                    className="relative w-full max-w-[420px] md:min-h-[394px] bg-card border border-border rounded-[24px] shadow-2xl z-20 flex flex-col p-4 font-poppins"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Frame 2608580: Header with Close Button */}
                    <div className="flex flex-col items-end w-full h-6 mb-[10px]">
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted transition-all active:scale-95"
                        >
                            <X className="w-5 h-5 text-[#FF6B6B]" strokeWidth={2} />
                        </button>
                    </div>

                    {/* Frame 2608581: Main Content */}
                    <div className="flex flex-col items-center w-full flex-1 gap-4">
                        {/* Frame 2608578: Title & Subtitle */}
                        <div className="flex flex-col items-center gap-2">
                            <h3 className="font-medium text-[18px] leading-[26px] text-foreground text-center">
                                Save
                            </h3>
                            <p className="font-normal text-[12px] leading-[16px] text-muted-foreground text-center">
                                Share this with others
                            </p>
                        </div>

                        {/* General Item */}
                        <div className="w-full flex flex-col gap-2">
                            <button
                                onClick={() => handleSaveToFolder(null)}
                                disabled={!!savingToFolderId}
                                className="w-full flex items-center gap-2 px-4 h-14 hover:bg-muted/50 rounded-xl transition-all group active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-6 h-6 flex items-center justify-center">
                                        <Icon icon="solar:folder-linear" className="w-6 h-6 text-foreground" />
                                    </div>
                                    <span className="font-normal text-[16px] leading-[24px] text-foreground">General</span>
                                </div>
                                {savingToFolderId === 'all' && (
                                    <Loader2 className="w-4 h-4 ml-auto text-primary animate-spin" />
                                )}
                            </button>
                        </div>

                        {/* Collections List */}
                        <div className="w-full flex flex-col items-start gap-2 h-[144px]">
                            <span className="px-4 font-normal text-[12px] leading-[16px] text-muted-foreground">Collections</span>

                            <div className="w-full flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                    </div>
                                ) : (
                                    folders.map((folder) => (
                                        <button
                                            key={folder.folder_id}
                                            onClick={() => handleSaveToFolder(folder.folder_id)}
                                            disabled={!!savingToFolderId}
                                            className="w-full flex items-center gap-2 px-4 h-14 hover:bg-muted/50 rounded-xl transition-all group active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                                    {isValidImageUrl(folder.cover_image) ? (
                                                        <img src={folder.cover_image!} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                                            <Icon icon="solar:folder-linear" className="w-5 h-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-normal text-[16px] leading-[24px] text-foreground truncate max-w-[200px]">
                                                    {folder.name}
                                                </span>
                                            </div>
                                            {savingToFolderId === folder.folder_id && (
                                                <Loader2 className="w-4 h-4 ml-auto text-primary animate-spin" />
                                            )}
                                        </button>
                                    ))
                                )}

                                {!isLoading && folders.length === 0 && (
                                    <p className="px-4 text-[11px] text-muted-foreground italic opacity-70">
                                        No collections yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* New Collection Button */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full h-10 flex items-center justify-center gap-[10px] border border-[#818CF8] rounded-[24px] bg-white dark:bg-transparent hover:bg-[#818CF8]/5 transition-all active:scale-[0.98] mt-4"
                    >
                        <Plus className="w-6 h-6 text-[#818CF8]" strokeWidth={1.5} />
                        <span className="font-normal text-[14px] leading-[20px] text-[#818CF8] text-center w-[102px]">New collection</span>
                    </button>
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
