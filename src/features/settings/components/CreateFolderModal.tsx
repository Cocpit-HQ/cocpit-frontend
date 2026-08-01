"use client"

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FolderPlus, User, Plus, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createSavedFolder, renameSavedFolder } from '@/features/settings/api/savedPost'
import { SavedFolder } from '@/types/entities'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { Icon } from '@iconify/react'
import { CocpitProfileUpload } from '@/shared/commonComponents/Cocpitprofileupload'

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
            let response;
            if (isEditing && folderId) {
                response = await renameSavedFolder(folderId, folderName, companyId, coverImage);
            } else {
                response = await createSavedFolder(folderName, companyId, coverImage);
            }
            if (response.success) {
                toast.success(isEditing ? "Folder updated" : "Folder created")
                onSuccess(response.folder)
                onClose()
            }
        } catch (error: any) {
            console.error("Failed to save folder:", error)
            if (error.response?.status === 409) {
                toast.error("Folder with this name already exists")
            } else {
                toast.error(isEditing ? "Failed to update folder" : "Failed to create folder")
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 isolate">
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
                    className="relative w-full max-w-[420px] md:min-h-[374px] bg-card border border-border rounded-[24px] shadow-2xl z-10 flex flex-col p-6 font-poppins"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Close Button */}
                    <div className="flex flex-col items-end w-full h-6 mb-[10px]">
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted transition-all active:scale-95"
                        >
                            <X className="w-5 h-5 text-[#FF6B6B]" strokeWidth={2} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center w-full flex-1 gap-4">
                        {/* Title & Subtitle */}
                        <div className="flex flex-col items-center gap-2">
                            <h3 className="font-medium text-[18px] leading-[26px] text-foreground text-center">
                                {isEditing ? "Edit collection" : "Collection"}
                            </h3>
                            <p className="font-normal text-[12px] leading-[16px] text-muted-foreground text-center">
                                Share this with others
                            </p>
                        </div>

                        {/* Add cover image section */}
                        <CocpitProfileUpload
                            value={coverImage}
                            onChange={setCoverImage}
                            trigger={
                                <div className="flex flex-col items-center gap-2 mt-2 cursor-pointer group">
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border border-border overflow-hidden relative transition-all group-hover:bg-muted/80">
                                        {coverImage ? (
                                            <img src={coverImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Icon icon="solar:folder-linear" className="w-10 h-10 text-muted-foreground" />
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all">
                                            <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </div>
                                    <span className="font-normal text-[12px] leading-[16px] text-foreground">
                                        {isEditing ? "Cover image" : "Add cover image"}
                                    </span>
                                </div>
                            }
                        />

                        <form onSubmit={handleSubmit} className="w-full flex flex-col flex-1 gap-6 mt-2">
                            <div className="flex flex-col gap-2">
                                <label className="font-normal text-[14px] leading-[20px] text-foreground">
                                    Collection name
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={folderName}
                                    onChange={(e) => setFolderName(e.target.value)}
                                    placeholder="Enter value"
                                    className="w-full h-12 bg-transparent border border-[#818CF8]/50 rounded-[12px] px-4 text-[16px] leading-[24px] font-normal text-foreground dark:text-foreground focus:outline-none focus:border-[#818CF8] focus:ring-1 focus:ring-[#818CF8] transition-all placeholder:text-muted-foreground/50 font-poppins"
                                />
                            </div>

                            <div className="flex items-center gap-3 mt-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 h-10 flex items-center justify-center border border-[#818CF8] rounded-[24px] font-normal text-[14px] text-[#818CF8] bg-white dark:bg-transparent hover:bg-[#818CF8]/5 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!folderName.trim() || isLoading}
                                    className="flex-1 h-10 flex items-center justify-center bg-[#818CF8] rounded-[24px] font-normal text-[14px] text-white hover:bg-[#818CF8]/90 disabled:bg-[#818CF8]/40 disabled:text-white/60 transition-all active:scale-95 shadow-sm"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (isEditing ? "Save" : "Add")}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body)
}
