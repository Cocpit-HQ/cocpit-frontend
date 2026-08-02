"use client";

import React, { useState } from 'react';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUpdatePassword, useLogout } from '../../../hooks/useAccountSettings';

export function ManagePasswordPage() {
  const pathname = usePathname() || '/settings/account-password';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const updatePasswordMutation = useUpdatePassword();

  const handleUpdatePassword = () => {
    setErrorMsg('');
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match");
      return;
    }
    
    updatePasswordMutation.mutate({ currentPassword, newPassword }, {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Show toast or some success state
      },
      onError: (error: any) => {
        setErrorMsg(error?.response?.data?.message || "Failed to update password");
      }
    });
  };


  const logoutMutation = useLogout();
  const router = useRouter();

  const handleForgotPassword = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push('/forgot-password');
      },
      onError: () => {
        // Fallback if logout fails
        router.push('/forgot-password');
      }
    });
  };

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins">
      <div className="w-full p-4 relative flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-row items-center gap-4 mb-8">
          <Link 
            href={`${basePath}/account`} 
            className="flex items-center justify-center w-[40px] h-[40px] rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </Link>
          <div className="flex flex-col">
            <h2 className="text-[18px] font-semibold text-black leading-tight mb-1">Manage password</h2>
            <p className="text-[13px] font-normal text-[#6B7280] leading-tight">Update your security credentials to keep your account safe.</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-4 w-full">
          
          {/* Current Password */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[14px] font-medium text-black">Current password</label>
            <div className="relative w-full">
              <input 
                type={showCurrent ? "text" : "password"} 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full h-[48px] px-4 py-2 bg-white border border-gray-200 rounded-[16px] text-[14px] text-black focus:outline-none focus:border-[#818CF8] placeholder:text-gray-400"
              />
              <button 
                type="button" 
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:opacity-70"
              >
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[14px] font-medium text-black">New password</label>
            <div className="relative w-full">
              <input 
                type={showNew ? "text" : "password"} 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="w-full h-[48px] px-4 py-2 bg-white border border-gray-200 rounded-[16px] text-[14px] text-black focus:outline-none focus:border-[#818CF8] placeholder:text-gray-400"
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:opacity-70"
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <span className="text-[12px] text-[#6B7280] mt-1">*Use at least 8 characters</span>
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
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <span className="text-[12px] text-[#FF6B6B] mt-1">Passwords do not match</span>
            )}
          </div>

          {errorMsg && <p className="text-[14px] text-[#FF6B6B]">{errorMsg}</p>}
          {updatePasswordMutation.isSuccess && <p className="text-[14px] text-green-500">Password updated successfully!</p>}

          {/* Buttons */}
          <div className="flex flex-row justify-end items-center gap-4">
            <button 
              onClick={handleForgotPassword}
              className="flex items-center justify-center h-[40px] px-6 rounded-[24px] border border-[#818CF8] bg-white text-[#818CF8] text-[14px] font-medium transition-colors"
            >
              Forgot password
            </button>
            <button 
              onClick={handleUpdatePassword}
              disabled={updatePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="flex items-center justify-center h-[40px] px-8 rounded-[24px] border border-[#6366F1] bg-[#6366F1] text-white text-[14px] font-medium transition-colors disabled:opacity-50 disabled:border-[#C7D2FE] disabled:bg-[#C7D2FE]"
            >
              {updatePasswordMutation.isPending ? "Updating..." : "Update"}
            </button>
          </div>

        </div>

        {/* Footer Note */}
        <div className="mt-auto pt-16 pb-4 w-full flex justify-center">
          <p className="text-[12px] font-normal text-[#9CA3AF] text-center">
            Note: Changing your password will log you out of all other sessions on all devices for your protection.
          </p>
        </div>

      </div>
    </div>
  );
}
