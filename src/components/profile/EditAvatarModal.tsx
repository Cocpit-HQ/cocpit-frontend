import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, X, Loader2 } from "lucide-react";
import { Icon } from '@iconify/react';
import { cn } from "@/lib/utils";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        setZoom(0);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const [lastClickTime, setLastClickTime] = useState(0);

  const handleSave = async () => {
    const now = Date.now();
    if (now - lastClickTime < 2000) return; // 2 second cooldown
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

      const size = 800; // High resolution output
      canvas.width = size;
      canvas.height = size;

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      
      // Move to center for transformations
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      
      // Handle aspect ratio (Object-cover logic)
      const imgAspect = img.width / img.height;
      let drawWidth, drawHeight;

      if (imgAspect > 1) {
        // Wide image
        drawHeight = size;
        drawWidth = size * imgAspect;
      } else {
        // Tall image
        drawWidth = size;
        drawHeight = size / imgAspect;
      }

      // Apply zoom
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
      onClose();
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[600px] [&>button]:hidden outline-none">
        <div className="relative bg-white rounded-[24px] p-[32px] w-full shadow-sm flex flex-col outline-none">
          <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-1 text-[#F87171] hover:bg-red-50 rounded-full transition-colors z-10"
          >
              <X className="w-6 h-6" strokeWidth={1.5} />
          </button>

          <div className="text-center mb-6 relative px-4">
              <DialogTitle className="text-[18px] leading-[26px] font-semibold font-[family-name:var(--font-poppins)] text-[#000000] mb-1">
                Profile image
              </DialogTitle>
              <p className="text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
                Square image works best for profile display
              </p>
          </div>

          <div className="flex justify-center items-center gap-4 mb-6">
            <button 
              onClick={() => setFlipV(!flipV)}
              className={cn("p-1.5 rounded-md transition-colors", flipV ? "bg-[#6366F1] text-white" : "text-[#000000] hover:bg-gray-100")}
            >
              <Icon icon="hugeicons:flip-top" className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setFlipH(!flipH)}
              className={cn("p-1.5 rounded-md transition-colors", flipH ? "bg-[#6366F1] text-white" : "text-[#000000] hover:bg-gray-100")}
            >
              <Icon icon="hugeicons:flip-left" className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="p-1.5 text-[#000000] hover:bg-gray-100 rounded-md transition-colors"
            >
              <Icon icon="wordpress:rotate-left" className="w-6 h-6" />
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting || !currentAvatarUrl}
              className="p-1.5 text-[#F87171] hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} /> : <Trash2 className="w-6 h-6" strokeWidth={1.5} />}
            </button>
          </div>

          <div className="w-[240px] h-[240px] mx-auto relative overflow-hidden bg-gray-100 rounded-md cursor-pointer" onClick={() => fileInputRef.current?.click()}>
             <img
              src={displayUrl}
              alt="Current Profile"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-200"
              style={{ 
                transform: `scale(${1 + (zoom / 100)}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})` 
              }}
            />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-full h-full rounded-full ring-[200px] ring-black/40"></div>
            </div>
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
                onClick={onClose} 
                disabled={isUploading || isDeleting}
                className="w-[160px] h-[40px] rounded-[24px] border-[#818CF8] text-[#818CF8] hover:bg-[#EEF2FF] bg-transparent text-[14px]"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isUploading || isDeleting || (!previewUrl && !currentAvatarUrl)}
                className="w-[160px] h-[40px] rounded-[24px] bg-[#6366F1] text-white hover:bg-[#4F46E5] border-none text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isUploading ? "Saving..." : "Save"}
              </Button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
