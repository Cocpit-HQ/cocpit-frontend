"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderPlus, Bookmark, Check, Loader2 } from 'lucide-react'
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

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[999] flex items-end md:items-center justify-center sm:px-4 isolate">
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
                    className="relative w-full max-w-sm bg-card border-t md:border border-border rounded-t-[20px] md:rounded-2xl shadow-2xl overflow-hidden z-20 max-h-[85vh] flex flex-col ring-1 ring-border/50"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Bookmark className="w-4 h-4 text-primary fill-current" />
                            </div>
                            <h3 className="font-bold text-base text-foreground tracking-tight">
                                Save to Collection
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                        {/* Action: Create New Folder */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full flex items-center gap-3.5 px-4 py-3.5 text-sm text-foreground hover:bg-primary/5 rounded-xl transition-all group border border-transparent hover:border-primary/10 active:scale-[0.98]"
                        >
                            <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 border border-border group-hover:border-primary/20 transition-all">
                                <FolderPlus className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-left">
                                <span className="block font-semibold">Create Collection</span>
                                <span className="text-[11px] text-muted-foreground">Start a new organized list</span>
                            </div>
                        </button>

                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="h-px bg-border/60 flex-1" />
                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest whitespace-nowrap">My Collections</span>
                            <div className="h-px bg-border/60 flex-1" />
                        </div>

                        {/* Option: All Saved Posts */}
                        <button
                            onClick={() => handleSaveToFolder(null)}
                            disabled={!!savingToFolderId}
                            className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-foreground hover:bg-muted/50 rounded-xl transition-all group active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-primary/10 shadow-inner">
                                    <Bookmark className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-semibold">General</span>
                                    <span className="text-[11px] text-muted-foreground font-medium">Unsorted ideas and inspiration</span>
                                </div>
                            </div>
                            {savingToFolderId === 'all' ? (
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-20 transition-opacity" />
                                </div>
                            )}
                        </button>

                        {isLoading ? (
                            <div className="py-10 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Syncing your lists...</span>
                            </div>
                        ) : (
                            folders.map((folder) => (
                                <button
                                    key={folder.folder_id}
                                    onClick={() => handleSaveToFolder(folder.folder_id)}
                                    disabled={!!savingToFolderId}
                                    className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-foreground hover:bg-muted/50 rounded-xl transition-all group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-xl bg-muted/30 border border-border flex items-center justify-center group-hover:border-primary/30 transition-all shadow-sm">
                                            <span className="text-xl filter drop-shadow-sm group-hover:scale-110 transition-transform">📁</span>
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-semibold truncate max-w-[180px]">{folder.name}</span>
                                            <span className="text-[11px] text-muted-foreground font-medium">{folder.post_count || 0} posts</span>
                                        </div>
                                    </div>
                                    {savingToFolderId === folder.folder_id ? (
                                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                            <div className="w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-20 transition-opacity" />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}

                        {!isLoading && folders.length === 0 && (
                            <div className="py-8 px-4 text-center">
                                <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                                    <Bookmark className="w-5 h-5 text-muted-foreground/40" />
                                </div>
                                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic opacity-70">
                                    Your collections are empty. Create one to keep your feed organized and clean.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="md:hidden h-2 shrink-0" />
                </motion.div>

                <CreateFolderModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onFolderCreated={handleCreateFolder}
                />
            </div>
        </AnimatePresence>
    )

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body)
}
