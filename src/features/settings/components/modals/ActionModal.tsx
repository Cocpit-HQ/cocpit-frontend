"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: (otp?: string) => void | Promise<void>;
  confirmColor?: 'blue' | 'red';
  requiresOtp?: boolean;
  onSendOtp?: () => Promise<{ email_masked?: string } | void>;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export function ActionModal({
  isOpen,
  onClose,
  title,
  description,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  confirmColor = 'blue',
  requiresOtp = false,
  onSendOtp,
  isLoading = false,
  errorMessage = null,
}: ActionModalProps) {
  const [step, setStep] = useState<'initial' | 'otp'>('initial');
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('initial');
      setOtp('');
      setMaskedEmail('');
      setSendingOtp(false);
      setCooldown(0);
      setLocalError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSendCode = async () => {
    if (!onSendOtp) return;
    setSendingOtp(true);
    setLocalError(null);
    try {
      const res = await onSendOtp();
      if (res?.email_masked) {
        setMaskedEmail(res.email_masked);
      }
      setStep('otp');
      setCooldown(30);
    } catch (err: any) {
      setLocalError(err?.response?.data?.message || err?.message || 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleConfirmAction = async () => {
    if (requiresOtp && step === 'initial') {
      await handleSendCode();
      return;
    }

    if (requiresOtp && (!otp || otp.trim().length !== 6)) {
      setLocalError('Please enter a valid 6-digit verification code.');
      return;
    }

    setLocalError(null);
    try {
      await onConfirm(otp.trim());
    } catch (err: any) {
      setLocalError(err?.response?.data?.message || err?.message || 'Action failed');
    }
  };

  const displayedError = errorMessage || localError;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-[380px] bg-ds-surface-2 p-6 rounded-2xl shadow-2xl border border-ds-border mx-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex flex-col items-center justify-center gap-2 w-full">
            <h2 className="ds-text-body-2 text-base font-semibold text-ds-text-primary text-center w-full">
              {title}
            </h2>
            <p className="ds-text-small text-ds-text-secondary text-center w-full leading-relaxed">
              {description}
            </p>
          </div>

          {requiresOtp && step === 'otp' && (
            <div className="flex flex-col items-center w-full gap-3 my-4">
              {maskedEmail && (
                <p className="ds-text-meta text-ds-accent font-medium">
                  Verification code sent to {maskedEmail}
                </p>
              )}
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                className="w-full text-center text-lg tracking-[6px] font-bold py-2 border border-ds-border rounded-xl bg-ds-surface-1 text-ds-text-primary focus:outline-none focus:border-ds-accent"
              />
              <button
                type="button"
                disabled={cooldown > 0 || sendingOtp}
                onClick={handleSendCode}
                className="ds-text-meta text-ds-accent hover:underline disabled:opacity-50 cursor-pointer"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
              </button>
            </div>
          )}

          {displayedError && (
            <div className="w-full my-2 p-2 bg-ds-error/10 border border-ds-error/20 rounded-lg text-left">
              <p className="ds-text-small text-ds-error font-medium">
                {displayedError}
              </p>
            </div>
          )}

          <div className="flex flex-row gap-3 w-full justify-center mt-4">
            <button
              onClick={onClose}
              disabled={isLoading || sendingOtp}
              className="ds-btn flex-1 h-[36px] px-4 rounded-full border border-ds-border bg-ds-surface-1 text-ds-text-primary ds-text-small font-medium hover:bg-ds-surface-2 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirmAction}
              disabled={isLoading || sendingOtp}
              className={`ds-btn flex-1 h-[36px] px-4 rounded-full text-white ds-text-small font-medium transition-opacity flex items-center justify-center gap-2 hover:opacity-90 ${
                confirmColor === 'red'
                  ? 'bg-ds-error'
                  : 'bg-ds-accent'
              } disabled:opacity-50`}
            >
              {(isLoading || sendingOtp) && <Loader2 className="w-4 h-4 animate-spin" />}
              {requiresOtp && step === 'initial' ? 'Send Code' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

