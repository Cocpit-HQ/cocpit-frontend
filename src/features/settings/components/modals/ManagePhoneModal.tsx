"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { VerifyIcon } from '@/components/icons';
import { CountryCodeDropdown } from './CountryCodeDropdown';
import { useAccountSettings, useSetPhone, useConfirmPhone } from '@/features/settings/hooks/useAccountSettings';
import { useCompanyAccountSettings } from '@/features/settings/hooks/useCompanyAccountSettings';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ManagePhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'change' | 'delete';
  currentPhone?: string;
}

export function ManagePhoneModal({ isOpen, onClose, mode, currentPhone }: ManagePhoneModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const { data: accountData } = useAccountSettings();
  const { data: companyAccountData } = useCompanyAccountSettings();
  const { isCompany } = useActiveProfile();
  const activeAccountData = isCompany ? companyAccountData : accountData;
  const [countryCode, setCountryCode] = useState(isCompany ? '+971' : '+91');

  useEffect(() => {
    if (activeAccountData?.countryCode) {
      setCountryCode(activeAccountData.countryCode);
    } else if (currentPhone) {
      setCountryCode(currentPhone.length === 9 ? '+971' : '+91');
    } else {
      setCountryCode(isCompany ? '+971' : '+91');
    }
  }, [activeAccountData?.countryCode, currentPhone, isCompany]);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(30);

  // Single efficient interval timer for OTP countdown
  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown > 0]);

  const queryClient = useQueryClient();
  const setPhoneMutation = useSetPhone();
  const confirmPhoneMutation = useConfirmPhone();

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setPhone('');
      setCode('');
      setErrorMsg('');
      setCountdown(30);
      confirmPhoneMutation.reset();
      setPhoneMutation.reset();
    }, 200);
  }, [onClose, confirmPhoneMutation, setPhoneMutation]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // SSR guard: No extra re-render cycle via useState(mounted)
  if (!isOpen || typeof document === 'undefined') return null;

  const requiredLength = countryCode === '+971' ? 9 : 10;
  const isPhoneValid = phone.length === requiredLength;
  const isCodeValid = code.length === 6;

  const checkIsSameNumber = useCallback((inputPhone: string, code: string) => {
    const existingPhone = (currentPhone || activeAccountData?.phone || '').trim();
    const existingCountryCode = activeAccountData?.countryCode || '+91';
    const reqLen = code === '+971' ? 9 : 10;
    return Boolean(
      existingPhone &&
      inputPhone.trim() === existingPhone &&
      code === existingCountryCode &&
      inputPhone.length === reqLen
    );
  }, [currentPhone, activeAccountData?.phone, activeAccountData?.countryCode]);

  const getIsDisabled = () => {
    if (step === 1) return !isPhoneValid || checkIsSameNumber(phone, countryCode) || setPhoneMutation.isPending;
    if (step === 2) return !confirmPhoneMutation.isSuccess || confirmPhoneMutation.isPending;
    return false;
  };

  const handleNext = () => {
    setErrorMsg('');

    if (step === 1) {
      if (phone.length !== requiredLength) {
        setErrorMsg(`Please enter a valid ${requiredLength}-digit phone number.`);
        return;
      }

      if (checkIsSameNumber(phone, countryCode)) {
        setErrorMsg('This phone number is already linked to your account. Please try adding a different number.');
        return;
      }

      setPhoneMutation.mutate(
        { countryCode, phone },
        {
          onSuccess: () => {
            setStep(2);
            setCode('');
            setCountdown(30);
          },
          onError: (err: any) => {
            setErrorMsg(err?.response?.data?.message || 'Failed to send verification code');
          }
        }
      );
    } else if (step === 2) {
      if (confirmPhoneMutation.isSuccess) {
        queryClient.invalidateQueries({ queryKey: ['userAccount'] });
        queryClient.invalidateQueries({ queryKey: ['companyAccountSettings'] });
        toast.success(mode === 'add' ? 'Phone number added successfully' : 'Phone number updated successfully');
        handleClose();
        return;
      }

      if (code.length !== 6) {
        setErrorMsg('Please enter a 6-digit code');
        return;
      }

      confirmPhoneMutation.mutate(
        { otp: code },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userAccount'] });
            queryClient.invalidateQueries({ queryKey: ['companyAccountSettings'] });
            toast.success(mode === 'add' ? 'Phone number added successfully' : 'Phone number updated successfully');
            handleClose();
          },
          onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Invalid code')
        }
      );
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(30);
    setErrorMsg('');
    confirmPhoneMutation.reset();
    setCode('');
    setPhoneMutation.mutate(
      { countryCode, phone },
      {
        onError: (err: any) => {
          setErrorMsg(err?.response?.data?.message || 'Failed to resend verification code');
        }
      }
    );
  };

  const getButtonText = () => {
    if (step === 1) return setPhoneMutation.isPending ? 'Sending...' : 'Continue';
    if (confirmPhoneMutation.isPending) return 'Verifying...';
    return 'Continue';
  };

  return createPortal(
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-phone-modal-title"
        className="w-[316px] min-h-[220px] p-4 bg-ds-bg border border-ds-border rounded-2xl flex flex-col justify-between items-center shadow-2xl animate-in fade-in zoom-in-95 duration-200 select-none"
      >
        <div className="self-stretch flex flex-col justify-start items-center gap-1">
          <h2 id="manage-phone-modal-title" className="text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 m-0 text-center">
            {step === 1 ? 'Enter your phone number' : 'Verify your phone number'}
          </h2>
          <p className="self-stretch text-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 m-0">
            {step === 1
              ? "Enter a valid number. We'll send a verification code to confirm it"
              : `A 6-digit verification code has been sent to ${countryCode} ${phone}`}
          </p>

          {step === 1 ? (
            <div className="self-stretch py-1 flex flex-col justify-start items-start gap-1.5">
              <label htmlFor="phone-input" className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                Phone number
              </label>
              <div className="self-stretch flex flex-col justify-start items-start gap-1">
                <div className="self-stretch pb-1 border-b border-ds-border flex justify-between items-center gap-2">
                  <CountryCodeDropdown
                    value={countryCode}
                    onChange={(newCode) => {
                      setCountryCode(newCode);
                      if (checkIsSameNumber(phone, newCode)) {
                        setErrorMsg('This phone number is already linked to your account. Please try adding a different number.');
                      } else {
                        setErrorMsg('');
                      }
                    }}
                  />
                  <input
                    id="phone-input"
                    type="tel"
                    autoFocus
                    value={phone}
                    maxLength={requiredLength}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '');
                      setPhone(numericValue);
                      if (checkIsSameNumber(numericValue, countryCode)) {
                        setErrorMsg('This phone number is already linked to your account. Please try adding a different number.');
                      } else if (errorMsg) {
                        setErrorMsg('');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !getIsDisabled()) handleNext();
                    }}
                    placeholder={countryCode === '+971' ? '1234567' : '1234567890'}
                    className="w-full bg-transparent border-none outline-none text-ds-text-primary placeholder:text-ds-text-muted text-sm font-normal font-['DM_Sans'] leading-5 p-0"
                  />
                </div>
                {/* Form layout stability: reserved space prevents shifting */}
                <div className="min-h-[16px] self-stretch flex items-center">
                  {errorMsg && (
                    <span className="text-ds-error text-xs font-normal font-['DM_Sans'] leading-4">
                      {errorMsg}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="self-stretch py-1 flex flex-col justify-start items-start gap-1.5">
              <label htmlFor="code-input" className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                Enter code
              </label>
              <div className="self-stretch flex flex-col justify-start items-start gap-1">
                <div className="self-stretch pb-1 border-b border-ds-border flex justify-between items-center gap-2">
                  <input
                    id="code-input"
                    type="text"
                    maxLength={6}
                    autoFocus
                    disabled={confirmPhoneMutation.isSuccess || confirmPhoneMutation.isPending}
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCode(val);
                      if (errorMsg) setErrorMsg('');
                      if (val.length === 6) {
                        confirmPhoneMutation.mutate(
                          { otp: val },
                          {
                            onSuccess: () => {
                              toast.success('Code verified');
                            },
                            onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Invalid code')
                          }
                        );
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !getIsDisabled()) handleNext();
                    }}
                    placeholder="000000"
                    className="w-full bg-transparent border-none outline-none text-ds-text-primary placeholder:text-ds-text-muted text-sm font-normal font-['DM_Sans'] leading-5 p-0 tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {confirmPhoneMutation.isSuccess && !errorMsg && (
                    <VerifyIcon className="w-5 h-5 shrink-0 text-ds-success" size={20} />
                  )}
                </div>
                {/* Form layout stability: reserved space prevents shifting */}
                <div className="min-h-[16px] self-stretch flex items-center">
                  {errorMsg && (
                    <span className="text-ds-error text-xs font-normal font-['DM_Sans'] leading-4">
                      {errorMsg}
                    </span>
                  )}
                </div>
                {/* Resend — use invisible instead of unmounting to prevent layout shift */}
                <div className={`self-stretch flex justify-start items-center ${confirmPhoneMutation.isSuccess ? 'invisible' : ''}`}>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0 || confirmPhoneMutation.isSuccess}
                    className={`text-xs font-normal font-['DM_Sans'] leading-4 p-0 bg-transparent border-none ${
                      countdown > 0 || confirmPhoneMutation.isSuccess
                        ? 'text-ds-text-muted cursor-default'
                        : 'text-ds-accent hover:opacity-80 transition-opacity no-underline hover:no-underline cursor-pointer'
                    }`}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full inline-flex justify-center items-center gap-2 pt-0">
          <button
            type="button"
            onClick={handleNext}
            disabled={getIsDisabled()}
            className={`h-[36px] min-w-[90px] px-4 py-1.5 rounded-full flex justify-center items-center gap-2.5 transition-all text-base font-medium font-['DM_Sans'] leading-6 ${
              getIsDisabled()
                ? 'bg-ds-surface-1 text-ds-text-muted cursor-not-allowed'
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
