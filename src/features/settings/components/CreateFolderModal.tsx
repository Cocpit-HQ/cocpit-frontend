"use client"

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createSavedFolderWithFile, updateSavedFolderWithFile } from '@/features/settings/api/savedPost'
import { SavedFolder } from '@/types/entities'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { Icon } from '@iconify/react'
import { CocpitProfileUpload } from '@/shared/commonComponents/Cocpitprofileupload'

function dataUrlToBlob(dataUrl: string): Blob {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bytes = atob(data);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
}

interface CreateFolderModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (folder: SavedFolder) => void
    isEditing?: boolean
    initialName?: string
    initialCoverImage?: string
    folderId?: string
}

export function CreateFolderModal({ isOpen, onClose, onSuccess, isEditing, initialName = '', initialCoverImage = '', folderId }: CreateFolderModalProps) {
    const { isCompany, activeProfile } = useActiveProfile()
    const [folderName, setFolderName] = useState(initialName)
    const [coverImage, setCoverImage] = useState(initialCoverImage)
    const [isLoading, setIsLoading] = useState(false)

    React.useEffect(() => {
        if (isOpen) {
            setFolderName(initialName)
            setCoverImage(initialCoverImage)
        }
    }, [isOpen, initialName, initialCoverImage])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!folderName.trim()) return

        setIsLoading(true)
        try {
            const companyId = isCompany ? activeProfile?.id : undefined;
            const formData = new FormData();
            formData.append('name', folderName.trim());
            if (companyId) formData.append('companyId', companyId);

            // Comment out image upload for now as requested (sent as empty)
            /*
            if (coverImage && coverImage.startsWith('data:')) {
                const blob = dataUrlToBlob(coverImage);
                const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
                formData.append('cover_image', file);
            } else if (coverImage && coverImage.startsWith('http')) {
                formData.append('coverImage', coverImage);
            }
            */

            let response;
            if (isEditing && folderId) {
                response = await updateSavedFolderWithFile(folderId, formData);
            } else {
                response = await createSavedFolderWithFile(formData);
            }
            if (response.success) {
                toast.success(isEditing ? "Folder updated" : "Folder created")
                onSuccess(response.folder)
                onClose()
            }
        } catch (error: any) {
            const serverMsg = error.response?.data?.message || error.response?.data?.error;
            if (error.response?.status === 409) {
                console.warn("[SavedCollections] Conflict 409:", serverMsg || "Folder with this name already exists");
                toast.error(serverMsg || "A collection with this name already exists. Please choose a different name.");
            } else {
                console.error("[SavedCollections] Failed to save folder:", error);
                toast.error(serverMsg || (isEditing ? "Failed to update folder" : "Failed to create folder"));
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 isolate">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 15 }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    className="relative w-[300px] max-w-[calc(100vw-32px)] p-4 bg-ds-bg border border-ds-border rounded-2xl shadow-2xl z-10 flex flex-col justify-start items-center gap-4 overflow-hidden select-none animate-in fade-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Title */}
                    <div className="justify-start text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 text-center">
                        {isEditing ? "Edit collection" : "New collection"}
                    </div>

                    {/* Form: Input and Buttons */}
                    <form onSubmit={handleSubmit} className="self-stretch flex flex-col items-center gap-4">
                        {/* Underline text input */}
                        <div className="self-stretch py-2 border-b border-ds-border inline-flex justify-start items-center gap-2.5">
                            <input
                                type="text"
                                autoFocus
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                placeholder="Collection name"
                                className="w-full bg-transparent outline-none border-none text-ds-text-primary placeholder:text-ds-text-muted text-sm font-normal font-['DM_Sans'] leading-5"
                            />
                        </div>

                        {/* Actions: Create & Cancel */}
                        <div className="inline-flex justify-center items-start gap-2">
                            <button
                                type="submit"
                                disabled={!folderName.trim() || isLoading}
                                className={`w-20 px-3 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 transition-all text-base font-medium font-['DM_Sans'] leading-6 ${
                                    folderName.trim()
                                        ? 'bg-ds-accent text-white hover:opacity-90 active:scale-95 cursor-pointer'
                                        : 'bg-[#1c1d22] text-ds-text-muted cursor-not-allowed'
                                }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    isEditing ? "Save" : "Create"
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 flex justify-center items-center gap-2.5 transition-colors cursor-pointer"
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
