"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut } from 'lucide-react';
import { LogoutModal } from '../modals/LogoutModal';
import { MobileSettingsHeader } from './MobileSettingsHeader';
import { MobileDeactivateView } from './MobileDeactivateView';
import { MobileDeleteView } from './MobileDeleteView';

export interface MobileAccountViewProps {
  accountData?: any;
  isLoading?: boolean;
  hasPassword?: boolean;
  hasPhone?: boolean;
  phoneNumber?: string | null;
  userEmail?: string;
  basePath?: string;
  hasCompanyAccount?: boolean;
}

export function MobileAccountView({
  accountData,
  isLoading = false,
  hasPassword = true,
  hasPhone = false,
  phoneNumber,
  userEmail,
  basePath = '/settings',
  hasCompanyAccount = false,
}: MobileAccountViewProps) {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'main' | 'deactivate' | 'delete'>('main');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  if (currentView === 'deactivate') {
    return <MobileDeactivateView onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'delete') {
    return (
      <MobileDeleteView 
        onBack={() => setCurrentView('main')} 
        hasCompanyAccount={hasCompanyAccount} 
      />
    );
  }

  const emailDisplay = isLoading ? 'Loading...' : (userEmail || 'alex.jordan@cocpit.io');
  const phoneDisplay = isLoading
    ? 'Loading...'
    : hasPhone
    ? `${accountData?.countryCode || (phoneNumber?.length === 9 ? '+971' : '+91')} ${phoneNumber || ''}`.trim()
    : 'No phone number';

  return (
    <div className="flex flex-col w-full text-ds-text-primary font-sans select-none pb-8">
      <MobileSettingsHeader title="Account" />

      <div className="flex flex-col w-full divide-y divide-ds-border/40">
        
        {/* SECTION 1: CREDENTIALS */}
        <div className="flex flex-col w-full px-4 pb-3">
          <h2 className="mb-2 text-ds-text-muted text-[12px] font-medium uppercase tracking-wider font-['DM_Sans']">
            Credentials
          </h2>

          <div className="flex flex-col w-full">
            {/* Row 1: Manage password */}
            <div
              onClick={() => router.push(`${basePath}/${hasPassword ? 'account-password' : 'account-add-password'}`)}
              role="button"
              tabIndex={0}
              className="flex flex-row items-center justify-between py-3 w-full active:bg-ds-surface-1 transition-colors border-b border-ds-border/30 cursor-pointer"
            >
              <div className="flex flex-col min-w-0 pr-3">
                <span className="text-ds-text-primary text-[15px] font-medium font-['DM_Sans'] leading-[22px]">
                  Manage password
                </span>
                <span className="text-ds-text-secondary text-[13px] font-normal font-['DM_Sans'] leading-[18px]">
                  Update your login credentials
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-ds-text-muted shrink-0" strokeWidth={1.5} />
            </div>

            {/* Row 2: Manage email (Commented out) */}
            {/*
            <div
              onClick={() => router.push(`${basePath}/account-email`)}
              role="button"
              tabIndex={0}
              className="flex flex-row items-center justify-between py-3 w-full active:bg-ds-surface-1 transition-colors border-b border-ds-border/30 cursor-pointer"
            >
              <div className="flex flex-col min-w-0 pr-3">
                <span className="text-ds-text-primary text-[15px] font-medium font-['DM_Sans'] leading-[22px]">
                  Manage email
                </span>
                <span className="text-ds-text-secondary text-[13px] font-normal font-['DM_Sans'] leading-[18px] truncate">
                  Current: {emailDisplay}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-ds-text-muted shrink-0" strokeWidth={1.5} />
            </div>
            */}

            {/* Row 2: Manage phone number */}
            <div
              onClick={() => router.push(`${basePath}/account-phone`)}
              role="button"
              tabIndex={0}
              className="flex flex-row items-center justify-between py-3 w-full active:bg-ds-surface-1 transition-colors cursor-pointer"
            >
              <div className="flex flex-col min-w-0 pr-3">
                <span className="text-ds-text-primary text-[15px] font-medium font-['DM_Sans'] leading-[22px]">
                  Manage phone number
                </span>
                <span className="text-ds-text-secondary text-[13px] font-normal font-['DM_Sans'] leading-[18px] truncate">
                  {phoneDisplay}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-ds-text-muted shrink-0" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* SECTION 2: SESSION */}
        <div className="flex flex-col w-full px-4 py-3">
          <h2 className="mb-2 text-ds-text-muted text-[12px] font-medium uppercase tracking-wider font-['DM_Sans']">
            Session
          </h2>

          <div className="flex flex-col w-full">
            {/* Row 1: Logout */}
            <div className="flex flex-row items-center justify-between py-3 w-full border-b border-ds-border/30">
              <div className="flex flex-col min-w-0 pr-3">
                <span className="text-ds-text-primary text-[15px] font-medium font-['DM_Sans'] leading-[22px]">
                  Logout
                </span>
                <span className="text-ds-text-secondary text-[13px] font-normal font-['DM_Sans'] leading-[18px]">
                  Sign out of your current session on this device
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                className="h-8 px-3 rounded-full border border-ds-border hover:bg-ds-surface-1 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-ds-text-primary" />
                <span className="text-ds-text-primary text-[13px] font-medium font-['DM_Sans'] whitespace-nowrap">
                  Log out
                </span>
              </button>
            </div>

            {/* Row 2: Deactivate account */}
            <div
              onClick={() => setCurrentView('deactivate')}
              role="button"
              tabIndex={0}
              className="flex flex-row items-center justify-between py-3 w-full active:bg-ds-surface-1 transition-colors border-b border-ds-border/30 cursor-pointer"
            >
              <div className="flex flex-col min-w-0 pr-3">
                <span className="text-ds-text-primary text-[15px] font-medium font-['DM_Sans'] leading-[22px]">
                  Deactivate account
                </span>
                <span className="text-ds-text-secondary text-[13px] font-normal font-['DM_Sans'] leading-[18px]">
                  Temporarily hide your cocpit account. You can reactivate it at any time
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-ds-text-muted shrink-0" strokeWidth={1.5} />
            </div>

            {/* Row 3: Delete account */}
            <div
              onClick={() => setCurrentView('delete')}
              role="button"
              tabIndex={0}
              className="flex flex-row items-center justify-between py-3 w-full active:bg-ds-surface-1 transition-colors cursor-pointer"
            >
              <div className="flex flex-col min-w-0 pr-3">
                <span className="text-ds-text-primary text-[15px] font-medium font-['DM_Sans'] leading-[22px]">
                  Delete account
                </span>
                <span className="text-ds-text-secondary text-[13px] font-normal font-['DM_Sans'] leading-[18px]">
                  Permanently remove all your data, portfolios, and professional network connections. This action cannot be undone.
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-ds-text-muted shrink-0" strokeWidth={1.5} />
            </div>
          </div>
        </div>

      </div>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
    </div>
  );
}
