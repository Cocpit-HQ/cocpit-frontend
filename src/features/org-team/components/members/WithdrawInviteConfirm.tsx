'use client';

import React from 'react';
import { CocpitConfirmBox } from '@/shared/commonComponents/CocpitConfirmBox';

interface WithdrawInviteConfirmProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function WithdrawInviteConfirm({
  isOpen,
  onConfirm,
  onCancel,
}: WithdrawInviteConfirmProps) {
  return (
    <CocpitConfirmBox
      isOpen={isOpen}
      title="Withdraw Invitation?"
      message="This invitation will be canceled and can't be accepted."
      confirmText="Withdraw"
      cancelText="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
      buttonWidthClass="w-[98px]"
      modalClassName="w-[245px] h-[150px]"
    />
  );
}
