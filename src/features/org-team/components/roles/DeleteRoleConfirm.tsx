'use client';

import React from 'react';

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
  if (!isOpen) return null;

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="box-border flex flex-col items-center p-[12px] gap-[16px] w-[193px] bg-ds-bg border border-ds-border rounded-[16px] relative select-none"
      >
        <div className="flex flex-col items-center gap-[8px] w-[167px]">
          <h2 className="w-full text-center ds-text-body-1 text-ds-text-primary m-0">
            Delete role?
          </h2>
          <p className="w-[167px] text-center font-['DM_Sans'] text-[14px] font-normal leading-[20px] text-ds-text-secondary m-0 whitespace-normal">
            This will permanently delete the role and remove its permissions
          </p>
        </div>

        <div className="flex flex-row justify-center items-start gap-[8px] w-[162px] h-[36px]">
          <button
            onClick={onConfirm}
            className="flex flex-row justify-center items-center px-[12px] py-[6px] gap-[10px] w-[77px] h-[36px] bg-[var(--ds-accent)] rounded-[100px] ds-text-body-1 text-ds-text-primary hover:brightness-110 transition-colors cursor-pointer"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex flex-row justify-center items-center px-[12px] py-[6px] gap-[10px] w-[77px] h-[36px] border border-ds-border rounded-[100px] bg-transparent ds-text-body-1 text-ds-text-primary hover:bg-ds-surface-1 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
