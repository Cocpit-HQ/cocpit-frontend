"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TransferOwnershipModal } from './TransferOwnershipModal';
import { SelectCompanyTransferModal, CompanyInfo } from './SelectCompanyTransferModal';
import { useDeleteAccount } from '../../../../hooks/useAccountSettings';
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
        router.push('/login');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm font-poppins">
      <div className={`relative flex flex-col items-center bg-white rounded-[24px] p-4 w-[450px] max-w-full shadow-lg ${hasCompanyAccount ? 'h-[550px]' : 'h-auto pb-2'}`}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#FF6B6B] hover:opacity-80 transition-opacity"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title & Description */}
        <div className="flex flex-col items-center gap-2 mb-4 w-[418px] mt-2">
          <h2 className="text-[18px] font-medium text-black leading-[26px] text-center m-0">Delete your Cocpit account</h2>
          <p className="text-[14px] font-normal text-[#6B7280] leading-[20px] text-center m-0 px-2">
            Your account will be scheduled for deletion. You can recover it within 40 days using the link sent to your email. After 40 days, your account and all associated data will be permanently deleted
          </p>
        </div>

        {/* Company Accounts Block */}
        {hasCompanyAccount && (
          <div className="flex flex-col items-center w-[418px] bg-[#EEF2FF] rounded-[24px] p-4 gap-2 mb-6">
            <h3 className="text-[14px] font-semibold text-black leading-[20px] mb-1">Company accounts</h3>
            
            {loadingCompanies ? (
              <div className="flex items-center justify-center py-4 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin mr-1" /> Loading owned companies...
              </div>
            ) : (
              <div 
                className="flex flex-col items-start w-full gap-2 mb-2 px-[40px] max-h-[160px] overflow-y-auto pr-2 [&:not(:hover)]:[scrollbar-width:none] [&:not(:hover)::-webkit-scrollbar]:w-0 [&:not(:hover)::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
              >
                {ownedCompanies.map(company => (
                  <label key={company.id} className="flex items-center gap-2 cursor-pointer w-full h-[20px]">
                    <input 
                      type="checkbox" 
                      checked={checkedCompanyIds.includes(company.id)} 
                      onChange={() => toggleCompanyChecked(company.id)} 
                      className="w-[18px] h-[18px] rounded-[2px] border-[#6B7280] cursor-pointer flex-shrink-0"
                    />
                    <span className="text-[14px] font-normal text-[#6B7280] leading-[20px] truncate">
                      Also delete <span className="font-semibold text-black">{company.name}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            
            {!allChecked && ownedCompanies.length > 0 && (
              <>
                <span className="text-[12px] font-normal text-[#6B7280] leading-[16px] text-center">Or</span>
                
                <p className="text-[14px] font-normal text-[#6B7280] leading-[20px] text-center">
                  If you keep this unchecked, you'll need to transfer ownership to another account before deleting your account
                </p>
                
                <button 
                  onClick={handleOpenTransfer}
                  className="flex items-center justify-center w-[168px] h-[40px] rounded-[24px] border border-[#6366F1] text-[#6366F1] text-[14px] font-normal leading-[20px] transition-colors hover:bg-indigo-50 mt-1"
                >
                  Transfer Ownership
                </button>
              </>
            )}
          </div>
        )}

        {errorMsg && <p className="text-[14px] text-[#FF6B6B] mb-2">{errorMsg}</p>}

        <div className="w-[418px] mb-4">
          <input
            type="password"
            className="w-full p-2.5 rounded-[12px] border border-[#E5E7EB] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#818CF8]"
            placeholder="Enter your password to confirm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-row justify-center items-center w-[418px] h-[40px] gap-4 ${hasCompanyAccount ? 'mt-auto' : 'mt-4'}`}>
          <button 
            onClick={onClose} 
            className="flex items-center justify-center w-[140px] h-[40px] rounded-[24px] border border-[#818CF8] bg-white text-[#818CF8] text-[14px] font-normal leading-[20px] transition-colors hover:bg-indigo-50"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleDelete} 
            disabled={isDeleteDisabled || !password || deleteAccountMutation.isPending}  
            className={`flex items-center justify-center w-[140px] h-[40px] rounded-[24px] text-[14px] font-normal leading-[20px] transition-colors ${
              isDeleteDisabled ? 'bg-[#FFF6F6] text-[#FF6B6B]/50 border border-transparent cursor-not-allowed' : 'bg-[#FF6B6B] text-white hover:opacity-90 border border-white'
            }`}
          >
            {deleteAccountMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
        
      </div>
    </div>
  );
}
