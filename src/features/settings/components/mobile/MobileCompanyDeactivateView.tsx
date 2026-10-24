"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { sendDeactivateOrgOTP, validateDeactivateOrgOTP, deactivateOrganization } from '@/services/api/settings';
import { companyService } from '@/services/organization.service';
import { setActorContext } from '@/services/api/auth';
import { useCompanyAccountSettings } from '@/features/settings/hooks/useCompanyAccountSettings';
import { toast } from 'sonner';
import { MobileSettingsHeader } from './MobileSettingsHeader';

export interface MobileCompanyDeactivateViewProps {
  onBack?: () => void;
  isDeactivated?: boolean;
}

export function MobileCompanyDeactivateView({
  onBack,
  isDeactivated = false,
}: MobileCompanyDeactivateViewProps) {
  const router = useRouter();
  const pathname = usePathname() || '/settings';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const { activeProfile } = useActiveProfile();
  const { refetch } = useCompanyAccountSettings();

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

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setOtpCode('');
      setErrorMsg('');
      setIsSuccess(false);
      return;
    }
    if (onBack) {
      onBack();
    } else {
      router.replace(basePath);
    }
  };

  const entityLabel = activeProfile?.entityType === 'INSTITUTION' ? 'institution' : 'business';
  const targetId = activeProfile?.id || '';

  // STEP 1 -> STEP 2: Request OTP
  const handleSendOTP = async () => {
    if (!targetId) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (isDeactivated) {
        const res = await companyService.sendReactivateOrgOTP(targetId);
        setMaskedEmail(res.email_masked || 'your registered email address');
        setCountdown(res.cooldown_seconds || 30);
        toast.success("Verification code sent to your email");
      } else {
        const res = await sendDeactivateOrgOTP(targetId);
        setMaskedEmail(res.email_masked || 'your registered email address');
        setCountdown(res.cooldown_seconds || 30);
        toast.success("Verification code sent to your email");
      }
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0 || isLoading || !targetId) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (isDeactivated) {
        const res = await companyService.sendReactivateOrgOTP(targetId);
        setMaskedEmail(res.email_masked || maskedEmail);
        setCountdown(res.cooldown_seconds || 30);
        toast.success("New verification code sent");
      } else {
        const res = await sendDeactivateOrgOTP(targetId);
        setMaskedEmail(res.email_masked || maskedEmail);
        setCountdown(res.cooldown_seconds || 30);
        toast.success("New verification code sent");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP and trigger action
  const handleVerify = async () => {
    const code = otpCode.trim();
    if (!code || code.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code");
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      if (isDeactivated) {
        await companyService.reactivateOrgWithOTP(targetId, code);
        setIsSuccess(true);
        toast.success(`Your ${entityLabel} page has been reactivated`);
        await refetch();
        if (onBack) onBack();
      } else {
        await deactivateOrganization(targetId, code);
        setIsSuccess(true);
        toast.success(`Your ${entityLabel} account has been deactivated`);

        try {
          await setActorContext({ type: 'USER' });
        } catch (_) {}
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('cocpit_active_profile');
        }

        setTimeout(() => {
          window.location.replace('/feed');
        }, 500);
      }
    } catch (err: any) {
      const rawMsg = err.response?.data?.message || err.message;
      const message = (rawMsg === 'Incorrect code' || rawMsg === 'Invalid verification code')
        ? 'Invalid verification code'
        : (rawMsg || `Failed to ${isDeactivated ? 'reactivate' : 'deactivate'} ${entityLabel}`);
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-120px)] text-ds-text-primary font-sans select-none pb-8">
      <MobileSettingsHeader
        title={step === 2 ? "Verify your identity" : isDeactivated ? "Reactivate" : "Deactivate"}
        onBack={handleBack}
      />

      <div className="flex-1 flex flex-col px-4 py-2 gap-5 w-full max-w-[480px]">
        {/* STEP 1: Overview & Confirmation */}
        {step === 1 && (
          <>
            <h2 className="text-ds-text-primary text-[18px] font-medium font-['DM_Sans'] leading-[24px] m-0">
              {isDeactivated
                ? `Are you sure you want to reactivate your \u201C${activeProfile?.name || 'organization'}\u201D page?`
                : 'Deactivate your account?'}
            </h2>

            <p className="text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] m-0">
              {isDeactivated
                ? 'Once reactivated, the page will become visible and accessible to visitors again'
                : 'Your account will be deactivated. You can reactivate it anytime from the \u201COrganization\u201D tab under your account Settings. Your profile, followers, posts, and data will be retained and restored when you reactivate your account.'}
            </p>

            {errorMsg && (
              <div className="w-full p-2.5 rounded-xl bg-ds-error/10 border border-ds-error/20" role="alert">
                <span className="text-ds-error text-xs font-['DM_Sans']">{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-row items-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={isLoading}
                className="h-9 px-6 rounded-full flex justify-center items-center transition-all cursor-pointer font-['DM_Sans'] text-sm font-medium bg-ds-accent text-white hover:opacity-90 active:scale-95 disabled:opacity-50 ds-focus-ring"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : isDeactivated ? (
                  'Reactivate'
                ) : (
                  'Deactivate'
                )}
              </button>

              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="h-9 px-6 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-primary text-sm font-medium font-['DM_Sans'] cursor-pointer ds-focus-ring"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* STEP 2: 6-Digit OTP Verification */}
        {step === 2 && (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-ds-text-primary text-[18px] font-medium font-['DM_Sans'] leading-[24px] m-0">
                Verify your identity
              </h2>
              <p className="text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] m-0">
                A 6-digit verification code has been sent to{' '}
                <span className="text-ds-text-primary font-medium">{maskedEmail || 'your email'}</span>
              </p>
            </div>

            <div className="flex flex-col w-full gap-2 pt-2">
              <label className="text-ds-text-secondary text-[12px] font-normal font-['DM_Sans'] leading-[16px]">
                Enter code
              </label>
              <div className={`flex flex-row items-center justify-between pb-2 border-b ${errorMsg ? 'border-ds-error' : 'border-ds-border'}`}>
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
                    if (val.length === 6 && !isDeactivated) {
                      try {
                        await validateDeactivateOrgOTP(targetId, val);
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
                      handleVerify();
                    }
                  }}
                  placeholder="000000"
                  className="w-full bg-transparent border-none p-0 focus:outline-none text-[16px] text-ds-text-primary placeholder:text-ds-text-muted font-['DM_Sans'] tracking-widest"
                />
                {isSuccess && !errorMsg && (
                  <BadgeCheck className="w-5 h-5 shrink-0 text-ds-success" />
                )}
              </div>

              {errorMsg && (
                <span className="text-ds-error text-xs pt-1 font-['DM_Sans']">{errorMsg}</span>
              )}

              <div className={`w-full flex justify-start items-center pt-1 ${isSuccess ? 'invisible' : ''}`}>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isLoading || isSuccess}
                  className={`text-[13px] font-normal font-['DM_Sans'] p-0 bg-transparent border-none ${
                    countdown > 0 || isLoading || isSuccess
                      ? 'text-ds-text-muted cursor-default'
                      : 'text-ds-accent hover:opacity-80 transition-opacity cursor-pointer'
                  }`}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </div>

            <div className="flex flex-row items-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleVerify}
                disabled={otpCode.length !== 6 || isLoading}
                className={`h-9 px-6 rounded-full flex justify-center items-center transition-all cursor-pointer font-['DM_Sans'] text-sm font-medium ${
                  otpCode.length !== 6 || isLoading
                    ? 'bg-ds-surface-1 text-ds-text-muted cursor-not-allowed border border-ds-border/40'
                    : 'bg-ds-accent text-white hover:opacity-90 active:scale-95 ds-focus-ring'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : isDeactivated ? (
                  'Reactivate'
                ) : (
                  'Deactivate'
                )}
              </button>

              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="h-9 px-6 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-primary text-sm font-medium font-['DM_Sans'] cursor-pointer ds-focus-ring"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
