"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Icon } from '@/components/icons'
import { toast } from 'sonner'
import { createSavedFolderWithFile, updateSavedFolderWithFile } from '@/features/settings/api/savedPost'
import { SavedFolder } from '@/types/entities'
import { useActiveProfile } from '@/context/ActiveProfileContext'

export interface CreateCollectionModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (folder: SavedFolder) => void
    isEditing?: boolean
    initialName?: string
    initialCoverImage?: string
    folderId?: string
}

export function CreateCollectionModal({
    isOpen,
    onClose,
    onSuccess,
    isEditing = false,
    initialName = '',
    folderId
}: CreateCollectionModalProps) {
    const { isCompany, activeProfile } = useActiveProfile()
    const [collectionName, setCollectionName] = useState(initialName)
    const [isLoading, setIsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            setCollectionName(initialName || '')
        }
    }, [isOpen, initialName])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!collectionName.trim()) return

        setIsLoading(true)
        try {
            const companyId = isCompany ? activeProfile?.id : undefined;
            const formData = new FormData();
            formData.append('name', collectionName.trim());
            if (companyId) formData.append('companyId', companyId);

            let response;
            if (isEditing && folderId) {
                response = await updateSavedFolderWithFile(folderId, formData);
            } else {
                response = await createSavedFolderWithFile(formData);
            }

            if (response.success) {
                toast.success(isEditing ? "Collection updated" : "Collection created")
                onSuccess(response.folder)
                onClose()
            }
        } catch (error: any) {
            console.error("Failed to save collection:", error)
            const serverMsg = error.response?.data?.message || error.response?.data?.error;
            if (error.response?.status === 409) {
                toast.error(serverMsg || "Collection with this name already exists")
            } else {
                toast.error(isEditing ? "Failed to update collection" : "Failed to create collection")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const hasName = collectionName.trim().length > 0

    if (!mounted || typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 isolate select-none">
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
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative w-72 p-3 bg-ds-bg border border-ds-border rounded-2xl shadow-2xl z-10 flex flex-col items-center gap-3 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Row: Close Button */}
                        <div className="self-stretch flex justify-end items-center">
                            <button
                                onClick={onClose}
                                type="button"
                                aria-label="Close modal"
                                className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity"
                            >
                                <Icon name="cross" className="w-5 h-5 text-ds-text-primary" />
                            </button>
                        </div>

                        {/* Title */}
                        <h3 className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-ds-text-primary text-center">
                            {isEditing ? "Edit collection" : "New collection"}
                        </h3>

                        <form onSubmit={handleSubmit} className="self-stretch flex flex-col items-center gap-3">
                            {/* Input & Counter Container */}
                            <div className="self-stretch flex flex-col gap-1">
                                <div className="self-stretch py-2 border-b border-ds-border flex items-center">
                                    <input
                                        type="text"
                                        autoFocus
                                        maxLength={25}
                                        value={collectionName}
                                        onChange={(e) => setCollectionName(e.target.value)}
                                        placeholder="Collection name"
                                        className="w-full bg-transparent border-none outline-none font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-ds-text-primary placeholder:text-ds-text-muted p-0"
                                    />
                                </div>
                                <span className="self-end font-['DM_Sans'] text-[12px] text-ds-text-muted">
                                    {collectionName.length}/25
                                </span>
                            </div>

                            {/* Buttons Row */}
                            <div className="flex justify-center items-center gap-2 pt-1">
                                <button
                                    type="submit"
                                    disabled={!hasName || isLoading}
                                    className={`w-20 px-3 py-1.5 rounded-[100px] flex justify-center items-center font-['DM_Sans'] font-medium text-[16px] leading-[24px] transition-colors ${
                                        hasName
                                            ? 'bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-[0.98]'
                                            : 'bg-ds-surface-1 text-ds-text-muted cursor-default'
                                    }`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        isEditing ? "Save" : "Create"
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
            )}
        </AnimatePresence>,
        document.body
    )
}
