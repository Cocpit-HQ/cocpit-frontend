"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDeactivateAccount } from '../../../../hooks/useAccountSettings';

interface DeactivateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasCompanyAccount?: boolean;
}

export function DeactivateAccountModal({ isOpen, onClose, hasCompanyAccount = false }: DeactivateAccountModalProps) {
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const deactivateMutation = useDeactivateAccount();

  if (!isOpen) return null;

  const handleDeactivate = () => {
    deactivateMutation.mutate({ password }, {
      onSuccess: () => {
        onClose();
        router.push('/?reason=deactivated');
      },
      onError: (err: any) => {
        setErrorMsg(err?.response?.data?.message || 'Failed to deactivate account');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm font-poppins">
      <div className="relative flex flex-col items-center bg-white rounded-[24px] p-4 w-[328px] max-w-full shadow-lg">
        
        {/* Title & Description */}
        <div className="flex flex-col items-center gap-[16px] mb-4 w-[296px] mt-2">
          <h2 className="w-[234px] h-[26px] flex items-center justify-center text-[18px] font-medium text-black leading-[26px] text-center m-0">Deactivate your account?</h2>
          <p className="w-[296px] h-[140px] flex items-center justify-center text-[14px] font-normal text-[#6B7280] leading-[20px] text-center m-0">
            Your profile will be hidden from cocpit. Access to organizations you're associated with will be removed, and organizations you own will be deactivated. Your followers, posts, and data will be retained and restored if you reactivate your account.
          </p>
          <p className="w-[296px] h-[32px] flex items-center justify-center text-[12px] font-medium text-black leading-[16px] text-center m-0">
            You can reactivate your account anytime during the recovery period by logging in again
          </p>
        </div>

        {errorMsg && <p className="text-[14px] text-[#FF6B6B] mb-2">{errorMsg}</p>}

        <div className="w-[296px] mb-4">
          <input
            type="password"
            className="w-full p-2.5 rounded-[12px] border border-[#E5E7EB] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#818CF8]"
            placeholder="Enter your password to confirm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row items-start justify-center w-[296px] h-[40px] gap-[16px]">
          <button 
            onClick={onClose} 
            className="box-border flex flex-row items-center justify-center px-[16px] py-[8px] gap-[10px] w-[140px] h-[40px] rounded-[24px] border border-[#6366F1] bg-[#FFFFFF] text-[#6366F1] transition-colors hover:bg-indigo-50"
          >
            <span className="w-[50px] h-[20px] text-[14px] font-normal leading-[20px] text-center font-['Poppins']">Cancel</span>
          </button>
          
          <button 
            onClick={handleDeactivate} 
            disabled={!password || deactivateMutation.isPending}  
            className={`box-border flex flex-row items-center justify-center px-[16px] py-[8px] gap-[10px] w-[140px] h-[40px] rounded-[24px] transition-colors ${
              !password ? 'bg-[#FFF6F6] text-[#FF6B6B]/50 border border-transparent cursor-not-allowed' : 'bg-[#FF6B6B] text-[#FFFFFF] hover:opacity-90 border border-[#FFFFFF]'
            }`}
          >
            <span className="w-[77px] h-[20px] text-[14px] font-normal leading-[20px] text-center font-['Poppins']">
              {deactivateMutation.isPending ? "Wait..." : "Deactivate"}
            </span>
          </button>
        </div>
        
      </div>
    </div>
  );
}
