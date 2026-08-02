"use client";

import React, { useState, useEffect } from 'react';
import { X, BadgeCheck, XCircle } from 'lucide-react';

import { useSetPhone, useConfirmPhone, useDeletePhone } from '../../../../hooks/useAccountSettings';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ManagePhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'change' | 'delete';
}

export function ManagePhoneModal({ isOpen, onClose, mode }: ManagePhoneModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && step === 2) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  useEffect(() => {
    if (step === 2) {
      setCountdown(30);
    }
  }, [step]);
  
  const queryClient = useQueryClient();
  const setPhoneMutation = useSetPhone();
  const confirmPhoneMutation = useConfirmPhone();
  const deletePhoneMutation = useDeletePhone();

  if (!isOpen) return null;

  const isDelete = mode === 'delete';

  const handleNext = () => {
    if (isDelete) {
      deletePhoneMutation.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['userAccount'] });
          toast.success('Phone number removed successfully');
          onClose();
        },
        onError: (err: any) => {
          setErrorMsg(err?.response?.data?.message || 'Failed to remove phone number');
        }
      });
      return;
    }

    setErrorMsg('');

    if (step === 1) {
      const digitCount = phone.replace(/\D/g, '').length;
      if (digitCount < 10) {
        setErrorMsg('Please enter a valid phone number.');
        return;
      }
      
      setPhoneMutation.mutate(
        { phone },
        {
          onSuccess: () => {
            setStep(2);
            setCode('');
          },
          onError: (err: any) => {
            setErrorMsg(err?.response?.data?.message || 'Failed to send verification code');
          }
        }
      );
    } else if (step === 2) {
      confirmPhoneMutation.mutate(
        { otp: code },
        {
          onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['userAccount'] });
            toast.success(data.message || 'Phone number updated successfully');
            setTimeout(() => handleClose(), 1000);
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
      { phone },
      {
        onError: (err: any) => {
          setErrorMsg(err?.response?.data?.message || 'Failed to resend verification code');
        }
      }
    );
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setPhone('');
      setCode('');
      setErrorMsg('');
    }, 300);
  };

  const getTitle = () => {
    if (isDelete) return 'Remove this phone number from your account?';
    if (step === 1) return 'Enter phone number';
    return 'Verify phone number';
  };

  const getSubtitle = () => {
    if (isDelete) return '';
    if (step === 1) {
      return "Enter a valid phone number. You'll need to verify it before it's added to your account";
    }
    return `A 6-digit verification code has been sent to ${phone}`;
  };

  const getButtonText = () => {
    if (isDelete) return deletePhoneMutation.isPending ? 'Removing...' : 'Remove';
    if (step === 1) return setPhoneMutation.isPending ? 'Sending...' : 'Continue';
    return confirmPhoneMutation.isPending ? 'Saving...' : 'Save';
  };

  const renderContent = () => {
    if (isDelete) return null;

    if (step === 1) {
      return (
        <div className="flex flex-col items-start gap-2 w-full">
          <label className="text-[14px] font-normal text-black">Phone number</label>
          <input 
            type="tel"
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length > 10) {
                setErrorMsg('Phone number cannot exceed 10 digits.');
                return;
              }
              setPhone(val);
              setErrorMsg('');
            }}
            placeholder="1234567890"
            className={`w-full h-[48px] px-4 bg-white border ${errorMsg ? 'border-[#FF6B6B]' : 'border-[#DADADA]'} rounded-[24px] text-[16px] text-black focus:outline-none focus:border-[#6366F1] transition-colors`}
          />
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="flex flex-col items-start gap-2 w-full">
          <label className="text-[14px] font-normal text-black">Enter code</label>
          <div className="relative w-full">
            <input 
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setCode(val);
                setErrorMsg('');
                if (val.length === 6) {
                  confirmPhoneMutation.mutate(
                    { otp: val },
                    {
                      onSuccess: (data) => {
                        queryClient.invalidateQueries({ queryKey: ['userAccount'] });
                        toast.success(data.message || 'Phone number updated successfully');
                        setTimeout(() => handleClose(), 1000);
                      },
                      onError: (err: any) => setErrorMsg(err?.response?.data?.message || 'Invalid code')
                    }
                  );
                }
              }}
              placeholder="000000"
              className={`w-full h-[48px] px-4 bg-white border ${errorMsg ? 'border-[#FF6B6B] focus:border-[#FF6B6B]' : confirmPhoneMutation.isSuccess ? 'border-[#4ADE80] focus:border-[#4ADE80]' : 'border-[#DADADA] focus:border-[#6366F1]'} rounded-[24px] text-[16px] text-black focus:outline-none transition-colors`}
            />
            {confirmPhoneMutation.isSuccess && !errorMsg && (
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
  };

  const isValidCode = code.length === 6;

  const getIsDisabled = () => {
    if (isDelete) return deletePhoneMutation.isPending;
    if (step === 1) return !phone || setPhoneMutation.isPending;
    if (step === 2) return !isValidCode || confirmPhoneMutation.isPending;
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
            {getSubtitle() && (
              <p className={`${isDelete ? 'text-[13px] text-[#9CA3AF]' : 'text-[14px] text-[#6B7280]'} font-normal leading-[20px]`}>
                {getSubtitle()}
              </p>
            )}
          </div>

          {renderContent()}

          {errorMsg && (
            <p className="text-[13px] text-[#FF6B6B] w-full text-center mt-2">{errorMsg}</p>
          )}

          <div className="flex flex-row justify-between items-center gap-4 w-full h-[40px] mt-2">
            <button 
              onClick={handleClose}
              className="flex-1 flex items-center justify-center h-[40px] rounded-[24px] border border-[#6366F1] bg-white text-[#6366F1] text-[14px] font-normal transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleNext}
              disabled={getIsDisabled()}
              className={`flex-1 flex items-center justify-center h-[40px] rounded-[24px] border border-white text-white text-[14px] font-normal transition-colors ${isDelete ? 'bg-[#FF6B6B]' : 'bg-[#6366F1]'} disabled:opacity-50`}
            >
              {getButtonText()}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
