"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createSavedFolder } from '@/services/api/savedPost'
import { SavedFolder } from '@/types/entities'

interface CreateFolderModalProps {
    isOpen: boolean
    onClose: () => void
    onFolderCreated: (folder: SavedFolder) => void
}

export function CreateFolderModal({ isOpen, onClose, onFolderCreated }: CreateFolderModalProps) {
    const [folderName, setFolderName] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!folderName.trim()) return

        setIsLoading(true)
        try {
            const response = await createSavedFolder(folderName)
            if (response.success) {
                toast.success("Folder created")
                onFolderCreated(response.folder)
                setFolderName('')
                onClose()
            }
        } catch (error: any) {
            console.error("Failed to create folder:", error)
            if (error.response?.status === 409) {
                toast.error("Folder with this name already exists")
            } else {
                toast.error("Failed to create folder")
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-sm bg-card border border-border rounded-xl shadow-xl overflow-hidden z-10"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <FolderPlus className="w-4 h-4 text-primary" />
                            New Folder
                        </h3>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4">
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                                Folder Name
                            </label>
                            <input
                                type="text"
                                autoFocus
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                placeholder="e.g. Travel, Recipes, Inspiration"
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!folderName.trim() || isLoading}
                                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
