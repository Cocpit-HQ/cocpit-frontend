"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { companyService } from '@/services/organization.service';
import { ActionModal } from './ActionModal';
import { toast } from 'sonner';

type PageStatus = 'active' | 'deactivated' | 'scheduled_for_deletion' | 'associated';

type Org = {
  id: string;
  name: string;
  type: string;
  logoUrl: string | null;
  relation: 'owned' | 'associated';
  createdOn?: string;
  organizationType?: string;
  joinedOn?: string;
  role?: string;
  pageStatus: PageStatus;
};

const OrgItem = ({ org, onClick }: { org: Org; onClick: () => void }) => (
  <div 
    className="flex flex-row items-center gap-4 py-3 w-full cursor-pointer transition-colors rounded-lg px-2 -ml-2 hover:bg-gray-50 dark:hover:bg-slate-800/50"
    onClick={onClick}
  >
    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
      <Image
        src={org.logoUrl || '/assets/default-company.png'}
        alt={`${org.name} logo`}
        width={48}
        height={48}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex flex-col justify-center items-start">
      <h3 className="text-[16px] font-semibold text-black leading-[24px] dark:text-foreground">{org.name}</h3>
      <p className="text-[14px] text-[#6B7280] dark:text-slate-400 leading-[20px]">{org.type}</p>
    </div>
  </div>
);

export function OrganizationsSettingsPage() {
  const [ownedOrgs, setOwnedOrgs] = useState<Org[]>([]);
  const [associatedOrgs, setAssociatedOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<'reactivate' | 'recover' | 'leave' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrgs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyService.getUserOrganizationsSettings();
      setOwnedOrgs(data.owned || []);
      setAssociatedOrgs(data.associated || []);
    } catch (err: any) {
      console.error('Failed to load user organizations:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const selectedOrg = [...ownedOrgs, ...associatedOrgs].find(o => o.id === selectedOrgId);

  const triggerActorContextRefresh = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cocpit:refresh-actor-context'));
    }
  };

  const handleReactivate = async (otp?: string) => {
    if (!selectedOrg) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await companyService.reactivateOrgWithOTP(selectedOrg.id, otp || '');
      toast.success('Your company account has been reactivated');
      setModalState(null);
      await fetchOrgs();
      triggerActorContextRefresh();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || 'Reactivation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecover = async (otp?: string) => {
    if (!selectedOrg) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await companyService.recoverOrgWithOTP(selectedOrg.id, otp || '');
      setModalState(null);
      await fetchOrgs();
      triggerActorContextRefresh();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || 'Recovery failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!selectedOrg) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await companyService.leaveOrg(selectedOrg.id);
      setModalState(null);
      setSelectedOrgId(null);
      await fetchOrgs();
      triggerActorContextRefresh();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || 'Failed to leave organization');
    } finally {
      setActionLoading(false);
    }
  };


  const handleViewPage = async () => {
    if (!selectedOrg) return;
    try {
      await companyService.switchContext(selectedOrg.id);
      window.location.href = `/organization/${selectedOrg.id}`;
    } catch (err: any) {
      console.error('Switch context error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 w-full max-w-[698px] min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-[14px] text-gray-500 font-poppins">Loading organizations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start px-4 py-6 gap-4 w-full max-w-[698px] font-poppins">
        <div className="w-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-[14px] font-medium leading-[20px]">{error}</p>
        </div>
        <button
          onClick={fetchOrgs}
          className="px-4 py-2 bg-indigo-600 text-white text-[14px] font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (selectedOrg) {
    return (
      <div className="flex flex-col items-start px-4 py-2 gap-8 w-full max-w-[698px] font-poppins">
        {/* Detail View Header */}
        <div className="flex flex-row items-center gap-4 w-full">
          <button 
            onClick={() => { setSelectedOrgId(null); setActionError(null); }}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
          <div className="flex flex-col items-start">
            <h1 className="text-[20px] font-semibold text-black leading-[28px] dark:text-foreground">
              {selectedOrg.relation === 'owned' ? 'Organization details' : 'Association details'}
            </h1>
            <p className="text-[14px] text-[#6B7280] dark:text-slate-400 leading-[20px]">
              {selectedOrg.relation === 'owned' ? 'View and manage your organization' : 'View and manage your association'}
            </p>
          </div>
        </div>

        {/* Company Header */}
        <div className="flex flex-row justify-between items-center w-full mt-4">
          <div className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <Image
                src={selectedOrg.logoUrl || '/assets/default-company.png'}
                alt={`${selectedOrg.name} logo`}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center items-start">
              <h3 className="text-[16px] font-semibold text-black leading-[24px] dark:text-foreground">{selectedOrg.name}</h3>
              <p className="text-[14px] text-[#6B7280] dark:text-slate-400 leading-[20px]">{selectedOrg.type}</p>
            </div>
          </div>
          {selectedOrg.pageStatus !== 'deactivated' && selectedOrg.pageStatus !== 'scheduled_for_deletion' && (
            <button
              onClick={handleViewPage}
              className="text-[14px] text-[#818CF8] font-medium transition-colors hover:text-[#6c79f7]"
            >
              View page
            </button>
          )}
        </div>

        {/* Metadata section */}
        <div className="flex flex-row w-full mt-2">
          <div className="flex flex-col w-1/2 gap-1">
            <span className="text-[14px] text-[#6B7280] dark:text-slate-400">
              {selectedOrg.relation === 'owned' ? 'Created on' : 'Joined on'}
            </span>
            <span className="text-[14px] text-black font-medium dark:text-foreground">
              {selectedOrg.relation === 'owned' ? selectedOrg.createdOn : selectedOrg.joinedOn}
            </span>
          </div>
          <div className="flex flex-col w-1/2 gap-1">
            <span className="text-[14px] text-[#6B7280] dark:text-slate-400">
              {selectedOrg.relation === 'owned' ? 'Organization type' : 'Role'}
            </span>
            <span className="text-[14px] text-black font-medium dark:text-foreground">
              {selectedOrg.relation === 'owned' ? selectedOrg.organizationType : selectedOrg.role}
            </span>
          </div>
        </div>

        {/* Page Status section */}
        <div className="flex flex-col items-start w-full gap-2 mt-4">
          <h2 className="text-[14px] text-[#6B7280] dark:text-slate-400 leading-[20px]">Page status</h2>
          
          {selectedOrg.pageStatus === 'active' && (
            <div className="w-full bg-[#EEF2FF] dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-[16px] p-4">
              <p className="text-[14px] text-black dark:text-slate-200 leading-[20px]">
                This page is currently active and fully operational. Visitors can access and interact with all available content and features without any restrictions.
              </p>
            </div>
          )}

          {selectedOrg.pageStatus === 'deactivated' && (
            <div className="flex flex-col items-end w-full gap-4">
              <div className="w-full bg-[#EEF2FF] dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-[16px] p-4">
                <p className="text-[14px] text-black dark:text-slate-200 leading-[20px] w-full">
                  This page is currently deactivated and is not visible to visitors. Its content and features are temporarily unavailable until the page is reactivated
                </p>
              </div>
              <button 
                onClick={() => { setActionError(null); setModalState('reactivate'); }}
                className="px-4 py-2 bg-transparent border border-[#818CF8] rounded-[24px] text-[#818CF8] text-[14px] font-medium hover:bg-[#EEF2FF] dark:hover:bg-slate-800 transition-colors"
              >
                Reactivate page
              </button>
            </div>
          )}

          {selectedOrg.pageStatus === 'scheduled_for_deletion' && (
            <div className="flex flex-col items-end w-full gap-4">
              <div className="w-full bg-[#FFF5F5] dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-[16px] p-4">
                <p className="text-[14px] text-black dark:text-slate-200 leading-[20px] w-full">
                  This page has been scheduled for deletion and will be permanently removed after 40 days. You can recover and reactivate the page at any time within this period. Once the 40-day period ends, the page and its associated data cannot be restored
                </p>
              </div>
              <button 
                onClick={() => { setActionError(null); setModalState('recover'); }}
                className="px-4 py-2 bg-transparent border border-[#818CF8] rounded-[24px] text-[#818CF8] text-[14px] font-medium hover:bg-[#EEF2FF] dark:hover:bg-slate-800 transition-colors"
              >
                Recover page
              </button>
            </div>
          )}

          {selectedOrg.pageStatus === 'associated' && (
            <div className="flex flex-col items-end w-full gap-4">
              <div className="w-full bg-[#EEF2FF] dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-[16px] p-4">
                <p className="text-[14px] text-black dark:text-slate-200 leading-[20px] w-full">
                  You are currently associated with this page and have access to its content and features. You can choose to leave the page at any time, after which your access and permissions will be removed
                </p>
              </div>
              <button 
                onClick={() => { setActionError(null); setModalState('leave'); }}
                className="px-4 py-2 bg-transparent border border-[#FF6B6B] rounded-[24px] text-[#FF6B6B] text-[14px] font-medium hover:bg-[#FFF5F5] dark:hover:bg-slate-800 transition-colors"
              >
                Leave page
              </button>
            </div>
          )}
        </div>

        {/* Modals */}
        <ActionModal
          isOpen={modalState === 'reactivate'}
          onClose={() => setModalState(null)}
          title={<span>Are you sure you want to reactivate your <b>"{selectedOrg.name}"</b> page?</span>}
          description="A verification code will be sent to the owner email to confirm reactivation."
          confirmText="Reactivate"
          requiresOtp={true}
          onSendOtp={() => companyService.sendReactivateOrgOTP(selectedOrg.id)}
          onConfirm={(otp) => handleReactivate(otp)}
          confirmColor="blue"
          isLoading={actionLoading}
          errorMessage={actionError}
        />
        <ActionModal
          isOpen={modalState === 'recover'}
          onClose={() => setModalState(null)}
          title={<span>Are you sure you want to recover your <b>"{selectedOrg.name}"</b> page?</span>}
          description="A verification code will be sent to the owner email. The page will be restored immediately upon verification."
          confirmText="Recover"
          requiresOtp={true}
          onSendOtp={() => companyService.sendRecoverOrgOTP(selectedOrg.id)}
          onConfirm={(otp) => handleRecover(otp)}
          confirmColor="blue"
          isLoading={actionLoading}
          errorMessage={actionError}
        />
        <ActionModal
          isOpen={modalState === 'leave'}
          onClose={() => setModalState(null)}
          title={<span>Are you sure you want to leave <b>"{selectedOrg.name}"</b>?</span>}
          description="You will lose access to the page and its associated features"
          confirmText="Leave"
          requiresOtp={false}
          onConfirm={() => handleLeave()}
          confirmColor="red"
          isLoading={actionLoading}
          errorMessage={actionError}
        />

      </div>
    );
  }

  return (
    <div className="flex flex-col items-start px-4 py-2 gap-8 w-full max-w-[698px] font-poppins">
      {/* Header section */}
      <div className="flex flex-row justify-between items-start w-full">
        <div className="flex flex-col items-start">
          <h1 className="text-[24px] font-semibold text-black leading-[32px] dark:text-foreground">Organizations</h1>
          <p className="text-[16px] text-[#6B7280] dark:text-slate-400 leading-[24px]">View all owned and associated organizations</p>
        </div>
        
        <button 
          onClick={() => window.location.href = '/company-onboarding'}
          className="flex flex-row justify-center items-center px-4 py-2 gap-2 h-[40px] bg-white border border-[#818CF8] rounded-[24px] dark:bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="whitespace-nowrap text-[14px] font-medium text-[#818CF8] leading-[20px] text-center">
            New organization +
          </span>
        </button>
      </div>

      {/* Owned Organizations */}
      <div className="flex flex-col items-start w-full gap-4">
        <h2 className="text-[14px] font-medium text-[#6B7280] dark:text-slate-400 leading-[20px] uppercase">Owned</h2>
        
        {ownedOrgs.length === 0 ? (
          <p className="text-[14px] text-gray-400 italic">No owned organizations</p>
        ) : (
          <div className="flex flex-col items-start w-full">
            {ownedOrgs.map(org => (
              <OrgItem key={org.id} org={org} onClick={() => setSelectedOrgId(org.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Associated Organizations */}
      <div className="flex flex-col items-start w-full gap-4">
        <h2 className="text-[14px] font-medium text-[#6B7280] dark:text-slate-400 leading-[20px] uppercase">Associations</h2>
        
        {associatedOrgs.length === 0 ? (
          <p className="text-[14px] text-gray-400 italic">No associated organizations</p>
        ) : (
          <div className="flex flex-col items-start w-full">
            {associatedOrgs.map(org => (
              <OrgItem key={org.id} org={org} onClick={() => setSelectedOrgId(org.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

