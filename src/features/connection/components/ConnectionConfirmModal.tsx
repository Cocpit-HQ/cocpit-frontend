'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

export type ConnectionConfirmType =
  | 'decline-requests'
  | 'withdraw-all'
  | 'decline-invitations'
  | 'decline-all'
  | 'accept-all';

interface ConnectionConfirmModalProps {
  isOpen: boolean;
  type: ConnectionConfirmType | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const MODAL_CONFIG: Record<
  ConnectionConfirmType,
  {
    title: string;
    subtitle: string;
    confirmLabel: string;
  }
> = {
  // 1. Decline connection requests (Received tab)
  'decline-requests': {
    title: 'Decline all invitations?',
    subtitle:
      "This will decline all pending connection requests. This action can't be undone",
    confirmLabel: 'Decline all',
  },
  // 2. Withdraw connection requests (Sent tab)
  'withdraw-all': {
    title: 'Withdraw all invitations?',
    subtitle:
      'This will cancel all your pending connection requests. You can send new requests to these people later',
    confirmLabel: 'Withdraw all',
  },
  // 3. Decline page/channel invitations (Invitation tab)
  'decline-invitations': {
    title: 'Decline all invitations?',
    subtitle:
      "This will decline all pending invitations to join organization pages. You can’t undo this action",
    confirmLabel: 'Decline all',
  },
  // Backward compatibility aliases
  'decline-all': {
    title: 'Decline all invitations?',
    subtitle:
      "This will decline all pending connection requests. This action can't be undone",
    confirmLabel: 'Decline all',
  },
  'accept-all': {
    title: 'Accept all invitations?',
    subtitle:
      'This will accept all pending requests and connect you with these people.',
    confirmLabel: 'Accept all',
  },
};

export function ConnectionConfirmModal({
  isOpen,
  type,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConnectionConfirmModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    confirmBtnRef.current?.focus();

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen || !type || !mounted) return null;

  const config = MODAL_CONFIG[type];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-subtitle"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      {/* 
        Figma Specs:
        width: 236px, height: 154px, padding: 12px, gap: 16px
        border: 1px solid #2C2C33, border-radius: 16px, background: #030303
      */}
      <div
        className="box-border w-[236px] h-[154px] p-[12px] gap-[16px] rounded-[16px] border border-ds-border bg-ds-bg shadow-2xl flex flex-col items-center justify-between font-dm-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Text stack */}
        <div className="flex flex-col items-center text-center gap-1.5 w-full">
          <h3
            id="confirm-modal-title"
            className="font-dm-sans font-medium text-[16px] leading-[22px] text-ds-text-primary"
          >
            {config.title}
          </h3>
          <p
            id="confirm-modal-subtitle"
            className="font-dm-sans font-normal text-[11px] leading-[15px] text-ds-text-secondary text-center px-0.5"
          >
            {config.subtitle}
          </p>
        </div>

        {/* Buttons row */}
        <div className="flex flex-row items-center gap-2 w-full mt-auto">
          {/* Action confirm button */}
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-[36px] px-2 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary font-dm-sans font-medium text-[13px] leading-[20px] transition-all cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent disabled:opacity-40 disabled:cursor-default flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-ds-text-primary" />
            ) : (
              config.confirmLabel
            )}
          </button>

          {/* Cancel button */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 h-[36px] px-2 rounded-full border border-ds-border bg-transparent hover:bg-ds-surface-1 active:scale-95 text-ds-text-primary font-dm-sans font-medium text-[13px] leading-[20px] transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent disabled:opacity-40 disabled:cursor-default flex items-center justify-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConnectionConfirmModal;
