"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TransferOwnershipModal } from './TransferOwnershipModal';
import { SelectCompanyTransferModal, CompanyInfo } from './SelectCompanyTransferModal';
import { useDeleteAccount } from '@/features/settings/hooks/useAccountSettings';
import { companyService } from '@/services/organization.service';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasCompanyAccount?: boolean;
}

export function DeleteAccountModal({ isOpen, onClose, hasCompanyAccount = false }: DeleteAccountModalProps) {
  const [ownedCompanies, setOwnedCompanies] = useState<CompanyInfo[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [checkedCompanyIds, setCheckedCompanyIds] = useState<string[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSelectCompanyModalOpen, setIsSelectCompanyModalOpen] = useState(false);
  const [selectedCompanyToTransfer, setSelectedCompanyToTransfer] = useState<CompanyInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const deleteAccountMutation = useDeleteAccount();

  useEffect(() => {
    if (isOpen && hasCompanyAccount) {
      fetchOwnedCompanies();
    }
  }, [isOpen, hasCompanyAccount]);

  const fetchOwnedCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const companies = await companyService.getOwnedCompanies();
      const mapped: CompanyInfo[] = companies.map(c => ({
        id: c.company_id || c.org_id || '',
        name: c.name,
        type: c.industry || c.entity_type || 'Company',
        logo_url: c.logo_url
      }));
      setOwnedCompanies(mapped);
    } catch (err: any) {
      console.error("Failed to fetch owned companies:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  if (!isOpen) return null;

  const handleDelete = () => {
    deleteAccountMutation.mutate({ password, companyIdsToDelete: checkedCompanyIds }, {
      onSuccess: () => {
        onClose();
        router.push('/');
      },
      onError: (err: any) => {
        setErrorMsg(err?.response?.data?.message || 'Failed to delete account');
      }
    });
  };

  const allChecked = ownedCompanies.length > 0 && checkedCompanyIds.length === ownedCompanies.length;
  const anyChecked = checkedCompanyIds.length > 0;
  const isDeleteDisabled = hasCompanyAccount && ownedCompanies.length > 0 && !anyChecked;

  const toggleCompanyChecked = (id: string) => {
    if (checkedCompanyIds.includes(id)) {
      setCheckedCompanyIds(checkedCompanyIds.filter(cId => cId !== id));
    } else {
      setCheckedCompanyIds([...checkedCompanyIds, id]);
    }
  };

  const handleOpenTransfer = () => {
    const companiesToTransfer = ownedCompanies.filter(c => !checkedCompanyIds.includes(c.id));
    if (companiesToTransfer.length > 1) {
      setIsSelectCompanyModalOpen(true);
    } else if (companiesToTransfer.length === 1) {
      setSelectedCompanyToTransfer(companiesToTransfer[0]);
      setIsTransferModalOpen(true);
    }
  };

  if (isSelectCompanyModalOpen) {
    return (
      <SelectCompanyTransferModal
        isOpen={true}
        onClose={() => setIsSelectCompanyModalOpen(false)}
        companies={ownedCompanies.filter(c => !checkedCompanyIds.includes(c.id))}
        onContinue={(company) => {
          setIsSelectCompanyModalOpen(false);
          setSelectedCompanyToTransfer(company);
          setIsTransferModalOpen(true);
        }}
      />
    );
  }

  if (isTransferModalOpen && selectedCompanyToTransfer) {
    return (
      <TransferOwnershipModal
        isOpen={true}
        onClose={() => setIsTransferModalOpen(false)}
        onBack={() => {
          setIsTransferModalOpen(false);
          if (ownedCompanies.length > 1) {
            setIsSelectCompanyModalOpen(true);
          }
        }}
        companyId={selectedCompanyToTransfer.id}
        companyName={selectedCompanyToTransfer.name}
        onTransferSuccess={() => {
          setIsTransferModalOpen(false);
          fetchOwnedCompanies();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* Outer Rounded Container */}
      <div className="relative flex flex-col items-center bg-ds-surface-2 border border-ds-border rounded-2xl w-[480px] max-w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Inner Scrollable Container */}
        <div className={`relative flex flex-col items-center w-full p-6 ${hasCompanyAccount ? 'max-h-[85vh] overflow-y-auto' : 'h-auto'}`}>

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-surface-1 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Description */}
          <div className="flex flex-col items-center gap-2 mb-5 w-full text-center mt-1">
            <h2 className="ds-text-body-2 text-ds-text-primary">Delete your Cocpit account</h2>
            <p className="ds-text-small text-ds-text-secondary max-w-sm">
              Your account will be scheduled for deletion. You can recover it within 40 days using the link sent to your email. After 40 days, your account and all associated data will be permanently deleted.
            </p>
          </div>

          {/* Company Accounts Block */}
          {hasCompanyAccount && (
            <div className="flex flex-col items-center w-full bg-ds-surface-1 border border-ds-border rounded-xl p-4 gap-3 mb-5">
              <h3 className="ds-text-small-2 text-ds-text-primary self-start">Company accounts</h3>

              {loadingCompanies ? (
                <div className="flex items-center justify-center py-4 ds-text-small text-ds-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-ds-accent" /> Loading owned companies...
                </div>
              ) : (
                <div className="flex flex-col items-start w-full gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {ownedCompanies.map(company => (
                    <label key={company.id} className="flex items-center gap-2.5 cursor-pointer w-full py-1">
                      <input
                        type="checkbox"
                        checked={checkedCompanyIds.includes(company.id)}
                        onChange={() => toggleCompanyChecked(company.id)}
                        className="w-4 h-4 rounded border-ds-border text-ds-accent focus:ring-ds-accent bg-ds-surface-2 cursor-pointer flex-shrink-0"
                      />
                      <span className="ds-text-small text-ds-text-secondary truncate">
                        Also delete <span className="font-semibold text-ds-text-primary">{company.name}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {!allChecked && ownedCompanies.length > 0 && (
                <div className="flex flex-col items-center gap-2 pt-2 border-t border-ds-border/60 w-full text-center">
                  <span className="ds-text-meta text-ds-text-muted uppercase tracking-wider">Or</span>
                  <p className="ds-text-small text-ds-text-secondary">
                    If you keep this unchecked, you&apos;ll need to transfer ownership to another account before deleting your account.
                  </p>
                  <button
                    onClick={handleOpenTransfer}
                    className="ds-btn ds-btn-secondary ds-text-small-1 h-9 px-4 mt-1 border border-ds-border hover:border-ds-accent hover:text-ds-accent transition-colors"
                  >
                    Transfer Ownership
                  </button>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="w-full p-2.5 mb-4 rounded-lg bg-ds-error/10 border border-ds-error/20 text-ds-error ds-text-small text-center">
              {errorMsg}
            </div>
          )}

          <div className="w-full mb-5">
            <label className="ds-text-small-1 text-ds-text-secondary mb-1.5 block">
              Confirm your password
            </label>
            <input
              type="password"
              className="ds-input w-full bg-ds-surface-1 border border-ds-border rounded-lg text-ds-text-primary focus:outline-none focus:border-ds-accent focus:ring-1 focus:ring-ds-accent ds-text-small"
              placeholder="Enter your password to confirm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end w-full gap-3 pt-2 border-t border-ds-border/40">
            <button
              onClick={onClose}
              className="ds-btn ds-btn-secondary ds-text-body-1 h-9 px-5 border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-secondary hover:text-ds-text-primary"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleteDisabled || !password || deleteAccountMutation.isPending}
              className={`ds-btn ds-text-body-1 h-9 px-5 rounded-lg text-white font-medium transition-all ${
                isDeleteDisabled || !password
                  ? 'bg-ds-error/40 text-white/50 cursor-not-allowed'
                  : 'bg-ds-error hover:opacity-90 active:scale-95 shadow-sm'
              }`}
            >
              {deleteAccountMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
