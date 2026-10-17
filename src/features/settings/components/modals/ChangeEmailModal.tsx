"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';
import { maskEmail } from '@/lib/utils';
import {
  useVerifyCurrentEmailInit,
  useVerifyCurrentEmailConfirm,
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [newEmail, setNewEmail] = useState('');
  const [currentEmailCode, setCurrentEmailCode] = useState('');
  const [newEmailCode, setNewEmailCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(30);
  const hasInitPrimaryRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const queryClient = useQueryClient();

  const verifyCurrentEmailInit = useVerifyCurrentEmailInit();
  const verifyCurrentEmailConfirm = useVerifyCurrentEmailConfirm();
  const submitNewEmail = useSubmitNewEmail();
  const submitRecoveryEmail = useSubmitRecoveryEmail();
  const verifyEmailMutation = useVerifyEmail();
  const verifyRecoveryEmailMutation = useVerifyRecoveryEmail();

  useEffect(() => {
    if (isOpen && isPrimary && !hasInitPrimaryRef.current && step === 1) {
      hasInitPrimaryRef.current = true;
      verifyCurrentEmailInit.mutate(undefined, {
        onError: (err: any) => {
          setErrorMsg(getErrorMessage(err, 'Failed to send verification code to current email'));
        }
      });
    }
  }, [isOpen, isPrimary, step, verifyCurrentEmailInit]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && ((isPrimary && (step === 1 || step === 3)) || (isRecovery && step === 2))) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, step, isPrimary, isRecovery]);

  useEffect(() => {
    if ((isPrimary && (step === 1 || step === 3)) || (isRecovery && step === 2)) {
      setCountdown(30);
    }
  }, [step, isPrimary, isRecovery]);

  if (!isOpen || !mounted) return null;

  const handleNext = () => {
    if (isDelete) {
      if (onConfirmDelete) onConfirmDelete();
      return;
    }

    setErrorMsg('');

    if (isPrimary) {
      if (step === 1) {
        if (verifyCurrentEmailConfirm.isSuccess) {
          setStep(2);
          return;
        }
        if (currentEmailCode.length !== 6) {
          return setErrorMsg('Please enter a 6-digit code');
        }
        verifyCurrentEmailConfirm.mutate(
          { otp: currentEmailCode },
          {
            onSuccess: () => {
              toast.success('Code verified');
              setStep(2);
            },
            onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Invalid code'))
          }
        );
      } else if (step === 2) {
        if (!newEmail || !validateEmail(newEmail)) return setErrorMsg('Please enter a valid email address.');
        submitNewEmail.mutate(
          { newEmail },
          {
            onSuccess: () => setStep(3),
            onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to submit new email'))
          }
        );
      } else if (step === 3) {
        if (verifyEmailMutation.isSuccess) {
          queryClient.invalidateQueries({ queryKey: ['userAccount'] });
          if (isCompany) {
            queryClient.invalidateQueries({ queryKey: ['companyAccountSettings'] });
          }
          toast.success('Email updated successfully');
          handleClose();
          return;
        }
        if (newEmailCode.length !== 6) {
          return setErrorMsg('Please enter a 6-digit code');
        }
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
      }
    } else if (isRecovery) {
      if (step === 1) {
        if (!newEmail || !validateEmail(newEmail)) return setErrorMsg('Please enter a valid email address.');
        if (newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase()) return setErrorMsg('Recovery email cannot match primary email.');
        submitRecoveryEmail.mutate(
          { recoveryEmail: newEmail },
          {
            onSuccess: () => setStep(2),
            onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to submit recovery email'))
          }
        );
      } else if (step === 2) {
        if (verifyRecoveryEmailMutation.isSuccess) {
          queryClient.invalidateQueries({ queryKey: ['userAccount'] });
          toast.success('Recovery email updated successfully');
          handleClose();
          return;
        }
        if (newEmailCode.length !== 6) {
          return setErrorMsg('Please enter a 6-digit code');
        }
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
    if (isPrimary && step === 1) {
      verifyCurrentEmailInit.mutate(undefined, {
        onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to resend code'))
      });
    } else if (isPrimary && step === 3) {
      submitNewEmail.mutate({ newEmail }, {
        onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to resend code'))
      });
    } else if (isRecovery && step === 2) {
      submitRecoveryEmail.mutate({ recoveryEmail: newEmail }, {
        onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to resend code'))
      });
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setCurrentEmailCode('');
      setNewEmailCode('');
      setNewEmail('');
      hasInitPrimaryRef.current = false;
      setErrorMsg('');
    }, 300);
  };

  const getTitle = () => {
    if (isDelete) return 'Remove Recovery Email?';
    if (isRecovery && step === 1) return 'Recovery email';
    return 'Verify email';
  };

  const getSubtitle = () => {
    if (isDelete) return 'Removing your recovery email may make account recovery more difficult.';
    if (isPrimary) {
      if (step === 1) return `A 6-digit verification code has been sent to ${maskEmail(currentEmail)}`;
      if (step === 2) return "Enter a valid email address. You'll need to verify it before the change is applied";
      if (step === 3) return `A 6-digit verification code has been sent to ${maskEmail(newEmail)}`;
    }
    if (isRecovery) {
      if (step === 1) return "Enter a valid email address. You'll need to verify it before adding";
      if (step === 2) return `A 6-digit verification code has been sent to ${maskEmail(newEmail)}`;
    }
    return '';
  };

  const getButtonText = () => {
    if (isDelete) return 'Remove';
    if (isPrimary) {
      if (step === 1 && verifyCurrentEmailConfirm.isPending) return 'Verifying...';
      if (step === 2 && submitNewEmail.isPending) return 'Sending...';
      if (step === 3 && verifyEmailMutation.isPending) return 'Verifying...';
    }
    if (isRecovery) {
      if (step === 1 && submitRecoveryEmail.isPending) return 'Sending...';
      if (step === 2 && verifyRecoveryEmailMutation.isPending) return 'Verifying...';
    }
    return 'Continue';
  };

  const isNewEmailSuccess = (isPrimary && verifyEmailMutation.isSuccess) || (isRecovery && verifyRecoveryEmailMutation.isSuccess);

  const getIsDisabled = () => {
    if (isPrimary) {
      if (step === 1) return currentEmailCode.length !== 6 || verifyCurrentEmailConfirm.isPending;
      if (step === 2) return !newEmail || !validateEmail(newEmail) || submitNewEmail.isPending;
      if (step === 3) return newEmailCode.length !== 6 || verifyEmailMutation.isPending;
    }
    if (isRecovery) {
      if (step === 1) return !newEmail || !validateEmail(newEmail) || (newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase()) || submitRecoveryEmail.isPending;
      if (step === 2) return newEmailCode.length !== 6 || verifyRecoveryEmailMutation.isPending;
    }
    return false;
  };

  const renderContent = () => {
    if (isDelete) return null;

    if (isPrimary && step === 1) {
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
                value={currentEmailCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setCurrentEmailCode(val);
                  setErrorMsg('');
                  if (val.length === 6) {
                    verifyCurrentEmailConfirm.mutate(
                      { otp: val },
                      {
                        onSuccess: () => {
                          toast.success('Code verified');
                        },
                        onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Invalid code'))
                      }
                    );
                  }
                }}
                placeholder="000000"
                className="w-full bg-transparent border-none outline-none text-ds-text-primary placeholder:text-ds-text-muted text-sm font-normal font-['DM_Sans'] leading-5 p-0"
              />
              {verifyCurrentEmailConfirm.isSuccess && !errorMsg && (
                <CheckCircle2 className="w-4 h-4 text-ds-success shrink-0" />
              )}
            </div>
            {errorMsg && (
              <div className="self-stretch text-ds-error text-xs font-normal font-['DM_Sans'] leading-4">
                {errorMsg}
              </div>
            )}
            <div className="self-stretch flex justify-start items-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                className={`text-xs font-normal font-['DM_Sans'] leading-4 p-0 bg-transparent border-none ${
                  countdown > 0
                    ? 'text-ds-text-muted cursor-default'
                    : 'text-ds-accent hover:underline cursor-pointer'
                }`}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if ((isPrimary && step === 2) || (isRecovery && step === 1)) {
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

    if ((isPrimary && step === 3) || (isRecovery && step === 2)) {
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
                value={newEmailCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setNewEmailCode(val);
                  setErrorMsg('');
                  if (val.length === 6) {
                    if (isPrimary && step === 3) {
                      verifyEmailMutation.mutate(
                        { otp: val },
                        {
                          onSuccess: () => {
                            toast.success('Code verified');
                          },
                          onError: (err: any) => setErrorMsg(getErrorMessage(err, 'Failed to verify new email'))
                        }
                      );
                    } else if (isRecovery && step === 2) {
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
                className="w-full bg-transparent border-none outline-none text-ds-text-primary placeholder:text-ds-text-muted text-sm font-normal font-['DM_Sans'] leading-5 p-0"
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
            <div className="self-stretch flex justify-start items-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                className={`text-xs font-normal font-['DM_Sans'] leading-4 p-0 bg-transparent border-none ${
                  countdown > 0
                    ? 'text-ds-text-muted cursor-default'
                    : 'text-ds-accent hover:underline cursor-pointer'
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
            className={`h-[36px] min-w-[100px] px-4 py-1.5 rounded-full flex justify-center items-center gap-2.5 transition-all text-base font-medium font-['DM_Sans'] leading-6 ${
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
            className="h-[36px] w-24 px-3 py-1.5 rounded-full border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center gap-2.5 transition-colors text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 cursor-pointer ds-focus-ring"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
