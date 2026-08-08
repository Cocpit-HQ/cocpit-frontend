"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KeyRound, Mail, Phone, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="flex flex-col items-start px-0 md:px-4 py-2 gap-6 w-full max-w-[698px] font-poppins pb-24">
      {/* Header */}
      <div className="flex flex-row items-center md:items-start gap-4 w-full px-4 md:px-0">
        <button 
          onClick={() => window.history.back()} 
          className="md:hidden flex justify-center items-center p-2 w-[48px] h-[48px] border border-[#DADADA] rounded-[100px] backdrop-blur-[12px] shrink-0"
        >
          <ChevronLeft className="w-6 h-6 text-[#6B7280]" strokeWidth={1.5} />
        </button>
        <div className="flex flex-col items-start w-full">
          <h1 className="text-[18px] md:text-[24px] font-medium md:font-semibold text-black leading-[26px] md:leading-[32px]">Account settings</h1>
          <p className="text-[12px] md:text-[16px] text-[#6B7280] leading-[16px] md:leading-[24px]">Manage your account settings</p>
        </div>
      </div>

      {/* Credentials */}
      <div className="flex flex-col items-start px-4 md:px-6 gap-2 w-full">
        <h2 className="text-[18px] font-medium text-black leading-[26px]">Credentials</h2>
        
        <div className="flex flex-col items-start w-full">
          {/* Password */}
          <div className="flex flex-row justify-between items-center py-3 w-full group">
            <Link href={`${basePath}/account-password`} className="flex flex-row items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity flex-1">
              <KeyRound className="w-6 h-6 text-black shrink-0" />
              <div className="flex flex-col justify-center items-start">
                <h3 className="flex items-center h-[24px] font-normal text-[16px] text-black leading-[24px]">Manage password</h3>
                <p className="text-[14px] text-[#6B7280] leading-[20px]">Update your login credentials</p>
              </div>
            </Link>
            <Link href={`${basePath}/account-password`} className="hidden md:block">
              <button className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[169px] h-[40px] bg-white border border-[#818CF8] rounded-[24px] transition-colors">
                <span className="whitespace-nowrap text-[14px] text-[#818CF8] leading-[20px] text-center">Reset password</span>
              </button>
            </Link>
            <Link href={`${basePath}/account-password`} className="md:hidden flex shrink-0 pl-2">
              <ChevronRight className="w-6 h-6 text-black" strokeWidth={1.5} />
            </Link>
          </div>

          {/* Email */}
          <div className="flex flex-row justify-between items-center py-3 w-full group">
            <Link href={`${basePath}/account-email`} className="flex flex-row items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity flex-1">
              <Mail className="w-6 h-6 text-black shrink-0" />
              <div className="flex flex-col justify-center items-start">
                <h3 className="flex items-center h-[24px] font-normal text-[16px] text-black leading-[24px]">Manage email</h3>
                <p className="text-[14px] text-[#6B7280] leading-[20px]">Current: {userEmail}</p>
              </div>
            </Link>
            <Link href={`${basePath}/account-email`} className="hidden md:block">
              <button className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[169px] h-[40px] bg-white border border-[#818CF8] rounded-[24px] transition-colors">
                <span className="whitespace-nowrap text-[14px] text-[#818CF8] leading-[20px] text-center">Change email</span>
              </button>
            </Link>
            <Link href={`${basePath}/account-email`} className="md:hidden flex shrink-0 pl-2">
              <ChevronRight className="w-6 h-6 text-black" strokeWidth={1.5} />
            </Link>
          </div>

          {/* Phone */}
          <div className="flex flex-row justify-between items-center py-3 w-full group">
            <Link href={`${basePath}/account-phone`} className="flex flex-row items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity flex-1">
              <Phone className="w-6 h-6 text-black shrink-0" />
              <div className="flex flex-col justify-center items-start">
                <h3 className="flex items-center h-[24px] font-normal text-[16px] text-black leading-[24px]">Manage phone number</h3>
                <p className="text-[14px] text-[#6B7280] leading-[20px]">
                  {hasPhone ? phoneNumber : "No phone number"}
                </p>
              </div>
            </Link>
            <Link href={`${basePath}/account-phone`} className="hidden md:block">
              <button className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[169px] h-[40px] bg-white border border-[#818CF8] rounded-[24px] transition-colors">
                <span className="whitespace-nowrap text-[14px] text-[#818CF8] leading-[20px] text-center">
                  {hasPhone ? "Change number" : "Add phone number"}
                </span>
              </button>
            </Link>
            <Link href={`${basePath}/account-phone`} className="md:hidden flex shrink-0 pl-2">
              <ChevronRight className="w-6 h-6 text-black" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Session */}
      <div className="flex flex-col items-start px-4 md:px-6 gap-2 w-full">
        <h2 className="text-[18px] font-medium text-black leading-[26px]">Session</h2>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4 md:gap-0">
          <div className="flex flex-col justify-center items-start">
            <h3 className="text-[16px] text-black leading-[24px]">Logout</h3>
            <p className="text-[14px] text-[#6B7280] leading-[20px]">
              Sign out of your current session on this device
            </p>
          </div>
          <button 
            onClick={() => setActiveModal('logout')}
            className="flex flex-row justify-center items-center py-2 gap-1 rounded-[24px] transition-colors"
          >
            <LogOut className="w-6 h-6 text-[#FF6B6B]" />
            <span className="text-[16px] text-[#FF6B6B] leading-[24px]">Log out</span>
          </button>
        </div>
      </div>

      {/* Deactivate Account */}
      <div className="flex flex-col justify-center items-start px-4 md:px-6 pt-4 gap-4 w-full border-t border-[#DADADA]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4 md:gap-0">
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
      <div className="flex flex-col justify-center items-start px-4 md:px-6 gap-4 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4 md:gap-0">
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
