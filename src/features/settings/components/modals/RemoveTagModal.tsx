"use client";

import React from 'react';
import { ActionConfirmModal } from '@/shared/commonComponents/ActionConfirmModal';

interface RemoveTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function RemoveTagModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: RemoveTagModalProps) {
  if (!isOpen) return null;

  return (
    <ActionConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      type="remove_tag"
      confirmText="Remove"
      cancelText="Cancel"
      confirmColor="accent"
      isLoading={isLoading}
      buttonWidthClass="w-[84px]"
      modalClassName="w-[202px] min-h-[150px]"
    />
  );
}

export default RemoveTagModal;
