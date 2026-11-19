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
      type="clear_all_notifications"
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
};

export default ClearAllModal;
