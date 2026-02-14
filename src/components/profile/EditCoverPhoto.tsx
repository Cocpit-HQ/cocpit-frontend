
"use client";

import React, { useState, useRef, ReactNode } from "react";
import { Camera, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { uploadCoverPhoto, deleteCoverPhoto } from "@/services/api/profile";
import { useToast } from "@/hooks/use-toast";

interface EditCoverPhotoProps {
  coverImage: string | null;
  setCoverImage: (image: string | null) => void;
  children?: ReactNode;
  onUpload?: (formData: FormData) => Promise<{ coverUrl: string }>;
  onDelete?: () => Promise<void>;
}

const EditCoverPhoto: React.FC<EditCoverPhotoProps> = ({ coverImage, setCoverImage, children, onUpload, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Error", description: "Invalid file type. Please upload an image.", variant: "destructive" });
      return;
    }

    // Validate size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File size exceeds 5MB.", variant: "destructive" });
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("cover", selectedFile);

      let response;
      if (onUpload) {
        response = await onUpload(formData);
      } else {
        response = await uploadCoverPhoto(formData);
      }

      setCoverImage(response.coverUrl || (response as any).url);
      toast({ title: "Success", description: "Cover photo updated successfully." });

      // Cleanup
      handleCancelPreview();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: "Failed to upload cover photo.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete();
      } else {
        await deleteCoverPhoto();
      }
      setCoverImage(null);
      toast({ title: "Success", description: "Cover photo removed." });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Error", description: "Failed to remove cover photo.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const displayImage = previewUrl || coverImage || null;

  const CoverPhotoModal = (
    <Dialog open={isModalOpen} onOpenChange={(open) => {
      setIsModalOpen(open);
      if (!open) handleCancelPreview();
    }}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-none shadow-2xl">
        <DialogHeader className="flex flex-col items-center justify-center pt-6">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Cover Photo</DialogTitle>
          <DialogDescription className="text-center text-gray-500 mt-2">
            fast and easy way
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          {/* Rectangular Preview or Dropzone */}
          <div className="relative w-full aspect-[3/1] bg-blue-50/50 dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-dashed border-blue-200 dark:border-gray-700 flex flex-col items-center justify-center group hover:border-blue-400 transition-colors cursor-pointer" onClick={!previewUrl ? openFileDialog : undefined}>
            {displayImage ? (
              <img src={displayImage} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="bg-white dark:bg-gray-700 p-3 rounded-full mb-3 shadow-sm">
                  <ImageIcon className="h-8 w-8 text-pink-500" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload your cover photo</p>
                <p className="text-xs text-gray-400 mt-1">Drag and drop files here</p>
              </div>
            )}

            {/* Overlay button to change image during preview */}
            {previewUrl && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm" onClick={openFileDialog}>Change Image</Button>
              </div>
            )}
          </div>

          <div className="w-full mt-3 space-y-3">
            {/* Preview Actions */}
            {previewUrl ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelPreview}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isUploading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isUploading ? "Saving..." : "Save Photo"}
                </Button>
              </div>
            ) : (
              /* Delete Button - Only visible when not previewing and image exists */
              <Button
                variant="outline"
                className="w-full border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDelete}
                disabled={!coverImage || isUploading || isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Photo
              </Button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/png, image/jpeg, image/gif"
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <div className="relative w-full h-48 md:h-64 bg-gray-200 dark:bg-gray-700 rounded-t-lg group">
        {coverImage ? (
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover rounded-t-lg" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#4169E1] via-[#A855F7] to-[#EC4899] rounded-t-lg"></div>
        )}
        <div className="absolute inset-0 bg-black/20 rounded-t-lg pointer-events-none"></div>

        {children}
        <div className="absolute bottom-4 right-4 flex gap-2 z-50 pointer-events-auto">
          {/* Minimal trigger buttons on the cover itself */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer bg-white/80 dark:bg-black/50 p-2 rounded-full text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-black transition-colors"
            aria-label="Edit cover photo"
          >
            <Camera className="h-5 w-5" />
          </button>
        </div>
      </div>
      {CoverPhotoModal}
    </>
  );
};

export default EditCoverPhoto;