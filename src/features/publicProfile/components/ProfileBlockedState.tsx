"use client";

import React from "react";
import { BlockIcon } from "@/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileBlockedStateProps {
  onUnblock: () => void;
  isLoading?: boolean;
  canManageBlock?: boolean;
  noBlockMessage?: string;
}

export const ProfileBlockedState: React.FC<ProfileBlockedStateProps> = ({
  onUnblock,
  isLoading = false,
  canManageBlock = true,
  noBlockMessage,
}) => {
  return (
    /* FullPageError: w: 800px, h: 306px, p: 40px 20px, gap: 24px */
    <div className="w-full max-w-[800px] h-[306px] py-[40px] px-[20px] flex flex-col justify-center items-center gap-[24px] self-stretch flex-none animate-in fade-in duration-200 select-none">
      {/* IconFrame: 64x64px, p: 16px, bg: #1A1A20 (var(--ds-surface-1)), rounded: 100px */}
      <div className="w-[64px] h-[64px] p-[16px] rounded-[100px] bg-[var(--ds-surface-1)] flex items-center justify-center flex-none">
        <BlockIcon
          size={32}
          className="w-[32px] h-[32px] text-[var(--ds-text-muted)] flex-none"
          fill="var(--ds-text-muted)"
        />
      </div>

      {/* TextBlock: w: 760px, h: 78px, gap: 10px */}
      <div className="w-full max-w-[760px] flex flex-col items-center p-0 gap-[10px] flex-none self-stretch">
        {/* Title: You've blocked (DM Sans 20px Semibold / 28px LH, color: #FFECE6) */}
        <h2 className="font-['DM_Sans'] font-semibold text-[20px] leading-[28px] text-[var(--ds-text-primary)] text-center flex-none">
          You&apos;ve blocked
        </h2>

        {/* Subtext: Unblock this member to view their profile, posts, and professional information again (DM Sans 14px Regular / 20px LH, color: #B8ADA8, w: 360px) */}
        <p className="w-[360px] max-w-full font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] text-center flex-none">
          Unblock this member to view their profile, posts, and professional information again
        </p>
      </div>

      {/* Primary emphasis button: w: 86px, h: 36px, p: 6px 12px, gap: 10px, bg: #EC6229, rounded: 100px */}
      {!canManageBlock ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip enableTouch>
            <TooltipTrigger asChild>
              <span className="inline-block cursor-not-allowed">
                <button
                  type="button"
                  disabled
                  className="w-[86px] h-[36px] px-[12px] py-[6px] rounded-[100px] bg-[var(--ds-accent)] flex flex-row justify-center items-center gap-[10px] outline-none flex-none shadow-md opacity-50 pointer-events-none"
                  aria-label="Unblock disabled"
                >
                  <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] flex-none text-center">
                    Unblock
                  </span>
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-['DM_Sans'] z-50">
              {noBlockMessage || "You don't have access to block/unblock on the behalf of company"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={onUnblock}
          className="w-[86px] h-[36px] px-[12px] py-[6px] rounded-[100px] bg-[var(--ds-accent)] hover:opacity-90 active:scale-95 transition-all flex flex-row justify-center items-center gap-[10px] cursor-pointer focus:outline-none flex-none shadow-md disabled:opacity-50 disabled:cursor-default disabled:pointer-events-none"
        >
          <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] flex-none text-center">
            {isLoading ? "..." : "Unblock"}
          </span>
        </button>
      )}
    </div>
  );
};

export default ProfileBlockedState;
