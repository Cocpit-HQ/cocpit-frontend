"use client";

import React, { useState, ReactNode } from "react";
import { uploadCoverPhoto, deleteCoverPhoto } from "../services/profile.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CocpitUserCoverImageEditor } from "@/shared/commonComponents/CocpitUserCoverImageEditor";

export interface EditCoverPhotoProps {
  isOpen?: boolean;
  onClose?: () => void;
  coverImage: string | null;
  initialFile?: File | null;
  setCoverImage?: (image: string | null) => void;
  children?: ReactNode;
  onUpload?: (formData: FormData) => Promise<{ coverUrl: string }>;
  onDelete?: () => Promise<void>;
  portalContainerId?: string;
  title?: string;
  subtitle?: string;
}

export const EditCoverPhoto: React.FC<EditCoverPhotoProps> = ({
  isOpen,
  onClose,
  coverImage,
  initialFile,
  setCoverImage,
  children,
  onUpload,
  onDelete,
  title = "Add banner",
  subtitle = "Double-click the image to change it",
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const isModalOpen = isControlled ? isOpen : internalOpen;
  const queryClient = useQueryClient();

  const closeModal = () => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  const handleSave = async (dataUrl: string | null, file: File | null) => {
    try {
      if (file) {
        // Upload new / updated cover photo
        const formData = new FormData();
        formData.append("cover", file);

        let response: any;
        if (onUpload) {
          response = await onUpload(formData);
        } else {
          response = await uploadCoverPhoto(formData);
        }

        const newUrl = response?.coverUrl || response?.url || dataUrl;
        if (setCoverImage && newUrl) {
          setCoverImage(newUrl);
        }
        queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        toast.success("Cover photo updated successfully.");
      } else if (!dataUrl) {
        // Removed cover photo
        if (onDelete) {
          await onDelete();
        } else {
          await deleteCoverPhoto();
        }
        if (setCoverImage) {
          setCoverImage(null);
        }
        queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        toast.success("Cover photo removed.");
      }
      closeModal();
    } catch (error) {
      console.error("Cover photo save error:", error);
      toast.error("Failed to save cover photo.");
    }
  };

  const editorModal = (
    <CocpitUserCoverImageEditor
      isOpen={isModalOpen}
      onClose={closeModal}
      initialImage={coverImage}
      initialFile={initialFile}
      onSave={handleSave}
      title={title}
      subtitle={subtitle}
    />
  );

  if (children) {
    return (
      <>
        <div
          onClick={() => !isModalOpen && setInternalOpen(true)}
          className="cursor-pointer"
        >
          {children}
        </div>
        {editorModal}
      </>
    );
  }

  return editorModal;
};

export default EditCoverPhoto;
