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
        setErrorMsg('Incorrect password');
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
      <div className="relative flex flex-col items-center bg-ds-bg border border-ds-border rounded-[16px] w-[403px] max-w-[calc(100vw-32px)] p-3 gap-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Title & Description */}
        <div className="flex flex-col items-center gap-2 w-full text-center">
          <h2 className="ds-text-body-1 text-ds-text-primary">Delete your Cocpit account?</h2>
          <p className="ds-text-secondary text-ds-text-secondary leading-[20px]">
            Your account will be scheduled for deletion. You can recover it within 40 days using the link sent to your email. After 40 days, your account and all associated data will be permanently deleted
          </p>
        </div>

        {/* Company Accounts Block */}
        {hasCompanyAccount && (
          <div className="flex flex-col items-center w-full bg-ds-bg rounded-[24px] p-4 gap-2">
            <h3 className="ds-text-body-1 text-ds-text-primary text-center">Company accounts</h3>

            {loadingCompanies ? (
              <div className="flex items-center justify-center py-4 ds-text-small text-ds-text-muted">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-ds-accent" /> Loading...
              </div>
            ) : (
              <div className="flex flex-col items-center w-full gap-3 max-h-[160px] overflow-y-auto pr-1">
                {ownedCompanies.map(company => {
                  const isChecked = checkedCompanyIds.includes(company.id);
                  return (
                    <div
                      key={company.id}
                      onClick={() => toggleCompanyChecked(company.id)}
                      className="flex flex-row items-start gap-2 cursor-pointer w-full max-w-[272px] select-none"
                    >
                      <div
                        className={`w-6 h-6 rounded-[4px] border shrink-0 flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-ds-accent border-ds-accent'
                            : 'bg-ds-surface-1 border-ds-border hover:border-ds-text-muted'
                        }`}
                      >
                        {isChecked && (
                          <svg className="w-4 h-4 text-white stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="ds-text-secondary text-ds-text-secondary text-left leading-[20px] break-words flex-1">
                        Also delete <span className="text-ds-text-primary font-medium">{company.name}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {!allChecked && ownedCompanies.length > 0 && (
              <div className="flex flex-col items-center gap-3 w-full text-center mt-1">
                <span className="font-poppins text-[12px] leading-[16px] text-ds-text-secondary text-center">
                  Or
                </span>
                <p className="ds-text-secondary text-ds-text-secondary text-center max-w-[345px] leading-[20px]">
                  If you keep this unchecked, you&apos;ll need to transfer ownership to another account before deleting your account
                </p>
                <button
                  type="button"
                  onClick={handleOpenTransfer}
                  className="flex flex-row justify-center items-center px-3 py-[6px] h-9 w-[172px] rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors ds-text-body-1 text-ds-text-primary cursor-pointer ds-focus-ring whitespace-nowrap"
                >
                  Transfer ownership
                </button>
              </div>
            )}
          </div>
        )}

        {/* Enter Password */}
        <div className="flex flex-col w-full gap-1 shrink-0 px-1">
          <label className="ds-text-small-1 text-ds-text-secondary text-left w-full">Enter Password</label>
          <div className={`flex flex-col justify-center items-start w-full pb-1 px-0 border-b ${errorMsg ? 'border-ds-error' : 'border-ds-border'}`}>
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
                    className="text-ds-text-secondary hover:text-ds-text-primary transition-colors focus:outline-none cursor-pointer"
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
        <div className="flex flex-row justify-center items-center gap-2 w-full">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleteDisabled || !password || deleteAccountMutation.isPending}
            className={`flex flex-row justify-center items-center px-3 py-[6px] h-9 w-[77px] rounded-full transition-all cursor-pointer ${
              isDeleteDisabled || !password
                ? 'bg-ds-surface-2 text-ds-text-muted cursor-not-allowed opacity-50'
                : 'bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary'
            }`}
          >
            {deleteAccountMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-ds-text-primary" />
            ) : (
              <span className="ds-text-body-1 text-ds-text-primary">Delete</span>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex flex-row justify-center items-center px-3 py-[6px] h-9 w-[77px] rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-primary cursor-pointer ds-focus-ring"
          >
            <span className="ds-text-body-1 text-ds-text-primary">Cancel</span>
          </button>
        </div>

      </div>
    </div>
  );
}
