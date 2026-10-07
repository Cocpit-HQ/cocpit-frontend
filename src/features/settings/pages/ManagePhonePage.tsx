"use client";

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { ManagePhoneModal } from '../components/modals/ManagePhoneModal';
import { useRouter } from 'next/navigation';
import { useAccountSettings, useDeletePhone } from '../hooks/useAccountSettings';
import { useQueryClient } from '@tanstack/react-query';
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal';
import { toast } from 'sonner';

export function ManagePhonePage() {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<'add' | 'change' | 'delete' | null>(null);
  
  const queryClient = useQueryClient();
  const { data: accountData } = useAccountSettings();
  const deletePhoneMutation = useDeletePhone();

  const hasPhone = !!accountData?.phone && accountData.phone.trim() !== "";
  const phoneNumber = accountData?.phone || "";

  const handleDeletePhone = () => {
    deletePhoneMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['userAccount'] });
        queryClient.invalidateQueries({ queryKey: ['companyAccountSettings'] });
        toast.success('Phone number removed successfully');
        setModalMode(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to remove phone number');
      }
    });
  };

  return (
    <div className="w-full max-w-[712px] px-4 py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-3 select-none">
      {/* Header */}
      <div className="self-stretch flex items-center gap-2.5 mb-1 shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back to account settings"
          className="-ml-1.5 flex items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring md:w-[20px] md:h-[20px] md:-ml-1.5 md:rounded-none md:border-0 md:p-0 md:hover:bg-transparent md:text-ds-text-primary md:hover:text-ds-accent"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary stroke-[1.5] md:stroke-[2]" />
        </button>
        <h1 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6 m-0">
          Manage phone number
        </h1>
      </div>

      {/* Content Section */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2 shrink-0">
        {!hasPhone ? (
          <>
            <div className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
              Phone number
            </div>
            <div className="self-stretch text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
              Add your phone number to make it easier for people to contact you when needed. You can control whether it&apos;s visible to others in your Privacy settings
            </div>
            <div className="self-stretch inline-flex justify-end items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalMode('add')}
                className="h-[36px] px-4 py-1.5 bg-ds-accent hover:opacity-90 text-ds-text-primary rounded-full inline-flex justify-center items-center gap-2.5 transition-opacity cursor-pointer ds-focus-ring"
              >
                <span className="text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
                  Add phone number
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-2.5">
              <div className="text-ds-text-secondary text-xs font-medium font-['DM_Sans'] leading-4">
                Phone number
              </div>
              <div className="text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 break-all">
                {`${accountData?.countryCode || ''} ${phoneNumber}`.trim()}
              </div>
            </div>
            <div className="self-stretch inline-flex justify-end items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setModalMode('delete')}
                className="w-[126px] h-[36px] px-3 py-1.5 rounded-full border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center gap-2.5 transition-colors text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 cursor-pointer ds-focus-ring"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setModalMode('change')}
                className="w-[197px] h-[36px] px-3 py-1.5 bg-ds-accent hover:opacity-90 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 rounded-full inline-flex justify-center items-center gap-2.5 transition-opacity cursor-pointer ds-focus-ring whitespace-nowrap"
              >
                Change number
              </button>
            </div>
          </>
        )}
      </div>

      {(modalMode === 'add' || modalMode === 'change') && (
        <ManagePhoneModal
          isOpen={true}
          onClose={() => setModalMode(null)}
          mode={modalMode}
          currentPhone={phoneNumber}
        />
      )}

      {modalMode === 'delete' && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => setModalMode(null)}
          onConfirm={handleDeletePhone}
          title="Are you sure you want to delete phone number?"
          description="This cannot be undone"
          isDeleting={deletePhoneMutation.isPending}
          modalClassName="w-[280px] p-3"
        />
      )}
    </div>
  );
}
