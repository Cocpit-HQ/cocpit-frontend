"use client";

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ChangeEmailModal } from '../components/modals/ChangeEmailModal';
import { useRouter } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useAccountSettings, useDeleteRecoveryEmail } from '../hooks/useAccountSettings';
import { useCompanyAccountSettings } from '../hooks/useCompanyAccountSettings';
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal';
import { toast } from 'sonner';

export function ManageEmailPage() {
  const router = useRouter();
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [isAddRecoveryModalOpen, setIsAddRecoveryModalOpen] = useState(false);
  const [isDeleteRecoveryModalOpen, setIsDeleteRecoveryModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { data: accountData } = useAccountSettings();
  const { data: companyAccountData } = useCompanyAccountSettings();
  const deleteRecoveryEmailMutation = useDeleteRecoveryEmail();
  const { isCompany } = useActiveProfile();
  const isOrg = isCompany;

  const userEmail = isOrg ? (companyAccountData?.email || "") : (accountData?.primaryEmail || "");
  const recoveryEmail = accountData?.recoveryEmail || "";
  const hasRecovery = !!accountData?.recoveryEmail && accountData.recoveryEmail.trim() !== "";

  const handleDeleteRecoveryEmail = () => {
    deleteRecoveryEmailMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['userAccount'] });
        toast.success('Recovery email deleted');
        setIsDeleteRecoveryModalOpen(false);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to delete recovery email');
      }
    });
  };

  return (
    <div className="w-full h-full max-w-[712px] p-0 md:px-4 md:py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-0 md:gap-4 select-none">
      {/* Header */}
      <div className="self-stretch flex items-center gap-2 shrink-0 px-4 h-6 mb-4 md:px-0 md:h-auto md:mb-1">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back to account settings"
          className="flex items-center justify-center w-5 h-5 p-0 text-ds-text-primary hover:text-ds-text-secondary transition-colors shrink-0 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary stroke-[1.5]" />
        </button>
        <h1 className="text-ds-text-primary text-[16px] md:text-base font-medium md:font-semibold font-['DM_Sans'] leading-[24px] h-6 flex items-center m-0">
          Manage email
        </h1>
      </div>

      {/* Primary Email Section */}
      <div className="self-stretch px-4 md:px-0 flex flex-col justify-start items-start gap-2 shrink-0">
        <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
          <div className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
            Primary email
          </div>
          <div className="text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 break-all">
            {userEmail || "@alex.viva********@gmail.com"}
          </div>
        </div>
        <div className="self-stretch inline-flex justify-end items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setIsChangeEmailModalOpen(true)}
            className="w-[126px] h-[36px] bg-ds-accent hover:opacity-90 text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-6 rounded-[100px] inline-flex justify-center items-center transition-opacity cursor-pointer ds-focus-ring whitespace-nowrap"
          >
            Change Email
          </button>
        </div>
      </div>

      {/* Recovery Email Section - User Accounts Only */}
      {!isOrg && (
        <div className="self-stretch px-4 md:px-0 flex flex-col justify-start items-start gap-2 shrink-0">
          {!hasRecovery ? (
            <>
              <div className="text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                Recovery email
              </div>
              <div className="self-stretch text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                A recovery email helps you regain access to your account if you lose access to your primary email. Adding one provides an extra layer of security and makes account recovery faster and easier.
              </div>
              <div className="self-stretch inline-flex justify-end items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddRecoveryModalOpen(true)}
                  className="h-[36px] px-4 py-1.5 border border-ds-border bg-transparent hover:bg-ds-surface-1 text-ds-text-primary rounded-[100px] inline-flex justify-center items-center gap-2.5 transition-colors cursor-pointer ds-focus-ring"
                >
                  <span className="text-[16px] font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
                    Add recovery email
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
                <div className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                  Recovery email
                </div>
                <div className="text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 break-all">
                  {recoveryEmail}
                </div>
              </div>
              <div className="self-stretch inline-flex justify-end items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDeleteRecoveryModalOpen(true)}
                  className="h-[36px] px-4 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center gap-2.5 transition-colors text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-6 cursor-pointer ds-focus-ring whitespace-nowrap"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddRecoveryModalOpen(true)}
                  className="w-[126px] h-[36px] bg-ds-accent hover:opacity-90 text-ds-text-primary text-[16px] font-medium font-['DM_Sans'] leading-6 rounded-[100px] inline-flex justify-center items-center transition-opacity cursor-pointer ds-focus-ring whitespace-nowrap"
                >
                  Change Email
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer Note (Positioned vertically between Help & Support and Legal & Privacy tabs) */}
      <div className="self-stretch flex-1 flex flex-col justify-end items-center px-4 md:px-0 pt-8 pb-8 md:pb-[172px]">
        <p className="text-center text-ds-text-secondary text-[12px] font-normal font-['DM_Sans'] leading-[16px] m-0 max-w-[648px] w-full">
          Note: Verification ensures that you own the new email address. After updating, all notifications and login requests will be sent to the new address. Your old email will no longer be associated with this Cocpit account.
        </p>
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
        <DeleteConfirmationModal
          isOpen={isDeleteRecoveryModalOpen}
          onClose={() => setIsDeleteRecoveryModalOpen(false)}
          onConfirm={handleDeleteRecoveryEmail}
          title="Are you sure you want to delete recovery email?"
          description="This cannot be undone"
          isDeleting={deleteRecoveryEmailMutation.isPending}
          modalClassName="w-[280px] p-3"
        />
      )}
    </div>
  );
}
