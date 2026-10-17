"use client";

import React, { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface SettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  isPending?: boolean;
  isDestructive?: boolean;
  isConfirmDisabled?: boolean;
  maxWidth?: string;
  customFooter?: React.ReactNode;
}

export function SettingModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  isPending = false,
  isDestructive = false,
  isConfirmDisabled = false,
  maxWidth = 'max-w-[450px]',
  customFooter,
}: SettingModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`relative flex flex-col w-full ${maxWidth} bg-ds-surface-2 border border-ds-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-surface-1 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col p-6">
          <div className="flex flex-col gap-1 mb-4 pr-6">
            {typeof title === 'string' ? (
              <h2 className="ds-text-body-2 text-ds-text-primary">{title}</h2>
            ) : (
              title
            )}
            {description && (
              <p className="ds-text-small text-ds-text-secondary">{description}</p>
            )}
          </div>

          <div className="w-full">{children}</div>

          {/* Footer */}
          {customFooter ? (
            customFooter
          ) : onConfirm || confirmText ? (
            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-ds-border/40">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="ds-btn ds-btn-secondary ds-text-body-1 h-9 px-5 border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-secondary hover:text-ds-text-primary"
              >
                {cancelText}
              </button>
              {onConfirm && (
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isConfirmDisabled || isPending}
                  className={`ds-btn ds-text-body-1 h-9 px-5 rounded-lg text-white font-medium transition-all ${
                    isDestructive
                      ? 'bg-ds-error hover:opacity-90 active:scale-95'
                      : 'bg-ds-accent hover:opacity-90 active:scale-95'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </span>
                  ) : (
                    confirmText || 'Confirm'
                  )}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
