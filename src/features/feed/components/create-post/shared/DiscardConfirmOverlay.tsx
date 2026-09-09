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
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in animate-duration-200">
      <div className="bg-ds-surface-2 border border-ds-border rounded-[20px] shadow-2xl p-6 w-[292px] max-w-[292px] flex flex-col items-center text-center font-dmsans">
        <h3 className="ds-text-body-1 text-ds-text-primary font-medium">Discard?</h3>
        <p className="ds-text-small text-ds-text-secondary mt-1.5">Leave without saving changes</p>
        <div className="flex gap-3 justify-center mt-5 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-grow flex-1 py-2 px-4 border border-ds-border text-ds-text-primary rounded-full hover:bg-ds-surface-1 transition-all duration-200 text-[14px] leading-[20px] font-medium font-dmsans bg-transparent outline-none focus:ring-2 focus:ring-[var(--ds-accent)]/30 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-grow flex-1 py-2 px-4 bg-[var(--ds-error)] text-white rounded-full hover:opacity-90 transition-all duration-200 text-[14px] leading-[20px] font-medium font-dmsans shadow-sm outline-none focus:ring-2 focus:ring-[var(--ds-error)]/30 cursor-pointer"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscardConfirmOverlay;
