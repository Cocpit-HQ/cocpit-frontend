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

  const entityLabel = activeProfile.entityType === 'INSTITUTION' ? 'institution' : 'business';
  const isDeactivated = accountData?.isDeactivated;

  const handleAction = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (isDeactivated) {
        await reactivateOrganization(activeProfile.id);
        toast.success(`Your ${entityLabel} account has been reactivated`);
        await refetch();
        onClose();
      } else {
        await deactivateOrganization(activeProfile.id);
        toast.success(`Your ${entityLabel} account has been deactivated`);
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
      <div className="relative flex flex-col items-center bg-white rounded-3xl p-4 w-[450px] max-w-full shadow-lg h-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#FF6B6B] hover:opacity-80 transition-opacity"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title & Description */}
        <div className="flex flex-col items-center gap-2 mb-4 w-full px-2 mt-2">
          <h2 className="text-black text-lg font-medium font-['Poppins'] leading-6 text-center m-0">
            {isDeactivated ? 'Reactivate' : 'Deactivate'} {entityLabel} page?
          </h2>
          <p className="text-gray-500 text-sm font-normal font-['Poppins'] leading-5 text-center m-0 px-2">
            {isDeactivated 
              ? `Your ${entityLabel} page will become visible again to everyone.` 
              : `Your account will be deactivated. You can reactivate it anytime from the “Organization” tab under your account Settings. Your profile, followers, posts, and data will be retained and restored when you reactivate your account`}
          </p>
        </div>

        {errorMsg && <p className="text-sm text-red-500 mb-2">{errorMsg}</p>}

        {/* Action Buttons */}
        <div className="inline-flex justify-center items-center gap-4 w-full mt-4 mb-2">
          <button 
            onClick={onClose} 
            className="w-36 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-blue-600 flex justify-center items-center gap-2.5 cursor-pointer hover:bg-blue-50 transition-colors"
          >
            <span className="text-center text-blue-600 text-sm font-normal leading-5">Cancel</span>
          </button>
          
          <button 
            onClick={handleAction} 
            disabled={isLoading}  
            className={`w-36 h-10 px-4 py-2 rounded-3xl outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-2.5 transition-colors ${
              isLoading 
                ? 'bg-red-300 text-white cursor-not-allowed outline-transparent' 
                : (isDeactivated 
                    ? 'bg-blue-600 text-white outline-white hover:bg-blue-700 cursor-pointer' 
                    : 'bg-red-500 text-white outline-white hover:bg-red-600 cursor-pointer')
            }`}
          >
            <span className="text-center text-white text-sm font-normal leading-5">
              {isLoading ? (isDeactivated ? "Reactivating..." : "Deactivating...") : (isDeactivated ? "Reactivate" : "Deactivate")}
            </span>
          </button>
        </div>
        
      </div>
    </div>
  );
}
