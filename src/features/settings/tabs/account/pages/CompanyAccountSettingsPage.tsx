"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { useCompanyAccountSettings } from '../../../hooks/useCompanyAccountSettings';
import { useSettingsStore } from '@/store/settings.store';
import { DeactivateCompanyModal } from '../components/modals/DeactivateCompanyModal';
import { DeleteCompanyModal } from '../components/modals/DeleteCompanyModal';
import { TransferOwnershipModal } from '../components/modals/TransferOwnershipModal';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export function CompanyAccountSettingsPage() {
  const { data, isLoading, entityLabel } = useCompanyAccountSettings();
  const { activeProfile } = useActiveProfile();
  
  const activeModal = useSettingsStore(state => state.companyAccount.activeModal);
  const setModal = useSettingsStore(state => state.setCompanyAccountModal);

  // Transfer ownership needs company ID
  const companyId = activeProfile?.id || '';
  const companyName = activeProfile?.name || 'Company';

  if (isLoading) {
    return (
      <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20 items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start px-4 py-2 gap-4 w-full max-w-[698px] font-poppins relative">
      {/* Header */}
      <div className="flex flex-col items-start w-full">
        <h1 className="text-[24px] font-semibold text-black dark:text-company-text leading-[32px]">Account settings</h1>
        <p className="text-[16px] text-[#6B7280] dark:text-company-secondary leading-[24px]">Manage your account</p>
      </div>

      {/* Credentials */}
      <div className="flex flex-col items-start p-6 gap-2 w-full">
        <h2 className="text-[18px] font-medium text-black dark:text-company-text leading-[26px]">Credentials</h2>
        
        <div className="flex flex-col items-start w-full">
          {/* Email */}
          <div className="flex flex-row justify-between items-center py-3 w-full group">
            <Link href={`/settings/account/email`} className="flex flex-row items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
              <Mail className="w-6 h-6 text-black dark:text-company-text" />
              <div className="flex flex-col justify-center items-start">
                <h3 className="flex items-center h-[24px] font-normal text-[16px] text-black dark:text-company-text leading-[24px]">Manage email</h3>
                <p className="text-[14px] text-[#6B7280] dark:text-company-secondary leading-[20px]">Current: {data.email}</p>
              </div>
            </Link>
            <Link href={`/settings/account/email`}>
              <button className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[169px] h-[40px] bg-white dark:bg-company-card border border-[#1A73E8] dark:border-company-primary rounded-[24px] transition-colors">
                <span className="whitespace-nowrap text-[14px] text-[#1A73E8] dark:text-company-primary leading-[20px] text-center">Change email</span>
              </button>
            </Link>
          </div>

          {/* Phone */}
          <div className="flex flex-row justify-between items-center py-3 w-full border-t border-[#DADADA] dark:border-company-border group">
            <Link href={`/settings/account/phone`} className="flex flex-row items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
              <Phone className="w-6 h-6 text-black dark:text-company-text" />
              <div className="flex flex-col justify-center items-start">
                <h3 className="flex items-center h-[24px] font-normal text-[16px] text-black dark:text-company-text leading-[24px]">Manage phone number</h3>
                <p className="text-[14px] text-[#6B7280] dark:text-company-secondary leading-[20px]">
                  {data.phone ? `Current: ${data.phone}` : "No phone number"}
                </p>
              </div>
            </Link>
            <Link href={`/settings/account/phone`}>
              <button className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[169px] h-[40px] bg-white dark:bg-company-card border border-[#1A73E8] dark:border-company-primary rounded-[24px] transition-colors">
                <span className="whitespace-nowrap text-[14px] text-[#1A73E8] dark:text-company-primary leading-[20px] text-center">
                  {data.phone ? "Change number" : "Add phone number"}
                </span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Deactivate */}
      <div className="flex flex-col justify-center items-center p-6 gap-2.5 w-full">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex flex-col justify-center items-start max-w-[435px]">
            <h3 className="text-[16px] text-black dark:text-company-text leading-[24px]">Deactivate {entityLabel.toLowerCase()} page</h3>
            <p className="text-[14px] text-[#6B7280] dark:text-company-secondary leading-[20px]">
              Temporarily hide your {entityLabel.toLowerCase()} page. You can reactivate it at any time.
            </p>
          </div>
          <button 
            onClick={() => setModal('deactivate')}
            className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[140px] h-[40px] bg-white dark:bg-company-card border border-[#1A73E8] dark:border-company-primary rounded-[24px] transition-colors hover:bg-blue-50 dark:hover:bg-company-light-primary"
          >
            <span className="text-[14px] text-[#1A73E8] dark:text-company-primary leading-[20px] text-center">{data.isDeactivated ? 'Reactivate' : 'Deactivate'}</span>
          </button>
        </div>
      </div>

      {/* Transfer Ownership */}
      <div className="flex flex-col justify-center items-center p-6 gap-2.5 w-full">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex flex-col justify-center items-start max-w-[435px]">
            <h3 className="text-[16px] text-black dark:text-company-text leading-[24px]">Transfer ownership</h3>
            <p className="text-[14px] text-[#6B7280] dark:text-company-secondary leading-[20px]">
              Transfer ownership of this {entityLabel.toLowerCase()} page to another administrator.
            </p>
          </div>
          <button 
            onClick={() => setModal('transfer')}
            className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[140px] h-[40px] bg-white dark:bg-company-card border border-[#1A73E8] dark:border-company-primary rounded-[24px] transition-colors hover:bg-blue-50 dark:hover:bg-company-light-primary"
          >
            <span className="text-[14px] text-[#1A73E8] dark:text-company-primary leading-[20px] text-center">Transfer</span>
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="flex flex-col justify-center items-center p-6 gap-2.5 w-full">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex flex-col justify-center items-start max-w-[435px]">
            <h3 className="text-[16px] text-black dark:text-company-text leading-[24px]">Delete {entityLabel.toLowerCase()} account</h3>
            <p className="text-[14px] text-[#6B7280] dark:text-company-secondary leading-[20px]">
              Permanently delete your {entityLabel.toLowerCase()} page and all associated data.
            </p>
          </div>
          <button 
            onClick={() => setModal('delete')}
            className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[140px] h-[40px] bg-[#EF4444] dark:bg-company-error border border-white dark:border-company-border rounded-[24px] transition-colors hover:opacity-90"
          >
            <span className="text-[14px] text-white leading-[20px] text-center">Delete</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <DeactivateCompanyModal 
        isOpen={activeModal === 'deactivate'} 
        onClose={() => setModal(null)} 
      />
      
      <TransferOwnershipModal 
        isOpen={activeModal === 'transfer'} 
        onClose={() => setModal(null)} 
        companyId={companyId}
        companyName={companyName}
      />
      
      <DeleteCompanyModal 
        isOpen={activeModal === 'delete'} 
        onClose={() => setModal(null)} 
      />
    </div>
  );
}
