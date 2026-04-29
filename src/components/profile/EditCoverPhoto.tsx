
"use client";

import React, { useState, useRef, ReactNode } from "react";
import { Camera, Trash2, Upload, Image as ImageIcon, Crop, Contrast, X, Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
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

  const [zoom, setZoom] = useState(50);

  const CoverPhotoModal = (
    <Dialog open={isModalOpen} onOpenChange={(open) => {
      setIsModalOpen(open);
      if (!open) handleCancelPreview();
    }}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[600px] [&>button]:hidden outline-none">
        <div className="relative bg-white rounded-[24px] p-[32px] w-full shadow-sm flex flex-col outline-none">
          <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-1 text-[#F87171] hover:bg-red-50 rounded-full transition-colors z-10"
          >
              <X className="w-6 h-6" strokeWidth={1.5} />
          </button>

          <div className="text-center mb-6 relative px-4">
              <DialogTitle className="text-[18px] leading-[26px] font-semibold font-[family-name:var(--font-poppins)] text-[#000000] mb-1">
                Cover image
              </DialogTitle>
              <p className="text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
                This will appear at the top of your profile
              </p>
          </div>

          <div className="flex justify-center items-center gap-4 mb-6">
            <button className="p-1.5 text-[#000000] hover:bg-gray-100 rounded-md transition-colors">
              <Icon icon="hugeicons:flip-top" className="w-6 h-6" />
            </button>
            <button className="p-1.5 text-[#000000] hover:bg-gray-100 rounded-md transition-colors">
              <Icon icon="hugeicons:flip-left" className="w-6 h-6" />
            </button>
            <button className="p-1.5 text-[#000000] hover:bg-gray-100 rounded-md transition-colors">
              <Icon icon="wordpress:rotate-left" className="w-6 h-6" />
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting || !displayImage}
              className="p-1.5 text-[#F87171] hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} /> : <Trash2 className="w-6 h-6" strokeWidth={1.5} />}
            </button>
          </div>

          <div 
            className="w-[500px] h-[160px] mx-auto relative overflow-hidden bg-gray-100 rounded-[24px] cursor-pointer" 
            onClick={openFileDialog}
          >
             <img
              src={displayImage || "/assets/coverphoto.jpg"}
              alt="Current Cover"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-200"
              style={{ transform: `scale(${1 + (zoom / 100)})` }}
            />
          </div>

          <div className="mt-8 max-w-[400px] mx-auto w-full">
            <p className="text-[14px] font-medium text-[#000000] mb-3">Zoom</p>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-[#EEF2FF] rounded-full accent-[#6366F1] cursor-pointer"
            />
          </div>

          <div className="flex justify-center gap-4 mt-10">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  handleCancelPreview();
                  setIsModalOpen(false);
                }} 
                disabled={isUploading || isDeleting}
                className="w-[160px] h-[40px] rounded-[24px] border-[#818CF8] text-[#818CF8] hover:bg-[#EEF2FF] bg-transparent text-[14px]"
              >
                Cancel
              </Button>
              <Button 
                onClick={previewUrl ? handleSave : openFileDialog}
                disabled={isUploading || isDeleting}
                className="w-[160px] h-[40px] rounded-[24px] bg-[#6366F1] text-white hover:bg-[#4F46E5] border-none text-[14px]"
              >
                {isUploading ? "Saving..." : previewUrl ? "Save" : "Upload"}
              </Button>
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
      <div className="relative w-full h-[160px] bg-gray-200 dark:bg-gray-700 rounded-[24px] group overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover rounded-[24px]" />
        ) : (
          <img src="/assets/coverphoto.jpg" alt="Default Cover" className="w-full h-full object-cover rounded-[24px]" />
        )}
        {children}
        
        {/* Avatar Cutout */}
        <div className="absolute left-[38px] -bottom-[40px] w-[80px] h-[80px] bg-white rounded-full z-0" />

        <div className="absolute bottom-4 right-4 flex gap-2 z-50 pointer-events-auto">
          {/* Minimal trigger buttons on the cover itself */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
            aria-label="Edit cover photo"
          >
            <img src="/assets/edit.png" alt="Edit" className="w-[32px] h-[32px]" />
          </button>
        </div>
      </div>
      {CoverPhotoModal}
    </>
  );
};

export default EditCoverPhoto;
