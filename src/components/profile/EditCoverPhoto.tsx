"use client";

import React, { useState, useRef, ReactNode } from "react";
import { Camera, Trash2, Upload } from "lucide-react";
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

interface EditCoverPhotoProps {
  coverImage: string | null;
  setCoverImage: (image: string | null) => void;
  children?: ReactNode;
}

const EditCoverPhoto: React.FC<EditCoverPhotoProps> = ({ coverImage, setCoverImage, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
        setIsModalOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    setCoverImage(null);
    setIsModalOpen(false);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const CoverPhotoModal = (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent
        className={isMobile ? "bottom-0 h-[85vh] translate-y-0 rounded-t-lg" : ""}
        onInteractOutside={(e) => {
            if (isMobile) e.preventDefault();
        }}
        onEscapeKeyDown={handleClose}
      >
        <DialogHeader>
          <DialogTitle>Add a cover image</DialogTitle>
          <DialogDescription>
            Showcase your personality, interests, work, or team moments
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg my-4 min-h-[300px]">
          {coverImage ? (
            <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
                <p>No image selected</p>
            </div>
          )}
        </div>

        <DialogFooter className={`flex ${isMobile ? 'flex-col-reverse' : 'flex-row'} gap-2`}>
            {coverImage ? (
                <>
                    <Button variant="destructive" onClick={handleDelete} className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                    <Button variant="outline" onClick={openFileDialog} className="w-full">
                        <Camera className="mr-2 h-4 w-4" /> Replace
                    </Button>
                </>
            ) : (
                <Button onClick={openFileDialog} className="w-full">
                    <Upload className="mr-2 h-4 w-4" /> Upload photo
                </Button>
            )}
        </DialogFooter>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/png, image/jpeg, image/gif"
          className="hidden"
        />
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
          {coverImage && (
            <button
              type="button"
              onClick={handleDelete}
              className="cursor-pointer bg-white/80 dark:bg-black/50 p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-white dark:hover:bg-black transition-colors"
              aria-label="Delete cover photo"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
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