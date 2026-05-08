import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, X, Loader2 } from "lucide-react";
import { Icon } from '@iconify/react';
import { cn } from "@/lib/utils";

type ModalState = "edit" | "upload";

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
  const [zoom, setZoom] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>("edit");
  const [isDragOver, setIsDragOver] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Determine initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentAvatarUrl || previewUrl) {
        setModalState("edit");
      } else {
        setModalState("upload");
      }
    }
  }, [isOpen]);

  const displayUrl = previewUrl || currentAvatarUrl || null;
  const hasImage = !!displayUrl;

  const resetTransforms = () => {
    setZoom(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  const handleFileProcess = useCallback((file: File) => {
    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return;
    }
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      resetTransforms();
      setModalState("edit");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
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
    const now = Date.now();
    if (now - lastClickTime < 2000) return;
    setLastClickTime(now);

    const sourceUrl = previewUrl || currentAvatarUrl;
    if (!sourceUrl) return;

    try {
      setIsUploading(true);

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

      const size = 800;
      canvas.width = size;
      canvas.height = size;

      ctx.clearRect(0, 0, size, size);
      ctx.save();

      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      const imgAspect = img.width / img.height;
      let drawWidth, drawHeight;

      if (imgAspect > 1) {
        drawHeight = size;
        drawWidth = size * imgAspect;
      } else {
        drawWidth = size;
        drawHeight = size / imgAspect;
      }

      const zoomScale = 1 + (zoom / 100);
      drawWidth *= zoomScale;
      drawHeight *= zoomScale;

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], "profile_avatar.jpg", { type: "image/jpeg" });
          await onUpload(file);
          onClose();
        }
      }, "image/jpeg", 0.95);

    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      setPreviewUrl(null);
      resetTransforms();
      setModalState("upload");
    } catch (error) {
      console.error("Delete failed", error);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-none sm:max-w-[600px] h-[100dvh] sm:h-auto w-full [&>button]:hidden outline-none data-[state=open]:duration-300 data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0">
        <div className="relative bg-card rounded-none sm:rounded-[24px] p-4 sm:p-[32px] w-full h-full sm:h-auto shadow-sm flex flex-col outline-none overflow-y-auto overflow-x-hidden">

          {/* ─── Mobile Header ─── */}
          <div className="sm:hidden flex items-center justify-between mb-8 sticky top-0 bg-card z-20 pt-2 pb-4">
            <button onClick={onClose} className="p-2 -ml-2 text-foreground hover:bg-secondary rounded-full transition-colors">
              <Icon icon="hugeicons:arrow-left-01" className="w-6 h-6" />
            </button>
            <DialogTitle className="text-[16px] font-medium font-[family-name:var(--font-poppins)] text-foreground m-0 p-0">
              Profile image
            </DialogTitle>
            <button
              onClick={handleSave}
              disabled={isUploading || isDeleting || !hasImage}
              className="px-4 py-1.5 rounded-full bg-secondary text-primary font-medium text-[14px] disabled:opacity-50 transition-all"
            >
              {isUploading ? "..." : "Save"}
            </button>
          </div>

          {/* ─── Desktop Header ─── */}
          <button
            onClick={onClose}
            className="hidden sm:block absolute top-6 right-6 p-1 text-destructive hover:bg-destructive/10 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>

          <div className="hidden sm:block text-center mb-6 relative px-4">
            <DialogTitle className="text-[18px] leading-[26px] font-semibold font-[family-name:var(--font-poppins)] text-foreground mb-1">
              Profile image
            </DialogTitle>
            <p className="text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
              Square image works best for profile display
            </p>
          </div>

          {/* ─── Content Area with Smooth Transition ─── */}
          <div className="relative min-h-[320px] sm:min-h-[360px] flex flex-col items-center justify-center">

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
                  disabled={isDeleting || !currentAvatarUrl}
                  className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} /> : <Trash2 className="w-6 h-6" strokeWidth={1.5} />}
                </button>
              </div>

              {/* Image Preview with Hover Overlay */}
              <div
                className="w-[200px] h-[200px] aspect-square flex-shrink-0 mx-auto relative bg-muted cursor-pointer group flex items-center justify-center border-4 border-card shadow-lg"
                onClick={openFilePicker}
              >
                {hasImage && (
                  <img
                    src={displayUrl!}
                    alt="Current Profile"
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-200 z-[1]"
                    style={{
                      transform: `scale(${1 + (zoom / 100)}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
                    }}
                  />
                )}

                {/* Perfect Circle Crop Overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none z-[2] overflow-hidden"
                >
                   <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full"
                    style={{
                      boxShadow: '0 0 0 999px rgba(217, 217, 217, 0.5)'
                    }}
                  />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 z-[3]">
                  
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
              <div className="mt-auto sm:mt-8 max-w-[400px] mx-auto w-full px-4 sm:px-0">
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
                    Recommended size: 400 × 400 px
                  </p>
                </div>
              </div>


            </div>
          </div>

          {/* ─── Desktop Footer Buttons ─── */}
          <div className="hidden sm:flex justify-center gap-4 mt-10">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading || isDeleting}
              className="w-[160px] h-[40px] rounded-[24px] border border-primary text-primary bg-transparent text-[14px] flex items-center justify-center transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUploading || isDeleting || !hasImage}
              className="w-[160px] h-[40px] rounded-[24px] bg-primary text-primary-foreground border-none text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              {isUploading ? "Saving..." : "Save"}
            </button>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
