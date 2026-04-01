"use client"

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createSavedFolder } from '@/services/api/savedPost'
import { SavedFolder } from '@/types/entities'
import { useActiveProfile } from '@/context/ActiveProfileContext'

interface CreateFolderModalProps {
    isOpen: boolean
    onClose: () => void
    onFolderCreated: (folder: SavedFolder) => void
}

export function CreateFolderModal({ isOpen, onClose, onFolderCreated }: CreateFolderModalProps) {
    const { isCompany, activeProfile } = useActiveProfile()
    const [folderName, setFolderName] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!folderName.trim()) return

        setIsLoading(true)
        try {
            const companyId = isCompany ? activeProfile?.id : undefined;
            const response = await createSavedFolder(folderName, companyId)
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

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 isolate">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/60 backdrop-blur-sm sm:bg-black/40"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 400 }}
                    className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 ring-1 ring-border/50"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <FolderPlus className="w-4 h-4 text-primary" />
                            </div>
                            <h3 className="font-bold text-base text-foreground tracking-tight">
                                New Collection
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5">
                        <div className="mb-5">
                            <label className="block text-[11px] font-bold text-muted-foreground/60 mb-2 uppercase tracking-[0.1em]">
                                Collection Name
                            </label>
                            <input
                                type="text"
                                autoFocus
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                placeholder="e.g. Design Inspo, Tech News..."
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 font-medium"
                            />
                        </div>

                        <div className="flex justify-end items-center gap-3 mt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!folderName.trim() || isLoading}
                                className="px-6 py-2.5 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:grayscale transition-all shadow-md shadow-primary/20 active:scale-95 flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Creating...
                                    </>
                                ) : "Create Collection"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body)
}
