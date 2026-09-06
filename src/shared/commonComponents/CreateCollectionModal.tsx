"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createSavedFolderWithFile } from '@/features/settings/api/savedPost'
import { SavedFolder } from '@/types/entities'
import { useActiveProfile } from '@/context/ActiveProfileContext'

interface CreateCollectionModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (folder: SavedFolder) => void
}

export function CreateCollectionModal({ isOpen, onClose, onSuccess }: CreateCollectionModalProps) {
    const { isCompany, activeProfile } = useActiveProfile()
    const [collectionName, setCollectionName] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setCollectionName('')
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!collectionName.trim()) return

        setIsLoading(true)
        try {
            const companyId = isCompany ? activeProfile?.id : undefined;
            const formData = new FormData();
            formData.append('name', collectionName.trim());
            if (companyId) formData.append('companyId', companyId);

            const response = await createSavedFolderWithFile(formData);
            if (response.success) {
                toast.success("Collection created")
                onSuccess(response.folder)
                onClose()
            }
        } catch (error: any) {
            console.error("Failed to create collection:", error)
            if (error.response?.status === 409) {
                toast.error("Collection with this name already exists")
            } else {
                toast.error("Failed to create collection")
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    const hasName = collectionName.trim().length > 0

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 isolate">
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
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 400 }}
                    className="relative w-full max-w-[300px] bg-ds-surface-2 border border-ds-border rounded-[var(--radius-card-new)] shadow-2xl z-10 flex flex-col p-[16px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header: Title + Close */}
                    <div className="flex items-center justify-between w-full mb-[16px]">
                        <div className="w-[24px]" /> {/* Spacer for centering */}
                        <h3 className="ds-text-body-1 text-ds-text-primary text-center">
                            New collection
                        </h3>
                        <button
                            onClick={onClose}
                            aria-label="Close create collection modal"
                            className="flex items-center justify-center w-[24px] h-[24px] rounded-full hover:bg-ds-surface-1 transition-colors duration-[var(--motion-quick)]"
                        >
                            <X className="w-[16px] h-[16px] text-ds-text-secondary" strokeWidth={2} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
                        {/* Input */}
                        <div className="flex flex-col gap-[4px]">
                            <label className="ds-text-small text-ds-text-muted">
                                Collection name
                            </label>
                            <input
                                type="text"
                                autoFocus
                                value={collectionName}
                                onChange={(e) => setCollectionName(e.target.value)}
                                placeholder="Collection name"
                                className="w-full h-[36px] bg-transparent border border-ds-border rounded-[var(--radius-card-new)] px-[12px] ds-text-small text-ds-text-primary focus:outline-none focus:border-[var(--ds-accent)] focus:ring-1 focus:ring-[var(--ds-accent)] transition-colors duration-[var(--motion-quick)] placeholder:text-ds-text-muted"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-[12px]">
                            <button
                                type="submit"
                                disabled={!hasName || isLoading}
                                className={`h-[36px] px-[16px] rounded-full ds-text-secondary-1 transition-colors duration-[var(--motion-quick)] ${
                                    hasName
                                        ? 'bg-[var(--ds-accent)] text-white hover:opacity-90 active:scale-[0.98]'
                                        : 'bg-transparent text-ds-text-muted cursor-default'
                                }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-[16px] h-[16px] animate-spin" />
                                ) : (
                                    'Create'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-[36px] px-[16px] rounded-full bg-transparent text-ds-text-primary ds-text-secondary-1 hover:bg-ds-surface-1 transition-colors duration-[var(--motion-quick)] active:scale-[0.98]"
                            >
                                Cancel
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
