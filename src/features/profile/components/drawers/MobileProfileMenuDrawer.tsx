"use client";

import React from "react";
import { Drawer } from "vaul";

interface MobileProfileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onContactInfo: () => void;
  onShareProfile: () => void;
  onDownloadProfile: () => void;
}

export const MobileProfileMenuDrawer: React.FC<MobileProfileMenuDrawerProps> = ({
  isOpen,
  onClose,
  onContactInfo,
  onShareProfile,
  onDownloadProfile,
}) => {
  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[99]" />
        <Drawer.Content className="bg-[var(--ds-surface-1)] flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[100] outline-none font-['DM_Sans'] border-t border-[var(--ds-border)] px-4 pb-8 pt-3">
          <Drawer.Title className="sr-only">Profile Options</Drawer.Title>
          <Drawer.Description className="sr-only">Options for your profile</Drawer.Description>
          
          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--ds-border)] mb-4" />

          {/* Action List */}
          <div className="flex flex-col gap-1 w-full">
            <button
              type="button"
              onClick={() => {
                onClose();
                onContactInfo();
              }}
              className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
            >
              Contact info
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onShareProfile();
              }}
              className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
            >
              Share profile
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDownloadProfile();
              }}
              className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
            >
              Download profile
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default MobileProfileMenuDrawer;
