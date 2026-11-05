"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';
import { maskEmail } from '@/lib/utils';
import {
  useSubmitNewEmail,
  useSubmitRecoveryEmail,
  useVerifyEmail,
  useVerifyRecoveryEmail
} from '@/features/settings/hooks/useAccountSettings';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useActiveProfile } from '@/context/ActiveProfileContext';

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete?: () => void;
  currentEmail: string;
  mode?: 'primary' | 'recovery' | 'delete';
}

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const getErrorMessage = (err: any, fallback: string) => {
  return err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || fallback;
};

export function ChangeEmailModal({ isOpen, onClose, onConfirmDelete, currentEmail, mode = 'primary' }: ChangeEmailModalProps) {
  const { isCompany } = useActiveProfile();
  const isPrimary = mode === 'primary';
  const isRecovery = mode === 'recovery';
  const isDelete = mode === 'delete';

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [newEmail, setNewEmail] = useState('');
  const [newEmailCode, setNewEmailCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    setMounted(true);
  }, []);

  const queryClient = useQueryClient();

  const submitNewEmail = useSubmitNewEmail();
  const submitRecoveryEmail = useSubmitRecoveryEmail();
  const verifyEmailMutation = useVerifyEmail();
  const verifyRecoveryEmailMutation = useVerifyRecoveryEmail();

  // Single efficient interval timer for OTP countdown
  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    if (step === 2) {
      setCountdown(30);
    }
  }, [step]);

  if (!isOpen || !mounted) return null;

  const handleNext = () => {
    if (isDelete) {
      if (onConfirmDelete) onConfirmDelete();
      return;
    }

    setErrorMsg('');

    if (step === 1) {
      if (!newEmail || !validateEmail(newEmail)) return setErrorMsg('Please enter a valid email address.');
      if (newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase()) {
        return setErrorMsg(isPrimary ? 'New email must be different from current email.' : 'Recovery email cannot match primary email.');
      }
      if (isPrimary) {
        submitNewEmail.mutate(
          { newEmail },
          {
            onSuccess: () => setStep(2),
            onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to submit new email'))
          }
        );
      } else if (isRecovery) {
        submitRecoveryEmail.mutate(
          { recoveryEmail: newEmail },
          {
            onSuccess: () => setStep(2),
            onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to submit recovery email'))
          }
        );
      }
    } else if (step === 2) {
      if (isPrimary && verifyEmailMutation.isSuccess) {
        queryClient.invalidateQueries({ queryKey: ['userAccount'] });
        if (isCompany) {
          queryClient.invalidateQueries({ queryKey: ['companyAccountSettings'] });
        }
        toast.success('Email updated successfully');
        handleClose();
        return;
      }
      if (isRecovery && verifyRecoveryEmailMutation.isSuccess) {
        queryClient.invalidateQueries({ queryKey: ['userAccount'] });
        toast.success('Recovery email updated successfully');
        handleClose();
        return;
      }
      if (newEmailCode.length !== 6) {
        return setErrorMsg('Please enter a 6-digit code');
      }
      if (isPrimary) {
        verifyEmailMutation.mutate(
          { otp: newEmailCode },
          {
            onSuccess: (data) => {
              queryClient.invalidateQueries({ queryKey: ['userAccount'] });
              if (isCompany) {
                queryClient.invalidateQueries({ queryKey: ['companyAccountSettings'] });
              }
              toast.success(data.message || 'Email updated successfully');
              handleClose();
            },
            onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to verify new email'))
          }
        );
      } else if (isRecovery) {
        verifyRecoveryEmailMutation.mutate(
          { otp: newEmailCode },
          {
            onSuccess: (data) => {
              queryClient.invalidateQueries({ queryKey: ['userAccount'] });
              toast.success(data.message || 'Recovery email updated successfully');
              handleClose();
            },
            onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to verify recovery email'))
          }
        );
      }
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(30);
    setErrorMsg('');
    if (isPrimary) {
      submitNewEmail.mutate(
        { newEmail },
        {
          onSuccess: () => toast.success('Verification code resent'),
          onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to resend code'))
        }
      );
    } else if (isRecovery) {
      submitRecoveryEmail.mutate(
        { recoveryEmail: newEmail },
        {
          onSuccess: () => toast.success('Verification code resent'),
          onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to resend code'))
        }
      );
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setNewEmailCode('');
      setNewEmail('');
      setErrorMsg('');
      verifyEmailMutation.reset();
      verifyRecoveryEmailMutation.reset();
      submitNewEmail.reset();
      submitRecoveryEmail.reset();
    }, 300);
  };

  const getTitle = () => {
    if (isDelete) return 'Remove Recovery Email?';
    if (isRecovery) return 'Recovery email';
    return 'Change email';
  };

  const getSubtitle = () => {
    if (isDelete) return 'Removing your recovery email may make account recovery more difficult.';
    if (step === 1) {
      if (isPrimary) return "Enter a valid email address. You'll need to verify it before the change is applied";
      if (isRecovery) return "Enter a valid email address. You'll need to verify it before adding";
    }
    if (step === 2) {
      return `A 6-digit verification code has been sent to ${maskEmail(newEmail)}`;
    }
    return '';
  };

  const getButtonText = () => {
    if (isDelete) return 'Remove';
    if (step === 1) {
      if (isPrimary && submitNewEmail.isPending) return 'Sending...';
      if (isRecovery && submitRecoveryEmail.isPending) return 'Sending...';
      return 'Continue';
    }
    if (step === 2) {
      if (isPrimary && verifyEmailMutation.isPending) return 'Verifying...';
      if (isRecovery && verifyRecoveryEmailMutation.isPending) return 'Verifying...';
      return 'Continue';
    }
    return 'Continue';
  };

  const isNewEmailSuccess = (isPrimary && verifyEmailMutation.isSuccess) || (isRecovery && verifyRecoveryEmailMutation.isSuccess);

  const getIsDisabled = () => {
    if (step === 1) {
      if (!newEmail || !validateEmail(newEmail)) return true;
      if (newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase()) return true;
      if (isPrimary && submitNewEmail.isPending) return true;
      if (isRecovery && submitRecoveryEmail.isPending) return true;
      return false;
    }
    if (step === 2) {
      if (!isNewEmailSuccess) return true;
      if (isPrimary && verifyEmailMutation.isPending) return true;
      if (isRecovery && verifyRecoveryEmailMutation.isPending) return true;
      return false;
    }
    return false;
  };

  const renderContent = () => {
    if (isDelete) return null;

    if (step === 1) {
      return (
        <div className="self-stretch py-2 flex flex-col justify-start items-start gap-2">
          <div className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
            Enter email
          </div>
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <div className="self-stretch pb-1 border-b border-ds-border flex justify-between items-center gap-2">
              <input
                type="email"
                autoFocus
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                onBlur={() => {
                  if (newEmail.trim() !== '' && !validateEmail(newEmail)) {
                    setErrorMsg('Please enter a valid email address.');
                  }
                }}
                placeholder="xyz@gmail.com"
                className="w-full bg-transparent border-none outline-none text-ds-text-primary placeholder:text-ds-text-muted text-sm font-normal font-['DM_Sans'] leading-5 p-0"
              />
            </div>
            {errorMsg && (
              <div className="self-stretch text-ds-error text-xs font-normal font-['DM_Sans'] leading-4">
                {errorMsg}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="self-stretch py-2 flex flex-col justify-start items-start gap-2">
          <div className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
            Enter code
          </div>
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <div className="self-stretch pb-1 border-b border-ds-border flex justify-between items-center gap-2">
              <input
                type="text"
                maxLength={6}
                autoFocus
                disabled={verifyEmailMutation.isPending || verifyRecoveryEmailMutation.isPending || (isNewEmailSuccess && !errorMsg)}
                value={newEmailCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setNewEmailCode(val);
                  setErrorMsg('');
                  if (val.length === 6) {
                    if (isPrimary) {
                      verifyEmailMutation.mutate(
                        { otp: val },
                        {
                          onSuccess: () => {
                            toast.success('Code verified');
                          },
                          onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to verify new email'))
                        }
                      );
                    } else if (isRecovery) {
                      verifyRecoveryEmailMutation.mutate(
                        { otp: val },
                        {
                          onSuccess: () => {
                            toast.success('Code verified');
                          },
                          onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to verify recovery email'))
                        }
                      );
                    }
                  }
                }}
                placeholder="000000"
                className="w-full bg-transparent border-none outline-none text-ds-text-primary placeholder:text-ds-text-muted text-sm font-normal font-['DM_Sans'] leading-5 p-0 tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {isNewEmailSuccess && !errorMsg && (
                <CheckCircle2 className="w-4 h-4 text-ds-success shrink-0" />
              )}
            </div>
            {errorMsg && (
              <div className="self-stretch text-ds-error text-xs font-normal font-['DM_Sans'] leading-4">
                {errorMsg}
              </div>
            )}
            {/* Resend — use invisible instead of unmounting to prevent layout shift */}
            <div className={`self-stretch flex justify-start items-center ${isNewEmailSuccess ? 'invisible' : ''}`}>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isNewEmailSuccess}
                className={`text-xs font-normal font-['DM_Sans'] leading-4 p-0 bg-transparent border-none ${
                  countdown > 0 || isNewEmailSuccess
                    ? 'text-ds-text-muted cursor-default'
                    : 'text-ds-accent hover:opacity-80 transition-opacity no-underline hover:no-underline cursor-pointer'
                }`}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-80 p-3 bg-ds-bg border border-ds-border rounded-2xl flex flex-col justify-start items-center gap-4 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 select-none">
        <div className="self-stretch flex flex-col justify-start items-center gap-2">
          <h2 className="text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 m-0 text-center">
            {getTitle()}
          </h2>
          <p className="self-stretch text-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 m-0">
            {getSubtitle()}
          </p>
          {renderContent()}
        </div>

        <div className="w-full inline-flex justify-center items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleNext}
            disabled={getIsDisabled()}
            className={`w-[94px] h-[36px] rounded-full flex justify-center items-center transition-all text-base font-medium font-['DM_Sans'] leading-6 ${
              getIsDisabled()
                ? 'bg-ds-surface-2 text-ds-text-muted cursor-not-allowed'
                : isDelete
                ? 'bg-ds-error hover:opacity-90 text-white cursor-pointer ds-focus-ring'
                : 'bg-ds-accent hover:opacity-90 text-ds-text-primary cursor-pointer ds-focus-ring'
            }`}
          >
            {getButtonText()}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-[94px] h-[36px] rounded-full border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center transition-colors text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 cursor-pointer ds-focus-ring"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
