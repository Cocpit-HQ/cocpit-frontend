"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditAvatarModal } from "@/features/profile/components/EditAvatarModal";
import { MAX_GROUP_MEMBERS } from "@/constants/messaging";

interface GroupEditViewProps {
    editData: {
        name: string;
        headline: string;
        description: string;
        avatar: string;
    };
    setEditData: React.Dispatch<React.SetStateAction<{
        name: string;
        headline: string;
        description: string;
        avatar: string;
    }>>;
    formErrors: {
        name: string;
        headline: string;
    };
    memberCount: number;
    hasChanges: boolean;
    isSaving: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onBack: () => void;
}

export const GroupEditView: React.FC<GroupEditViewProps> = ({
    editData,
    setEditData,
    formErrors,
    memberCount,
    hasChanges,
    isSaving,
    onSave,
    onDiscard,
    onBack
}) => {
    const [isEditAvatarOpen, setIsEditAvatarOpen] = useState(false);
    const [avatarInitialFile, setAvatarInitialFile] = useState<File | null>(null);
    const avatarFileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        if (editData.avatar) {
            setAvatarInitialFile(null);
            setIsEditAvatarOpen(true);
        } else {
            avatarFileInputRef.current?.click();
        }
    };

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarInitialFile(file);
            setIsEditAvatarOpen(true);
        }
        e.target.value = "";
    };

    const handleAvatarUpload = async (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setEditData(prev => ({ ...prev, avatar: reader.result as string }));
        };
        reader.readAsDataURL(file);
        setIsEditAvatarOpen(false);
        setAvatarInitialFile(null);
    };

    const handleAvatarDelete = async () => {
        setEditData(prev => ({ ...prev, avatar: "" }));
        setIsEditAvatarOpen(false);
        setAvatarInitialFile(null);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--ds-bg)] text-[var(--ds-text-primary)] font-['DM_Sans'] animate-in slide-in-from-right duration-200 overflow-y-auto scrollbar-hide">
            {/* Header Back Button */}
            <div className="p-4 md:px-6 md:pt-6 pb-2 flex items-center shrink-0">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 cursor-pointer text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity text-sm font-medium outline-none bg-transparent border-none p-0"
                >
                    <ChevronLeft className="w-5 h-5 text-[var(--ds-text-primary)]" strokeWidth={2} />
                    <span>Back</span>
                </button>
            </div>

            {/* Centered Group Avatar with Upload Trigger */}
            <div className="flex flex-col items-center px-4 pt-1 pb-4 shrink-0 text-center">
                <div
                    onClick={handleAvatarClick}
                    className="relative group cursor-pointer w-[88px] h-[88px] rounded-full overflow-hidden bg-zinc-800 border border-[var(--ds-border)] flex items-center justify-center shadow-sm"
                >
                    {editData.avatar ? (
                        <Image
                            src={editData.avatar}
                            alt="Preview"
                            width={88}
                            height={88}
                            className="object-cover w-full h-full"
                            unoptimized
                        />
                    ) : (
                        <div className="text-2xl font-bold text-[var(--ds-accent)]">
                            {(editData.name || "G").substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                    </div>
                </div>

                <input
                    type="file"
                    ref={avatarFileInputRef}
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleAvatarFileChange}
                />

                {isEditAvatarOpen && (
                    <EditAvatarModal
                        isOpen={isEditAvatarOpen}
                        onClose={() => {
                            setIsEditAvatarOpen(false);
                            setAvatarInitialFile(null);
                        }}
                        currentAvatarUrl={editData.avatar || null}
                        initialFile={avatarInitialFile}
                        onUpload={handleAvatarUpload}
                        onDelete={handleAvatarDelete}
                    />
                )}

                <h1 className="font-semibold text-lg md:text-xl text-[var(--ds-text-primary)] mt-3">
                    {editData.name || "Group Name"}
                </h1>

                <div className="flex items-center justify-center gap-2 mt-1 text-xs text-[var(--ds-text-secondary)]">
                    {editData.headline && (
                        <>
                            <span className="truncate max-w-[200px]">{editData.headline}</span>
                            <span>•</span>
                        </>
                    )}
                    <span>{memberCount}/{MAX_GROUP_MEMBERS} Members</span>
                </div>
            </div>

            {/* Inputs Form (Underline format matching Figma design) */}
            <div className="flex flex-col gap-6 mt-6 px-6 max-w-xl mx-auto w-full">
                {/* Group Name */}
                <div className="flex flex-col gap-1.5 w-full">
                    <label
                        htmlFor="group-name"
                        className="text-xs font-normal text-[var(--ds-text-secondary)]"
                    >
                        Group name
                    </label>
                    <input
                        id="group-name"
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full bg-transparent border-0 border-b border-[var(--ds-border)] focus:border-[var(--ds-accent)] text-[var(--ds-text-primary)] py-2 text-sm outline-none transition-colors"
                        placeholder="Enter group name"
                    />
                    {formErrors.name && (
                        <p className="text-[var(--ds-error)] text-xs mt-1">
                            {formErrors.name}
                        </p>
                    )}
                </div>

                {/* Group Headline */}
                <div className="flex flex-col gap-1.5 w-full">
                    <label
                        htmlFor="group-headline"
                        className="text-xs font-normal text-[var(--ds-text-secondary)]"
                    >
                        Group headline
                    </label>
                    <input
                        id="group-headline"
                        type="text"
                        value={editData.headline}
                        onChange={(e) => setEditData({ ...editData, headline: e.target.value })}
                        className="w-full bg-transparent border-0 border-b border-[var(--ds-border)] focus:border-[var(--ds-accent)] text-[var(--ds-text-primary)] py-2 text-sm outline-none transition-colors"
                        placeholder="Enter group headline"
                    />
                    {formErrors.headline && (
                        <p className="text-[var(--ds-error)] text-xs mt-1">
                            {formErrors.headline}
                        </p>
                    )}
                </div>

                {/* Action Buttons: Save & Discard Pill Buttons */}
                <div className="flex items-center justify-center gap-4 mt-8 pb-12">
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={!hasChanges || !editData.name?.trim() || isSaving}
                        className={cn(
                            "px-8 py-2 rounded-full font-medium text-sm transition-all cursor-pointer shadow-sm outline-none",
                            hasChanges && editData.name?.trim() && !isSaving
                                ? "bg-[var(--ds-accent)] text-white hover:opacity-90"
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        )}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>

                    <button
                        type="button"
                        onClick={onDiscard}
                        className="px-8 py-2 rounded-full bg-transparent border border-[var(--ds-border)] text-[var(--ds-text-primary)] font-medium text-sm hover:bg-zinc-800/80 transition-all cursor-pointer outline-none"
                    >
                        Discard
                    </button>
                </div>
            </div>
        </div>
    );
};
