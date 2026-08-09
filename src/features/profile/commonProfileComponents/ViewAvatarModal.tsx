"use client";

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
  if (!avatarUrl) return null;
  const displayUrl = avatarUrl;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-transparent border-none shadow-none max-w-none w-auto p-0 flex items-center justify-center">
        <div className="sr-only">
            <DialogTitle>Profile Picture</DialogTitle>
            <DialogDescription>A regular view of the profile picture.</DialogDescription>
        </div>

        <div className="relative">
             <img
              src={displayUrl}
              alt="Profile"
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-md"
              onClick={(e) => e.stopPropagation()}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
