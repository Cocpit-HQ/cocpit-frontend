"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KeyRound, Mail, Phone, LogOut } from 'lucide-react';
import { LogoutModal } from '../components/modals/LogoutModal';
import { DeleteAccountModal } from '../components/modals/DeleteAccountModal';
import { DeactivateAccountModal } from '../components/modals/DeactivateAccountModal';
import { useAccountSettings } from '../../../hooks/useAccountSettings';
import { useSettingsStore } from '@/store/settings.store';

export function AccountSettingsPage() {
  // UI-only state (which modal is open) now lives in the shared settings
  // store instead of local useState — see src/store/settings.store.ts for why.
  const activeModal = useSettingsStore((state) => state.account.activeModal);
  const setActiveModal = useSettingsStore((state) => state.setAccountModal);

  const pathname = usePathname() || '/settings/account';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const { data: accountData, isLoading } = useAccountSettings();

  // Use API data
  const userEmail = accountData?.primaryEmail || "";
  const hasPhone = !!accountData?.phone && accountData.phone.trim() !== "";
  const phoneNumber = accountData?.phone;
  const hasCompanyAccount = accountData?.hasCompanyAccount ?? true;

  return (
    <div className="flex flex-col items-start px-4 py-2 gap-4 w-full max-w-[698px] font-poppins">
      {/* Header */}
      <div className="flex flex-col items-start w-full">
        <h1 className="text-[24px] font-semibold text-black leading-[32px]">Account settings</h1>
        <p className="text-[16px] text-[#6B7280] leading-[24px]">Manage your account settings</p>
      </div>

      {/* Credentials */}
      <div className="flex flex-col items-start p-6 gap-2 w-full">
        <h2 className="text-[18px] font-medium text-black leading-[26px]">Credentials</h2>
        
        <div className="flex flex-col items-start w-full">
          {/* Password */}
          <div className="flex flex-row justify-between items-center py-3 w-full group">
            <Link href={`${basePath}/account-password`} className="flex flex-row items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
              <KeyRound className="w-6 h-6 text-black" />
              <div className="flex flex-col justify-center items-start">
                <h3 className="flex items-center w-[150px] h-[24px] font-normal text-[16px] text-black leading-[24px]">Manage password</h3>
                <p className="text-[14px] text-[#6B7280] leading-[20px]">Update your login credentials</p>
              </div>
            </Link>
            <Link href={`${basePath}/account-password`}>
              <button className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[169px] h-[40px] bg-white border border-[#818CF8] rounded-[24px] transition-colors">
                <span className="whitespace-nowrap text-[14px] text-[#818CF8] leading-[20px] text-center">Reset password</span>
              </button>
            </Link>
          </div>

          {/* Email */}
          <div className="flex flex-row justify-between items-center py-3 w-full border-t border-[#DADADA] group">
            <Link href={`${basePath}/account-email`} className="flex flex-row items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
              <Mail className="w-6 h-6 text-black" />
              <div className="flex flex-col justify-center items-start">
                <h3 className="flex items-center h-[24px] font-normal text-[16px] text-black leading-[24px]">Manage email</h3>
                <p className="text-[14px] text-[#6B7280] leading-[20px]">Current: {userEmail}</p>
              </div>
            </Link>
            <Link href={`${basePath}/account-email`}>
              <button className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[169px] h-[40px] bg-white border border-[#818CF8] rounded-[24px] transition-colors">
                <span className="whitespace-nowrap text-[14px] text-[#818CF8] leading-[20px] text-center">Change email</span>
              </button>
            </Link>
          </div>

          {/* Phone */}
          <div className="flex flex-row justify-between items-center py-3 w-full border-t border-[#DADADA] group">
            <Link href={`${basePath}/account-phone`} className="flex flex-row items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
              <Phone className="w-6 h-6 text-black" />
              <div className="flex flex-col justify-center items-start">
                <h3 className="flex items-center h-[24px] font-normal text-[16px] text-black leading-[24px]">Manage phone number</h3>
                <p className="text-[14px] text-[#6B7280] leading-[20px]">
                  {hasPhone ? phoneNumber : "No phone number"}
                </p>
              </div>
            </Link>
            <Link href={`${basePath}/account-phone`}>
              <button className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[169px] h-[40px] bg-white border border-[#818CF8] rounded-[24px] transition-colors">
                <span className="whitespace-nowrap text-[14px] text-[#818CF8] leading-[20px] text-center">
                  {hasPhone ? "Change number" : "Add phone number"}
                </span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Session */}
      <div className="flex flex-col items-start p-6 gap-2 w-full">
        <h2 className="text-[18px] font-medium text-black leading-[26px]">Session</h2>
        
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex flex-col justify-center items-start">
            <h3 className="text-[16px] text-black leading-[24px]">Logout</h3>
            <p className="text-[14px] text-[#6B7280] leading-[20px]">
              Sign out of your current session on this device
            </p>
          </div>
          <button 
            onClick={() => setActiveModal('logout')}
            className="flex flex-row justify-center items-center pl-4 pr-3 py-2 gap-1 w-[120px] h-[40px] rounded-[24px] transition-colors"
          >
            <LogOut className="w-6 h-6 text-[#FF6B6B]" />
            <span className="text-[16px] text-[#FF6B6B] leading-[24px]">Log out</span>
          </button>
        </div>
      </div>

      {/* Deactivate Account */}
      <div className="flex flex-col justify-center items-center p-6 gap-2.5 w-full border-t border-[#DADADA]">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex flex-col justify-center items-start max-w-[435px]">
            <h3 className="text-[16px] text-black leading-[24px]">Deactivate account</h3>
            <p className="text-[14px] text-[#6B7280] leading-[20px]">
              Temporarily hide your profile, posts, and comments. You can reactivate by logging back in.
            </p>
          </div>
          <button 
            onClick={() => setActiveModal('deactivate')}
            className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[113px] h-[40px] bg-white border border-[#FF6B6B] rounded-[24px] transition-colors hover:bg-red-50"
          >
            <span className="text-[14px] text-[#FF6B6B] leading-[20px] text-center">Deactivate</span>
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="flex flex-col justify-center items-center p-6 gap-2.5 w-full">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex flex-col justify-center items-start max-w-[435px]">
            <h3 className="text-[16px] text-black leading-[24px]">Delete account</h3>
            <p className="text-[14px] text-[#6B7280] leading-[20px]">
              Permanently remove all your data, portfolios, and professional network connections. This action cannot be undone.
            </p>
          </div>
          <button 
            onClick={() => setActiveModal('delete')}
            className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[113px] h-[40px] bg-[#FF6B6B] border border-white rounded-[24px] transition-colors"
          >
            <span className="text-[14px] text-white leading-[20px] text-center">Delete</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <LogoutModal 
        isOpen={activeModal === 'logout'} 
        onClose={() => setActiveModal(null)} 
      />
      <DeleteAccountModal 
        isOpen={activeModal === 'delete'} 
        onClose={() => setActiveModal(null)}
        hasCompanyAccount={hasCompanyAccount}
      />
      <DeactivateAccountModal 
        isOpen={activeModal === 'deactivate'} 
        onClose={() => setActiveModal(null)}
        hasCompanyAccount={hasCompanyAccount}
      />
    </div>
  );
}
