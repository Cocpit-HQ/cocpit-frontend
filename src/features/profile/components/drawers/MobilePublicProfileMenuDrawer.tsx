"use client";

import React from "react";
import { Drawer } from "vaul";

interface MobilePublicProfileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  connectionStatus: "none" | "pending" | "pending_sent" | "connected" | string;
  onConnect: () => void;
  onRemoveConnection: () => void;
  onContactInfo?: () => void;
  onSendOffer: () => void;
  onViewResume: () => void;
  onDownloadProfile: () => void;
  onShareProfile: () => void;
  onBlockProfile: () => void;
  onReportProfile: () => void;
  profileScore?: number;
}

export const MobilePublicProfileMenuDrawer: React.FC<MobilePublicProfileMenuDrawerProps> = ({
  isOpen,
  onClose,
  connectionStatus,
  onConnect,
  onRemoveConnection,
  onContactInfo,
  onSendOffer,
  onViewResume,
  onDownloadProfile,
  onShareProfile,
  onBlockProfile,
  onReportProfile,
  profileScore,
}) => {
  const isConnected = connectionStatus === "connected";
  const isPending = connectionStatus === "pending_sent" || connectionStatus === "pending";

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[99]" />
        <Drawer.Content className="bg-[var(--ds-bg)] flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[100] outline-none font-['DM_Sans'] border-t border-[var(--ds-border)] px-4 pb-8 pt-3">
          <Drawer.Title className="sr-only">More Profile Options</Drawer.Title>
          <Drawer.Description className="sr-only">Actions for this profile</Drawer.Description>

          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--ds-border)] mb-4" />

          {/* Action List */}
          <div className="flex flex-col gap-1 w-full">
            {/* Connection state action: Connect or Pending only (when connected, Message is the primary action button) */}
            {!isConnected && (
              isPending ? (
                <div className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-muted)] cursor-default select-none">
                  Pending
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onConnect();
                  }}
                  className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
                >
                  Connect
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onContactInfo?.();
              }}
              className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
            >
              Contact info
            </button>

            {/*
            <button
              type="button"
              onClick={() => {
                onClose();
                onSendOffer();
              }}
              className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
            >
              Send offer
            </button>
            */}

            <button
              type="button"
              onClick={() => {
                onClose();
                onViewResume();
              }}
              className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
            >
              View resume
            </button>

            {profileScore === 100 && (
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
            )}

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
                onBlockProfile();
              }}
              className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
            >
              Block profile
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onReportProfile();
              }}
              className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
            >
              Report profile
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default MobilePublicProfileMenuDrawer;
