"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { useCompanyAccountSettings } from '../../../hooks/useCompanyAccountSettings';
import { useSettingsStore } from '@/store/settings.store';
import { DeactivateCompanyModal } from '../components/modals/DeactivateCompanyModal';
import { DeleteCompanyModal } from '../components/modals/DeleteCompanyModal';
import { TransferOwnershipModal } from '../components/modals/TransferOwnershipModal';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useSocket } from '@/context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';

import { usePathname } from 'next/navigation';

export function CompanyAccountSettingsPage() {
  const { data, isLoading, entityLabel } = useCompanyAccountSettings();
  const { activeProfile, refreshProfile } = useActiveProfile();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const pathname = usePathname() || '/settings/account';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const activeModal = useSettingsStore(state => state.companyAccount.activeModal);
  const setModal = useSettingsStore(state => state.setCompanyAccountModal);

  // Transfer ownership needs company ID
  const companyId = activeProfile?.id || '';
  const companyName = activeProfile?.name || 'Company';

  // Owner detection: is_owner comes from actor context (created_by === userId check in backend)
  const roleData = activeProfile?.viewer_role_data;
  const [isOwner, setIsOwner] = useState<boolean>(roleData?.is_owner === true);

  // Keep isOwner in sync when activeProfile changes (e.g. after refreshProfile)
  useEffect(() => {
    setIsOwner(roleData?.is_owner === true);
  }, [roleData?.is_owner]);

  // Listen for real-time ownership transfer events — disable owner actions immediately
  useEffect(() => {
    if (!socket || !companyId) return;

    const handleOwnershipTransferred = (payload: { orgId: string; previousOwnerId: string; newOwnerId: string }) => {
      if (payload.orgId !== companyId) return;
      // Current user is no longer the owner — disable owner-only UI immediately
      setIsOwner(false);
      if (refreshProfile) refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['companyAccountSettings', companyId] });
    };

    const handleOrgListUpdated = (payload: { orgId: string; action: string }) => {
      if (payload.orgId !== companyId) return;
      if (payload.action === 'demoted_to_admin') {
        setIsOwner(false);
      } else if (payload.action === 'promoted_to_owner') {
        setIsOwner(true);
      }
      if (refreshProfile) refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['companyAccountSettings', companyId] });
    };

    socket.on('org_ownership_transferred', handleOwnershipTransferred);
    socket.on('org_list_updated', handleOrgListUpdated);

    return () => {
      socket.off('org_ownership_transferred', handleOwnershipTransferred);
      socket.off('org_list_updated', handleOrgListUpdated);
    };
  }, [socket, companyId, refreshProfile, queryClient]);

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
            <Link href={`${basePath}/account-email`} className="flex flex-row items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
              <Mail className="w-6 h-6 text-black dark:text-company-text" />
              <div className="flex flex-col justify-center items-start">
                <h3 className="flex items-center h-[24px] font-normal text-[16px] text-black dark:text-company-text leading-[24px]">Manage email</h3>
                <p className="text-[14px] text-[#6B7280] dark:text-company-secondary leading-[20px]">Current: {data.email}</p>
              </div>
            </Link>
            <Link href={`${basePath}/account-email`}>
              <button className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[169px] h-[40px] bg-white dark:bg-company-card border border-[#1A73E8] dark:border-company-primary rounded-[24px] transition-colors">
                <span className="whitespace-nowrap text-[14px] text-[#1A73E8] dark:text-company-primary leading-[20px] text-center">Change email</span>
              </button>
            </Link>
          </div>

          {/* Phone */}
          <div className="flex flex-row justify-between items-center py-3 w-full border-t border-[#DADADA] dark:border-company-border group">
            <Link href={`${basePath}/account-phone`} className="flex flex-row items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
              <Phone className="w-6 h-6 text-black dark:text-company-text" />
              <div className="flex flex-col justify-center items-start">
                <h3 className="flex items-center h-[24px] font-normal text-[16px] text-black dark:text-company-text leading-[24px]">Manage phone number</h3>
                <p className="text-[14px] text-[#6B7280] dark:text-company-secondary leading-[20px]">
                  {data.phone ? `Current: ${data.phone}` : "No phone number"}
                </p>
              </div>
            </Link>
            <Link href={`${basePath}/account-phone`}>
              <button className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[169px] h-[40px] bg-white dark:bg-company-card border border-[#1A73E8] dark:border-company-primary rounded-[24px] transition-colors">
                <span className="whitespace-nowrap text-[14px] text-[#1A73E8] dark:text-company-primary leading-[20px] text-center">
                  {data.phone ? "Change number" : "Add phone number"}
                </span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ──── OWNER-ONLY SECTION ──── */}

      {/* Deactivate */}
      <div className="flex flex-col justify-center items-center p-6 gap-2.5 w-full">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex flex-col justify-center items-start max-w-[435px]">
            <h3 className="text-[16px] text-black dark:text-company-text leading-[24px]">Deactivate {entityLabel === 'INSTITUTION' ? 'institution page' : 'business page'}</h3>
            <p className="text-[14px] text-[#6B7280] dark:text-company-secondary leading-[20px]">
              Temporarily hide your {entityLabel === 'INSTITUTION' ? 'institution page' : 'business page'}. You can reactivate it at any time.
            </p>
          </div>
          <div className="group relative flex items-center">
            <button
              disabled={!isOwner}
              onClick={() => isOwner && setModal('deactivate')}
              className={`flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[140px] h-[40px] rounded-[24px] border transition-colors ${isOwner
                  ? 'bg-white dark:bg-company-card border-[#1A73E8] dark:border-company-primary hover:bg-blue-50 dark:hover:bg-company-light-primary cursor-pointer'
                  : 'bg-[#E5E7EB] dark:bg-gray-700 border-[#E5E7EB] dark:border-gray-600 cursor-default opacity-75'
                }`}
            >
              <span className={`text-[14px] leading-[20px] text-center ${isOwner ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#9CA3AF]'}`}>
                {data.isDeactivated ? 'Reactivate' : 'Deactivate'}
              </span>
            </button>
            {!isOwner && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-row items-center justify-center px-3 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded-lg whitespace-nowrap shadow-lg z-50 pointer-events-none transition-opacity">
                You don't have access
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Ownership */}
      <div className="flex flex-col justify-center items-center p-6 gap-2.5 w-full">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex flex-col justify-center items-start max-w-[435px]">
            <h3 className="text-[16px] text-black dark:text-company-text leading-[24px]">Transfer ownership</h3>
            <p className="text-[14px] text-[#6B7280] dark:text-company-secondary leading-[20px]">
              Transfer ownership of this {entityLabel === 'INSTITUTION' ? 'institution page' : 'business page'} to another administrator.
            </p>
          </div>
          <div className="group relative flex items-center">
            <button
              disabled={!isOwner}
              onClick={() => isOwner && setModal('transfer')}
              className={`flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[140px] h-[40px] rounded-[24px] border transition-colors ${isOwner
                  ? 'bg-white dark:bg-company-card border-[#1A73E8] dark:border-company-primary hover:bg-blue-50 dark:hover:bg-company-light-primary cursor-pointer'
                  : 'bg-[#E5E7EB] dark:bg-gray-700 border-[#E5E7EB] dark:border-gray-600 cursor-default opacity-75'
                }`}
            >
              <span className={`text-[14px] leading-[20px] text-center ${isOwner ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#9CA3AF]'}`}>
                Transfer
              </span>
            </button>
            {!isOwner && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-row items-center justify-center px-3 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded-lg whitespace-nowrap shadow-lg z-50 pointer-events-none transition-opacity">
                You don't have access
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div className="flex flex-col justify-center items-center p-6 gap-2.5 w-full">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex flex-col justify-center items-start max-w-[435px]">
            <h3 className="text-[16px] text-black dark:text-company-text leading-[24px]">Delete {entityLabel === 'INSTITUTION' ? 'institution page' : 'business page'}</h3>
            <p className="text-[14px] text-[#6B7280] dark:text-company-secondary leading-[20px]">
              Permanently delete your {entityLabel === 'INSTITUTION' ? 'institution page' : 'business page'} and all associated data.
            </p>
          </div>
          <div className="group relative flex items-center">
            <button
              disabled={!isOwner}
              onClick={() => isOwner && setModal('delete')}
              className={`flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[140px] h-[40px] rounded-[24px] border transition-colors ${isOwner
                  ? 'bg-[#EF4444] dark:bg-company-error border-white dark:border-company-border hover:opacity-90 cursor-pointer'
                  : 'bg-[#E5E7EB] dark:bg-gray-700 border-[#E5E7EB] dark:border-gray-600 cursor-default opacity-75'
                }`}
            >
              <span className={`text-[14px] leading-[20px] text-center ${isOwner ? 'text-white' : 'text-[#9CA3AF]'}`}>
                Delete
              </span>
            </button>
            {!isOwner && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-row items-center justify-center px-3 py-1.5 bg-gray-900 text-white text-[12px] font-medium rounded-lg whitespace-nowrap shadow-lg z-50 pointer-events-none transition-opacity">
                You don't have access
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
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
        onTransferSuccess={() => {
          // Immediately disable owner actions on successful transfer
          setIsOwner(false);
          setModal(null);
        }}
      />

      <DeleteCompanyModal
        isOpen={activeModal === 'delete'}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
