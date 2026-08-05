"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { deactivateOrganization, reactivateOrganization } from '@/services/api/settings';
import { useCompanyAccountSettings } from '../../../../hooks/useCompanyAccountSettings';
import { toast } from 'sonner';

interface DeactivateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeactivateCompanyModal({ isOpen, onClose }: DeactivateCompanyModalProps) {
  const { activeProfile, switchProfile } = useActiveProfile();
  const { data: accountData, refetch } = useCompanyAccountSettings();
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !activeProfile) return null;

  const entityLabel = activeProfile.entityType === 'INSTITUTION' ? 'institution' : 'company';
  const isDeactivated = accountData?.isDeactivated;

  const handleAction = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (isDeactivated) {
        await reactivateOrganization(activeProfile.id);
        toast.success(`Your ${entityLabel} page has been reactivated`);
        await refetch();
        onClose();
      } else {
        await deactivateOrganization(activeProfile.id);
        toast.success(`Your ${entityLabel} page has been deactivated`);
        onClose();
        // On success, switch back to user context and go to feed since the company is deactivated
        switchProfile("USER", "");
        window.location.href = '/feed';
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || `Failed to ${isDeactivated ? 'reactivate' : 'deactivate'} ${entityLabel}`);
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
            {isDeactivated ? 'Reactivate' : 'Deactivate'} {entityLabel} page
          </h2>
          <p className="text-[14px] font-normal text-[#6B7280] leading-[20px] text-center m-0 px-2">
            {isDeactivated 
              ? `Your ${entityLabel} page will become visible again to everyone.` 
              : `Your ${entityLabel} page will be hidden from cocpit. You can reactivate it at any time.`}
          </p>
        </div>

        {errorMsg && <p className="text-[14px] text-[#FF6B6B] mb-2">{errorMsg}</p>}

        {/* Action Buttons */}
        <div className="flex flex-row justify-center items-center w-[418px] h-[40px] gap-4 mt-4 mb-4">
          <button 
            onClick={onClose} 
            className="flex items-center justify-center w-[140px] h-[40px] rounded-[24px] border border-[#818CF8] bg-white text-[#818CF8] text-[14px] font-normal leading-[20px] transition-colors hover:bg-indigo-50"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleAction} 
            disabled={isLoading}  
            className={`flex items-center justify-center w-[140px] h-[40px] rounded-[24px] text-[14px] font-normal leading-[20px] transition-colors ${
              isLoading ? 'bg-[#FFF6F6] text-[#FF6B6B]/50 border border-transparent cursor-not-allowed' : (isDeactivated ? 'bg-[#1A73E8] text-white hover:opacity-90' : 'bg-[#FF6B6B] text-white hover:opacity-90 border border-white')
            }`}
          >
            {isLoading ? (isDeactivated ? "Reactivating..." : "Deactivating...") : (isDeactivated ? "Reactivate" : "Deactivate")}
          </button>
        </div>
        
      </div>
    </div>
  );
}
