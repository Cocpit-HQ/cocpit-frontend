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

  const entityLabel = activeProfile.entityType === 'INSTITUTION' ? 'institution' : 'company';

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
      toast.success(`Your ${entityLabel} has been scheduled for deletion`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm font-poppins">
      <div className="relative flex flex-col items-center bg-white rounded-[24px] p-6 w-[450px] max-w-full shadow-lg">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#FF6B6B] hover:opacity-80 transition-opacity"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: Confirmation & Request OTP */}
        {step === 1 && (
          <div className="flex flex-col items-center gap-4 w-full mt-2">
            <div className="flex flex-col items-center gap-2 text-center w-full">
              <h2 className="text-[18px] font-medium text-black leading-snug">
                Delete your Cocpit {entityLabel}
              </h2>
              <p className="text-[14px] font-normal text-[#6B7280] leading-[20px] px-2">
                Your {entityLabel} page will be scheduled for deletion (40-day recovery window). All associated data will be removed. A verification code will be sent to the registered email address.
              </p>
            </div>

            {errorMsg && (
              <p className="text-[13px] text-[#FF6B6B] text-center w-full mt-1">{errorMsg}</p>
            )}

            <div className="flex flex-row justify-between items-center gap-4 w-full h-[40px] mt-4">
              <button 
                onClick={handleClose} 
                className="flex-1 flex items-center justify-center h-[40px] rounded-[24px] border border-[#818CF8] bg-white text-[#818CF8] text-[14px] font-normal transition-colors hover:bg-indigo-50"
              >
                Cancel
              </button>
              
              <button 
                onClick={handleSendOTP}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center h-[40px] rounded-[24px] bg-[#FF6B6B] text-white text-[14px] font-normal transition-colors hover:opacity-90 disabled:opacity-50"
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
          <div className="flex flex-col items-center gap-4 w-full mt-2">
            <div className="flex flex-col items-center gap-2 text-center w-full">
              <h2 className="text-[18px] font-medium text-black leading-snug">
                Verify deletion code
              </h2>
              <p className="text-[14px] font-normal text-[#6B7280] leading-[20px]">
                A 6-digit verification code has been sent to <span className="font-medium text-black">{maskedEmail}</span>
              </p>
            </div>

            {/* OTP Input Field */}
            <div className="flex flex-col items-start gap-2 w-full mt-1">
              <label className="text-[14px] font-normal text-black">Enter code</label>
              <div className="relative w-full">
                <input 
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpCode(val);
                    setErrorMsg('');
                    if (val.length === 6) {
                      handleVerifyAndDelete(val);
                    }
                  }}
                  placeholder="000000"
                  className={`w-full h-[48px] px-4 bg-white border ${
                    errorMsg ? 'border-[#FF6B6B] focus:border-[#FF6B6B]' : isSuccess ? 'border-[#4ADE80] focus:border-[#4ADE80]' : 'border-[#DADADA] focus:border-[#6366F1]'
                  } rounded-[24px] text-[16px] text-black focus:outline-none transition-colors tracking-widest`}
                />
                {isSuccess && !errorMsg && (
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

              {isSuccess && !errorMsg && (
                <p className="text-[13px] text-[#4ADE80] w-full text-left">Code verified successfully. Deleting...</p>
              )}

              {/* Resend Link */}
              <div className="w-full text-right mt-1">
                <button 
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isLoading}
                  className={`text-[12px] ${countdown > 0 || isLoading ? 'text-[#9CA3AF] cursor-not-allowed' : 'text-[#6366F1] hover:underline'}`}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-[13px] text-[#FF6B6B] text-center w-full mt-1">{errorMsg}</p>
            )}

            <div className="flex flex-row justify-between items-center gap-4 w-full h-[40px] mt-2">
              <button 
                onClick={handleClose} 
                className="flex-1 flex items-center justify-center h-[40px] rounded-[24px] border border-[#818CF8] bg-white text-[#818CF8] text-[14px] font-normal transition-colors hover:bg-indigo-50"
              >
                Cancel
              </button>

              <button 
                onClick={() => handleVerifyAndDelete()}
                disabled={isLoading || otpCode.length !== 6}
                className="flex-1 flex items-center justify-center h-[40px] rounded-[24px] bg-[#FF6B6B] text-white text-[14px] font-normal transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </span>
                ) : (
                  "Verify & Delete"
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
