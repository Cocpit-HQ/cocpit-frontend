"use client";

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

import { useQueryClient } from '@tanstack/react-query';
import { ChangeEmailModal } from '../components/modals/ChangeEmailModal';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useAccountSettings, useDeleteRecoveryEmail } from '../../../hooks/useAccountSettings';

export function ManageEmailPage() {
  const pathname = usePathname() || '/settings/account-email';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [isAddRecoveryModalOpen, setIsAddRecoveryModalOpen] = useState(false);
  const [isDeleteRecoveryModalOpen, setIsDeleteRecoveryModalOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: accountData } = useAccountSettings();
  const deleteRecoveryEmailMutation = useDeleteRecoveryEmail();
  const { isCompany } = useActiveProfile();
  const isOrg = isCompany;

  const userEmail = accountData?.primaryEmail || "";
  const recoveryEmail = accountData?.recoveryEmail || "";
  const hasRecovery = !!accountData?.recoveryEmail && accountData.recoveryEmail.trim() !== "";

  const handleDeleteRecoveryEmail = () => {
    deleteRecoveryEmailMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['userAccount'] });
        setIsDeleteRecoveryModalOpen(false);
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
            <h2 className="text-[18px] font-semibold text-black leading-tight mb-1">Manage email</h2>
            <p className="text-[13px] font-normal text-[#6B7280] leading-tight">Update your security credentials to keep your account safe.</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-8 w-full">
          
          {/* Primary Email */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[14px] font-medium text-black">Primary email</label>
            <input 
              type="text" 
              value={userEmail}
              disabled
              className="w-full h-[48px] px-4 py-2 bg-white border border-gray-200 rounded-[16px] text-[14px] text-black focus:outline-none focus:border-[#818CF8]"
            />
            <div className="flex justify-end mt-2">
              <button 
                onClick={() => setIsChangeEmailModalOpen(true)}
                className="flex items-center justify-center h-[40px] px-8 rounded-[24px] bg-[#6366F1] border border-white text-white text-[14px] font-normal transition-colors"
              >
                Change email
              </button>
            </div>
          </div>

          {/* Recovery Email - User Accounts Only */}
          {!isOrg && (
            <div className="flex flex-col gap-2 w-full">
              <label className="text-[14px] font-medium text-black">Recovery email</label>
            
            {!hasRecovery ? (
              <>
                <p className="text-[13px] text-[#6B7280] leading-snug">
                  A recovery email helps you regain access to your account if you lose access to your primary email. Adding one provides an extra layer of security and makes account recovery faster and easier.
                </p>
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={() => setIsAddRecoveryModalOpen(true)}
                    className="flex items-center justify-center h-[40px] px-6 rounded-[24px] border border-[#818CF8] bg-white text-[#818CF8] text-[14px] font-medium transition-colors"
                  >
                    Add recovery email
                  </button>
                </div>
              </>
            ) : (
              <>
                <input 
                  type="text" 
                  value={recoveryEmail}
                  disabled
                  className="w-full h-[48px] px-4 py-2 bg-white border border-gray-200 rounded-[16px] text-[14px] text-black focus:outline-none focus:border-[#818CF8]"
                />
                <div className="flex justify-end gap-4 mt-2">
                  <button 
                    onClick={() => setIsDeleteRecoveryModalOpen(true)}
                    className="flex items-center justify-center h-[40px] px-6 rounded-[24px] border border-[#FF6B6B] bg-white text-[#FF6B6B] text-[14px] font-medium transition-colors hover:bg-red-50"
                  >
                    Remove
                  </button>
                  <button 
                    onClick={() => setIsChangeEmailModalOpen(true)}
                    className="flex items-center justify-center h-[40px] px-8 rounded-[24px] bg-[#6366F1] border border-white text-white text-[14px] font-normal transition-colors"
                  >
                    Change email
                  </button>
                </div>
              </>
            )}
          </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-auto pt-16 pb-4 w-full flex justify-center">
          <p className="text-[12px] font-normal text-[#9CA3AF] text-center max-w-[600px] leading-snug">
            Note: Verification ensures that you own the new email address. After updating, all notifications and login requests will be sent to the new address. Your old email will no longer be associated with this Cocpit account.
          </p>
        </div>

      </div>

      {isChangeEmailModalOpen && (
        <ChangeEmailModal 
          isOpen={isChangeEmailModalOpen} 
          onClose={() => setIsChangeEmailModalOpen(false)} 
          currentEmail={userEmail}
        />
      )}
      
      {isAddRecoveryModalOpen && (
        <ChangeEmailModal 
          isOpen={isAddRecoveryModalOpen}
          onClose={() => setIsAddRecoveryModalOpen(false)}
          currentEmail={userEmail}
          mode="recovery"
        />
      )}

      {isDeleteRecoveryModalOpen && (
        <ChangeEmailModal 
          isOpen={isDeleteRecoveryModalOpen}
          onClose={() => setIsDeleteRecoveryModalOpen(false)}
          onConfirmDelete={handleDeleteRecoveryEmail}
          currentEmail={recoveryEmail}
          mode="delete"
        />
      )}
    </div>
  );
}
