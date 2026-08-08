"use client";

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

import { ManagePhoneModal } from '../components/modals/ManagePhoneModal';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAccountSettings, useDeletePhone } from '../../../hooks/useAccountSettings';
import { useQueryClient } from '@tanstack/react-query';

export function ManagePhonePage() {
  const pathname = usePathname() || '/settings/account-phone';
  const router = useRouter();
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';
  const [modalMode, setModalMode] = useState<'add' | 'change' | 'delete' | null>(null);
  const queryClient = useQueryClient();
  
  const { data: accountData } = useAccountSettings();
  const hasPhone = !!accountData?.phone && accountData.phone.trim() !== "";
  const phoneNumber = accountData?.phone || "";

  return (
    <div className="flex flex-col w-full font-poppins">
      <div className="w-full p-4 relative min-h-[600px] flex flex-col">
        
        {/* Header */}
        <div className="flex flex-row items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center justify-center w-[40px] h-[40px] rounded-full border border-gray-200 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-[18px] font-semibold text-black leading-tight mb-1">Manage phone number</h2>
            <p className="text-[13px] font-normal text-[#6B7280] leading-tight">Keep your account secure by verifying your primary contact number.</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-8 w-full">
          
          {/* Phone Number */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[14px] font-medium text-black">Phone number</label>
            
            {!hasPhone ? (
              <>
                <p className="text-[13px] text-[#6B7280] leading-snug max-w-[600px]">
                  Add your phone number to make it easier for people to contact you when needed. You can control whether it's visible to others in your Privacy settings
                </p>
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={() => setModalMode('add')}
                    className="flex items-center justify-center h-[40px] px-6 rounded-[24px] border border-[#818CF8] bg-white text-[#818CF8] text-[14px] font-medium transition-colors"
                  >
                    Add phone number
                  </button>
                </div>
              </>
            ) : (
              <>
                <input 
                  type="text" 
                  value={phoneNumber}
                  disabled
                  className="w-full h-[48px] px-4 py-2 bg-white border border-gray-200 rounded-[16px] text-[14px] text-black focus:outline-none focus:border-[#818CF8]"
                />
                <div className="flex justify-end gap-4 mt-2">
                  <button 
                    onClick={() => setModalMode('delete')}
                    className="flex items-center justify-center h-[40px] px-6 rounded-[24px] border border-[#FF6B6B] bg-white text-[#FF6B6B] text-[14px] font-medium transition-colors hover:bg-red-50"
                  >
                    Remove
                  </button>
                  <button 
                    onClick={() => setModalMode('change')}
                    className="flex items-center justify-center h-[40px] px-8 rounded-[24px] bg-[#6366F1] border border-white text-white text-[14px] font-normal transition-colors"
                  >
                    Change number
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {modalMode && (
        <ManagePhoneModal isOpen={!!modalMode} onClose={() => setModalMode(null)} mode={modalMode} />
      )}
    </div>
  );
}
