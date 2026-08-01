"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

export interface CompanyInfo {
  id: number;
  name: string;
  type: string;
}

interface SelectCompanyTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (company: CompanyInfo) => void;
  companies: CompanyInfo[];
}

export function SelectCompanyTransferModal({ isOpen, onClose, onContinue, companies }: SelectCompanyTransferModalProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm font-poppins">
      <div className="relative flex flex-col items-center bg-white rounded-[24px] p-4 w-[450px] h-[426px] max-w-full shadow-lg">
        
        {/* Close Button Area */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-[#FF6B6B] hover:opacity-80 transition-opacity"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Wrapper */}
        <div className="flex flex-col items-center w-[366px] mt-2 h-full">
          
          {/* Header */}
          <div className="flex flex-col items-center gap-2 mb-4">
            <h2 className="text-[18px] font-medium text-black leading-[26px] text-center m-0">Transfer company ownership</h2>
            <p className="text-[12px] font-normal text-[#6B7280] leading-[16px] text-center m-0">
              Select the company you want to transfer
            </p>
          </div>

          {/* Company List */}
          <div className="flex flex-col w-full gap-4 mb-4 flex-1 overflow-y-auto pr-1">
            {companies.map(company => (
              <div 
                key={company.id} 
                onClick={() => setSelectedCompanyId(company.id)}
                className={`flex items-center gap-2 px-4 py-2 w-full min-h-[64px] rounded-[12px] cursor-pointer transition-colors ${
                  selectedCompanyId === company.id ? 'bg-[#EEF2FF]' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-[48px] h-[48px] rounded-[12px] overflow-hidden relative flex-shrink-0">
                  <Image 
                    src="/assets/defaultcompany image.png" 
                    alt={company.name} 
                    fill 
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col flex-1 justify-center">
                  <span className="text-[16px] font-medium text-black leading-[24px]">{company.name}</span>
                  <span className="text-[12px] font-normal text-[#6B7280] leading-[16px]">{company.type}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row w-full gap-4 mt-auto">
            <button 
              onClick={onClose} 
              className="flex-1 flex items-center justify-center h-[40px] rounded-[24px] border border-[#6366F1] bg-white transition-colors hover:bg-indigo-50"
            >
              <span className="text-[14px] font-normal text-[#6366F1] leading-[20px]">Cancel</span>
            </button>
            
            <button 
              onClick={() => {
                const comp = companies.find(c => c.id === selectedCompanyId);
                if (comp) onContinue(comp);
              }}
              disabled={!selectedCompanyId}
              className={`flex-1 flex items-center justify-center h-[40px] rounded-[24px] border border-white transition-colors ${
                selectedCompanyId ? 'bg-[#6366F1] hover:opacity-90' : 'bg-[#6366F1]/50 cursor-not-allowed'
              }`}
            >
              <span className="text-[14px] font-normal text-white leading-[20px]">Continue</span>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
