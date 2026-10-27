"use client";

import React, { useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { LogoutModal } from '../components/modals/LogoutModal';
import { DeleteAccountModal } from '../components/modals/DeleteAccountModal';
import { DeactivateAccountModal } from '../components/modals/DeactivateAccountModal';
import { useAccountSettings } from '../hooks/useAccountSettings';
import { useSettingsStore } from '@/store/settings.store';
import { MobileAccountView } from '../components/MobileSettingsView';

export function AccountSettingsPage() {
  const router = useRouter();
  const activeModal = useSettingsStore((state) => state.account.activeModal);
  const setActiveModal = useSettingsStore((state) => state.setAccountModal);

  const pathname = usePathname() || '/settings/account';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const { data: accountData, isLoading } = useAccountSettings();

  const userEmail = accountData?.primaryEmail || '';
  const hasPhone = !!accountData?.phone && accountData.phone.trim() !== '';
  const phoneNumber = accountData?.phone;
  const hasCompanyAccount = accountData?.hasCompanyAccount ?? true;
  const hasPassword = Boolean(accountData?.hasPassword);

  const handleCloseModal = useCallback(() => setActiveModal(null), [setActiveModal]);
  const handleOpenLogout = useCallback(() => setActiveModal('logout'), [setActiveModal]);
  const handleOpenDeactivate = useCallback(() => setActiveModal('deactivate'), [setActiveModal]);
  const handleOpenDelete = useCallback(() => setActiveModal('delete'), [setActiveModal]);

  React.useEffect(() => {
    return () => {
      setActiveModal(null);
    };
  }, [setActiveModal]);

  return (
    <>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. DESKTOP VIEW: 100% Intact & Untouched for >= md (768px+)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex w-full max-w-[712px] py-2 rounded-tr-3xl rounded-br-3xl flex-col justify-start items-start gap-3 select-none text-ds-text-primary">
        {/* Credentials Section */}
        <div className="self-stretch px-4 py-2 flex flex-col justify-start items-start">
          <div className="self-stretch flex items-center gap-2.5 mb-1">
            <h2 className="text-ds-text-primary ds-text-body-1 m-0">
              Credentials
            </h2>
          </div>

          <div className="self-stretch flex flex-col justify-start items-start">
            {/* Row 1: Manage password */}
            <div className="self-stretch py-2 flex flex-row justify-between items-center gap-4">
              <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
                <span className="text-ds-text-primary ds-text-body-1">
                  Manage password
                </span>
                <p className="text-ds-text-secondary ds-text-secondary m-0">
                  Update your login credentials
                </p>
              </div>
              <Link
                href={`${basePath}/${hasPassword ? 'account-password' : 'account-add-password'}`}
                className="shrink-0"
              >
                <button
                  type="button"
                  className="w-[200px] h-[36px] px-4 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center gap-2.5 transition-colors cursor-pointer ds-focus-ring"
                >
                  <span className="text-ds-text-primary ds-text-body-1 whitespace-nowrap">
                    {isLoading ? '...' : hasPassword ? 'Change password' : 'Add password'}
                  </span>
                </button>
              </Link>
            </div>

            {/* Row 2: Manage email (Commented out) */}
            {/*
            <div className="self-stretch py-2 border-t border-ds-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
                <span className="text-ds-text-primary ds-text-body-1">
                  Manage email
                </span>
                <p className="text-ds-text-secondary ds-text-secondary m-0 truncate max-w-full">
                  {isLoading ? 'Loading...' : userEmail ? `Current: ${userEmail}` : 'Current: alex.jordan@cocpit.io'}
                </p>
              </div>
              <Link href={`${basePath}/account-email`} className="shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full sm:w-auto h-[36px] px-4 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center gap-2.5 transition-colors cursor-pointer ds-focus-ring"
                >
                  <span className="text-ds-text-primary ds-text-body-1 whitespace-nowrap">
                    Change email
                  </span>
                </button>
              </Link>
            </div>
            */}

            {/* Row 3: Manage phone number */}
            <div className="self-stretch py-2 border-t border-ds-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
                <span className="text-ds-text-primary ds-text-body-1">
                  Manage phone number
                </span>
                <p className="text-ds-text-secondary ds-text-secondary m-0 truncate max-w-full">
                  {isLoading ? 'Loading...' : hasPhone ? `${accountData?.countryCode || (phoneNumber?.length === 9 ? '+971' : '+91')} ${phoneNumber || ''}`.trim() : 'No phone number'}
                </p>
              </div>
              <Link href={`${basePath}/account-phone`} className="shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  className={`${hasPhone ? 'w-full sm:w-[200px]' : 'w-full sm:w-[170px]'} h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center gap-2.5 transition-colors cursor-pointer ds-focus-ring`}
                >
                  <span className="text-ds-text-primary ds-text-body-1 whitespace-nowrap">
                    {hasPhone ? 'Change phone number' : 'Add phone number'}
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Session Section */}
        <div className="self-stretch px-4 flex flex-col justify-start items-start gap-2">
          <div className="self-stretch flex flex-col justify-start items-start">
            <h2 className="self-stretch text-ds-text-primary ds-text-body-1 m-0">
              Session
            </h2>
            {/* Logout Row */}
            <div className="self-stretch py-2 flex flex-row justify-between items-center gap-4">
              <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
                <span className="text-ds-text-primary ds-text-body-1">
                  Logout
                </span>
                <p className="text-ds-text-secondary ds-text-secondary m-0">
                  Sign out of your current session on this device
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenLogout}
                className="w-[107px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center gap-2 transition-colors cursor-pointer shrink-0 ds-focus-ring"
              >
                <LogOut className="w-4 h-4 text-ds-text-primary shrink-0" />
                <span className="text-ds-text-primary ds-text-body-1 whitespace-nowrap">
                  Log out
                </span>
              </button>
            </div>
          </div>

          {/* Deactivate account */}
          <div className="self-stretch py-2 border-t border-ds-border flex flex-row justify-between items-center gap-4">
            <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
              <span className="text-ds-text-primary ds-text-body-1">
                Deactivate account
              </span>
              <p className="text-ds-text-secondary ds-text-secondary m-0">
                Temporarily hide your cocpit account. You can reactivate it at any time
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenDeactivate}
              className="w-[107px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center gap-2.5 transition-colors cursor-pointer shrink-0 ds-focus-ring"
            >
              <span className="text-ds-text-primary ds-text-body-1 whitespace-nowrap">
                Deactivate
              </span>
            </button>
          </div>

          {/* Delete account */}
          <div className="self-stretch py-2 border-t border-ds-border flex flex-row justify-between items-center gap-4">
            <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
              <span className="text-ds-text-primary ds-text-body-1">
                Delete account
              </span>
              <p className="text-ds-text-secondary ds-text-secondary m-0">
                Permanently remove all your data, portfolios, and professional network connections. This action cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenDelete}
              className="w-[107px] h-[36px] px-3 py-1.5 bg-ds-error hover:bg-ds-error/90 rounded-[100px] flex justify-center items-center gap-2.5 transition-colors cursor-pointer shrink-0 ds-focus-ring"
            >
              <span className="text-white ds-text-body-1 whitespace-nowrap">
                Delete
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Modals */}
        <LogoutModal isOpen={activeModal === 'logout'} onClose={handleCloseModal} />
        <DeactivateAccountModal isOpen={activeModal === 'deactivate'} onClose={handleCloseModal} />
        <DeleteAccountModal
          isOpen={activeModal === 'delete'}
          onClose={handleCloseModal}
          hasCompanyAccount={hasCompanyAccount}
        />
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. MOBILE VIEW: Strictly rendered on < md (< 768px)          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex md:hidden flex-col w-full">
        <MobileAccountView
          accountData={accountData}
          isLoading={isLoading}
          hasPassword={hasPassword}
          hasPhone={hasPhone}
          phoneNumber={phoneNumber}
          userEmail={userEmail}
          basePath={basePath}
          hasCompanyAccount={hasCompanyAccount}
        />
      </div>
    </>
  );
}

