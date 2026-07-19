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
      title="Are you sure you want to withdraw your invitation?"
      message="This invitation will be canceled and can no longer be accepted"
      confirmText="Withdraw"
      cancelText="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
