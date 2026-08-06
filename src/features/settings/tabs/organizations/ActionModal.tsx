import React from 'react';


interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  confirmColor?: 'blue' | 'red';
}

export function ActionModal({
  isOpen,
  onClose,
  title,
  description,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  confirmColor = 'blue'
}: ActionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
      <div className="relative w-[300px] bg-white p-[16px] rounded-[24px] shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center justify-center text-center font-poppins">
          <div className="flex flex-col items-center justify-center py-[8px] gap-[10px] w-full">
            <h2 className="text-[14px] font-normal text-black m-0 leading-[20px] text-center w-full">
              {title}
            </h2>
            <p className="text-[12px] font-normal text-[#6B7280] m-0 leading-[16px] text-center w-full">
              {description}
            </p>
          </div>
          <div className="flex flex-row gap-[16px] w-full justify-center mt-2">
            <button
              onClick={onClose}
              className="flex-1 h-[40px] px-[16px] py-[8px] rounded-[24px] border border-[#818CF8] bg-white text-[#818CF8] font-normal text-[14px] leading-[20px] hover:bg-[#EEF2FF] transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 h-[40px] px-[16px] py-[8px] rounded-[24px] text-white font-normal text-[14px] leading-[20px] transition-colors flex items-center justify-center ${
                confirmColor === 'red'
                  ? 'bg-[#FF6B6B] border border-white hover:bg-[#ff5252]'
                  : 'bg-[#818CF8] border border-white hover:bg-[#6c79f7]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
