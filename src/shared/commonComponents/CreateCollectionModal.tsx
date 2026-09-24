"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Icon } from '@/components/icons'
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
                    className="relative w-72 p-3 bg-ds-bg border border-ds-border rounded-2xl shadow-2xl z-10 flex flex-col items-center gap-3 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Top Row: Close Button */}
                    <div className="self-stretch flex justify-end items-center">
                        <button
                            onClick={onClose}
                            aria-label="Close create collection modal"
                            className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity"
                        >
                            <Icon name="cross" className="w-5 h-5 text-ds-text-primary" />
                        </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-ds-text-primary text-center">
                        New collection
                    </h3>

                    <form onSubmit={handleSubmit} className="self-stretch flex flex-col items-center gap-3">
                        {/* Input Row */}
                        <div className="self-stretch py-2 border-b border-ds-border flex items-center">
                            <input
                                type="text"
                                autoFocus
                                value={collectionName}
                                onChange={(e) => setCollectionName(e.target.value)}
                                placeholder="Collection name"
                                className="w-full bg-transparent border-none outline-none font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-ds-text-primary placeholder:text-ds-text-muted p-0"
                            />
                        </div>

                        {/* Buttons Row */}
                        <div className="flex justify-center items-center gap-2 pt-1">
                            <button
                                type="submit"
                                disabled={!hasName || isLoading}
                                className={`w-20 px-3 py-1.5 rounded-[100px] flex justify-center items-center font-['DM_Sans'] font-medium text-[16px] leading-[24px] transition-colors ${hasName
                                        ? 'bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-[0.98]'
                                        : 'bg-ds-surface-1 text-ds-text-muted cursor-default'
                                    }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Create'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 rounded-[100px] border border-ds-border flex justify-center items-center font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-ds-text-primary hover:bg-ds-surface-1 transition-colors active:scale-[0.98]"
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
