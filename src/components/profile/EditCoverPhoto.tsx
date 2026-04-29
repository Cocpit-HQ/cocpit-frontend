
"use client";

import React, { useState, useRef, ReactNode } from "react";
import { Camera, Trash2, Upload, Image as ImageIcon, Crop, Contrast, X, Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
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
import { useQueryClient } from "@tanstack/react-query";

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
  const [zoom, setZoom] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    const sourceUrl = previewUrl || coverImage;
    if (!sourceUrl) return;

    setIsUploading(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = sourceUrl;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Maintain a high resolution aspect ratio (3.125:1 for 500x160)
      const width = 1500;
      const height = 480;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      let drawWidth, drawHeight;

      if (imgAspect > canvasAspect) {
        drawHeight = height;
        drawWidth = height * imgAspect;
      } else {
        drawWidth = width;
        drawHeight = width / imgAspect;
      }

      const zoomScale = 1 + (zoom / 100);
      drawWidth *= zoomScale;
      drawHeight *= zoomScale;

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], "cover_photo.jpg", { type: "image/jpeg" });
          const formData = new FormData();
          formData.append("cover", file);

          let response;
          if (onUpload) {
            response = await onUpload(formData);
          } else {
            response = await uploadCoverPhoto(formData);
          }

          setCoverImage(response.coverUrl || (response as any).url);
          queryClient.invalidateQueries({ queryKey: ["my-profile"] });
          toast({ title: "Success", description: "Cover photo updated successfully." });

          handleCancelPreview();
          setIsModalOpen(false);
        }
      }, "image/jpeg", 0.9);

    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: "Failed to save cover photo.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setZoom(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
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
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
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
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[600px] [&>button]:hidden outline-none">
        <div className="relative bg-card rounded-[24px] p-[32px] w-full shadow-sm flex flex-col outline-none">
          <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-1 text-destructive hover:bg-destructive/10 rounded-full transition-colors z-10"
          >
              <X className="w-6 h-6" strokeWidth={1.5} />
          </button>

          <div className="text-center mb-6 relative px-4">
              <DialogTitle className="text-[18px] leading-[26px] font-semibold font-[family-name:var(--font-poppins)] text-foreground mb-1">
                Cover image
              </DialogTitle>
              <p className="text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                This will appear at the top of your profile
              </p>
          </div>

          <div className="flex justify-center items-center gap-4 mb-6">
            <button 
              onClick={() => setFlipV(!flipV)}
              className={cn("p-1.5 rounded-md transition-colors", flipV ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary")}
            >
              <Icon icon="hugeicons:flip-top" className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setFlipH(!flipH)}
              className={cn("p-1.5 rounded-md transition-colors", flipH ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary")}
            >
              <Icon icon="hugeicons:flip-left" className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="p-1.5 text-foreground hover:bg-secondary rounded-md transition-colors"
            >
              <Icon icon="wordpress:rotate-left" className="w-6 h-6" />
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting || !coverImage}
              className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} /> : <Trash2 className="w-6 h-6" strokeWidth={1.5} />}
            </button>
          </div>

          <div 
            className="w-full h-[200px] mx-auto relative overflow-hidden bg-secondary rounded-[24px]" 
          >
             <img
              src={displayImage || "/assets/coverphoto.jpg"}
              alt="Current Cover"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-200"
              style={{ transform: `scale(${1 + (zoom / 100)}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})` }}
            />
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors cursor-pointer group"
              onClick={openFileDialog}
            >
              {!displayImage && <ImageIcon className="w-8 h-8 text-muted-foreground group-hover:text-foreground" />}
            </div>
          </div>

          <div className="mt-8 max-w-[400px] mx-auto w-full">
            <p className="text-[14px] font-medium text-foreground mb-3">Zoom</p>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-secondary rounded-full accent-primary cursor-pointer"
            />
          </div>

          <div className="flex justify-center gap-4 mt-10">
              {coverImage && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isUploading || isDeleting}
                  className="w-[160px] h-[40px] rounded-[24px] border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent text-[14px]"
                >
                  {isDeleting ? "Removing..." : "Remove"}
                </Button>
              )}
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  handleCancelPreview();
                  setIsModalOpen(false);
                }} 
                disabled={isUploading || isDeleting}
                className="w-[160px] h-[40px] rounded-[24px] border-primary text-primary hover:bg-primary/5 bg-transparent text-[14px]"
              >
                Cancel
              </Button>
              <Button 
                onClick={displayImage ? handleSave : openFileDialog}
                disabled={isUploading || isDeleting}
                className="w-[160px] h-[40px] rounded-[24px] bg-primary text-primary-foreground hover:opacity-90 border-none text-[14px]"
              >
                {isUploading ? "Saving..." : displayImage ? "Save" : "Upload"}
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
      <div className="relative w-full h-[200px] bg-muted rounded-t-[24px] group overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <img src="/assets/coverphoto.jpg" alt="Default Cover" className="w-full h-full object-cover" />
        )}
        {children}
        
        {/* Avatar Cutout */}
        <div className="absolute left-4 md:left-[38px] -bottom-[32px] md:-bottom-[40px] w-[64px] h-[64px] md:w-[80px] md:h-[80px] bg-card rounded-full z-0" />

        <div className="absolute bottom-4 right-4 flex gap-2 z-10 pointer-events-auto">
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
