"use client";

import React from "react";
import { Drawer } from "vaul";

interface MobilePublicProfileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** The resolved directional connection status */
  connectionStatus: "none" | "pending_sent" | "pending_received" | "connected" | string;
  /** Whether the primary header action is currently Follow (>=500 connections) */
  showFollowPrimary?: boolean;
  /** Whether the current user is already following the target */
  isFollowing?: boolean;
  onFollow: () => void;
  onConnect: () => void;
  onWithdraw: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onMessage: () => void;
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
  showFollowPrimary = false,
  isFollowing = false,
  onFollow,
  onConnect,
  onWithdraw,
  onAccept,
  onDecline,
  onMessage,
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
  const isConnected       = connectionStatus === "connected";
  const isPendingSent     = connectionStatus === "pending_sent";
  const isPendingReceived = connectionStatus === "pending_received";

  const closeAnd = (fn: () => void) => () => {
    onClose();
    fn();
  };

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

            {/* Render Follow/Unfollow in drawer whenever Follow is not the primary header button and not connected */}
            {!showFollowPrimary && !isConnected && (
              <button
                type="button"
                onClick={closeAnd(onFollow)}
                className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            )}

            {/* Show Connect in drawer whenever Follow is the primary header button and no connection request */}
            {showFollowPrimary && connectionStatus === "none" && (
              <button
                type="button"
                onClick={closeAnd(onConnect)}
                className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
              >
                Connect
              </button>
            )}

            {/* ── SCENARIO 1: pending_sent → Withdraw in drawer ── */}
            {showFollowPrimary && isPendingSent && (
              <button
                type="button"
                onClick={closeAnd(onWithdraw)}
                className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
              >
                Withdraw request
              </button>
            )}

            {/* ── SCENARIO 2: pending_received → Accept + Decline + Message in drawer ── */}
            {isPendingReceived && (
              <>
                <button
                  type="button"
                  onClick={closeAnd(onAccept)}
                  className="w-full text-left py-3 px-3 rounded-xl text-base font-medium text-[var(--ds-accent)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
                >
                  Accept request
                </button>
                <button
                  type="button"
                  onClick={closeAnd(onDecline)}
                  className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
                >
                  Decline request
                </button>
                {!showFollowPrimary && (
                  <button
                    type="button"
                    onClick={closeAnd(onMessage)}
                    className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
                  >
                    Message
                  </button>
                )}
              </>
            )}

            {/* ── Connected: Remove connection ── */}
            {isConnected && (
              <button
                type="button"
                onClick={closeAnd(onRemoveConnection)}
                className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
              >
                Remove connection
              </button>
            )}

            {/* Common items always shown */}
            <button
              type="button"
              onClick={closeAnd(() => onContactInfo?.())}
              className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
            >
              Contact info
            </button>

            <button
              type="button"
              onClick={closeAnd(onViewResume)}
              className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
            >
              View resume
            </button>

            {profileScore === 100 && (
              <button
                type="button"
                onClick={closeAnd(onDownloadProfile)}
                className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
              >
                Download profile
              </button>
            )}

            <button
              type="button"
              onClick={closeAnd(onShareProfile)}
              className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
            >
              Share profile
            </button>

            <button
              type="button"
              onClick={closeAnd(onBlockProfile)}
              className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
            >
              Block profile
            </button>

            <button
              type="button"
              onClick={closeAnd(onReportProfile)}
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
