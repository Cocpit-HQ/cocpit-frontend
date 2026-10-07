"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, BadgeCheck, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TransferOwnershipModal } from './TransferOwnershipModal';
import { SelectCompanyTransferModal, CompanyInfo } from './SelectCompanyTransferModal';
import { useDeleteAccount } from '@/features/settings/hooks/useAccountSettings';
import { companyService } from '@/services/organization.service';
import { hardLogout } from '@/lib/logout';

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
  const [showPassword, setShowPassword] = useState(false);

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
      onSuccess: async () => {
        onClose();
        await hardLogout('account_deleted');
      },
      onError: (err: any) => {
        setErrorMsg('incorrect password');
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
      <div className="relative flex flex-col items-center bg-ds-bg border border-ds-border rounded-2xl w-[304px] p-6 gap-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Title & Description */}
        <div className="flex flex-col items-center gap-2 w-full text-center">
          <h2 className="ds-text-body-1 text-ds-text-primary">Delete your Cocpit account?</h2>
          <p className="ds-text-small text-ds-text-secondary">
            Your account will be scheduled for deletion. You can recover it within 40 days using the link sent to your email. After 40 days, your account and all associated data will be permanently deleted
          </p>
        </div>

        {/* Company Accounts Block */}
        {hasCompanyAccount && (
          <div className="flex flex-col items-center w-full bg-ds-bg rounded-2xl gap-3">
            <h3 className="ds-text-body-1 text-ds-text-primary self-center">Company accounts</h3>

            {loadingCompanies ? (
              <div className="flex items-center justify-center py-4 ds-text-small text-ds-text-muted">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-ds-accent" /> Loading...
              </div>
            ) : (
              <div className="flex flex-col items-start w-full gap-3 max-h-[160px] overflow-y-auto pr-1">
                {ownedCompanies.map(company => (
                  <label key={company.id} className="flex items-center gap-2 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={checkedCompanyIds.includes(company.id)}
                      onChange={() => toggleCompanyChecked(company.id)}
                      className="w-6 h-6 rounded bg-ds-surface-1 border border-ds-border text-ds-accent focus:ring-ds-accent cursor-pointer flex-shrink-0"
                    />
                    <span className="ds-text-secondary text-ds-text-secondary">
                      Also delete <span className="text-ds-text-primary">{company.name}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {!allChecked && ownedCompanies.length > 0 && (
              <div className="flex flex-col items-center gap-3 w-full text-center mt-2">
                <span className="ds-text-small text-ds-text-secondary uppercase">Or</span>
                <p className="ds-text-secondary text-ds-text-secondary px-4">
                  If you keep this unchecked, you'll need to transfer ownership to another account before deleting your account
                </p>
                <button
                  onClick={handleOpenTransfer}
                  className="flex flex-row justify-center items-center px-4 py-[6px] h-9 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors ds-text-body-1 text-ds-text-primary whitespace-nowrap"
                >
                  Transfer Ownership
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col w-full gap-[4px] shrink-0">
          <div className={`flex flex-col justify-center items-start w-full pb-[6px] px-0 border-b ${errorMsg ? 'border-ds-error' : 'border-ds-border'}`}>
            <div className="flex flex-row justify-between items-center w-full gap-2.5 p-0 shrink-0">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 ds-text-secondary text-ds-text-primary placeholder:text-ds-text-muted"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
              />
            {password && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-ds-text-secondary hover:text-ds-text-primary transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4 shrink-0" />
                  ) : (
                    <EyeOff className="w-4 h-4 shrink-0" />
                  )}
                </button>
              </div>
            )}
            </div>
          </div>
          {/* Supporting Area */}
          <div className="ds-supporting-area min-h-[16px] w-full flex items-start">
            {errorMsg && (
              <span className="ds-text-small text-ds-error m-0 p-0 leading-[16px]">{errorMsg}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row justify-center items-center gap-3 w-full">
          <button
            onClick={handleDelete}
            disabled={isDeleteDisabled || !password || deleteAccountMutation.isPending}
            className={`flex flex-row justify-center items-center px-4 py-[6px] h-9 rounded-full transition-all ${
              isDeleteDisabled || !password
                ? 'bg-ds-surface-2 text-ds-text-muted cursor-not-allowed'
                : 'bg-ds-accent hover:opacity-90 active:scale-95 shadow-sm text-ds-text-primary'
            }`}
          >
            {deleteAccountMutation.isPending ? (
               <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="ds-text-body-1">Delete</span>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="flex flex-row justify-center items-center px-4 py-[6px] h-9 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-primary"
          >
            <span className="ds-text-body-1">Cancel</span>
          </button>
        </div>

      </div>
    </div>
  );
}
