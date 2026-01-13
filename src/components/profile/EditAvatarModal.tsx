import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // Assuming standard shadcn button exists or we use raw button
import { Camera, Trash2, Loader2, Upload } from "lucide-react";

interface EditAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function EditAvatarModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  onUpload,
  onDelete,
}: EditAvatarModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        await onUpload(file);
        onClose();
      } catch (error) {
        console.error("Upload failed", error);
        // Could add toast here if available globally
      } finally {
        setIsUploading(false);
        // Reset input value to allow re-uploading same file if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      onClose();
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayUrl = currentAvatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Photo</DialogTitle>
          <DialogDescription>
            Update or remove your profile picture.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          <div className="relative h-40 w-40 rounded-full overflow-hidden border-4 border-background shadow-sm">
             <img
              src={displayUrl}
              alt="Current Profile"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col w-full gap-3 sm:flex-row sm:justify-center">
            <Button
                variant="outline"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isDeleting}
            >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Upload Photo
            </Button>

            {/* Only show delete if user has a custom avatar (not null) */}
            {currentAvatarUrl && (
                <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={handleDelete}
                    disabled={isUploading || isDeleting}
                >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete
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
            <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading || isDeleting}>
              Cancel
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
