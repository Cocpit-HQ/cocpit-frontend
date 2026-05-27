import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface CocpitConfirmBoxProps {
  isOpen: any;
  title: string;
  message?: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CocpitConfirmBox: React.FC<CocpitConfirmBoxProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const show = Boolean(isOpen);

  if (!show || !mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 400);
    }
  };

  return createPortal(
    <>
      <style>
        {`
          @keyframes confirm-box-blink {
            0%, 50%, 100% { transform: scale(1); }
            25%, 75% { transform: scale(1.03); }
          }
          .blink-attention {
            animation: confirm-box-blink 0.4s ease-in-out;
          }
        `}
      </style>
      <div 
        className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        onClick={handleBackdropClick}
      >
        <div 
          className={`bg-card w-full max-w-full md:max-w-[400px] p-8 rounded-t-[24px] rounded-b-none md:rounded-[24px] shadow-2xl flex flex-col items-center text-center animate-in slide-in-from-bottom duration-300 md:zoom-in-95 md:duration-200 relative ${isBlinking ? 'blink-attention' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="flex flex-col items-center justify-center mb-8">
            <span className="text-[14px] font-normal text-[var(--foreground)] font-[family-name:var(--font-poppins)] mb-2 leading-[20px] text-center">
              {title}
            </span>
            {message && (
              <span className="text-[12px] text-[var(--muted-foreground)] font-normal font-[family-name:var(--font-poppins)] leading-[16px] text-center px-4 max-w-[268px] mx-auto">
                {message}
              </span>
            )}
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
              }}
              className="flex-1 h-[48px] rounded-full border border-[var(--primary)] text-[var(--primary)] bg-transparent hover:bg-[var(--primary-tint)] hover:text-[var(--primary)] font-semibold text-[15px] font-[family-name:var(--font-poppins)] shadow-none transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onConfirm();
              }}
              className="flex-1 h-[48px] rounded-full bg-[var(--destructive)] hover:opacity-90 text-[var(--destructive-foreground)] font-semibold text-[15px] font-[family-name:var(--font-poppins)] border-none shadow-sm transition-all"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
