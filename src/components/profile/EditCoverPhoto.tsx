
"use client";

import React, { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { Trash2, X, Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { uploadCoverPhoto, deleteCoverPhoto } from "@/services/api/profile";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type ModalState = "edit" | "upload";

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
  const [modalState, setModalState] = useState<ModalState>("edit");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const displayImage = previewUrl || coverImage || null;
  const hasImage = !!displayImage;

  // Determine initial state when modal opens
  useEffect(() => {
    if (isModalOpen) {
      if (coverImage || previewUrl) {
        setModalState("edit");
      } else {
        setModalState("upload");
      }
    }
  }, [isModalOpen]);

  const resetTransforms = () => {
    setZoom(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    resetTransforms();
  };

  const handleFileProcess = useCallback((file: File) => {
    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Error", description: "Invalid file type. Please upload an image.", variant: "destructive" });
      return;
    }
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File size exceeds 5MB.", variant: "destructive" });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    resetTransforms();
    setModalState("edit");
  }, [toast]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFileProcess(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  }, [handleFileProcess]);

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
      setPreviewUrl(null);
      setSelectedFile(null);
      resetTransforms();
      setModalState("upload");
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Error", description: "Failed to remove cover photo.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const switchToUpload = () => {
    setModalState("upload");
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const CoverPhotoModal = (
    <Dialog open={isModalOpen} onOpenChange={(open) => {
      setIsModalOpen(open);
      if (!open) handleCancelPreview();
    }}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[800px] [&>button]:hidden outline-none">
        <div className="relative bg-card rounded-[24px] p-[16px] w-[800px] max-w-full shadow-sm flex flex-col outline-none">
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

          {/* ─── Content Area with Smooth Transition ─── */}
          <div className="relative min-h-[340px] flex flex-col items-center justify-center">

            {/* ═══ EDIT STATE ═══ */}
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center transition-all duration-300 ease-in-out",
                modalState === "edit"
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
              )}
            >
              {/* Transform Toolbar */}
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

              {/* Image Preview with Hover Overlay */}
              <div
                className="w-full h-[200px] mx-auto relative overflow-hidden bg-secondary rounded-[24px] cursor-pointer group"
                onClick={openFilePicker}
              >
                <img
                  src={displayImage || "/assets/coverphoto.jpg"}
                  alt="Current Cover"
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-200"
                  style={{ transform: `scale(${1 + (zoom / 100)}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})` }}
                />

                {/* ─── Hover Overlay ─── */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 z-10">
                  {/* Upload icon */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                    <Icon icon="solar:upload-linear" className="w-5 h-5 text-white" />
                  </div>
                  {/* Text */}
                  <span className="text-white text-[13px] font-medium font-[family-name:var(--font-poppins)] mt-1 tracking-wide">
                    Change image
                  </span>
                </div>
              </div>

              {/* Zoom Slider */}
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
            </div>

            {/* ═══ UPLOAD STATE ═══ */}
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ease-in-out",
                modalState === "upload"
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
              )}
            >
              {/* Centered Upload Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFilePicker}
                className={cn(
                  "w-[320px] sm:w-[380px] cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center py-12 px-6 gap-4",
                  isDragOver
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50"
                )}
              >
                {/* Upload Icon */}
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-2">
                  <Icon icon="solar:upload-linear" className="w-8 h-8 text-primary" />
                </div>

                {/* Text Content */}
                <div className="text-center space-y-2">
                  <p className="text-[15px] font-semibold text-foreground font-[family-name:var(--font-poppins)]">
                    Click or drag to upload
                  </p>
                  <p className="text-[13px] text-muted-foreground font-[family-name:var(--font-poppins)] leading-relaxed">
                    JPG, PNG, WEBP – Max 5MB
                  </p>
                  <p className="text-[12px] text-muted-foreground/70 font-[family-name:var(--font-poppins)]">
                    Recommended size: 1500 × 480 px
                  </p>
                </div>
              </div>


            </div>
          </div>

          {/* ─── Footer Buttons ─── */}
          <div className="flex justify-center gap-4 mt-10">
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
              onClick={handleSave}
              disabled={isUploading || isDeleting || !hasImage}
              className="w-[160px] h-[40px] rounded-[24px] bg-primary text-primary-foreground hover:opacity-90 border-none text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isUploading ? "Saving..." : "Save"}
            </Button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <div className="relative w-full h-[160px] bg-muted rounded-[24px] group overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <img src="/assets/coverphoto.jpg" alt="Default Cover" className="w-full h-full object-cover" />
        )}
        {children}

        {/* Avatar Cutout */}
        <div className="absolute left-[12px] md:left-[34px] -bottom-[49px] w-[98px] h-[98px] bg-[#ffffff] rounded-full z-0" />

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
