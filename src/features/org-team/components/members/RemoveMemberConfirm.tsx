'use client';

import React from 'react';
import { CocpitConfirmBox } from '@/shared/commonComponents/CocpitConfirmBox';

interface RemoveMemberConfirmProps {
  isOpen: boolean;
  memberName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function RemoveMemberConfirm({
  isOpen,
  memberName,
  onConfirm,
  onCancel,
  isLoading,
}: RemoveMemberConfirmProps) {
  return (
    <CocpitConfirmBox
      isOpen={isOpen}
      title="Remove member?"
      message="This will remove the member"
      confirmText="Remove"
      cancelText="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
      buttonWidthClass="w-[84px]"
      modalClassName="w-[202px] h-[150px]"
    />
  );
}
