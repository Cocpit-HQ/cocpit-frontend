"use client";

import React, { useState, useEffect } from 'react';
import { X, BadgeCheck, XCircle, Loader2 } from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { sendDeactivateOrgOTP, validateDeactivateOrgOTP, deactivateOrganization, reactivateOrganization } from '@/services/api/settings';
import { setActorContext } from '@/services/api/auth';
import { useCompanyAccountSettings } from '@/features/settings/hooks/useCompanyAccountSettings';
import { toast } from 'sonner';

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

  if (!isOpen || !activeProfile) return null;

  const entityLabel = activeProfile.entityType === 'INSTITUTION' ? 'institution' : 'business';
  const isDeactivated = accountData?.isDeactivated;

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

  // Handle Reactivation (Direct)
  const handleReactivate = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await reactivateOrganization(activeProfile.id);
      toast.success(`Your ${entityLabel} account has been reactivated`);
      await refetch();
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || `Failed to reactivate ${entityLabel}`);
    } finally {
      setIsLoading(false);
    }
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
      setErrorMsg(err.response?.data?.message || err.message || `Failed to deactivate ${entityLabel}`);
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
        className={`relative ${
          isDeactivated
            ? 'w-[309px] min-h-[174px]'
            : step === 2
            ? 'w-[316px] min-h-[250px]'
            : 'w-[304px] min-h-[230px]'
        } max-w-[calc(100vw-32px)] bg-ds-bg border border-ds-border rounded-[16px] p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200 box-border flex flex-col justify-between`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center justify-between w-full h-full gap-4 flex-1">
          {/* REACTIVATION FLOW */}
          {isDeactivated ? (
            <>
              <div className="flex flex-col items-center gap-2 text-center w-full">
                <h2 className="text-ds-text-primary ds-text-body-1 text-center m-0 p-0 w-full">
                  Are you sure you want to reactivate your &ldquo;{activeProfile.name}&rdquo; page?
                </h2>
                <p className="text-ds-text-secondary ds-text-secondary text-center m-0 p-0 w-full">
                  Once reactivated, the page will become visible and accessible to visitors again
                </p>
              </div>

              {errorMsg && (
                <div className="w-full p-2 rounded-lg bg-ds-error/10 border border-ds-error/20 text-center" role="alert">
                  <p className="text-ds-error ds-text-small font-medium m-0">{errorMsg}</p>
                </div>
              )}

              <div className="flex flex-row items-center justify-center gap-[8px] w-full">
                <button
                  type="button"
                  onClick={handleReactivate}
                  disabled={isLoading}
                  className="w-[106px] h-[36px] px-3 py-1.5 rounded-[100px] bg-ds-accent text-ds-text-primary ds-text-body-1 hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ds-focus-ring"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Reactivate
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-[106px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent hover:bg-ds-surface-1 text-ds-text-primary ds-text-body-1 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 ds-focus-ring"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            /* DEACTIVATION FLOW (2-STEP OTP) */
            <>
              {/* STEP 1: Confirmation Popup (Figma Spec 304 x 230 Hug) */}
              {step === 1 && (
                <>
                  <div className="flex flex-col items-center gap-2 text-center w-full">
                    <h2 className="text-ds-text-primary ds-text-body-1 text-center m-0 p-0 w-full">
                      Deactivate your account?
                    </h2>
                    <p className="text-ds-text-secondary ds-text-secondary text-center m-0 p-0 w-full">
                      Your account will be deactivated. You can reactivate it anytime from the &ldquo;Organization&rdquo; tab under your account Settings. Your profile, followers, posts, and data will be retained and restored when you reactivate your account.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="w-full p-2 rounded-lg bg-ds-error/10 border border-ds-error/20 text-center" role="alert">
                      <p className="text-ds-error ds-text-small font-medium m-0">{errorMsg}</p>
                    </div>
                  )}

                  <div className="flex flex-row items-center justify-center gap-[8px] w-full">
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={isLoading}
                      className="w-[106px] h-[36px] px-3 py-1.5 rounded-[100px] bg-ds-accent text-ds-text-primary ds-text-body-1 hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ds-focus-ring"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Deactivate
                    </button>

                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="w-[106px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent hover:bg-ds-surface-1 text-ds-text-primary ds-text-body-1 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 ds-focus-ring"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* STEP 2: Verify your identity (Figma Spec 316 x 250 Hug) */}
              {step === 2 && (
                <>
                  <div className="flex flex-col items-center gap-2 text-center w-full">
                    <h2 className="text-ds-text-primary ds-text-body-1 text-center m-0 p-0 w-full">
                      Verify your identity
                    </h2>
                    <p className="text-ds-text-secondary ds-text-secondary text-center m-0 p-0 w-full">
                      A 6-digit verification code has been sent to<br />
                      {maskedEmail}
                    </p>
                  </div>

                  {/* Underline OTP Input Block */}
                  <div className="w-full flex flex-col items-start gap-1">
                    <label className="text-ds-text-secondary ds-text-small">
                      Enter code
                    </label>
                    <div className="relative w-full border-b border-ds-border focus-within:border-ds-accent transition-colors">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        autoFocus
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
                              setErrorMsg(err.response?.data?.message || err.message || `Invalid verification code`);
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
                        className="w-full py-1 bg-transparent border-none text-ds-text-primary focus:outline-none tracking-[4px] text-left ds-text-secondary placeholder:text-ds-text-muted placeholder:tracking-normal ds-focus-ring"
                      />
                      {isSuccess && !errorMsg && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-ds-success">
                          <BadgeCheck className="w-4 h-4" />
                        </div>
                      )}
                      {errorMsg && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-ds-error">
                          <XCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Resend Link & Status */}
                    <div className="flex items-center justify-between w-full pt-1">
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={countdown > 0 || isLoading}
                        className={`ds-text-small cursor-pointer bg-transparent border-0 p-0 ds-focus-ring ${
                          countdown > 0 || isLoading
                            ? 'text-ds-text-muted cursor-default'
                            : 'text-ds-accent hover:underline'
                        }`}
                      >
                        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                      </button>
                      {isSuccess && !errorMsg && (
                        <span className="ds-text-small text-ds-success">Verified</span>
                      )}
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="w-full p-2 rounded-lg bg-ds-error/10 border border-ds-error/20 text-center" role="alert">
                      <p className="text-ds-error ds-text-small font-medium m-0">{errorMsg}</p>
                    </div>
                  )}

                  <div className="flex flex-row items-center justify-center gap-[8px] w-full">
                    <button
                      type="button"
                      onClick={() => handleVerifyAndDeactivate()}
                      disabled={isLoading || otpCode.length !== 6}
                      className={`w-[106px] h-[36px] px-3 py-1.5 rounded-[100px] ds-text-body-1 flex items-center justify-center gap-2 transition-all select-none ${
                        otpCode.length !== 6 || isLoading
                          ? 'bg-ds-surface-1 text-ds-text-muted border border-ds-border cursor-not-allowed'
                          : 'bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-95 cursor-pointer ds-focus-ring'
                      } disabled:opacity-50`}
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Deactivate
                    </button>

                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="w-[106px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent hover:bg-ds-surface-1 text-ds-text-primary ds-text-body-1 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 ds-focus-ring"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
