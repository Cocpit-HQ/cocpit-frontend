"use client";

import React from "react";
import { Drawer } from "vaul";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MobileBusinessProfileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSharePage?: () => void;
  onBlockToggle?: () => void;
  isBlocked?: boolean;
  isBlocking?: boolean;
  canBlock?: boolean;
  noBlockMessage?: string;
  canReport?: boolean;
  noReportMessage?: string;
  onReportCompany?: () => void;
  onEditProfile?: () => void;
  canEditProfile?: boolean;
  isOwnProfile?: boolean;
}

export const MobileBusinessProfileMenuDrawer: React.FC<MobileBusinessProfileMenuDrawerProps> = ({
  isOpen,
  onClose,
  onSharePage,
  onBlockToggle,
  isBlocked,
  isBlocking,
  canBlock = true,
  noBlockMessage,
  canReport = true,
  noReportMessage,
  onReportCompany,
  onEditProfile,
  canEditProfile,
  isOwnProfile,
}) => {
  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[99]" onClick={onClose} />
        <Drawer.Content className="bg-[var(--ds-bg)] flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[100] outline-none font-['DM_Sans'] border-t border-[var(--ds-border)] px-4 pb-8 pt-3">
          <Drawer.Title className="sr-only">Company Options</Drawer.Title>
          <Drawer.Description className="sr-only">Options for this company profile</Drawer.Description>

          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--ds-border)] mb-4" />

          {/* Action List (matching desktop More menu: Share page, Block page, Report page) */}
          <div className="flex flex-col gap-1 w-full">
            {isOwnProfile && canEditProfile && onEditProfile && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditProfile();
                }}
                className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
              >
                Edit profile
              </button>
            )}

            {onSharePage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSharePage();
                }}
                className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
              >
                Share page
              </button>
            )}

            {!isOwnProfile && onBlockToggle && (
              canBlock === false ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <span className="w-full inline-block cursor-not-allowed">
                        <button
                          type="button"
                          disabled
                          className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] pointer-events-none select-none"
                        >
                          {isBlocking ? "Updating..." : isBlocked ? "Unblock page" : "Block page"}
                        </button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs font-['DM_Sans'] z-[105]">
                      {noBlockMessage || "You don't have access to block/unblock on the behalf of company"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBlockToggle();
                  }}
                  disabled={isBlocking}
                  className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isBlocking ? "Updating..." : isBlocked ? "Unblock page" : "Block page"}
                </button>
              )
            )}

            {!isOwnProfile && onReportCompany && (
              canReport === false ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <span className="w-full inline-block cursor-not-allowed">
                        <button
                          type="button"
                          disabled
                          className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] pointer-events-none select-none"
                        >
                          Report page
                        </button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs font-['DM_Sans'] z-[105]">
                      {noReportMessage || "You don't have access to report on the behalf of company"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReportCompany();
                  }}
                  className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
                >
                  Report page
                </button>
              )
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default MobileBusinessProfileMenuDrawer;
