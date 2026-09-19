import React from "react";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  return (
    <ActionConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      type="delete_post"
      title={title}
      description={description}
      isLoading={isDeleting}
    />
  );
}

export default DeleteConfirmationModal;

