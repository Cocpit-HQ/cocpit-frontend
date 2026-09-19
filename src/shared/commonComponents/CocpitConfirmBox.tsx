'use client';

import React from 'react';
import { ActionConfirmModal } from './ActionConfirmModal';

export interface CocpitConfirmBoxProps {
  isOpen: any;
  title: React.ReactNode;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CocpitConfirmBox: React.FC<CocpitConfirmBoxProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <ActionConfirmModal
      isOpen={Boolean(isOpen)}
      onClose={onCancel}
      onConfirm={onConfirm}
      title={title}
      description={message}
      confirmText={confirmText}
      cancelText={cancelText}
      isLoading={isLoading}
    />
  );
};

export default CocpitConfirmBox;

