"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useAccountSettings, useSetPhone, useConfirmPhone } from '@/features/settings/hooks/useAccountSettings';
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
  const [countryCode, setCountryCode] = useState('+91');

  useEffect(() => {
    if (accountData?.countryCode) {
      setCountryCode(accountData.countryCode);
    }
  }, [accountData?.countryCode]);

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
    }, 200);
  }, [onClose]);

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

  const getIsDisabled = () => {
    if (step === 1) return !phone || setPhoneMutation.isPending;
    if (step === 2) return !isCodeValid || confirmPhoneMutation.isPending;
    return false;
  };

  const handleNext = () => {
    setErrorMsg('');

    if (step === 1) {
      if (phone.length !== requiredLength) {
        setErrorMsg(`Please enter a valid ${requiredLength}-digit phone number.`);
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="flex items-center gap-1 bg-transparent border-none outline-none text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 p-0 cursor-pointer">
                        <ChevronDown className="w-4 h-4 text-ds-text-primary" />
                        {countryCode}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      className="z-[10000] w-auto min-w-[204px] min-h-[80px] !bg-[#030303] !border !border-[#2C2C33] rounded-[8px] p-3 flex flex-col justify-center gap-3 shadow-2xl !outline-none !ring-0" 
                      style={{ backgroundColor: '#030303', borderColor: '#2C2C33' }}
                      align="start" 
                      sideOffset={8}
                    >
                      <DropdownMenuItem 
                        className="cursor-pointer text-ds-text-secondary hover:text-ds-text-primary hover:!bg-transparent p-0 text-sm font-normal font-['DM_Sans'] whitespace-nowrap !outline-none !border-none focus:!bg-transparent focus:text-ds-text-primary !ring-0"
                        onClick={() => {
                          setCountryCode('+91');
                          setErrorMsg('');
                        }}
                      >
                        India (+91)
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer text-ds-text-secondary hover:text-ds-text-primary hover:!bg-transparent p-0 text-sm font-normal font-['DM_Sans'] whitespace-nowrap !outline-none !border-none focus:!bg-transparent focus:text-ds-text-primary !ring-0"
                        onClick={() => {
                          setCountryCode('+971');
                          setErrorMsg('');
                        }}
                      >
                        United Arab Emirates (+971)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <input
                    id="phone-input"
                    type="tel"
                    autoFocus
                    value={phone}
                    maxLength={requiredLength}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '');
                      setPhone(numericValue);
                      if (errorMsg) setErrorMsg('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !getIsDisabled()) handleNext();
                    }}
                    placeholder={countryCode === '+971' ? '123456789' : '1234567890'}
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
                    className="w-full bg-transparent border-none outline-none text-ds-text-primary placeholder:text-ds-text-muted text-sm font-normal font-['DM_Sans'] leading-5 p-0 tracking-wider"
                  />
                  {confirmPhoneMutation.isSuccess && !errorMsg && (
                    <CheckCircle2 className="w-4 h-4 text-ds-success shrink-0" />
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
                {/* Hide resend code option after successful phone verification */}
                {!confirmPhoneMutation.isSuccess && (
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
                )}
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
