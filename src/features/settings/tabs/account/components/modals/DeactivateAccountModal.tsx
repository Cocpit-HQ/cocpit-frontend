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
      <div className="relative flex flex-col items-center bg-white rounded-[24px] p-4 w-[450px] max-w-full shadow-lg pb-6">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#FF6B6B] hover:opacity-80 transition-opacity"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title & Description */}
        <div className="flex flex-col items-center gap-2 mb-4 w-[418px] mt-2">
          <h2 className="text-[18px] font-medium text-black leading-[26px] text-center m-0">Deactivate your account</h2>
          <p className="text-[14px] font-normal text-[#6B7280] leading-[20px] text-center m-0 px-2">
            Deactivating your account will hide your profile, posts, and comments from other users. 
            {hasCompanyAccount && " Any companies you own will also be deactivated. "}
            You can reactivate your account at any time by logging back in.
          </p>
        </div>

        {errorMsg && <p className="text-[14px] text-[#FF6B6B] mb-2">{errorMsg}</p>}

        <div className="w-[418px] mb-4">
          <input
            type="password"
            className="w-full p-2.5 rounded-[12px] border border-[#E5E7EB] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#818CF8]"
            placeholder="Enter your password to confirm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row justify-center items-center w-[418px] h-[40px] gap-4 mt-4">
          <button 
            onClick={onClose} 
            className="flex items-center justify-center w-[140px] h-[40px] rounded-[24px] border border-[#818CF8] bg-white text-[#818CF8] text-[14px] font-normal leading-[20px] transition-colors hover:bg-indigo-50"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleDeactivate} 
            disabled={!password || deactivateMutation.isPending}  
            className={`flex items-center justify-center w-[140px] h-[40px] rounded-[24px] text-[14px] font-normal leading-[20px] transition-colors ${
              !password ? 'bg-[#FFF6F6] text-[#FF6B6B]/50 border border-transparent cursor-not-allowed' : 'bg-[#FF6B6B] text-white hover:opacity-90 border border-white'
            }`}
          >
            {deactivateMutation.isPending ? "Deactivating..." : "Deactivate"}
          </button>
        </div>
        
      </div>
    </div>
  );
}
