"use client";

import React, { useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { KeyRound, Mail, Phone, LogOut, ShieldAlert, Trash2, ChevronLeft } from 'lucide-react';
import { SettingCard } from '../components/SettingCard';
import { SettingRow } from '../components/SettingRow';
import { LogoutModal } from '../components/modals/LogoutModal';
import { DeleteCompanyModal } from '../components/modals/DeleteCompanyModal';
import { DeactivateCompanyModal } from '../components/modals/DeactivateCompanyModal';
import { useCompanyAccountSettings } from '../hooks/useCompanyAccountSettings';
import { useSettingsStore } from '@/store/settings.store';

export function CompanyAccountSettingsPage() {
  const router = useRouter();
  const activeModal = useSettingsStore((state) => state.account.activeModal);
  const setActiveModal = useSettingsStore((state) => state.setAccountModal);

  const pathname = usePathname() || '';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '';

  const { data: accountData, isLoading } = useCompanyAccountSettings();

  const primaryEmail = accountData?.email || '';
  const hasPhone = !!accountData?.phone && accountData.phone.trim() !== '';
  const phoneNumber = accountData?.phone;
  const isDeactivated = accountData?.isDeactivated ?? false;

  const handleCloseModal = useCallback(() => setActiveModal(null), [setActiveModal]);
  const handleOpenLogout = useCallback(() => setActiveModal('logout'), [setActiveModal]);
  const handleOpenDeactivate = useCallback(() => setActiveModal('deactivate'), [setActiveModal]);
  const handleOpenDelete = useCallback(() => setActiveModal('delete'), [setActiveModal]);

  return (
    <div className="w-full max-w-[712px] md:min-h-[490px] p-[8px_0px] flex flex-col items-start gap-[12px] rounded-[0px_24px_24px_0px] text-ds-text-primary font-sans">
      {/* Frame 2609232: Credentials Section */}
      <div className="w-full max-w-[712px] px-3 sm:px-4 py-2 flex flex-col items-start self-stretch">
        {/* Title: Credentials & Mobile Back */}
        <div className="flex flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(basePath)}
            aria-label="Back to settings menu"
            className="flex md:hidden items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring"
          >
            <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
          </button>
          <h2 className="text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px] flex items-center">
            Credentials
          </h2>
        </div>
        {/* Frame 2609220: Below title box */}
        <div className="w-full max-w-[680px] p-0 flex flex-col items-start self-stretch">
          {/* Row 1: Password (Frame: Password) */}
          <div className="w-full max-w-[680px] min-h-[60px] py-2 flex flex-row justify-between items-center self-stretch gap-4">
            {/* Left box */}
            <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center items-start p-0">
              <span className="text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px]">
                Manage password
              </span>
              <p className="text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] m-0">
                Update password for your account
              </p>
            </div>
            {/* Right button */}
            <Link href={`${basePath}/account-password`} className="shrink-0 w-full sm:w-auto">
              <button className="w-full sm:w-auto h-[36px] px-3 py-1.5 gap-[10px] rounded-[100px] border border-ds-border hover:border-ds-border/80 flex flex-row justify-center items-center group transition-colors whitespace-nowrap">
                <span className="text-ds-text-primary group-hover:text-white text-[16px] font-medium font-['DM_Sans'] leading-[24px] flex items-center justify-center transition-colors whitespace-nowrap">
                  Reset password
                </span>
              </button>
            </Link>
          </div>

          {/* Row 2: Organization email */}
          <div className="w-full max-w-[680px] min-h-[60px] py-2 border-t border-ds-border flex flex-row justify-between items-center self-stretch gap-4">
            <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center items-start p-0">
              <span className="text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px]">
                Organization email
              </span>
              <p className="text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] m-0 truncate">
                {isLoading ? 'Loading...' : primaryEmail ? `Current: ${primaryEmail}` : 'Manage organization email'}
              </p>
            </div>
            <Link href={`${basePath}/account-email`} className="shrink-0 w-full sm:w-auto">
              <button className="w-full sm:w-auto h-[36px] px-3 py-1.5 gap-[10px] rounded-[100px] border border-ds-border hover:border-ds-border/80 flex flex-row justify-center items-center group transition-colors whitespace-nowrap">
                <span className="text-ds-text-primary group-hover:text-white text-[16px] font-medium font-['DM_Sans'] leading-[24px] flex items-center justify-center transition-colors whitespace-nowrap">
                  Change email
                </span>
              </button>
            </Link>
          </div>

          {/* Row 3: Organization phone */}
          <div className="w-full max-w-[680px] min-h-[60px] py-2 border-t border-ds-border flex flex-row justify-between items-center self-stretch gap-4">
            <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center items-start p-0">
              <span className="text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px]">
                Organization phone
              </span>
              <p className="text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] m-0 truncate">
                {isLoading ? 'Loading...' : hasPhone ? `${accountData?.countryCode || ''} ${phoneNumber}`.trim() : 'No phone number'}
              </p>
            </div>
            <Link href={`${basePath}/account-phone`} className="shrink-0 w-full sm:w-auto">
              <button className="w-full sm:w-auto h-[36px] px-3 py-1.5 gap-[10px] rounded-[100px] border border-ds-border hover:border-ds-border/80 flex flex-row justify-center items-center group transition-colors whitespace-nowrap">
                <span className="text-ds-text-primary group-hover:text-white text-[16px] font-medium font-['DM_Sans'] leading-[24px] flex items-center justify-center transition-colors whitespace-nowrap">
                  {hasPhone ? 'Change phone number' : 'Add phone number'}
                </span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Frame 2609857: Session Section */}
      <div className="w-full max-w-[712px] px-3 sm:px-4 py-0 gap-[8px] flex flex-col items-start self-stretch">
        {/* Frame 2609221: Session Header & Logout Row */}
        <div className="w-full max-w-[680px] p-0 flex flex-col items-start self-stretch">
          <h2 className="text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px] flex items-center">
            Session
          </h2>
          {/* Frame 2609173: Logout Row */}
          <div className="w-full max-w-[680px] min-h-[60px] py-2 flex flex-row justify-between items-center self-stretch gap-4">
            {/* Left box */}
            <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center items-start p-0">
              <span className="text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px]">
                Logout
              </span>
              <p className="text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] m-0">
                Log out from this organization session
              </p>
            </div>
            {/* Right button */}
            <button
              onClick={handleOpenLogout}
              className="w-full sm:w-auto h-[36px] px-3 py-1.5 gap-[8px] rounded-[100px] border border-ds-border hover:border-ds-border/80 flex flex-row justify-center items-center group transition-colors shrink-0 whitespace-nowrap"
            >
              <LogOut className="w-[16px] h-[16px] text-ds-text-primary shrink-0" />
              <span className="text-ds-text-primary group-hover:text-white text-[16px] font-medium font-['DM_Sans'] leading-[24px] flex items-center justify-center transition-colors whitespace-nowrap">
                Log out
              </span>
            </button>
          </div>
        </div>

        {/* Frame 2609222: Deactivate page */}
        <div className="box-border w-full max-w-[680px] min-h-[60px] py-2 gap-[8px] border-t border-ds-border flex flex-col justify-center items-center self-stretch">
          <div className="w-full max-w-[680px] min-h-[44px] p-0 flex flex-row justify-between items-center self-stretch gap-4">
            {/* Left box */}
            <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center items-start p-0">
              <span className="text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px]">
                {isDeactivated ? 'Reactivate page' : 'Deactivate page'}
              </span>
              <p className="text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] m-0">
                {isDeactivated
                  ? 'Your page is currently inactive. Click to reactivate it.'
                  : 'Your organization page, posts, and details will be hidden from everyone'}
              </p>
            </div>
            {/* Right button */}
            <button
              onClick={handleOpenDeactivate}
              className="w-full sm:w-auto h-[36px] px-3 py-1.5 gap-[10px] rounded-[100px] border border-ds-border hover:border-ds-border/80 flex flex-row justify-center items-center group transition-colors shrink-0 whitespace-nowrap"
            >
              <span className="text-ds-text-primary group-hover:text-white text-[16px] font-medium font-['DM_Sans'] leading-[24px] flex items-center justify-center transition-colors whitespace-nowrap">
                {isDeactivated ? 'Reactivate' : 'Deactivate'}
              </span>
            </button>
          </div>
        </div>

        {/* Frame 2609223: Delete page */}
        <div className="box-border w-full max-w-[680px] min-h-[80px] py-2 gap-[8px] border-t border-ds-border flex flex-col justify-center items-center self-stretch">
          <div className="w-full max-w-[680px] min-h-[64px] p-0 flex flex-row justify-between items-center self-stretch gap-4">
            {/* Left box */}
            <div className="flex-1 min-w-0 pr-2 min-h-[64px] flex flex-col justify-center items-start p-0">
              <span className="text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-[24px]">
                Delete page
              </span>
              <p className="text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] m-0">
                Permanently delete page and all associated posts, analytics, and member roles. This action cannot be undone.
              </p>
            </div>
            {/* Right button */}
            <button
              onClick={handleOpenDelete}
              className="w-full sm:w-auto h-[36px] px-3 py-1.5 gap-[10px] rounded-[100px] bg-ds-error hover:bg-ds-error/90 flex flex-row justify-center items-center group transition-colors shrink-0 whitespace-nowrap"
            >
              <span className="text-white text-[16px] font-medium font-['DM_Sans'] leading-[24px] flex items-center justify-center whitespace-nowrap">
                Delete
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LogoutModal isOpen={activeModal === 'logout'} onClose={handleCloseModal} />
      <DeactivateCompanyModal isOpen={activeModal === 'deactivate'} onClose={handleCloseModal} />
      <DeleteCompanyModal isOpen={activeModal === 'delete'} onClose={handleCloseModal} />
    </div>
  );
}
