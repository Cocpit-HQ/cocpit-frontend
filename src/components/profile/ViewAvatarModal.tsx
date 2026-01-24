import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ViewAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl: string | null;
}

export function ViewAvatarModal({ isOpen, onClose, avatarUrl }: ViewAvatarModalProps) {
  const displayUrl = avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/*
         We override the default DialogContent styles to make it a lightbox.
         bg-transparent removes the white background.
         border-none removes the border.
         shadow-none removes the shadow.
         max-w-none / w-auto allows it to size to the image (constrained by viewport).
      */}
      <DialogContent className="bg-transparent border-none shadow-none max-w-none w-auto p-0 flex items-center justify-center">
        {/* Accessible Title/Description for screen readers since we might hide visual text */}
        <div className="sr-only">
            <DialogTitle>Profile Picture</DialogTitle>
            <DialogDescription>A regular view of the profile picture.</DialogDescription>
        </div>

        <div className="relative">
             <img
              src={displayUrl}
              alt="Profile"
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-md"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image? User said "touched anywhere else it will close". Default dialog behavior does this.
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
