import React from 'react';

interface WithdrawOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const WithdrawOfferModal: React.FC<WithdrawOfferModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[380px] bg-white rounded-3xl p-6 flex flex-col justify-start items-center gap-6 shadow-xl border border-indigo-50/50 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col gap-2 text-center">
          <h3 className="text-black text-lg font-semibold font-['Poppins'] leading-tight px-4">
            Are you sure you want to withdraw your offer?
          </h3>
          <p className="text-gray-400 text-xs font-normal font-['Poppins']">
            This cannot be undone
          </p>
        </div>

        <div className="self-stretch flex justify-center items-center gap-4">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 h-11 rounded-3xl border border-indigo-300 text-indigo-500 font-semibold font-['Poppins'] text-sm hover:bg-indigo-50/10 active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className="flex-1 h-11 rounded-3xl bg-red-400 text-white font-semibold font-['Poppins'] text-sm hover:bg-red-500 active:scale-95 transition-all shadow-sm shadow-red-200"
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawOfferModal;
