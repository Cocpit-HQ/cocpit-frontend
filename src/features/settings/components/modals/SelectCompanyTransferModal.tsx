"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { BusinessBuildingIcon } from '@/components/icons';

export interface CompanyInfo {
  id: string;
  name: string;
  type?: string;
  logo_url?: string;
}

interface SelectCompanyTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (company: CompanyInfo) => void;
  companies: CompanyInfo[];
}

function CompanyRow({
  company,
  isSelected,
  onSelect,
}: {
  company: CompanyInfo;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={onSelect}
      className={`flex flex-row items-center py-2 px-4 gap-2 w-full max-w-[418px] rounded-[12px] cursor-pointer transition-all select-none ${
        isSelected
          ? 'bg-ds-surface-1 border border-ds-border'
          : 'bg-transparent border border-transparent hover:bg-ds-surface-1/40'
      }`}
    >
      {/* Company Avatar (Figma Parity: 48x48 Frame with BusinessBuildingIcon fallback) */}
      <div className="w-12 h-12 rounded-[10px] overflow-hidden relative shrink-0 bg-ds-surface-2 border border-ds-border flex items-center justify-center">
        {company.logo_url && !imageError ? (
          <Image
            src={company.logo_url}
            alt={company.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <BusinessBuildingIcon className="w-6 h-6 text-ds-text-secondary shrink-0" />
        )}
      </div>

      {/* Company Info */}
      <div className="flex flex-col items-start justify-center flex-1 min-w-0">
        <span className="text-ds-text-primary text-[16px] font-normal leading-[24px] font-['DM_Sans',sans-serif] truncate w-full text-left">
          {company.name}
        </span>
        <span className="text-ds-text-secondary text-[12px] font-normal leading-[16px] font-['DM_Sans',sans-serif] truncate w-full text-left capitalize">
          {company.type || 'Saas'}
        </span>
      </div>
    </div>
  );
}

export function SelectCompanyTransferModal({
  isOpen,
  onClose,
  onContinue,
  companies,
}: SelectCompanyTransferModalProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    () => companies[0]?.id || null
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center bg-ds-bg border border-ds-border rounded-[16px] p-3 gap-3 w-[442px] max-w-[calc(100vw-32px)] shadow-2xl animate-in fade-in zoom-in-95 duration-200 box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Centered Header (Figma Parity: 16px font, 24px line-height, medium) */}
        <h2 className="font-['DM_Sans',sans-serif] font-medium text-[16px] leading-[24px] text-ds-text-primary text-center m-0 p-0">
          Transfer company ownership
        </h2>

        {/* Company List (Figma Parity: 418px Fill items, gap 8px) */}
        <div className="flex flex-col items-start w-full gap-2 max-h-[260px] overflow-y-auto pr-0.5 scrollbar-hide no-scrollbar [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {companies.length === 0 ? (
            <div className="flex items-center justify-center py-6 w-full text-center text-ds-text-muted text-[13px] font-['DM_Sans',sans-serif]">
              No owned companies available to transfer.
            </div>
          ) : (
            companies.map((company) => (
              <CompanyRow
                key={company.id}
                company={company}
                isSelected={selectedCompanyId === company.id}
                onSelect={() => setSelectedCompanyId(company.id)}
              />
            ))
          )}
        </div>

        {/* Action Buttons (Figma Parity: Frame 2609476 - Hug 196px x 36px, gap 8px, centered with 111px margins) */}
        <div className="flex flex-row justify-center items-center gap-2 w-full">
          <button
            type="button"
            onClick={() => {
              const comp = companies.find((c) => c.id === selectedCompanyId);
              if (comp) onContinue(comp);
            }}
            disabled={!selectedCompanyId}
            className="w-[94px] h-[36px] px-3 py-1.5 rounded-[100px] bg-ds-accent text-ds-text-primary text-[16px] leading-[24px] font-medium font-['DM_Sans',sans-serif] hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer ds-focus-ring whitespace-nowrap gap-[10px]"
          >
            Continue
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-[94px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent hover:bg-ds-surface-1 text-ds-text-primary text-[16px] leading-[24px] font-medium font-['DM_Sans',sans-serif] transition-colors flex items-center justify-center cursor-pointer ds-focus-ring whitespace-nowrap gap-[10px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
