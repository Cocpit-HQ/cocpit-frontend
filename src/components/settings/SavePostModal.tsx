"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderPlus, Bookmark, Check } from 'lucide-react'
import { SavedFolder } from '@/types/entities'
import { getSavedFolders, toggleSavePost } from '@/services/api/savedPost'
import { CreateFolderModal } from './CreateFolderModal'
import { toast } from 'sonner'
import { useActiveProfile } from '@/context/ActiveProfileContext'

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
        setFolders([newFolder, ...folders])
        // Optionally auto-save to new folder
        handleSaveToFolder(newFolder.folder_id)
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-sm bg-card border-t md:border border-border rounded-t-xl md:rounded-xl shadow-2xl overflow-hidden z-10 max-h-[80vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Bookmark className="w-4 h-4 text-primary fill-current" />
                            Save to...
                        </h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-2 space-y-1">
                        {/* Option: Create New Folder */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-background border border-transparent group-hover:border-border transition-colors">
                                <FolderPlus className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <span className="font-medium">New Collection</span>
                        </button>

                        <div className="h-px bg-border/50 my-1 mx-2" />

                        {/* Option: All Saved Posts */}
                        <button
                            onClick={() => handleSaveToFolder(null)}
                            disabled={!!savingToFolderId}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-white/5">
                                    <Bookmark className="w-5 h-5 text-white/70" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-medium">General</span>
                                    <span className="text-xs text-muted-foreground">Unsorted posts</span>
                                </div>
                            </div>
                            {savingToFolderId === 'all' && <Check className="w-4 h-4 text-primary" />}
                        </button>

                        {isLoading ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">Loading folders...</div>
                        ) : (
                            folders.map((folder) => (
                                <button
                                    key={folder.folder_id}
                                    onClick={() => handleSaveToFolder(folder.folder_id)}
                                    disabled={!!savingToFolderId}
                                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border flex items-center justify-center group-hover:border-primary/30 transition-colors">
                                            {/* Placeholder for folder cover image? For now just icon */}
                                            <span className="text-lg">📁</span>
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-medium truncate max-w-[180px]">{folder.name}</span>
                                            <span className="text-xs text-muted-foreground">{folder.post_count} posts</span>
                                        </div>
                                    </div>
                                    {savingToFolderId === folder.folder_id && <Check className="w-4 h-4 text-primary" />}
                                </button>
                            ))
                        )}

                        {!isLoading && folders.length === 0 && (
                            <div className="py-4 text-center text-xs text-muted-foreground italic">
                                No collections yet. Create one to organize your saved posts.
                            </div>
                        )}
                    </div>
                </motion.div>

                <CreateFolderModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onFolderCreated={handleCreateFolder}
                />
            </div>
        </AnimatePresence>
    )
}
