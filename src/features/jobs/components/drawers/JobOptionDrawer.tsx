import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface JobOptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  options: readonly string[] | string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  heightClass: string;
  ariaLabel?: string;
}

export const JobOptionDrawer: React.FC<JobOptionDrawerProps> = ({
  isOpen,
  onClose,
  options,
  selectedValue,
  onSelect,
  heightClass,
  ariaLabel = "Select option",
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      data-job-drawer="true"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 sm:hidden"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-[393px] mx-auto bg-[#030303] border-t border-x border-ds-border rounded-t-[8px] p-[8px_12px_24px] gap-4 flex flex-col items-start shadow-2xl animate-in slide-in-from-bottom duration-200 select-none box-border",
          heightClass
        )}
      >
        {/* Frame 2608582: Drag Handle */}
        <div className="w-full h-5 flex flex-col items-center justify-center shrink-0">
          <div className="w-[50px] h-[2px] bg-[#726B67] rounded-full" />
        </div>

        {/* Options List */}
        <div className="w-full flex flex-col gap-4">
          {options.map((opt) => {
            const isSelected = selectedValue === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onSelect(opt);
                  onClose();
                }}
                className="w-full text-left cursor-pointer bg-transparent border-none outline-none p-0 flex items-center transition-colors"
              >
                <span
                  className={cn(
                    "font-dm-sans font-normal text-sm leading-5 transition-colors",
                    isSelected ? "text-ds-accent font-medium" : "text-[#FFECE6] hover:text-white"
                  )}
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

export default JobOptionDrawer;
