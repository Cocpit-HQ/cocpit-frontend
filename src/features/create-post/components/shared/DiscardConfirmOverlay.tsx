import React from 'react';

interface DiscardConfirmOverlayProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DiscardConfirmOverlay: React.FC<DiscardConfirmOverlayProps> = ({
  isOpen,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in animate-duration-200">
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-[#2a2a4a] rounded-[24px] shadow-2xl p-6 w-[292px] max-w-[292px] flex flex-col items-center text-center font-poppins">
        <h3 className="text-[17px] leading-[24px] font-semibold text-black dark:text-white">Discard?</h3>
        <p className="text-[12.5px] leading-[18px] text-[#6B7280] dark:text-[#9CA3AF] mt-1.5 font-normal">Leave without saving changes</p>
        <div className="flex gap-3 justify-center mt-5 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-grow flex-1 py-2.5 px-4 border border-[#818CF8] text-[#818CF8] rounded-full hover:bg-[#818CF8]/10 transition-all duration-200 text-[16px] leading-[24px] font-medium font-poppins bg-transparent outline-none focus:ring-2 focus:ring-[#818CF8]/30"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-grow flex-1 py-2.5 px-4 bg-[#FF6B6B] text-white rounded-full hover:bg-[#FF6B6B]/90 transition-all duration-200 text-[16px] leading-[24px] font-medium font-poppins shadow-sm outline-none focus:ring-2 focus:ring-[#FF6B6B]/30"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};
