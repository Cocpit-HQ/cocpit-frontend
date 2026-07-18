'use client';

import React from 'react';
import { CocpitConfirmBox } from '@/shared/commonComponents/CocpitConfirmBox';

interface DeleteRoleConfirmProps {
  isOpen: boolean;
  roleName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteRoleConfirm({
  isOpen,
  roleName,
  onConfirm,
  onCancel,
}: DeleteRoleConfirmProps) {
  return (
    <CocpitConfirmBox
      isOpen={isOpen}
      title="Delete role?"
      message={`Are you sure you want to delete${roleName ? ` the "${roleName}"` : ''} role? All members with this role will lose their assigned permissions.`}
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
