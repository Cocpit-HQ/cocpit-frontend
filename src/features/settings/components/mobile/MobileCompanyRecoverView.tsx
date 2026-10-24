"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { companyService } from '@/services/organization.service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MobileSettingsHeader } from './MobileSettingsHeader';

export interface MobileCompanyRecoverViewProps {
  onBack: () => void;
  org: {
    id: string;
    name: string;
    slug?: string;
  };
  mode?: 'recover' | 'reactivate';
  onSuccess?: () => void | Promise<void>;
}

export function MobileCompanyRecoverView({
  onBack,
  org,
  mode = 'recover',
  onSuccess,
}: MobileCompanyRecoverViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const isReactivate = mode === 'reactivate';
  const actionLabel = isReactivate ? 'Reactivate' : 'Recover';

  const [step, setStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && step === 2) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setOtpCode('');
      setErrorMsg(null);
      setIsSuccess(false);
      return;
    }
    onBack();
  };

  const handleSendOTP = async () => {
    if (!org.id) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = isReactivate
        ? await companyService.sendReactivateOrgOTP(org.id)
        : await companyService.sendRecoverOrgOTP(org.id);
      setMaskedEmail(res.email_masked || 'your registered email');
      setCountdown(res.cooldown_seconds || 30);
      setStep(2);
      toast.success("Verification code sent to email");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!org.id || countdown > 0 || isLoading || isValidating) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = isReactivate
        ? await companyService.sendReactivateOrgOTP(org.id)
        : await companyService.sendRecoverOrgOTP(org.id);
      setMaskedEmail(res.email_masked || maskedEmail);
      setCountdown(res.cooldown_seconds || 30);
      toast.success("New verification code sent to email");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndAction = async () => {
    const code = otpCode.trim();
    if (!code || code.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit verification code");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (isReactivate) {
        await companyService.reactivateOrgWithOTP(org.id, code);
        toast.success("Organization page reactivated successfully");
      } else {
        await companyService.recoverOrgWithOTP(org.id, code);
        toast.success("Organization page recovered successfully");
      }
      setIsSuccess(true);

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['jobContext'] });
      queryClient.invalidateQueries({ queryKey: ['profilePreview'] });
      queryClient.invalidateQueries({ queryKey: ['entityPreview'] });
      queryClient.invalidateQueries({ queryKey: ['orgProfile'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['userOrganizations'] });

      if (onSuccess) {
        await onSuccess();
      }
      onBack();
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message || err?.message;
      const message = (!rawMsg || rawMsg === 'Incorrect code' || rawMsg === 'Invalid verification code')
        ? 'Invalid verification code'
        : rawMsg;
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-120px)] text-ds-text-primary font-sans select-none pb-8">
      <MobileSettingsHeader
        title={step === 2 ? "Verify your identity" : `${actionLabel} page`}
        onBack={handleBack}
      />

      <div className="flex-1 flex flex-col px-4 py-2 gap-5 w-full max-w-[480px]">
        {/* STEP 1: Confirmation */}
        {step === 1 && (
          <>
            <h2 className="text-ds-text-primary text-[18px] font-medium font-['DM_Sans'] leading-[24px] m-0">
              Are you sure you want to {isReactivate ? 'reactivate' : 'recover'} your &ldquo;{org.name}&rdquo; page?
            </h2>

            <p className="text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] m-0">
              Once reactivated, the page will become visible and accessible to visitors again
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
                className="h-9 px-6 rounded-[100px] flex justify-center items-center transition-all cursor-pointer font-['DM_Sans'] text-sm font-medium bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-95 disabled:opacity-50 ds-focus-ring"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send code'
                )}
              </button>

              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="h-9 px-6 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-primary text-sm font-medium font-['DM_Sans'] cursor-pointer ds-focus-ring"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* STEP 2: OTP Verification */}
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
                  disabled={isLoading || isValidating || isSuccess}
                  onChange={async (e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpCode(val);
                    setErrorMsg(null);
                    setIsSuccess(false);
                    if (val.length === 6) {
                      try {
                        setIsValidating(true);
                        if (isReactivate) {
                          await companyService.validateReactivateOrgOTP(org.id, val);
                        } else {
                          await companyService.validateRecoverOrgOTP(org.id, val);
                        }
                        setIsSuccess(true);
                      } catch (err: any) {
                        const rawMsg = err?.response?.data?.message || err?.message;
                        const message = (!rawMsg || rawMsg === 'Incorrect code' || rawMsg === 'Invalid verification code')
                          ? 'Invalid verification code'
                          : rawMsg;
                        setErrorMsg(message);
                      } finally {
                        setIsValidating(false);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && otpCode.length === 6 && !isLoading && !isValidating) {
                      handleVerifyAndAction();
                    }
                  }}
                  placeholder="000000"
                  className="w-full bg-transparent border-none p-0 focus:outline-none text-[16px] text-ds-text-primary placeholder:text-ds-text-muted font-['DM_Sans'] tracking-widest"
                />
                {isValidating && (
                  <Loader2 className="w-5 h-5 shrink-0 text-ds-text-muted animate-spin" />
                )}
                {isSuccess && !errorMsg && !isValidating && (
                  <BadgeCheck className="w-5 h-5 shrink-0 text-ds-success" />
                )}
              </div>

              {/* Reserved stable slot for error message so buttons don't shift */}
              <div className="w-full min-h-[16px] flex items-center">
                {errorMsg && !isValidating && (
                  <span className="text-ds-error text-xs font-['DM_Sans']">{errorMsg}</span>
                )}
              </div>

              <div className={`w-full flex justify-start items-center pt-1 ${isSuccess ? 'invisible' : ''}`}>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isLoading || isValidating || isSuccess}
                  className={`text-[13px] font-normal font-['DM_Sans'] p-0 bg-transparent border-none ${
                    countdown > 0 || isLoading || isValidating || isSuccess
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
                onClick={handleVerifyAndAction}
                disabled={otpCode.length !== 6 || isLoading || isValidating}
                className={`h-9 px-6 rounded-[100px] flex justify-center items-center transition-all cursor-pointer font-['DM_Sans'] text-sm font-medium ${
                  otpCode.length !== 6 || isLoading || isValidating
                    ? 'bg-ds-surface-1 text-ds-text-muted cursor-not-allowed border border-ds-border/40'
                    : 'bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-95 ds-focus-ring'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-ds-text-primary" />
                ) : (
                  actionLabel
                )}
              </button>

              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="h-9 px-6 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-primary text-sm font-medium font-['DM_Sans'] cursor-pointer ds-focus-ring"
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
