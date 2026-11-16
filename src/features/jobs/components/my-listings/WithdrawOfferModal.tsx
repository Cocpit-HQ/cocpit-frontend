import React from 'react';
import { CocpitConfirmBox } from '@/shared/commonComponents/CocpitConfirmBox';

interface WithdrawOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const WithdrawOfferModal: React.FC<WithdrawOfferModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <CocpitConfirmBox
      isOpen={isOpen}
      title="Withdraw Offer?"
      message="Are you sure you want to withdraw your offer? This action cannot be undone."
      confirmText="Withdraw"
      cancelText="Cancel"
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  );
};

export default WithdrawOfferModal;
