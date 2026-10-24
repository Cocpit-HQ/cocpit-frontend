"use client";

import React, { useState, useEffect } from 'react';
import { X, BadgeCheck, Loader2 } from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { sendDeactivateOrgOTP, validateDeactivateOrgOTP, deactivateOrganization, reactivateOrganization } from '@/services/api/settings';
import { setActorContext } from '@/services/api/auth';
import { useCompanyAccountSettings } from '@/features/settings/hooks/useCompanyAccountSettings';
import { toast } from 'sonner';
import { ReactivateCompanyModal } from './ReactivateCompanyModal';

interface DeactivateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeactivateCompanyModal({ isOpen, onClose }: DeactivateCompanyModalProps) {
  const { activeProfile, switchProfile } = useActiveProfile();
  const { data: accountData, refetch } = useCompanyAccountSettings();
  const [step, setStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && step === 2) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !activeProfile) return null;

  const entityLabel = activeProfile.entityType === 'INSTITUTION' ? 'institution' : 'business';
  const isDeactivated = accountData?.isDeactivated;

  if (isDeactivated) {
    return (
      <ReactivateCompanyModal
        isOpen={isOpen}
        onClose={onClose}
        org={{
          id: activeProfile.id,
          name: activeProfile.name,
        }}
        onSuccess={async () => {
          await refetch();
        }}
      />
    );
  }

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setOtpCode('');
      setMaskedEmail('');
      setErrorMsg('');
      setIsLoading(false);
      setCountdown(30);
      setIsSuccess(false);
    }, 300);
  };

  // Deactivation Step 1: Request OTP from backend & Advance to Step 2
  const handleSendOTP = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await sendDeactivateOrgOTP(activeProfile.id);
      setMaskedEmail(res.email_masked || 'your registered email address');
      toast.success("Verification code sent to your email");
      setStep(2);
      setCountdown(res.cooldown_seconds || 30);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || `Failed to send verification code`);
    } finally {
      setIsLoading(false);
    }
  };

  // Deactivation Step 2: Verify OTP and trigger deactivation
  const handleVerifyAndDeactivate = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (!code || code.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code");
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await deactivateOrganization(activeProfile.id, code);
      setIsSuccess(true);
      toast.success(`Your ${entityLabel} account has been deactivated`);

      // Switch backend actor context to personal user
      try {
        await setActorContext({ type: 'USER' });
      } catch (_) {}
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('cocpit_active_profile');
      }

      // Smooth atomic navigation to feed while keeping modal backdrop visible
      setTimeout(() => {
        window.location.replace('/feed');
      }, 500);
    } catch (err: any) {
      const rawMsg = err.response?.data?.message || err.message;
      const message = (rawMsg === 'Incorrect code' || rawMsg === 'Invalid verification code')
        ? 'Invalid verification code'
        : (rawMsg || `Failed to deactivate ${entityLabel}`);
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOTP = async () => {
    if (countdown > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await sendDeactivateOrgOTP(activeProfile.id);
      setMaskedEmail(res.email_masked || maskedEmail);
      toast.success("New verification code sent");
      setCountdown(res.cooldown_seconds || 30);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || `Failed to resend verification code`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative isolate ${
          step === 2
            ? 'w-[316px] min-h-[270px] h-auto'
            : 'w-[304px] min-h-[230px] h-auto'
        } max-w-[calc(100vw-32px)] bg-ds-bg border border-ds-border rounded-[16px] p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200 box-border flex flex-col items-center`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex flex-col items-center w-full ${step === 1 ? 'gap-4' : ''}`}>
          {/* STEP 1: Confirmation Popup (Figma Spec 304 x 230 Hug) */}
          {step === 1 && (
            <>
              {/* Frame 2609475: 278px width, 152px height, gap 8px */}
              <div className="w-[278px] min-h-[152px] flex flex-col items-center gap-2 text-center p-0 self-stretch">
                <h2 className="w-[278px] h-[24px] text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px] text-center m-0 p-0">
                  Deactivate your {entityLabel} page?
                </h2>
                <p className="w-[278px] h-[120px] text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] text-center m-0 p-0">
                  Your {entityLabel} page will be temporarily deactivated. You can reactivate it anytime from the Organization tab in your settings. Your profile, followers, posts, and data will be retained and restored when you reactivate your page.
                </p>
              </div>

              {errorMsg && (
                <div className="w-[278px] p-2 rounded-lg bg-ds-error/10 border border-ds-error/20 text-center" role="alert">
                  <p className="text-ds-error ds-text-small font-medium m-0">{errorMsg}</p>
                </div>
              )}

              {/* Frame 2609476: 220px width, 36px height, gap 8px */}
              <div className="w-[220px] h-[36px] flex flex-row items-center justify-center gap-2 p-0">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  className="w-[106px] h-[36px] px-3 py-1.5 rounded-[100px] bg-ds-accent text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px] hover:opacity-90 active:scale-95 flex items-center justify-center gap-[10px] transition-all cursor-pointer disabled:opacity-50 ds-focus-ring"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Deactivate
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-[106px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent hover:bg-ds-surface-1 text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px] flex items-center justify-center gap-[10px] transition-all cursor-pointer disabled:opacity-50 ds-focus-ring"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Verify your identity (Figma Spec: 316 x 270 Hug) */}
          {step === 2 && (
            <div className="flex flex-col items-center w-full">
              {/* Title & Subtitle */}
              <div className="flex flex-col items-center gap-2 text-center w-full">
                <h2 className="text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px] text-center m-0 p-0 w-full">
                  Verify your identity
                </h2>
                <div className="text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] text-center m-0 p-0 w-full flex flex-col items-center">
                  <span>A 6-digit verification code has been sent to</span>
                  {maskedEmail ? (
                    maskedEmail.split(',').map((email, idx) => (
                      <span key={idx} className="block text-center">
                        {email.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="block text-center">your registered email</span>
                  )}
                </div>
              </div>

              {/* Frame 2608851: 290px width, top/bottom padding 8px, gap 8px */}
              <div className="mt-2 w-full max-w-[290px] pt-2 pb-2 flex flex-col justify-start items-start gap-2">
                <label className="text-ds-text-secondary text-[12px] font-normal font-['DM_Sans'] leading-[16px]">
                  Enter code
                </label>
                <div className="w-full pb-1 border-b border-ds-border flex justify-between items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    autoFocus
                    disabled={isLoading || isSuccess}
                    onChange={async (e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtpCode(val);
                      setErrorMsg('');
                      setIsSuccess(false);
                      if (val.length === 6) {
                        try {
                          await validateDeactivateOrgOTP(activeProfile.id, val);
                          setIsSuccess(true);
                        } catch (err: any) {
                          const rawMsg = err.response?.data?.message || err.message;
                          const message = (!rawMsg || rawMsg === 'Incorrect code' || rawMsg === 'Invalid verification code')
                            ? 'Invalid verification code'
                            : rawMsg;
                          setErrorMsg(message);
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && otpCode.length === 6 && !isLoading) {
                        handleVerifyAndDeactivate();
                      }
                    }}
                    placeholder="000000"
                    aria-label="6-digit verification code"
                    className="w-full bg-transparent border-none outline-none text-ds-text-primary placeholder:text-ds-text-muted text-[14px] font-normal font-['DM_Sans'] leading-[20px] p-0 tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {isSuccess && !errorMsg && (
                    <BadgeCheck className="w-4 h-4 shrink-0 text-ds-success" />
                  )}
                </div>

                {/* Error message (if any) */}
                {errorMsg && (
                  <span className="text-ds-error text-[12px] font-normal font-['DM_Sans'] leading-[16px]">
                    {errorMsg}
                  </span>
                )}

                {/* Resend Link & Status — use invisible instead of unmounting to prevent layout shift */}
                <div className={`w-full flex justify-start items-center ${isSuccess ? 'invisible' : ''}`}>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || isLoading || isSuccess}
                    className={`text-[12px] font-normal font-['DM_Sans'] leading-[16px] p-0 bg-transparent border-none ${
                      countdown > 0 || isLoading || isSuccess
                        ? 'text-ds-text-muted cursor-default'
                        : 'text-ds-accent hover:opacity-80 transition-opacity no-underline hover:no-underline cursor-pointer'
                    }`}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                </div>
              </div>

              {/* Action Buttons Frame 2609476: 18px gap above, 8px gap between buttons */}
              <div className="mt-[18px] flex flex-row items-center justify-center gap-[8px] w-full">
                <button
                  type="button"
                  onClick={() => handleVerifyAndDeactivate()}
                  disabled={isLoading || otpCode.length !== 6}
                  className={`w-[106px] h-[36px] px-3 py-1.5 rounded-[100px] text-[14px] font-medium font-['DM_Sans'] leading-[20px] flex items-center justify-center gap-2 transition-all select-none ${
                    otpCode.length !== 6 || isLoading
                      ? 'bg-ds-surface-1 text-ds-text-muted border-none cursor-not-allowed'
                      : 'bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-95 cursor-pointer ds-focus-ring'
                  }`}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Deactivate
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-[106px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent hover:bg-ds-surface-1 text-ds-text-primary text-[14px] font-medium font-['DM_Sans'] leading-[20px] flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 ds-focus-ring"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
