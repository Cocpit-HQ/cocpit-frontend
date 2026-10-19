"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, BadgeCheck, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { companyService } from '@/services/organization.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export interface ReactivateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  org?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  onSuccess?: () => void | Promise<void>;
}

export function ReactivateCompanyModal({
  isOpen,
  onClose,
  org,
  onSuccess,
}: ReactivateCompanyModalProps) {
  const queryClient = useQueryClient();
  const { activeProfile, updateActiveProfile, refreshProfile, refreshCompanies } = useActiveProfile();

  const [step, setStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fallback to activeProfile if org prop is not explicitly passed
  const targetId = org?.id || (activeProfile?.type === 'COMPANY' ? activeProfile.id : '');
  const targetName = org?.name || (activeProfile?.type === 'COMPANY' ? activeProfile.name : 'Organization');

  // Reset state whenever modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setOtpCode('');
      setMaskedEmail('');
      setCountdown(30);
      setIsLoading(false);
      setIsValidating(false);
      setIsSuccess(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && step === 2) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  // Step 1: Request OTP from backend
  const handleSendOTP = async () => {
    if (!targetId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await companyService.sendReactivateOrgOTP(targetId);
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

  // Step 2: Resend OTP handler (isolated to prevent resetting or reverting Step 1)
  const handleResendOTP = async () => {
    if (!targetId || countdown > 0 || isLoading || isValidating) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await companyService.sendReactivateOrgOTP(targetId);
      setMaskedEmail(res.email_masked || maskedEmail);
      setCountdown(res.cooldown_seconds || 30);
      toast.success("New verification code sent to email");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and reactivate
  const handleVerifyAndReactivate = async () => {
    const code = otpCode.trim();
    if (!code || code.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit verification code");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await companyService.reactivateOrgWithOTP(targetId, code);
      toast.success("Your page has been reactivated");

      // Invalidate queries so UI reflects reactivated state across application
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['jobContext'] });
      queryClient.invalidateQueries({ queryKey: ['profilePreview'] });
      queryClient.invalidateQueries({ queryKey: ['entityPreview'] });
      queryClient.invalidateQueries({ queryKey: ['orgProfile'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });

      // Update activeProfile context if the reactivated org is current
      if (activeProfile?.id === targetId && updateActiveProfile) {
        updateActiveProfile({
          is_identity_verified: true,
        });
      }

      if (refreshProfile) {
        void refreshProfile();
      }
      if (refreshCompanies) {
        void refreshCompanies();
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cocpit:refresh-actor-context'));
      }

      if (onSuccess) {
        await onSuccess();
      }

      handleClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Reactivation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isOtpComplete = otpCode.trim().length === 6;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reactivate-org-modal-title"
      aria-describedby="reactivate-org-modal-desc"
    >
      <div
        className={`relative ${
          step === 2 ? 'w-[316px] min-h-[270px]' : 'w-[309px] min-h-[174px]'
        } max-w-[calc(100vw-32px)] bg-ds-bg border border-ds-border rounded-[16px] p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200 box-border`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4 w-full">
          {/* ── STEP 1: Confirmation Popup (Figma Spec 309px) ── */}
          {step === 1 && (
            <>
              <div className="flex flex-col items-center gap-2 text-center w-full">
                <h2
                  id="reactivate-org-modal-title"
                  className="text-ds-text-primary ds-text-body-1 text-center m-0 p-0 w-full"
                >
                  Are you sure you want to reactivate your &ldquo;{targetName}&rdquo; page?
                </h2>
                <p
                  id="reactivate-org-modal-desc"
                  className="text-ds-text-secondary ds-text-secondary text-center m-0 p-0 w-full"
                >
                  Once reactivated, the page will become visible and accessible to visitors again
                </p>
              </div>

              {errorMsg && (
                <div
                  className="w-full p-2 bg-ds-error/10 border border-ds-error/20 rounded-lg text-center"
                  role="alert"
                >
                  <p className="text-ds-error ds-text-small font-medium m-0">
                    {errorMsg}
                  </p>
                </div>
              )}

              {/* Action Buttons: Send code on Left, Cancel on Right (Figma Spec: 106px x 36px, gap-[10px]) */}
              <div className="flex flex-row items-center justify-center gap-[10px] w-full">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  className="w-[106px] h-[36px] px-3 py-1.5 rounded-[100px] bg-ds-accent text-ds-text-primary ds-text-body-1 hover:opacity-90 active:scale-95 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ds-focus-ring whitespace-nowrap"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                  <span className="whitespace-nowrap">Send code</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-[106px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent hover:bg-ds-surface-1 text-ds-text-primary ds-text-body-1 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 ds-focus-ring whitespace-nowrap"
                >
                  <span className="whitespace-nowrap">Cancel</span>
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Verify email Popup (Figma Spec 316px) ── */}
          {step === 2 && (
            <>
              <div className="flex flex-col items-center gap-2 text-center w-full">
                <h2
                  id="reactivate-org-modal-title"
                  className="text-ds-text-primary ds-text-body-1 text-center m-0 p-0 w-full"
                >
                  Verify email
                </h2>
                <p
                  id="reactivate-org-modal-desc"
                  className="text-ds-text-secondary ds-text-secondary text-center m-0 p-0 w-full"
                >
                  A 6-digit verification code has been sent to
                  <br />
                  {maskedEmail || 'your email'}
                </p>
              </div>

              {/* Code input field */}
              <div className="w-full flex flex-col items-start gap-1">
                <label
                  htmlFor="reactivate-otp-input"
                  className="text-ds-text-secondary ds-text-small"
                >
                  Enter code
                </label>
                <div className="relative w-full border-b border-ds-border focus-within:border-ds-accent transition-colors">
                  <input
                    id="reactivate-otp-input"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    autoFocus
                    onChange={async (e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtpCode(val);
                      setErrorMsg(null);
                      setIsSuccess(false);
                      if (val.length === 6) {
                        try {
                          setIsValidating(true);
                          await companyService.validateReactivateOrgOTP(targetId, val);
                          setIsSuccess(true);
                        } catch (err: any) {
                          setErrorMsg(err?.response?.data?.message || err?.message || 'Invalid verification code');
                        } finally {
                          setIsValidating(false);
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isOtpComplete && !isLoading && !isValidating) {
                        handleVerifyAndReactivate();
                      }
                    }}
                    placeholder="000000"
                    aria-label="6-digit verification code"
                    className="w-full py-1 bg-transparent border-none text-ds-text-primary focus:outline-none tracking-[4px] text-left ds-text-secondary placeholder:text-ds-text-muted placeholder:tracking-normal ds-focus-ring"
                  />
                  {isValidating && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 text-ds-text-muted">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                  {isSuccess && !errorMsg && !isValidating && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 text-ds-success">
                      <BadgeCheck className="w-4 h-4" />
                    </div>
                  )}
                  {errorMsg && !isValidating && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 text-ds-error">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Resend Link & Status */}
                <div className="flex items-center justify-between w-full pt-1">
                  {countdown > 0 ? (
                    <span className="text-ds-text-muted ds-text-small">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoading || isValidating}
                      onClick={handleResendOTP}
                      className="text-ds-accent hover:underline ds-text-small cursor-pointer bg-transparent border-0 p-0 ds-focus-ring whitespace-nowrap"
                    >
                      {isLoading ? 'Sending code...' : 'Resend code'}
                    </button>
                  )}
                  {isSuccess && !errorMsg && !isValidating && (
                    <span className="ds-text-small text-ds-success">Verified</span>
                  )}
                </div>
              </div>

              {errorMsg && (
                <div
                  className="w-full p-2 bg-ds-error/10 border border-ds-error/20 rounded-lg text-center"
                  role="alert"
                >
                  <p className="text-ds-error ds-text-small font-medium m-0">
                    {errorMsg}
                  </p>
                </div>
              )}

              {/* Action Buttons: Reactivate on Left, Cancel on Right (Figma Spec: 110px x 36px, gap-[10px]) */}
              <div className="flex flex-row items-center justify-center gap-[10px] w-full">
                <button
                  type="button"
                  onClick={handleVerifyAndReactivate}
                  disabled={isLoading || !isOtpComplete || isValidating}
                  className={`w-[110px] h-[36px] px-3 py-1.5 rounded-[100px] ds-text-body-1 flex items-center justify-center gap-1.5 transition-all select-none whitespace-nowrap ${
                    !isOtpComplete || isValidating
                      ? 'bg-ds-surface-1 text-ds-text-muted border border-ds-border cursor-not-allowed'
                      : 'bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-95 cursor-pointer ds-focus-ring'
                  } disabled:opacity-50`}
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                  <span className="whitespace-nowrap">Reactivate</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-[110px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent hover:bg-ds-surface-1 text-ds-text-primary ds-text-body-1 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 ds-focus-ring whitespace-nowrap"
                >
                  <span className="whitespace-nowrap">Cancel</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReactivateCompanyModal;
