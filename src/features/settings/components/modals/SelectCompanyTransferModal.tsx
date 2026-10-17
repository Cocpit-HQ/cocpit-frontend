"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';

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

export function SelectCompanyTransferModal({ isOpen, onClose, onContinue, companies }: SelectCompanyTransferModalProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex flex-col items-center bg-ds-bg border border-ds-border rounded-[16px] p-3 gap-3 w-[442px] max-w-[calc(100vw-32px)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Close Button Area */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-surface-1 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="font-poppins font-medium text-[18px] leading-[26px] text-ds-text-primary text-center mt-1">
          Transfer company ownership
        </h2>

        {/* Company List */}
        <div className="flex flex-col items-start w-full gap-3 max-h-[260px] overflow-y-auto pr-1">
          {companies.length === 0 ? (
            <div className="flex items-center justify-center py-8 w-full text-center ds-text-small text-ds-text-muted">
              No owned companies available to transfer.
            </div>
          ) : (
            companies.map(company => {
              const isSelected = selectedCompanyId === company.id;
              return (
                <div
                  key={company.id}
                  onClick={() => setSelectedCompanyId(company.id)}
                  className={`flex flex-row items-center p-[8px_16px] gap-2 w-full min-h-[64px] rounded-[8px] cursor-pointer transition-all border select-none ${
                    isSelected
                      ? 'bg-ds-surface-1 border-ds-accent'
                      : 'bg-ds-surface-1/60 border-ds-border hover:bg-ds-surface-1'
                  }`}
                >
                  <div className="w-12 h-12 rounded-[8px] overflow-hidden relative shrink-0 bg-ds-surface-2 border border-ds-border flex items-center justify-center">
                    {company.logo_url ? (
                      <Image
                        src={company.logo_url}
                        alt={company.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="ds-text-body-1 font-medium text-ds-accent">
                        {company.name?.charAt(0) || 'C'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-start justify-center flex-1 min-w-0">
                    <span className="ds-text-body text-ds-text-primary truncate w-full text-left">
                      {company.name}
                    </span>
                    <span className="ds-text-small text-ds-text-secondary truncate w-full text-left">
                      {company.type || 'SaaS'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row justify-center items-center gap-2 w-full pt-1">
          <button
            type="button"
            onClick={() => {
              const comp = companies.find(c => c.id === selectedCompanyId);
              if (comp) onContinue(comp);
            }}
            disabled={!selectedCompanyId}
            className="w-[94px] h-9 px-3 py-1.5 rounded-full bg-ds-accent text-ds-text-primary ds-text-body-1 font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
          >
            Transfer
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-[94px] h-9 px-3 py-1.5 rounded-full border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary ds-text-body-1 font-medium transition-colors flex items-center justify-center cursor-pointer ds-focus-ring"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
