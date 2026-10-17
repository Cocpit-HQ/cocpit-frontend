"use client";

import React from "react";
import { Drawer } from "vaul";

interface MobilePostMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner?: boolean;
  onEditPost?: () => void;
  onDeletePost?: () => void;
  onReportPost?: () => void;
  onCopyLink?: () => void;
}

export const MobilePostMenuDrawer: React.FC<MobilePostMenuDrawerProps> = ({
  isOpen,
  onClose,
  isOwner = false,
  onEditPost,
  onDeletePost,
  onReportPost,
  onCopyLink,
}) => {
  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[99]" onClick={onClose} />
        <Drawer.Content className="bg-[var(--ds-bg)] flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[100] outline-none font-['DM_Sans'] border-t border-[var(--ds-border)] px-4 pb-8 pt-3">
          <Drawer.Title className="sr-only">Post Actions</Drawer.Title>
          <Drawer.Description className="sr-only">Actions for this post</Drawer.Description>

          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--ds-border)] mb-4" />

          {/* Actions */}
          <div className="flex flex-col gap-1 w-full">
            {isOwner ? (
              <>
                {onEditPost && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditPost();
                    }}
                    className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
                  >
                    Edit post
                  </button>
                )}

                {onDeletePost && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onDeletePost();
                    }}
                    className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-error)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
                  >
                    Delete post
                  </button>
                )}
              </>
            ) : (
              <>
                {onCopyLink && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCopyLink();
                    }}
                    className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
                  >
                    Copy link
                  </button>
                )}

                {onReportPost && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReportPost();
                    }}
                    className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-error)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
                  >
                    Report post
                  </button>
                )}
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default MobilePostMenuDrawer;
