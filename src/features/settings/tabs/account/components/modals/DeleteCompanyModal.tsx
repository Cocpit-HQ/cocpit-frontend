"use client";

import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  if (!isOpen || !activeProfile) return null;

  const entityLabel = activeProfile.entityType === 'INSTITUTION' ? 'institution' : 'company';

  const handleDelete = async () => {
    if (!password.trim()) {
      setErrorMsg("Password is required to delete your account");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      await companyService.deleteCompany(activeProfile.id, password);
      toast.success(`Your ${entityLabel} has been deleted`);
      onClose();
      // On success, switch back to user context and go to feed
      switchProfile("USER", "");
      router.push('/feed');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || `Failed to delete ${entityLabel}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm font-poppins">
      <div className="relative flex flex-col items-center bg-white rounded-[24px] p-4 w-[450px] max-w-full shadow-lg h-auto pb-2">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#FF6B6B] hover:opacity-80 transition-opacity"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title & Description */}
        <div className="flex flex-col items-center gap-2 mb-4 w-[418px] mt-2">
          <h2 className="text-[18px] font-medium text-black leading-[26px] text-center m-0">
            Delete your Cocpit {entityLabel}
          </h2>
          <p className="text-[14px] font-normal text-[#6B7280] leading-[20px] text-center m-0 px-2">
            Your {entityLabel} account will be removed from cocpit.io. You can't undo this action and all associated data will be permanently removed.
          </p>
        </div>

        {errorMsg && <p className="text-[14px] text-[#FF6B6B] mb-2">{errorMsg}</p>}

        <div className="w-[418px] mb-4">
          <p className="text-[14px] font-medium text-black mb-2">Please enter your password to confirm:</p>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-2.5 rounded-[12px] border border-[#E5E7EB] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#818CF8]"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[10px] text-[#6B7280] hover:text-black"
            >
              {showPassword ? <EyeOff className="w-[20px] h-[20px]" /> : <Eye className="w-[20px] h-[20px]" />}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row justify-center items-center w-[418px] h-[40px] gap-4 mt-2 mb-4">
          <button 
            onClick={onClose} 
            className="flex items-center justify-center w-[140px] h-[40px] rounded-[24px] border border-[#818CF8] bg-white text-[#818CF8] text-[14px] font-normal leading-[20px] transition-colors hover:bg-indigo-50"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleDelete}
            disabled={isLoading || !password.trim()}
            className={`flex items-center justify-center w-[140px] h-[40px] rounded-[24px] text-[14px] font-normal leading-[20px] transition-colors ${
              (isLoading || !password.trim()) ? 'bg-[#FFF6F6] text-[#FF6B6B]/50 border border-transparent cursor-not-allowed' : 'bg-[#FF6B6B] text-white hover:opacity-90 border border-white'
            }`}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
        
      </div>
    </div>
  );
}
