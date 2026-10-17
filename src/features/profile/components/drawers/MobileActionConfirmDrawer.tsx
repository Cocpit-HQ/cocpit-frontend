"use client";

import React from "react";
import { Drawer } from "vaul";

interface MobileActionConfirmDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}

export const MobileActionConfirmDrawer: React.FC<MobileActionConfirmDrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  isDestructive = true,
}) => {
  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[99]" onClick={onClose} />
        <Drawer.Content className="bg-[var(--ds-bg)] flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[100] outline-none font-['DM_Sans'] border-t border-[var(--ds-border)] px-6 pb-8 pt-3">
          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--ds-border)] mb-5" />

          {/* Title & Description */}
          <div className="text-center mb-6">
            <Drawer.Title className="text-lg font-semibold text-[var(--ds-text-primary)] mb-2">
              {title}
            </Drawer.Title>
            <Drawer.Description className="text-sm text-[var(--ds-text-secondary)]">
              {description}
            </Drawer.Description>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row items-center gap-3 w-full justify-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onConfirm();
              }}
              className="flex-1 h-9 rounded-full bg-[var(--ds-accent)] text-[var(--ds-text-primary)] font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-full bg-[var(--ds-surface-2)] border border-[var(--ds-border)] text-[var(--ds-text-primary)] font-medium text-sm hover:bg-[var(--ds-surface-1)] active:scale-[0.98] transition-all cursor-pointer"
            >
              {cancelLabel}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default MobileActionConfirmDrawer;
