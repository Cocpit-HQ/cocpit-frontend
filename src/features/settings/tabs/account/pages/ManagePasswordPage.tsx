"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Clock } from 'lucide-react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';


import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUpdatePassword, useRequestPasswordResetLink, useResetLinkStatus } from '../../../hooks/useAccountSettings';
import { getFirstMissingPasswordRequirement, isPasswordFullyValid } from '@/lib/validators';



export function ManagePasswordPage() {
  const pathname = usePathname() || '/settings/account-password';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';
  const router = useRouter();
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  
  const updatePasswordMutation = useUpdatePassword();
  const requestResetLinkMutation = useRequestPasswordResetLink();
  const { data: resetStatus, refetch: refetchResetStatus } = useResetLinkStatus();

  // Sync active reset link timer from server
  useEffect(() => {
    if (resetStatus?.hasActiveLink && resetStatus?.remainingSeconds > 0) {
      setCooldownSeconds(resetStatus.remainingSeconds);
    }
  }, [resetStatus]);

  // Interval countdown manager
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          refetchResetStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds, refetchResetStatus]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleUpdatePassword = () => {
    setErrorMsg('');
    setResetSuccessMsg('');
    const missingReq = getFirstMissingPasswordRequirement(newPassword);
    if (missingReq) {
      setErrorMsg(missingReq);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMsg("New password must be different from current password.");
      return;
    }

    updatePasswordMutation.mutate({ currentPassword, newPassword }, {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success("Password changed successfully");
        router.push(`${basePath}/account`);
      },
      onError: (error: any) => {
        setErrorMsg(error?.response?.data?.message || "Failed to update password");
      }
    });
  };


  const handleForgotPassword = () => {
    if (cooldownSeconds > 0) return;
    setErrorMsg('');
    setResetSuccessMsg('');
    requestResetLinkMutation.mutate(undefined, {
      onSuccess: (data: any) => {
        setResetSuccessMsg(data?.message || "Password reset link sent to your registered email!");
        setCooldownSeconds(900); // 15 minutes = 900 seconds
        refetchResetStatus();
      },
      onError: (error: any) => {
        setErrorMsg(error?.response?.data?.message || "Failed to send password reset email link");
      }
    });
  };

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins">
      <div className="w-full p-4 relative flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-row items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center justify-center w-[40px] h-[40px] rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-[18px] font-semibold text-black leading-tight mb-1">Manage password</h2>
            <p className="text-[13px] font-normal text-[#6B7280] leading-tight">Update your security credentials to keep your account safe.</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-4 w-full">
          
          {/* Current Password */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[14px] font-medium text-black">Enter your current password</label>
            <div className="relative w-full">
              <input 
                type={showCurrent ? "text" : "password"} 
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errorMsg === "Current password is incorrect") setErrorMsg('');
                }}
                placeholder="Enter current password"
                className={`w-full h-[48px] px-4 py-2 bg-white border ${errorMsg === "Current password is incorrect" ? 'border-[#FF6B6B] focus:border-[#FF6B6B]' : 'border-gray-200 focus:border-[#818CF8]'} rounded-[16px] text-[14px] text-black focus:outline-none placeholder:text-gray-400`}
              />
              <button 
                type="button" 
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:opacity-70"
              >
                {showCurrent ? <Icon icon="fluent:eye-20-regular" className="w-5 h-5 text-gray-500" /> : <Icon icon="fluent:eye-off-20-regular" className="w-5 h-5 text-gray-500" />}
              </button>
            </div>
            {errorMsg === "Current password is incorrect" && (
              <span className="text-[12px] text-[#FF6B6B] mt-1">Current password does not match.</span>
            )}
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[14px] font-medium text-black">New password</label>
            <div className="relative w-full">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorMsg === "New password must be different from current password.") setErrorMsg('');
                }}
                placeholder="Enter your new password"
                maxLength={15}
                className={`w-full h-[48px] px-4 py-2 bg-white border ${newPassword && currentPassword && newPassword === currentPassword ? 'border-[#FF6B6B] focus:border-[#FF6B6B]' : 'border-gray-200 focus:border-[#818CF8]'} rounded-[16px] text-[14px] text-black focus:outline-none placeholder:text-gray-400`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:opacity-70"
              >
                {showNew ? <Icon icon="fluent:eye-20-regular" className="w-5 h-5 text-gray-500" /> : <Icon icon="fluent:eye-off-20-regular" className="w-5 h-5 text-gray-500" />}
              </button>
            </div>
            {newPassword && currentPassword && newPassword === currentPassword ? (
              <span className="text-[12px] text-[#FF6B6B] mt-1">New password must be different from current password.</span>
            ) : null}
            {newPassword && getFirstMissingPasswordRequirement(newPassword) ? (
              <span className="text-[12px] text-[#FF6B6B] mt-1">{getFirstMissingPasswordRequirement(newPassword)}</span>
            ) : null}
          </div>


          {/* Confirm New Password */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[14px] font-medium text-black">Confirm New password</label>
            <div className="relative w-full">
              <input 
                type={showConfirm ? "text" : "password"} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className={`w-full h-[48px] px-4 py-2 bg-white border ${confirmPassword && confirmPassword !== newPassword ? 'border-[#FF6B6B] focus:border-[#FF6B6B]' : 'border-gray-200 focus:border-[#818CF8]'} rounded-[16px] text-[14px] text-black focus:outline-none placeholder:text-gray-400`}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:opacity-70"
              >
                {showConfirm ? <Icon icon="fluent:eye-20-regular" className="w-5 h-5 text-gray-500" /> : <Icon icon="fluent:eye-off-20-regular" className="w-5 h-5 text-gray-500" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <span className="text-[12px] text-[#FF6B6B] mt-1">Passwords do not match.</span>
            )}
          </div>

          {errorMsg &&
            errorMsg !== "Current password is incorrect" &&
            errorMsg !== "Passwords do not match." &&
            errorMsg !== "New password must be different from current password." && (
              <span className="text-[12px] text-[#FF6B6B] mt-1">{errorMsg}</span>
          )}
          {resetSuccessMsg && (
            <span className="text-[12px] text-emerald-600 mt-1">{resetSuccessMsg}</span>
          )}

          {/* Buttons */}
          <div className="flex flex-row justify-end items-center gap-4">
            {cooldownSeconds > 0 ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-[24px] bg-amber-50 border border-amber-200 text-amber-700 text-[13px] font-medium">
                <Clock className="w-4 h-4 animate-pulse text-amber-600" />
                <span>Reset link active ({formatTime(cooldownSeconds)})</span>
              </div>
            ) : (
              <button 
                onClick={handleForgotPassword}
                disabled={requestResetLinkMutation.isPending}
                className="flex items-center justify-center h-[40px] px-6 rounded-[24px] border border-[#818CF8] bg-white text-[#818CF8] text-[14px] font-medium transition-colors disabled:opacity-50 hover:bg-indigo-50"
              >
                {requestResetLinkMutation.isPending ? "Sending link..." : "Forgot password"}
              </button>
            )}
            
            <button 
              onClick={handleUpdatePassword}
              disabled={updatePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword === currentPassword || !isPasswordFullyValid(newPassword)}
              className="flex items-center justify-center h-[40px] px-8 rounded-[24px] border border-[#6366F1] bg-[#6366F1] text-white text-[14px] font-medium transition-colors disabled:opacity-50 disabled:border-[#C7D2FE] disabled:bg-[#C7D2FE]"
            >
              {updatePasswordMutation.isPending ? "Updating..." : "Update"}
            </button>
          </div>

        </div>



      </div>
    </div>
  );
}
