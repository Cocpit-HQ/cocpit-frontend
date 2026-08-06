"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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

import { ActionModal } from './ActionModal';

const OrgItem = ({ org, onClick }: { org: Org; onClick: () => void }) => (
  <div 
    className="flex flex-row items-center gap-4 py-3 w-full cursor-pointer transition-colors rounded-lg px-2 -ml-2"
    onClick={onClick}
  >
    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden bg-gray-100">
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
      <p className="text-[14px] text-[#6B7280] leading-[20px]">{org.type}</p>
    </div>
  </div>
);

export function OrganizationsSettingsPage() {
  const [ownedOrgs, setOwnedOrgs] = useState<Org[]>([
    {
      id: '1',
      name: 'Acme Inc.',
      type: 'SaaS',
      logoUrl: null,
      relation: 'owned',
      createdOn: 'Oct 24, 2023',
      organizationType: 'Company',
      pageStatus: 'active',
    },
    {
      id: '2',
      name: 'Cocpit (Deactivated Mock)',
      type: 'SaaS',
      logoUrl: null,
      relation: 'owned',
      createdOn: 'Oct 24, 2023',
      organizationType: 'Company',
      pageStatus: 'deactivated',
    },
    {
      id: '3',
      name: 'Test Deletion Mock',
      type: 'SaaS',
      logoUrl: null,
      relation: 'owned',
      createdOn: 'Oct 24, 2023',
      organizationType: 'Company',
      pageStatus: 'scheduled_for_deletion',
    }
  ]);

  const [associatedOrgs, setAssociatedOrgs] = useState<Org[]>([
    {
      id: '4',
      name: 'Muenchener Rueckversicherungs-Gesellschaft',
      type: 'SaaS',
      logoUrl: null,
      relation: 'associated',
      joinedOn: 'Oct 24, 2023',
      role: 'Marketing',
      pageStatus: 'associated',
    }
  ]);

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<'reactivate' | 'recover' | 'leave' | null>(null);

  const selectedOrg = [...ownedOrgs, ...associatedOrgs].find(o => o.id === selectedOrgId);

  const updateOrgStatus = (id: string, newStatus: PageStatus) => {
    setOwnedOrgs(orgs => orgs.map(o => o.id === id ? { ...o, pageStatus: newStatus } : o));
    setAssociatedOrgs(orgs => orgs.map(o => o.id === id ? { ...o, pageStatus: newStatus } : o));
    setModalState(null);
  };

  const removeAssociatedOrg = (id: string) => {
    setAssociatedOrgs(orgs => orgs.filter(o => o.id !== id));
    setModalState(null);
    setSelectedOrgId(null);
  };

  if (selectedOrg) {
    return (
      <div className="flex flex-col items-start px-4 py-2 gap-8 w-full max-w-[698px] font-poppins">
        {/* Detail View Header */}
        <div className="flex flex-row items-center gap-4 w-full">
          <button 
            onClick={() => setSelectedOrgId(null)}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex flex-col items-start">
            <h1 className="text-[20px] font-semibold text-black leading-[28px] dark:text-foreground">
              {selectedOrg.relation === 'owned' ? 'Organization details' : 'Association details'}
            </h1>
            <p className="text-[14px] text-[#6B7280] leading-[20px]">
              {selectedOrg.relation === 'owned' ? 'View and manage your organization' : 'View and manage your association'}
            </p>
          </div>
        </div>

        {/* Company Header */}
        <div className="flex flex-row justify-between items-center w-full mt-4">
          <div className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden bg-gray-100">
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
              <p className="text-[14px] text-[#6B7280] leading-[20px]">{selectedOrg.type}</p>
            </div>
          </div>
          <button className="text-[14px] text-[#818CF8] font-medium transition-colors hover:text-[#6c79f7]">
            View page
          </button>
        </div>

        {/* Metadata section */}
        <div className="flex flex-row w-full mt-2">
          <div className="flex flex-col w-1/2 gap-1">
            <span className="text-[14px] text-[#6B7280]">
              {selectedOrg.relation === 'owned' ? 'Created on' : 'Joined on'}
            </span>
            <span className="text-[14px] text-black font-medium dark:text-foreground">
              {selectedOrg.relation === 'owned' ? selectedOrg.createdOn : selectedOrg.joinedOn}
            </span>
          </div>
          <div className="flex flex-col w-1/2 gap-1">
            <span className="text-[14px] text-[#6B7280]">
              {selectedOrg.relation === 'owned' ? 'Organization type' : 'Role'}
            </span>
            <span className="text-[14px] text-black font-medium dark:text-foreground">
              {selectedOrg.relation === 'owned' ? selectedOrg.organizationType : selectedOrg.role}
            </span>
          </div>
        </div>

        {/* Page Status section */}
        <div className="flex flex-col items-start w-full gap-2 mt-4">
          <h2 className="text-[14px] text-[#6B7280] leading-[20px]">Page status</h2>
          
          {selectedOrg.pageStatus === 'active' && (
            <div className="w-full bg-[#EEF2FF] rounded-[16px] p-4">
              <p className="text-[14px] text-black leading-[20px]">
                This page is currently active and fully operational. Visitors can access and interact with all available content and features without any restrictions.
              </p>
            </div>
          )}

          {selectedOrg.pageStatus === 'deactivated' && (
            <div className="w-full bg-[#EEF2FF] rounded-[16px] p-4 flex flex-col items-end gap-4">
              <p className="text-[14px] text-black leading-[20px] w-full">
                This page is currently deactivated and is not visible to visitors. Its content and features are temporarily unavailable until the page is reactivated
              </p>
              <button 
                onClick={() => setModalState('reactivate')}
                className="px-4 py-2 bg-transparent border border-[#818CF8] rounded-[24px] text-[#818CF8] text-[14px] font-medium hover:bg-[#EEF2FF] transition-colors"
              >
                Reactivate page
              </button>
            </div>
          )}

          {selectedOrg.pageStatus === 'scheduled_for_deletion' && (
            <div className="w-full bg-[#FFF5F5] rounded-[16px] p-4 flex flex-col items-end gap-4">
              <p className="text-[14px] text-black leading-[20px] w-full">
                This page has been scheduled for deletion and will be permanently removed after 40 days. You can recover and reactivate the page at any time within this period. Once the 40-day period ends, the page and its associated data cannot be restored
              </p>
              <button 
                onClick={() => setModalState('recover')}
                className="px-4 py-2 bg-transparent border border-[#818CF8] rounded-[24px] text-[#818CF8] text-[14px] font-medium hover:bg-[#EEF2FF] transition-colors"
              >
                Recover page
              </button>
            </div>
          )}

          {selectedOrg.pageStatus === 'associated' && (
            <div className="w-full bg-[#EEF2FF] rounded-[16px] p-4 flex flex-col items-end gap-4">
              <p className="text-[14px] text-black leading-[20px] w-full">
                You are currently associated with this page and have access to its content and features. You can choose to leave the page at any time, after which your access and permissions will be removed
              </p>
              <button 
                onClick={() => setModalState('leave')}
                className="px-4 py-2 bg-transparent border border-[#FF6B6B] rounded-[24px] text-[#FF6B6B] text-[14px] font-medium hover:bg-[#FFF5F5] transition-colors"
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
          description="Once reactivated, the page will become visible and accessible to visitors again."
          confirmText="Reactivate"
          onConfirm={() => updateOrgStatus(selectedOrg.id, 'active')}
          confirmColor="blue"
        />
        <ActionModal
          isOpen={modalState === 'recover'}
          onClose={() => setModalState(null)}
          title={<span>Are you sure you want to recover your <b>"{selectedOrg.name}"</b> page?</span>}
          description="The page will be restored immediately and the scheduled deletion will be canceled."
          confirmText="Recover"
          onConfirm={() => updateOrgStatus(selectedOrg.id, 'active')}
          confirmColor="blue"
        />
        <ActionModal
          isOpen={modalState === 'leave'}
          onClose={() => setModalState(null)}
          title={<span>Are you sure you want to leave <b>"{selectedOrg.name}"</b>?</span>}
          description="You will lose access to the page and its associated features"
          confirmText="Leave"
          onConfirm={() => removeAssociatedOrg(selectedOrg.id)}
          confirmColor="red"
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
          <p className="text-[16px] text-[#6B7280] leading-[24px]">View all owned and associated organizations</p>
        </div>
        
        <button className="flex flex-row justify-center items-center px-4 py-2 gap-2 h-[40px] bg-white border border-[#818CF8] rounded-[24px] dark:bg-transparent">
          <span className="whitespace-nowrap text-[14px] font-medium text-[#818CF8] leading-[20px] text-center">
            New organization +
          </span>
        </button>
      </div>

      {/* Owned Organizations */}
      <div className="flex flex-col items-start w-full gap-4">
        <h2 className="text-[14px] font-medium text-[#6B7280] leading-[20px] uppercase">Owned</h2>
        
        <div className="flex flex-col items-start w-full">
          {ownedOrgs.map(org => (
            <OrgItem key={org.id} org={org} onClick={() => setSelectedOrgId(org.id)} />
          ))}
        </div>
      </div>

      {/* Associated Organizations */}
      <div className="flex flex-col items-start w-full gap-4">
        <h2 className="text-[14px] font-medium text-[#6B7280] leading-[20px] uppercase">Associations</h2>
        
        <div className="flex flex-col items-start w-full">
          {associatedOrgs.map(org => (
            <OrgItem key={org.id} org={org} onClick={() => setSelectedOrgId(org.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
