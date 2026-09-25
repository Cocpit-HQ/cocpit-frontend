import React from 'react';
import { ActionConfirmModal } from '@/shared/commonComponents/ActionConfirmModal';

interface ClearAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ClearAllModal: React.FC<ClearAllModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  return (
    <ActionConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title="Clear all notifications"
      description="This will remove all your notifications"
      confirmText="Clear all"
      cancelText="Cancel"
      buttonWidthClass="w-[90px]"
    />
  );
};

export default ClearAllModal;
