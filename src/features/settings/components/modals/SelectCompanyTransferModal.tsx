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
      <div className="relative flex flex-col items-center bg-ds-surface-2 border border-ds-border rounded-2xl p-6 w-[450px] max-w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Close Button Area */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-surface-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Wrapper */}
        <div className="flex flex-col items-center w-full mt-1">

          {/* Header */}
          <div className="flex flex-col items-center gap-1.5 mb-5 text-center">
            <h2 className="ds-text-body-2 text-ds-text-primary">Transfer company ownership</h2>
            <p className="ds-text-small text-ds-text-secondary">
              Select the company you want to transfer
            </p>
          </div>

          {/* Company List */}
          <div className="flex flex-col w-full gap-2.5 mb-5 max-h-[240px] overflow-y-auto pr-1">
            {companies.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-center ds-text-small text-ds-text-muted">
                No owned companies available to transfer.
              </div>
            ) : (
              companies.map(company => {
                const isSelected = selectedCompanyId === company.id;
                return (
                  <div
                    key={company.id}
                    onClick={() => setSelectedCompanyId(company.id)}
                    className={`flex items-center gap-3 p-3 w-full rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-ds-accent bg-ds-surface-1'
                        : 'border-ds-border bg-ds-surface-1/50 hover:bg-ds-surface-1'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0 bg-ds-surface-2 border border-ds-border flex items-center justify-center">
                      {company.logo_url ? (
                        <Image
                          src={company.logo_url}
                          alt={company.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="ds-text-body-2 text-ds-accent">
                          {company.name?.charAt(0) || 'C'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 justify-center truncate">
                      <span className="ds-text-small-2 text-ds-text-primary truncate">{company.name}</span>
                      {company.type && <span className="ds-text-meta text-ds-text-muted">{company.type}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end w-full gap-3 pt-3 border-t border-ds-border/40">
            <button
              onClick={onClose}
              className="ds-btn ds-btn-secondary ds-text-body-1 h-9 px-5 border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-secondary hover:text-ds-text-primary"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                const comp = companies.find(c => c.id === selectedCompanyId);
                if (comp) onContinue(comp);
              }}
              disabled={!selectedCompanyId}
              className="ds-btn ds-text-body-1 h-9 px-5 rounded-lg bg-ds-accent text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
