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
  otpTitle?: string;
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
  otpTitle = "Verify email",
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
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
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
      if (res && typeof res === 'object' && 'email_masked' in res && res.email_masked) {
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
  const isOtpStep = requiresOtp && step === 'otp';
  const isOtpComplete = otp.trim().length === 6;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`relative ${
          isOtpStep ? 'w-[316px]' : 'w-[309px]'
        } bg-[#030303] border border-[#2C2C33] rounded-[16px] p-[12px] shadow-2xl animate-in fade-in zoom-in-95 duration-200 box-border`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-[16px] w-full">
          {/* Header text */}
          <div className="flex flex-col items-center gap-[8px] text-center w-full">
            <h2 className="text-white text-[16px] font-medium leading-[22px] text-center m-0 p-0 w-full">
              {isOtpStep ? otpTitle : title}
            </h2>
            <p className="text-[#8E8E93] text-[13px] font-normal leading-[18px] text-center m-0 p-0 w-full">
              {isOtpStep ? (
                <>
                  A 6-digit verification code has been sent to
                  <br />
                  <span className="text-white">{maskedEmail || 'your email'}</span>
                </>
              ) : (
                description
              )}
            </p>
          </div>

          {/* OTP Input Section (Step 2) */}
          {isOtpStep && (
            <div className="w-full flex flex-col items-start gap-[6px]">
              <span className="text-[#8E8E93] text-[12px] font-normal leading-[16px]">
                Enter code
              </span>
              <input
                type="text"
                maxLength={6}
                value={otp}
                autoFocus
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-transparent border-0 border-b border-[#2C2C33] focus:border-ds-accent text-white text-[15px] tracking-[4px] py-1 outline-none transition-colors placeholder:text-[#555] placeholder:tracking-normal"
              />
              <div className="pt-1">
                {cooldown > 0 ? (
                  <span className="text-[#8E8E93] text-[12px] leading-[16px]">
                    Resend in {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={sendingOtp}
                    onClick={handleSendCode}
                    className="text-ds-accent hover:underline text-[12px] leading-[16px] cursor-pointer bg-transparent border-0 p-0"
                  >
                    {sendingOtp ? 'Sending code...' : 'Resend code'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error message */}
          {displayedError && (
            <div className="w-full p-2 bg-ds-error/10 border border-ds-error/20 rounded-lg text-center">
              <p className="text-ds-error text-[12px] font-medium m-0">
                {displayedError}
              </p>
            </div>
          )}

          {/* Action Buttons: Primary on Left, Cancel on Right (matching Figma) */}
          <div className="flex flex-row items-center justify-center gap-[10px] w-full">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleConfirmAction}
              disabled={isLoading || sendingOtp || (isOtpStep && !isOtpComplete)}
              className={`flex-1 h-[36px] rounded-[100px] text-[14px] font-medium flex items-center justify-center gap-1.5 transition-all select-none whitespace-nowrap ${
                isOtpStep && !isOtpComplete
                  ? 'bg-[#1F1F23] text-[#71717A] border border-[#2C2C33] cursor-not-allowed'
                  : confirmColor === 'red'
                  ? 'bg-ds-error text-white hover:opacity-90 active:scale-95 cursor-pointer'
                  : 'bg-ds-accent text-white hover:opacity-90 active:scale-95 cursor-pointer'
              } disabled:opacity-50`}
            >
              {(isLoading || sendingOtp) && (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              )}
              <span className="whitespace-nowrap">
                {requiresOtp && step === 'initial' ? 'Send code' : confirmText}
              </span>
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || sendingOtp}
              className="flex-1 h-[36px] rounded-[100px] border border-[#2C2C33] bg-transparent hover:bg-white/5 text-white text-[14px] font-medium flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 select-none whitespace-nowrap"
            >
              <span className="whitespace-nowrap">{cancelText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

