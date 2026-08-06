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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
      <div className="relative w-[340px] bg-white p-[20px] rounded-[24px] shadow-lg animate-in fade-in zoom-in-95 duration-200 dark:bg-slate-900 border dark:border-slate-800">
        <div className="flex flex-col items-center justify-center text-center font-poppins">
          <div className="flex flex-col items-center justify-center py-[8px] gap-[10px] w-full">
            <h2 className="text-[15px] font-semibold text-black dark:text-foreground m-0 leading-[22px] text-center w-full">
              {title}
            </h2>
            <p className="text-[12px] font-normal text-[#6B7280] dark:text-slate-400 m-0 leading-[16px] text-center w-full">
              {description}
            </p>
          </div>

          {requiresOtp && step === 'otp' && (
            <div className="flex flex-col items-center w-full gap-3 my-3">
              {maskedEmail && (
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  Verification code sent to {maskedEmail}
                </p>
              )}
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                className="w-full text-center text-[18px] tracking-[6px] font-bold py-2 border rounded-xl border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                disabled={cooldown > 0 || sendingOtp}
                onClick={handleSendCode}
                className="text-[11px] text-indigo-500 hover:underline disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
              </button>
            </div>
          )}

          {displayedError && (
            <div className="w-full my-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-left">
              <p className="text-[12px] text-red-600 dark:text-red-400 font-medium">
                {displayedError}
              </p>
            </div>
          )}

          <div className="flex flex-row gap-[12px] w-full justify-center mt-3">
            <button
              onClick={onClose}
              disabled={isLoading || sendingOtp}
              className="flex-1 h-[40px] px-[16px] py-[8px] rounded-[24px] border border-[#818CF8] bg-white dark:bg-transparent text-[#818CF8] font-normal text-[14px] leading-[20px] hover:bg-[#EEF2FF] dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirmAction}
              disabled={isLoading || sendingOtp}
              className={`flex-1 h-[40px] px-[16px] py-[8px] rounded-[24px] text-white font-normal text-[14px] leading-[20px] transition-colors flex items-center justify-center gap-2 ${
                confirmColor === 'red'
                  ? 'bg-[#FF6B6B] border border-white hover:bg-[#ff5252]'
                  : 'bg-[#818CF8] border border-white hover:bg-[#6c79f7]'
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

