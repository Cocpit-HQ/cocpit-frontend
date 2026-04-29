import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crop, Contrast, Trash2, X, Loader2 } from "lucide-react";
import { Icon } from '@iconify/react';

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
  const [zoom, setZoom] = useState(50);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        await onUpload(file);
        onClose();
      } catch (error) {
        console.error("Upload failed", error);
      } finally {
        setIsUploading(false);
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

  const displayUrl = currentAvatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop";

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
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-200"
              style={{ transform: `scale(${1 + (zoom / 100)})` }}
            />
            {/* Circular mask for profile crop preview */}
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
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isDeleting}
                className="w-[160px] h-[40px] rounded-[24px] bg-[#6366F1] text-white hover:bg-[#4F46E5] border-none text-[14px]"
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
