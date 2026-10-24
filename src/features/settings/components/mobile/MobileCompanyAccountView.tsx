"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { MobileSettingsHeader } from './MobileSettingsHeader';
import { MobileCompanyDeactivateView } from './MobileCompanyDeactivateView';
import { MobileCompanyDeleteView } from './MobileCompanyDeleteView';

export interface MobileCompanyAccountViewProps {
  accountData?: any;
  isLoading?: boolean;
  isOwner?: boolean;
  primaryEmail?: string;
  hasPhone?: boolean;
  phoneNumber?: string | null;
  isDeactivated?: boolean;
  basePath?: string;
  onOpenDeactivate?: () => void;
  onOpenTransfer?: () => void;
  onOpenDelete?: () => void;
}

export function MobileCompanyAccountView({
  accountData,
  isLoading = false,
  isOwner = false,
  primaryEmail = '',
  hasPhone = false,
  phoneNumber,
  isDeactivated = false,
  basePath = '',
  onOpenDeactivate,
  onOpenTransfer,
  onOpenDelete,
}: MobileCompanyAccountViewProps) {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'main' | 'deactivate' | 'delete'>('main');

  if (currentView === 'deactivate') {
    return (
      <MobileCompanyDeactivateView
        onBack={() => setCurrentView('main')}
        isDeactivated={isDeactivated}
      />
    );
  }

  if (currentView === 'delete') {
    return (
      <MobileCompanyDeleteView
        onBack={() => setCurrentView('main')}
      />
    );
  }

  const phoneDisplay = isLoading
    ? 'Loading...'
    : hasPhone
    ? `${accountData?.countryCode || (phoneNumber?.length === 9 ? '+971' : '+91')} ${phoneNumber || ''}`.trim()
    : 'No phone number';

  const emailDisplay = isLoading
    ? 'Loading...'
    : primaryEmail
    ? `Current: ${primaryEmail}`
    : 'No email address registered';

  return (
    <div className="flex flex-col w-full text-ds-text-primary font-sans select-none pb-8">
      <MobileSettingsHeader title="Account" />

      <div className="flex flex-col w-full divide-y divide-ds-border/40">
        {/* ───────────────────────────────────────────────────────────── */}
        {/* SECTION 1: CREDENTIALS                                       */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col w-full px-4 pb-3">
          <h2 className="mb-2 text-ds-text-muted text-[12px] font-medium uppercase tracking-wider font-['DM_Sans']">
            Credentials
          </h2>

          <div className="flex flex-col w-full">
            {/* Row 1: Manage email */}
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
                  {emailDisplay}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-ds-text-muted shrink-0" strokeWidth={1.5} />
            </div>

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

        {/* ───────────────────────────────────────────────────────────── */}
        {/* SECTION 2: BUSINESS LIFECYCLE                                 */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col w-full px-4 py-3">
          <h2 className="mb-2 text-ds-text-muted text-[12px] font-medium uppercase tracking-wider font-['DM_Sans']">
            Business Lifecycle
          </h2>

          <div className="flex flex-col w-full">
            {/* Row 1: Deactivate / Reactivate business page (Navigates to full page) */}
            <div
              onClick={isOwner ? () => setCurrentView('deactivate') : undefined}
              role={isOwner ? 'button' : undefined}
              tabIndex={isOwner ? 0 : undefined}
              className={`flex flex-row items-center justify-between py-3 w-full border-b border-ds-border/30 ${
                isOwner ? 'active:bg-ds-surface-1 cursor-pointer' : ''
              }`}
            >
              <div className="flex flex-col min-w-0 pr-3">
                <span className="text-ds-text-primary text-[15px] font-medium font-['DM_Sans'] leading-[22px]">
                  {isDeactivated ? 'Reactivate business page' : 'Deactivate business page'}
                </span>
                <span className="text-ds-text-secondary text-[13px] font-normal font-['DM_Sans'] leading-[18px]">
                  {isDeactivated
                    ? 'Your business page is currently inactive. Click to reactivate it at any time'
                    : 'Temporarily hide your business page. You can reactivate it at any time'}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOwner) setCurrentView('deactivate');
                }}
                disabled={!isOwner}
                title={!isOwner ? 'Only the organization owner can deactivate this page' : undefined}
                className={`h-8 px-3.5 rounded-[100px] border border-ds-border flex items-center justify-center transition-colors shrink-0 ds-focus-ring ${
                  !isOwner ? 'opacity-40 cursor-not-allowed' : 'hover:bg-ds-surface-1 active:bg-ds-surface-2 cursor-pointer'
                }`}
              >
                <span className="text-ds-text-primary text-[13px] font-medium font-['DM_Sans'] whitespace-nowrap">
                  {isDeactivated ? 'Reactivate' : 'Deactivate'}
                </span>
              </button>
            </div>

            {/* Row 2: Transfer ownership */}
            <div
              onClick={isOwner && onOpenTransfer ? onOpenTransfer : undefined}
              role={isOwner ? 'button' : undefined}
              tabIndex={isOwner ? 0 : undefined}
              className={`flex flex-row items-center justify-between py-3 w-full border-b border-ds-border/30 ${
                isOwner ? 'active:bg-ds-surface-1 cursor-pointer' : ''
              }`}
            >
              <div className="flex flex-col min-w-0 pr-3">
                <span className="text-ds-text-primary text-[15px] font-medium font-['DM_Sans'] leading-[22px]">
                  Transfer ownership
                </span>
                <span className="text-ds-text-secondary text-[13px] font-normal font-['DM_Sans'] leading-[18px]">
                  Transfer ownership of this business page to another administrator
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenTransfer) onOpenTransfer();
                }}
                disabled={!isOwner}
                title={!isOwner ? 'Only the organization owner can transfer ownership' : undefined}
                className={`h-8 px-3.5 rounded-[100px] border border-ds-border flex items-center justify-center transition-colors shrink-0 ds-focus-ring ${
                  !isOwner ? 'opacity-40 cursor-not-allowed' : 'hover:bg-ds-surface-1 active:bg-ds-surface-2 cursor-pointer'
                }`}
              >
                <span className="text-ds-text-primary text-[13px] font-medium font-['DM_Sans'] whitespace-nowrap">
                  Transfer
                </span>
              </button>
            </div>

            {/* Row 3: Delete account (Navigates to full page) */}
            <div
              onClick={isOwner ? () => setCurrentView('delete') : undefined}
              role={isOwner ? 'button' : undefined}
              tabIndex={isOwner ? 0 : undefined}
              className={`flex flex-row items-center justify-between py-3 w-full ${
                isOwner ? 'active:bg-ds-surface-1 cursor-pointer' : ''
              }`}
            >
              <div className="flex flex-col min-w-0 pr-3">
                <span className="text-ds-text-primary text-[15px] font-medium font-['DM_Sans'] leading-[22px]">
                  Delete account
                </span>
                <span className="text-ds-text-secondary text-[13px] font-normal font-['DM_Sans'] leading-[18px]">
                  Permanently delete your business page and all associated data
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOwner) setCurrentView('delete');
                }}
                disabled={!isOwner}
                title={!isOwner ? 'Only the organization owner can delete this organization' : undefined}
                className={`h-8 px-3.5 rounded-[100px] flex items-center justify-center transition-colors shrink-0 ds-focus-ring ${
                  !isOwner
                    ? 'bg-ds-error/40 cursor-not-allowed'
                    : 'bg-ds-error hover:bg-ds-error/90 active:bg-ds-error/80 cursor-pointer'
                }`}
              >
                <span className="text-white text-[13px] font-medium font-['DM_Sans'] whitespace-nowrap">
                  Delete
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
