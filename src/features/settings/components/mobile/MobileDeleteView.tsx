"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useDeleteAccount } from '../../hooks/useAccountSettings';
import { companyService } from '@/services/organization.service';
import { hardLogout } from '@/lib/logout';
import { TransferOwnershipModal } from '../modals/TransferOwnershipModal';
import { SelectCompanyTransferModal, CompanyInfo } from '../modals/SelectCompanyTransferModal';
import { MobileSettingsHeader } from './MobileSettingsHeader';

export function MobileDeleteView({ 
  onBack,
  hasCompanyAccount = false 
}: { 
  onBack?: () => void;
  hasCompanyAccount?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname() || '/settings';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const [ownedCompanies, setOwnedCompanies] = useState<CompanyInfo[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [checkedCompanyIds, setCheckedCompanyIds] = useState<string[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSelectCompanyModalOpen, setIsSelectCompanyModalOpen] = useState(false);
  const [selectedCompanyToTransfer, setSelectedCompanyToTransfer] = useState<CompanyInfo | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const deleteAccountMutation = useDeleteAccount();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.replace(`${basePath}/account`);
    }
  };

  const fetchOwnedCompanies = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (hasCompanyAccount) {
      fetchOwnedCompanies();
    }
  }, [hasCompanyAccount, fetchOwnedCompanies]);

  const toggleCompanyChecked = (id: string) => {
    if (checkedCompanyIds.includes(id)) {
      setCheckedCompanyIds(checkedCompanyIds.filter(cId => cId !== id));
    } else {
      setCheckedCompanyIds([...checkedCompanyIds, id]);
    }
  };

  const allChecked = ownedCompanies.length > 0 && checkedCompanyIds.length === ownedCompanies.length;
  const anyChecked = checkedCompanyIds.length > 0;
  const isDeleteDisabled = hasCompanyAccount && ownedCompanies.length > 0 && !anyChecked;

  const handleOpenTransfer = () => {
    const companiesToTransfer = ownedCompanies.filter(c => !checkedCompanyIds.includes(c.id));
    if (companiesToTransfer.length > 1) {
      setIsSelectCompanyModalOpen(true);
    } else if (companiesToTransfer.length === 1) {
      setSelectedCompanyToTransfer(companiesToTransfer[0]);
      setIsTransferModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (!password) {
      setErrorMsg('Password is required');
      return;
    }
    setErrorMsg('');
    deleteAccountMutation.mutate({ password, companyIdsToDelete: checkedCompanyIds }, {
      onSuccess: async () => {
        await hardLogout('account_deleted');
      },
      onError: (err: any) => {
        setErrorMsg(err?.response?.data?.message || 'Incorrect password');
      }
    });
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
    <div className="flex flex-col w-full min-h-[calc(100vh-120px)] text-ds-text-primary font-sans select-none pb-8">
      <MobileSettingsHeader title="Delete" onBack={handleBack} />

      <div className="flex-1 flex flex-col px-4 py-2 gap-4 w-full max-w-[480px]">
        <h2 className="text-ds-text-primary text-[18px] font-medium font-['DM_Sans'] leading-[24px] m-0">
          Delete your Cocpit account
        </h2>

        <p className="text-ds-text-secondary text-[14px] font-normal font-['DM_Sans'] leading-[20px] m-0">
          Your account will be scheduled for deletion. You can recover it within 40 days using the link sent to your email. After 40 days, your account and all associated data will be permanently deleted
        </p>

        {/* Company accounts section */}
        {hasCompanyAccount && (
          <div className="flex flex-col w-full gap-3 pt-2">
            <h3 className="text-ds-text-primary text-[15px] font-medium font-['DM_Sans'] m-0">
              Company accounts
            </h3>

            {loadingCompanies ? (
              <div className="flex items-center gap-2 py-2 text-ds-text-muted text-sm font-['DM_Sans']">
                <Loader2 className="w-4 h-4 animate-spin text-ds-accent" /> Loading companies...
              </div>
            ) : ownedCompanies.length > 0 ? (
              <div className="flex flex-col gap-2.5 w-full">
                {ownedCompanies.map((company) => {
                  const isChecked = checkedCompanyIds.includes(company.id);
                  return (
                    <label 
                      key={company.id}
                      className="flex items-center justify-between py-1.5 cursor-pointer select-none"
                    >
                      <span className="text-ds-text-primary text-[14px] font-medium font-['DM_Sans']">
                        {company.name}
                      </span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCompanyChecked(company.id)}
                        className="w-5 h-5 rounded border border-ds-border bg-ds-surface-1 text-ds-accent focus:ring-0 cursor-pointer"
                      />
                    </label>
                  );
                })}

                {/* Unchecked explanation note */}
                {!allChecked && (
                  <div className="flex flex-col gap-3 pt-2">
                    <p className="text-ds-text-secondary text-[13px] font-normal font-['DM_Sans'] leading-[18px] m-0">
                      If you keep this unchecked, you&apos;ll need to transfer ownership to another account before deleting your account
                    </p>
                    <div>
                      <button
                        type="button"
                        onClick={handleOpenTransfer}
                        className="h-9 px-5 rounded-full border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary text-sm font-medium font-['DM_Sans'] transition-colors"
                      >
                        Transfer Ownership
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Password input */}
        <div className="flex flex-col w-full gap-1 pt-2">
          <div className={`flex flex-row items-center justify-between pb-2 border-b ${errorMsg ? 'border-ds-error' : 'border-ds-border'}`}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password to confirm"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full bg-transparent border-none p-0 focus:outline-none text-[14px] text-ds-text-primary placeholder:text-ds-text-muted font-['DM_Sans']"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-ds-text-secondary hover:text-ds-text-primary transition-colors p-1"
            >
              {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          {errorMsg && (
            <span className="text-ds-error text-xs pt-1 font-['DM_Sans']">{errorMsg}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row items-center gap-3 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleteDisabled || !password || deleteAccountMutation.isPending}
            className={`h-9 px-6 rounded-full flex justify-center items-center transition-all cursor-pointer font-['DM_Sans'] text-sm font-medium ${
              isDeleteDisabled || !password || deleteAccountMutation.isPending
                ? 'bg-ds-surface-1 text-ds-text-muted cursor-not-allowed border border-ds-border/40'
                : 'bg-ds-error text-white hover:opacity-90 active:scale-95'
            }`}
          >
            {deleteAccountMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              'Delete'
            )}
          </button>

          <button
            type="button"
            onClick={handleBack}
            className="h-9 px-6 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-primary text-sm font-medium font-['DM_Sans'] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
