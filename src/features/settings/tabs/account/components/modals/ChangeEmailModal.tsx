"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, BadgeCheck, XCircle } from 'lucide-react';
import { 
  useVerifyCurrentEmailInit, 
  useVerifyCurrentEmailConfirm,
  useSubmitNewEmail,
  useSubmitRecoveryEmail,
  useVerifyEmail, 
  useVerifyRecoveryEmail 
} from '../../../../hooks/useAccountSettings';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete?: () => void;
  currentEmail: string;
  mode?: 'primary' | 'recovery' | 'delete';
}

export function ChangeEmailModal({ isOpen, onClose, onConfirmDelete, currentEmail, mode = 'primary' }: ChangeEmailModalProps) {
  const isPrimary = mode === 'primary';
  const isRecovery = mode === 'recovery';
  const isDelete = mode === 'delete';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [newEmail, setNewEmail] = useState('');
  const [currentEmailCode, setCurrentEmailCode] = useState('');
  const [newEmailCode, setNewEmailCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(30);
  const hasInitPrimaryRef = useRef(false);

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
          setErrorMsg(err?.response?.data?.message || 'Failed to send verification code to current email');
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

  if (!isOpen) return null;

  const handleNext = () => {
    if (isDelete) {
      if (onConfirmDelete) onConfirmDelete();
      return;
    }

    setErrorMsg('');

    if (isPrimary) {
      if (step === 1) {
        verifyCurrentEmailConfirm.mutate(
          { otp: currentEmailCode },
          {
            onSuccess: () => setTimeout(() => setStep(2), 1000),
            onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Invalid code')
          }
        );
      } else if (step === 2) {
        if (!newEmail) return setErrorMsg('Please enter a valid email address.');
        submitNewEmail.mutate(
          { newEmail },
          {
            onSuccess: () => setStep(3),
            onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to submit new email')
          }
        );
      } else if (step === 3) {
        verifyEmailMutation.mutate(
          { otp: newEmailCode },
          {
            onSuccess: (data) => {
              queryClient.invalidateQueries({ queryKey: ['userAccount'] });
              toast.success(data.message || 'Email updated successfully');
              setTimeout(() => handleClose(), 1000);
            },
            onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to verify new email')
          }
        );
      }
    } else if (isRecovery) {
      if (step === 1) {
        if (!newEmail) return setErrorMsg('Please enter a valid email address.');
        if (newEmail.toLowerCase() === currentEmail.toLowerCase()) return setErrorMsg('Recovery email cannot match primary email.');
        submitRecoveryEmail.mutate(
          { recoveryEmail: newEmail },
          {
            onSuccess: () => setStep(2),
            onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to submit recovery email')
          }
        );
      } else if (step === 2) {
        verifyRecoveryEmailMutation.mutate(
          { otp: newEmailCode },
          {
            onSuccess: (data) => {
              queryClient.invalidateQueries({ queryKey: ['userAccount'] });
              toast.success(data.message || 'Recovery email updated successfully');
              setTimeout(() => handleClose(), 1000);
            },
            onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to verify recovery email')
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
        onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to resend code')
      });
    } else if (isPrimary && step === 3) {
      submitNewEmail.mutate({ newEmail }, {
        onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to resend code')
      });
    } else if (isRecovery && step === 2) {
      submitRecoveryEmail.mutate({ recoveryEmail: newEmail }, {
        onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to resend code')
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
    if (isPrimary) {
      if (step === 1) return 'Verify email';
      if (step === 2) return 'Enter new email';
      if (step === 3) return 'Verify new email';
    }
    if (isRecovery) {
      if (step === 1) return 'Enter recovery email';
      if (step === 2) return 'Verify new email';
    }
    return 'Change email';
  };

  const getSubtitle = () => {
    if (isDelete) return 'Removing your recovery email may make account recovery more difficult.';
    if (isPrimary) {
      if (step === 1) return `A 6-digit verification code has been sent to ${currentEmail}`;
      if (step === 2) return "Enter a valid email address. You'll need to verify it before the change is applied";
      if (step === 3) return `A 6-digit verification code has been sent to ${newEmail}`;
    }
    if (isRecovery) {
      if (step === 1) return "Enter a valid email address. You'll need to verify it before the change is applied";
      if (step === 2) return `A 6-digit verification code has been sent to ${newEmail}`;
    }
    return '';
  };

  const getButtonText = () => {
    if (isDelete) return 'Remove';
    if (isPrimary) {
      if (step === 1) return verifyCurrentEmailConfirm.isPending ? 'Verifying...' : 'Continue';
      if (step === 2) return submitNewEmail.isPending ? 'Sending code...' : 'Continue';
      if (step === 3) return verifyEmailMutation.isPending ? 'Verifying...' : 'Update email';
    }
    if (isRecovery) {
      if (step === 1) return submitRecoveryEmail.isPending ? 'Sending code...' : 'Continue';
      if (step === 2) return verifyRecoveryEmailMutation.isPending ? 'Verifying...' : 'Verify';
    }
    return 'Continue';
  };

  const isPending = verifyCurrentEmailInit.isPending || verifyCurrentEmailConfirm.isPending || submitNewEmail.isPending || submitRecoveryEmail.isPending || verifyEmailMutation.isPending || verifyRecoveryEmailMutation.isPending;
  const isNewEmailSuccess = (isPrimary && verifyEmailMutation.isSuccess) || (isRecovery && verifyRecoveryEmailMutation.isSuccess);

  const renderContent = () => {
    if (isDelete) return null;

    if (isPrimary && step === 1) {
      return (
        <div className="flex flex-col items-start gap-2 w-full">
          <label className="text-[14px] font-normal text-black">Enter code</label>
          <div className="relative w-full">
            <input 
              type="text"
              maxLength={6}
              value={currentEmailCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setCurrentEmailCode(val);
                setErrorMsg('');
                if (val.length === 6) {
                  verifyCurrentEmailConfirm.mutate(
                    { otp: val },
                    {
                      onSuccess: () => setTimeout(() => setStep(2), 1000),
                      onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Invalid code')
                    }
                  );
                }
              }}
              placeholder="000000"
              className={`w-full h-[48px] px-4 bg-white border ${errorMsg ? 'border-[#FF6B6B] focus:border-[#FF6B6B]' : verifyCurrentEmailConfirm.isSuccess ? 'border-[#4ADE80] focus:border-[#4ADE80]' : 'border-[#DADADA] focus:border-[#6366F1]'} rounded-[24px] text-[16px] text-black focus:outline-none transition-colors`}
            />
            {verifyCurrentEmailConfirm.isSuccess && !errorMsg && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4ADE80]">
                <BadgeCheck className="w-5 h-5" />
              </div>
            )}
            {errorMsg && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF6B6B]">
                <XCircle className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="w-full text-right mt-1">
            <button 
              onClick={handleResend}
              disabled={countdown > 0}
              className={`text-[12px] ${countdown > 0 ? 'text-[#9CA3AF] cursor-not-allowed' : 'text-[#6366F1] hover:underline'}`}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      );
    }

    if ((isPrimary && step === 2) || (isRecovery && step === 1)) {
      return (
        <div className="flex flex-col items-start gap-4 w-full">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[14px] font-normal text-black">Email</label>
            <input 
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="xyz@gmail.com"
              className={`w-full h-[48px] px-4 bg-white border ${errorMsg ? 'border-[#FF6B6B] focus:border-[#FF6B6B]' : 'border-[#DADADA] focus:border-[#6366F1]'} rounded-[24px] text-[16px] text-black focus:outline-none transition-colors`}
            />
          </div>
        </div>
      );
    }

    if ((isPrimary && step === 3) || (isRecovery && step === 2)) {
      return (
        <div className="flex flex-col items-start gap-2 w-full">
          <label className="text-[14px] font-normal text-black">Enter code</label>
          <div className="relative w-full">
            <input 
              type="text"
              maxLength={6}
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
                        onSuccess: (data) => {
                          queryClient.invalidateQueries({ queryKey: ['userAccount'] });
                          toast.success(data.message || 'Email updated successfully');
                          setTimeout(() => handleClose(), 1000);
                        },
                        onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to verify new email')
                      }
                    );
                  } else if (isRecovery && step === 2) {
                    verifyRecoveryEmailMutation.mutate(
                      { otp: val },
                      {
                        onSuccess: (data) => {
                          queryClient.invalidateQueries({ queryKey: ['userAccount'] });
                          toast.success(data.message || 'Recovery email updated successfully');
                          setTimeout(() => handleClose(), 1000);
                        },
                        onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Failed to verify recovery email')
                      }
                    );
                  }
                }
              }}
              placeholder="000000"
              className={`w-full h-[48px] px-4 bg-white border ${errorMsg ? 'border-[#FF6B6B] focus:border-[#FF6B6B]' : isNewEmailSuccess ? 'border-[#4ADE80] focus:border-[#4ADE80]' : 'border-[#DADADA] focus:border-[#6366F1]'} rounded-[24px] text-[16px] text-black focus:outline-none transition-colors`}
            />
            {isNewEmailSuccess && !errorMsg && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4ADE80]">
                <BadgeCheck className="w-5 h-5" />
              </div>
            )}
            {errorMsg && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF6B6B]">
                <XCircle className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="w-full text-right mt-1">
            <button 
              onClick={handleResend}
              disabled={countdown > 0}
              className={`text-[12px] ${countdown > 0 ? 'text-[#9CA3AF] cursor-not-allowed' : 'text-[#6366F1] hover:underline'}`}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const getIsDisabled = () => {
    if (isPrimary) {
      if (step === 1) return currentEmailCode.length !== 6 || verifyCurrentEmailConfirm.isPending;
      if (step === 2) return !newEmail || submitNewEmail.isPending;
      if (step === 3) return newEmailCode.length !== 6 || verifyEmailMutation.isPending;
    }
    if (isRecovery) {
      if (step === 1) return !newEmail || submitRecoveryEmail.isPending;
      if (step === 2) return newEmailCode.length !== 6 || verifyRecoveryEmailMutation.isPending;
    }
    return false;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm font-poppins">
      <div className={`relative flex flex-col items-center p-4 bg-white rounded-[24px] ${isDelete ? 'w-[360px]' : 'w-[450px]'} shadow-lg`}>
        
        {!isDelete && (
          <div className="w-full flex justify-end">
            <button onClick={handleClose} className="p-1">
              <X className="w-5 h-5 text-[#FF6B6B]" />
            </button>
          </div>
        )}

        <div className={`flex flex-col items-center w-full max-w-[360px] gap-4 ${isDelete ? 'mt-4 mb-2' : 'mt-2 mb-4'}`}>
          
          <div className="flex flex-col items-center gap-2 w-full text-center">
            <h2 className={`${isDelete ? 'text-[16px] max-w-[250px]' : 'text-[18px]'} font-medium text-black leading-snug`}>
              {getTitle()}
            </h2>
            <p className={`${isDelete ? 'text-[13px] text-[#9CA3AF]' : 'text-[14px] text-[#6B7280]'} font-normal leading-[20px]`}>
              {getSubtitle()}
            </p>
          </div>

          {renderContent()}

          {errorMsg && (
            <p className="text-[13px] text-[#FF6B6B] w-full text-center mt-2">{errorMsg}</p>
          )}

          <div className="flex flex-row justify-between items-center gap-4 w-full h-[40px] mt-2">
            <button 
              onClick={handleClose}
              className="flex-1 flex items-center justify-center h-[40px] rounded-[24px] border border-[#6366F1] bg-white text-[#6366F1] text-[14px] font-normal"
            >
              Cancel
            </button>
            <button 
              onClick={handleNext}
              disabled={getIsDisabled()}
              className={`flex-1 flex items-center justify-center h-[40px] rounded-[24px] border border-white text-white text-[14px] font-normal ${isDelete ? 'bg-[#FF6B6B]' : 'bg-[#6366F1]'} disabled:opacity-50`}
            >
              {getButtonText()}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
