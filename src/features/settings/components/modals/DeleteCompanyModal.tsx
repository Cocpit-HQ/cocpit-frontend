"use client";

import React, { useState, useEffect } from 'react';
import { X, BadgeCheck, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { companyService } from '@/services/organization.service';
import { toast } from 'sonner';

interface DeleteCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteCompanyModal({ isOpen, onClose }: DeleteCompanyModalProps) {
  const { activeProfile, switchProfile } = useActiveProfile();
  const [step, setStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  // Timer countdown logic for Step 2 resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && step === 2) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  if (!isOpen || !activeProfile) return null;

  const entityLabel = activeProfile.entityType === 'INSTITUTION' ? 'institution' : 'business';

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

  // Step 1: Request OTP from backend
  const handleSendOTP = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await companyService.sendDeleteOrgOTP(activeProfile.id);
      setMaskedEmail(res.email_masked || 'your registered email address');
      toast.success("Verification code sent");
      setStep(2);
      setCountdown(res.cooldown_seconds || 30);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || `Failed to send verification code`);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and trigger deletion
  const handleVerifyAndDelete = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (!code || code.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code");
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await companyService.verifyAndDeleteCompany(activeProfile.id, code);
      setIsSuccess(true);
      toast.success(`Your ${entityLabel} page has been scheduled for deletion`);
      setTimeout(() => {
        handleClose();
        switchProfile("USER", "");
        router.push('/feed');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || `Failed to delete ${entityLabel}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOTP = async () => {
    if (countdown > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await companyService.sendDeleteOrgOTP(activeProfile.id);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex flex-col items-center bg-ds-surface-2 border border-ds-border rounded-2xl p-6 w-[450px] max-w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-surface-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: Confirmation & Request OTP */}
        {step === 1 && (
          <div className="flex flex-col items-center gap-4 w-full mt-1">
            <div className="flex flex-col items-center gap-2 text-center w-full">
              <h2 className="ds-text-body-2 text-ds-text-primary">
                Delete your {entityLabel} page?
              </h2>
              <p className="ds-text-secondary text-ds-text-secondary max-w-sm">
                Your account will be scheduled for deletion. You can reactivate it within 40 days from the &ldquo;Organization&rdquo; tab under your account Settings. After 40 days, your account and all associated data will be permanently deleted.
              </p>
            </div>

            {errorMsg && (
              <div className="w-full p-2.5 rounded-lg bg-ds-error/10 border border-ds-error/20 text-ds-error ds-text-small text-center">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end w-full gap-3 pt-3 mt-2 border-t border-ds-border/40">
              <button
                onClick={handleClose}
                className="ds-btn ds-btn-secondary ds-text-body-1 h-9 px-5 border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-secondary hover:text-ds-text-primary"
              >
                Cancel
              </button>

              <button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="ds-btn ds-text-body-1 h-9 px-5 rounded-lg bg-ds-error text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                  </span>
                ) : (
                  "Send Code"
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 2 && (
          <div className="flex flex-col items-center gap-4 w-full mt-1">
            <div className="flex flex-col items-center gap-2 text-center w-full">
              <h2 className="ds-text-body-2 text-ds-text-primary">
                Verify deletion code
              </h2>
              <p className="ds-text-small text-ds-text-secondary max-w-sm">
                A 6-digit verification code has been sent to <span className="font-medium text-ds-text-primary">{maskedEmail}</span>
              </p>
            </div>

            {/* OTP Input Field */}
            <div className="flex flex-col items-start gap-1.5 w-full mt-1">
              <label className="ds-text-small-1 text-ds-text-secondary">Enter code</label>
              <div className="relative w-full">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={async (e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpCode(val);
                    setErrorMsg('');
                    setIsSuccess(false);
                    if (val.length === 6) {
                      try {
                        await companyService.validateDeleteCompanyOTP(activeProfile.id, val);
                        setIsSuccess(true);
                      } catch (err: any) {
                        setErrorMsg(err.response?.data?.message || err.message || `Invalid verification code`);
                      }
                    }
                  }}
                  placeholder="000000"
                  className={`ds-input w-full bg-ds-surface-1 border ${
                    errorMsg
                      ? 'border-ds-error focus:border-ds-error'
                      : isSuccess
                      ? 'border-ds-success focus:border-ds-success'
                      : 'border-ds-border focus:border-ds-accent'
                  } rounded-lg text-ds-text-primary focus:outline-none focus:ring-1 focus:ring-ds-accent transition-colors tracking-widest text-center text-base`}
                />
                {isSuccess && !errorMsg && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-success">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                )}
                {errorMsg && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-error">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
              </div>

              {isSuccess && !errorMsg && (
                <p className="ds-text-small text-ds-success w-full text-left">Code verified successfully.</p>
              )}

              {/* Resend Link */}
              <div className="w-full text-right mt-0.5">
                <button
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isLoading}
                  className={`ds-text-small ${
                    countdown > 0 || isLoading
                      ? 'text-ds-text-muted cursor-default'
                      : 'text-ds-accent hover:underline'
                  }`}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="w-full p-2.5 rounded-lg bg-ds-error/10 border border-ds-error/20 text-ds-error ds-text-small text-center">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end w-full gap-3 pt-3 mt-2 border-t border-ds-border/40">
              <button
                onClick={handleClose}
                className="ds-btn ds-btn-secondary ds-text-body-1 h-9 px-5 border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-secondary hover:text-ds-text-primary"
              >
                Cancel
              </button>

              <button
                onClick={() => handleVerifyAndDelete()}
                disabled={isLoading || otpCode.length !== 6}
                className="ds-btn ds-text-body-1 h-9 px-5 rounded-lg bg-ds-error text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
