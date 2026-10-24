"use client";

import React, { useState } from 'react';
import { BadgeCheck, XCircle, Loader2 } from 'lucide-react';
import { SettingModal } from './SettingModal';

interface SettingOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  maskedTarget?: string;
  countdown: number;
  onResend: () => void;
  onVerify: (otp: string) => Promise<void> | void;
  isPending: boolean;
  confirmText?: string;
  isDestructive?: boolean;
}

export function SettingOtpModal({
  isOpen,
  onClose,
  title,
  subtitle,
  maskedTarget,
  countdown,
  onResend,
  onVerify,
  isPending,
  confirmText = 'Verify',
  isDestructive = false,
}: SettingOtpModalProps) {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async () => {
    if (code.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    setErrorMsg('');
    try {
      await onVerify(code);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid verification code');
    }
  };

  const handleClose = () => {
    setCode('');
    setErrorMsg('');
    onClose();
  };

  return (
    <SettingModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={
        <span>
          {subtitle}{' '}
          {maskedTarget && (
            <span className="font-semibold text-ds-text-primary">{maskedTarget}</span>
          )}
        </span>
      }
      confirmText={confirmText}
      onConfirm={handleVerify}
      isPending={isPending}
      isDestructive={isDestructive}
      isConfirmDisabled={code.length !== 6}
    >
      <div className="flex flex-col gap-2 mt-2 w-full">
        <label className="ds-text-small-1 text-ds-text-secondary">Enter 6-digit code</label>
        <div className="relative w-full">
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setCode(val);
              setErrorMsg('');
            }}
            placeholder="000000"
            className={`ds-input w-full bg-ds-surface-1 border ${
              errorMsg ? 'border-ds-error focus:border-ds-error' : 'border-ds-border focus:border-ds-accent'
            } rounded-lg text-ds-text-primary focus:outline-none focus:ring-1 focus:ring-ds-accent transition-colors tracking-widest text-center text-base`}
          />
        </div>

        {errorMsg && (
          <p className="ds-text-small text-ds-error text-center mt-1">{errorMsg}</p>
        )}

        <div className="w-full text-right mt-1">
          <button
            type="button"
            onClick={onResend}
            disabled={countdown > 0 || isPending}
            className={`ds-text-small ${
              countdown > 0 || isPending
                ? 'text-ds-text-muted cursor-default'
                : 'text-ds-accent hover:opacity-80 transition-opacity no-underline hover:no-underline cursor-pointer'
            }`}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
          </button>
        </div>
      </div>
    </SettingModal>
  );
}
