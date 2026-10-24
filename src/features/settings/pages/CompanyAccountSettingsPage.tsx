"use client";

import React, { useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { DeleteCompanyModal } from '../components/modals/DeleteCompanyModal';
import { DeactivateCompanyModal } from '../components/modals/DeactivateCompanyModal';
import { TransferOwnershipModal } from '../components/modals/TransferOwnershipModal';
import { useCompanyAccountSettings } from '../hooks/useCompanyAccountSettings';
import { useSettingsStore } from '@/store/settings.store';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { MobileCompanyAccountView } from '../components/mobile';

export function CompanyAccountSettingsPage() {
  const router = useRouter();
  const activeModal = useSettingsStore((state) => state.companyAccount.activeModal);
  const setActiveModal = useSettingsStore((state) => state.setCompanyAccountModal);
  const { activeProfile } = useActiveProfile();

  const pathname = usePathname() || '';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '';

  const { data: accountData, isLoading, refetch } = useCompanyAccountSettings();

  const primaryEmail = accountData?.email || '';
  const hasPhone = !!accountData?.phone && accountData.phone.trim() !== '';
  const phoneNumber = accountData?.phone;
  const isDeactivated = accountData?.isDeactivated ?? false;

  // Only organization Owner has authority to deactivate, transfer, or delete
  const isOwner = Boolean(
    activeProfile?.viewer_role_data?.is_owner ||
    activeProfile?.viewer_role_data?.name?.toLowerCase() === 'owner'
  );

  const handleCloseModal = useCallback(() => setActiveModal(null), [setActiveModal]);
  const handleOpenDeactivate = useCallback(() => setActiveModal('deactivate'), [setActiveModal]);
  const handleOpenTransfer = useCallback(() => setActiveModal('transfer'), [setActiveModal]);
  const handleOpenDelete = useCallback(() => setActiveModal('delete'), [setActiveModal]);

  return (
    <>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. DESKTOP VIEW: 100% Intact & Untouched for >= md (768px+)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex w-full max-w-[712px] py-2 rounded-tr-3xl rounded-br-3xl flex-col justify-start items-start gap-3 select-none text-ds-text-primary">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. Credentials Section (Matches User Account dimensions 1:1)  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="self-stretch px-4 py-2 flex flex-col justify-start items-start">
        <div className="self-stretch flex items-center gap-2.5 mb-1">
          <button
            type="button"
            onClick={() => router.replace(basePath)}
            aria-label="Back to settings menu"
            className="-ml-1.5 flex md:hidden items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring"
          >
            <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
          </button>
          <h2 className="text-ds-text-primary ds-text-body-1 m-0">
            Credentials
          </h2>
        </div>

        <div className="self-stretch flex flex-col justify-start items-start">
          {/* Row 1: Manage email */}
          <div className="self-stretch py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
              <span className="text-ds-text-primary ds-text-body-1">
                Manage email
              </span>
              <p className="text-ds-text-secondary ds-text-secondary m-0 truncate max-w-full">
                {isLoading ? 'Loading...' : primaryEmail ? `Current: ${primaryEmail}` : 'No email address registered'}
              </p>
            </div>
            <Link href={`${basePath}/account-email`} className="shrink-0 w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto min-w-[169px] h-[36px] px-4 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center gap-2.5 transition-colors cursor-pointer ds-focus-ring"
              >
                <span className="text-ds-text-primary ds-text-body-1 whitespace-nowrap">
                  Change email
                </span>
              </button>
            </Link>
          </div>

          {/* Row 2: Manage phone number */}
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. Business Lifecycle Section (Matches User Session 1:1)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="self-stretch px-4 flex flex-col justify-start items-start gap-2">
        {/* Row 3: Deactivate business page */}
        <div className="self-stretch py-2 border-t border-ds-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
            <span className="text-ds-text-primary ds-text-body-1">
              {isDeactivated ? 'Reactivate business page' : 'Deactivate business page'}
            </span>
            <p className="text-ds-text-secondary ds-text-secondary m-0">
              {isDeactivated
                ? 'Your business page is currently inactive. Click to reactivate it at any time'
                : 'Temporarily hide your business page. You can reactivate it at any time'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenDeactivate}
            disabled={!isOwner}
            title={!isOwner ? 'Only the organization owner can deactivate this page' : undefined}
            className={`w-full sm:w-[107px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border flex justify-center items-center gap-2.5 transition-colors shrink-0 ds-focus-ring ${
              !isOwner ? 'opacity-40 cursor-not-allowed' : 'hover:bg-ds-surface-1 cursor-pointer'
            }`}
          >
            <span className="text-ds-text-primary ds-text-body-1 whitespace-nowrap">
              {isDeactivated ? 'Reactivate' : 'Deactivate'}
            </span>
          </button>
        </div>

        {/* Row 4: Transfer ownership */}
        <div className="self-stretch py-2 border-t border-ds-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
            <span className="text-ds-text-primary ds-text-body-1">
              Transfer ownership
            </span>
            <p className="text-ds-text-secondary ds-text-secondary m-0">
              Transfer ownership of this business page to another administrator
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenTransfer}
            disabled={!isOwner}
            title={!isOwner ? 'Only the organization owner can transfer ownership' : undefined}
            className={`w-full sm:w-[107px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border flex justify-center items-center gap-2.5 transition-colors shrink-0 ds-focus-ring ${
              !isOwner ? 'opacity-40 cursor-not-allowed' : 'hover:bg-ds-surface-1 cursor-pointer'
            }`}
          >
            <span className="text-ds-text-primary ds-text-body-1 whitespace-nowrap">
              Transfer
            </span>
          </button>
        </div>

        {/* Row 5: Delete account */}
        <div className="self-stretch py-2 border-t border-ds-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
            <span className="text-ds-text-primary ds-text-body-1">
              Delete account
            </span>
            <p className="text-ds-text-secondary ds-text-secondary m-0">
              Permanently delete your business page and all associated data
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenDelete}
            disabled={!isOwner}
            title={!isOwner ? 'Only the organization owner can delete this organization' : undefined}
            className={`w-full sm:w-[107px] h-[36px] px-3 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 transition-colors shrink-0 ds-focus-ring ${
              !isOwner
                ? 'bg-ds-error/40 cursor-not-allowed'
                : 'bg-ds-error hover:bg-ds-error/90 cursor-pointer'
            }`}
          >
            <span className="text-ds-text-primary ds-text-body-1 whitespace-nowrap">
              Delete
            </span>
          </button>
        </div>
      </div>
    </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. MOBILE VIEW: Strictly rendered on < md (< 768px)          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex md:hidden flex-col w-full">
        <MobileCompanyAccountView
          accountData={accountData}
          isLoading={isLoading}
          isOwner={isOwner}
          primaryEmail={primaryEmail}
          hasPhone={hasPhone}
          phoneNumber={phoneNumber}
          isDeactivated={isDeactivated}
          basePath={basePath}
          onOpenDeactivate={handleOpenDeactivate}
          onOpenTransfer={handleOpenTransfer}
          onOpenDelete={handleOpenDelete}
        />
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MODALS: Shared across both Desktop & Mobile                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <DeactivateCompanyModal
        isOpen={activeModal === 'deactivate'}
        onClose={handleCloseModal}
      />
      <TransferOwnershipModal
        isOpen={activeModal === 'transfer'}
        onClose={handleCloseModal}
        companyId={activeProfile?.id || ''}
        companyName={accountData?.companyName || activeProfile?.name || 'Organization'}
        onTransferSuccess={() => {
          refetch();
        }}
      />
      <DeleteCompanyModal
        isOpen={activeModal === 'delete'}
        onClose={handleCloseModal}
      />
    </>
  );
}
