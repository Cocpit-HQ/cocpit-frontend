import React, { useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Upload, Trash2 } from "lucide-react";

interface GroupAvatarUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAvatarUrl: string | null;
    onUpload: (file: File) => Promise<void>;
    onDelete?: () => Promise<void>;
}

export function GroupAvatarUploadModal({
    isOpen,
    onClose,
    currentAvatarUrl,
    onUpload,
    onDelete,
}: GroupAvatarUploadModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setIsUploading(true);
                await onUpload(file);
                onClose();
            } catch (error) {
                console.error("Upload failed", error);
                // Toast can be handled by parent
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        if (confirm("Are you sure you want to remove the group photo?")) {
            try {
                setIsUploading(true);
                await onDelete();
                onClose();
            } catch (error) {
                console.error("Delete failed", error);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const displayUrl = currentAvatarUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop"; // Group placeholder

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Group Photo</DialogTitle>
                    <DialogDescription>
                        Update group icon.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    <div className="relative h-40 w-40 rounded-full overflow-hidden border-4 border-background shadow-sm">
                        <img
                            src={displayUrl}
                            alt="Group Icon"
                            className="h-full w-full object-cover"
                        />
                    </div>

                    <div className="flex flex-col w-full gap-3 sm:flex-row sm:justify-center">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                            Upload Photo
                        </Button>

                        {currentAvatarUrl && onDelete && (
                            <Button
                                variant="outline"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2"
                                onClick={handleDelete}
                                disabled={isUploading}
                            >
                                <Trash2 className="h-4 w-4" />
                                Remove Photo
                            </Button>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
