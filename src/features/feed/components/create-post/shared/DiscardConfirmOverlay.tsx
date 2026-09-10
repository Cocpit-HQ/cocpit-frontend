import React, { useEffect } from 'react';

interface DiscardConfirmOverlayProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const DiscardConfirmOverlay: React.FC<DiscardConfirmOverlayProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  title = "Leave without saving?",
  subtitle = "Your changes will be lost",
  confirmLabel = "Leave",
  cancelLabel = "Cancel",
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 p-4"
      onClick={onCancel}
    >
      <div 
        className="box-border flex flex-col items-center p-[12px] gap-[16px] w-[193px] h-[130px] bg-[#030303] border border-[#2C2C33] rounded-[16px] shadow-2xl font-dm-sans select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Frame 2609475 */}
        <div className="flex flex-col items-center p-0 gap-[8px] w-[167px] h-[52px] shrink-0">
          <h3 className="w-[167px] h-[24px] font-dm-sans font-medium text-[16px] leading-[24px] text-[#FFECE6] text-center whitespace-nowrap m-0 p-0">
            {title}
          </h3>
          <p className="w-[167px] h-[20px] font-dm-sans font-normal text-[14px] leading-[20px] text-[#B8ADA8] text-center whitespace-nowrap m-0 p-0">
            {subtitle}
          </p>
        </div>

        {/* Frame 2609476 */}
        <div className="flex flex-row justify-center items-center p-0 gap-[8px] w-[162px] h-[36px] shrink-0">
          {/* Primary emphasis button: Leave */}
          <button
            type="button"
            onClick={onConfirm}
            className="flex flex-row justify-center items-center px-[12px] py-[6px] gap-[10px] w-[77px] h-[36px] bg-[#EC6229] hover:bg-[#d9551e] active:scale-95 text-[#FFECE6] rounded-[100px] transition-all cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-[#EC6229]/50 shrink-0"
          >
            <span className="w-[44px] h-[24px] font-dm-sans font-medium text-[16px] leading-[24px] text-[#FFECE6] text-center flex items-center justify-center">
              {confirmLabel}
            </span>
          </button>

          {/* Secondary button: Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="flex flex-row justify-center items-center px-[12px] py-[6px] gap-[10px] w-[77px] h-[36px] bg-transparent hover:bg-[#1A1A20] active:scale-95 text-[#FFECE6] border border-[#2C2C33] hover:border-[#42424b] rounded-[100px] transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#FFECE6]/20 shrink-0"
          >
            <span className="w-[53px] h-[24px] font-dm-sans font-medium text-[16px] leading-[24px] text-[#FFECE6] text-center flex items-center justify-center">
              {cancelLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscardConfirmOverlay;
