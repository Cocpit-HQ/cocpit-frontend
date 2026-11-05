import React from "react";
import { useBodyScrollLock } from "@/hooks";

export interface ApplicantsMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFilter: string;
  setSelectedFilter: (filter: any) => void;
}

const FILTER_OPTIONS = [
  "Top match",
  "Recent",
  "Shortlisted",
  "Noted",
  "Pending",
] as const;

export const ApplicantsMobileDrawer: React.FC<ApplicantsMobileDrawerProps> = ({
  isOpen,
  onClose,
  selectedFilter,
  setSelectedFilter,
}) => {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-ds-bg/60 backdrop-blur-xs animate-in fade-in duration-200 md:hidden touch-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[393px] mx-auto h-[232px] bg-ds-bg border-t border-x border-ds-border rounded-t-[8px] p-[8px_12px_24px] gap-4 flex flex-col items-start shadow-2xl animate-in slide-in-from-bottom duration-200 select-none box-border"
      >
        {/* Frame 2608582: Drag Handle */}
        <div className="w-full h-5 flex flex-col items-center justify-center shrink-0">
          <div className="w-[50px] h-[3px] bg-ds-text-muted rounded-full" />
        </div>

        {/* Filter options list */}
        <div className="w-full flex flex-col gap-4 flex-1">
          {FILTER_OPTIONS.map((opt) => {
            const isSelected = selectedFilter === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setSelectedFilter(opt);
                  onClose();
                }}
                className="w-full text-left cursor-pointer bg-transparent border-none outline-none p-0 flex items-center"
              >
                <span
                  className={`font-dm-sans font-normal text-sm leading-5 transition-colors ${
                    isSelected ? "text-ds-accent" : "text-ds-text-primary"
                  }`}
                >
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ApplicantsMobileDrawer;
