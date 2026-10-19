"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { BusinessBuildingIcon } from '@/components/icons';
import { companyService } from '@/services/organization.service';
import { ActionModal } from '../components/modals/ActionModal';
import { ReactivateCompanyModal } from '../components';
import { ActionConfirmModal } from '@/shared/commonComponents/ActionConfirmModal';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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

const PAGE_STATUS_CONFIG: Record<
  PageStatus,
  {
    description: string;
    actionText?: string;
    modalTarget?: 'reactivate' | 'recover' | 'leave';
  }
> = {
  active: {
    description:
      'This page is currently active and fully operational. Visitors can access and interact with all available content and features without any restrictions.',
  },
  deactivated: {
    description:
      'This page is currently deactivated and is not visible to visitors. Its content and features are temporarily unavailable until the page is reactivated.',
    actionText: 'Reactivate page',
    modalTarget: 'reactivate',
  },
  scheduled_for_deletion: {
    description:
      'This page has been scheduled for deletion and will be permanently removed after 40 days. You can recover and reactivate the page at any time within this period. Once the 40-day period ends, the page and its associated data cannot be restored.',
    actionText: 'Recover page',
    modalTarget: 'recover',
  },
  associated: {
    description:
      'You are currently associated with this page and have access to its content and features. You can choose to leave the page at any time, after which your access and permissions will be removed.',
    actionText: 'Leave page',
    modalTarget: 'leave',
  },
};

function OrgAvatar({
  logoUrl,
  name,
  className = 'w-12 h-12 rounded-xl',
}: {
  logoUrl?: string | null;
  name?: string;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [logoUrl]);

  return (
    <div
      className={`${className} shrink-0 overflow-hidden relative bg-ds-surface-2 border border-ds-border flex items-center justify-center`}
    >
      {logoUrl && !imageError ? (
        <Image
          src={logoUrl}
          alt={`${name || 'Organization'} logo`}
          fill
          unoptimized
          className="w-full h-full object-cover rounded-xl"
          onError={() => setImageError(true)}
        />
      ) : (
        <BusinessBuildingIcon className="w-6 h-6 text-ds-text-secondary shrink-0" />
      )}
    </div>
  );
}

const OrgItem = React.memo(({ org, onClick }: { org: Org; onClick: () => void }) => (
  <div
    role="button"
    tabIndex={0}
    className="self-stretch py-2 rounded-xl inline-flex justify-start items-center gap-2 cursor-pointer hover:bg-ds-surface-1/40 transition-colors ds-focus-ring"
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
  >
    <OrgAvatar logoUrl={org.logoUrl} name={org.name} />
    <div className="flex-1 min-w-0 inline-flex flex-col justify-start items-start gap-2">
      <div className="ds-text-body-1 text-ds-text-primary">{org.name}</div>
      <div className="ds-text-small text-ds-text-secondary">{org.type}</div>
    </div>
  </div>
));
OrgItem.displayName = 'OrgItem';

export function OrganizationsSettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '/settings/organizations';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

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

  const selectedOrg = useMemo(
    () => ownedOrgs.find(o => o.id === selectedOrgId) || associatedOrgs.find(o => o.id === selectedOrgId) || null,
    [ownedOrgs, associatedOrgs, selectedOrgId]
  );

  const queryClient = useQueryClient();

  const triggerActorContextRefresh = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cocpit:refresh-actor-context'));
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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="w-full max-w-[712px] px-4 py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ds-accent mb-3" />
        <p className="ds-text-small text-ds-text-secondary">Loading organizations...</p>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="w-full max-w-[712px] px-4 py-2 flex flex-col items-start gap-4">
        <div className="w-full bg-ds-error/10 border border-ds-error/20 text-ds-error p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="ds-text-secondary font-medium">{error}</p>
        </div>
        <button
          type="button"
          onClick={fetchOrgs}
          className="h-[36px] px-4 py-1.5 bg-ds-surface-1 rounded-[100px] outline outline-1 outline-offset-[-0.50px] outline-ds-accent inline-flex justify-center items-center cursor-pointer ds-focus-ring"
        >
          <span className="ds-text-body-1 text-ds-text-primary">Try Again</span>
        </button>
      </div>
    );
  }

  /* ── Detail View ── */
  if (selectedOrg) {
    const statusConfig = PAGE_STATUS_CONFIG[selectedOrg.pageStatus];

    return (
      <div className="w-full max-w-[712px] px-2 sm:px-4 py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-3">
        {/* Header: Back + Title */}
        <div className="self-stretch inline-flex justify-start items-center gap-2 shrink-0 pb-1">
          <button
            type="button"
            onClick={() => { setSelectedOrgId(null); setActionError(null); }}
            className="w-8 h-8 flex items-center justify-center cursor-pointer bg-transparent border border-ds-border hover:bg-ds-surface-1 p-0 ds-focus-ring rounded-full shrink-0"
            aria-label="Back to organizations list"
          >
            <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
          </button>
          <div className="ds-text-body-2 text-ds-text-primary">
            {selectedOrg.relation === 'owned' ? 'Organization details' : 'Association details'}
          </div>
        </div>

        {/* Details pane */}
        <div className="w-full flex flex-col gap-3">
          {/* Org Info Row */}
          <div className="self-stretch py-2 rounded-xl flex flex-row justify-between items-center gap-2">
            <div className="flex justify-start items-center gap-2 min-w-0 flex-1">
              <OrgAvatar logoUrl={selectedOrg.logoUrl} name={selectedOrg.name} />
              <div className="inline-flex flex-col justify-start items-start gap-1 min-w-0">
                <div className="ds-text-body-1 text-ds-text-primary truncate">{selectedOrg.name}</div>
                <div className="ds-text-small text-ds-text-secondary truncate">{selectedOrg.type}</div>
              </div>
            </div>
            {selectedOrg.pageStatus !== 'deactivated' && selectedOrg.pageStatus !== 'scheduled_for_deletion' && (
              <button
                type="button"
                onClick={handleViewPage}
                className="h-10 px-4 py-2 bg-ds-surface-1 rounded-3xl flex justify-center items-center cursor-pointer border-none ds-focus-ring shrink-0 ml-2"
              >
                <span className="text-center text-ds-accent ds-text-secondary whitespace-nowrap">View page</span>
              </button>
            )}
          </div>

          {/* Metadata Row */}
          <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-3 sm:gap-4">
            <div className="flex-1 min-w-0 inline-flex flex-col justify-start items-start gap-2">
              <div className="ds-text-body-1 text-ds-text-secondary">
                {selectedOrg.relation === 'owned' ? 'Created on' : 'Joined on'}
              </div>
              <div className="self-stretch ds-text-secondary text-ds-text-primary">
                {selectedOrg.relation === 'owned' ? selectedOrg.createdOn : selectedOrg.joinedOn}
              </div>
            </div>
            <div className="flex-1 min-w-0 inline-flex flex-col justify-start items-start gap-2">
              <div className="ds-text-body-1 text-ds-text-secondary">
                {selectedOrg.relation === 'owned' ? 'Organization type' : 'Role'}
              </div>
              <div className="self-stretch ds-text-secondary text-ds-text-primary">
                {selectedOrg.relation === 'owned' ? selectedOrg.organizationType : selectedOrg.role}
              </div>
            </div>
          </div>

          {/* Page Status */}
          {statusConfig && (
            <div className="self-stretch pt-1.5 flex flex-col justify-start items-end gap-2">
              <div className="self-stretch ds-text-body-1 text-ds-text-secondary">Page status</div>
              <div className="self-stretch p-4 bg-ds-surface-1 rounded-3xl flex flex-col justify-start items-start">
                <div className="self-stretch ds-text-secondary text-ds-text-primary">
                  {statusConfig.description}
                </div>
              </div>
              {statusConfig.actionText && statusConfig.modalTarget && (
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    setModalState(statusConfig.modalTarget!);
                  }}
                  className="h-[36px] px-3 py-1.5 border border-ds-border rounded-[100px] inline-flex justify-center items-center cursor-pointer bg-transparent ds-text-body-1 text-ds-text-primary hover:bg-ds-surface-1 active:bg-ds-surface-2 transition-colors ds-focus-ring"
                >
                  {statusConfig.actionText}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        <ReactivateCompanyModal
          isOpen={modalState === 'reactivate'}
          onClose={() => setModalState(null)}
          org={selectedOrg}
          onSuccess={async () => {
            await fetchOrgs();
            triggerActorContextRefresh();
          }}
        />
        <ActionModal
          isOpen={modalState === 'recover'}
          onClose={() => setModalState(null)}
          title={`Are you sure you want to recover your "${selectedOrg.name}" page?`}
          description="A verification code will be sent to the owner email. The page will be restored immediately upon verification."
          confirmText="Recover"
          requiresOtp={true}
          onSendOtp={() => companyService.sendRecoverOrgOTP(selectedOrg.id)}
          onConfirm={(otp) => handleRecover(otp)}
          confirmColor="blue"
          isLoading={actionLoading}
          errorMessage={actionError}
        />
        <ActionConfirmModal
          isOpen={modalState === 'leave'}
          onClose={() => setModalState(null)}
          title={<span>Are you sure you want to leave &ldquo;{selectedOrg.name}&rdquo;?</span>}
          description="You will lose access to the page and its associated features"
          confirmText="Leave"
          cancelText="Cancel"
          onConfirm={() => handleLeave()}
          confirmColor="red"
          cancelTextColor="secondary"
          isLoading={actionLoading}
          modalClassName="w-80 p-3"
          buttonWidthClass="w-20"
        />
      </div>
    );
  }

  /* ── List View ── */
  return (
    <div className="w-full max-w-[712px] px-2 sm:px-4 py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-3">
      {/* Header / Mobile Back - Visible on mobile only */}
      <div className="self-stretch inline-flex md:hidden justify-start items-center gap-3 shrink-0 pb-1 px-0 sm:px-4">
        <button
          type="button"
          onClick={() => router.replace(basePath)}
          aria-label="Back to settings menu"
          className="-ml-1.5 flex items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
        </button>
        <div className="ds-text-body-2 text-ds-text-primary">Organizations</div>
      </div>

      {/* Container for org items */}
      <div className="w-full flex flex-col gap-3 px-0 sm:px-4">
        {/* Owned label */}
        <div className="self-stretch inline-flex justify-start items-center gap-2.5">
          <div className="text-ds-text-secondary text-xs font-normal font-['DM_Sans'] leading-4">Owned</div>
        </div>

        {/* Owned org items */}
        {!ownedOrgs || ownedOrgs.length === 0 ? (
          <div className="self-stretch flex flex-col justify-center items-center gap-2 py-8 sm:py-10">
            <div className="text-center text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
              No organizations yet
            </div>
            <div className="text-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
              Organizations you&apos;re associated with will appear here
            </div>
          </div>
        ) : (
          ownedOrgs.map(org => (
            <OrgItem key={org.id} org={org} onClick={() => setSelectedOrgId(org.id)} />
          ))
        )}

        {/* Associations label */}
        <div className="self-stretch inline-flex justify-start items-center gap-2.5">
          <div className="text-ds-text-secondary text-xs font-normal font-['DM_Sans'] leading-4">Associations</div>
        </div>

        {/* Associated org items */}
        {!associatedOrgs || associatedOrgs.length === 0 ? (
          <div className="self-stretch flex flex-col justify-center items-center gap-2 py-8 sm:py-10">
            <div className="text-center text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
              No associations yet
            </div>
            <div className="text-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
              Organizations you&apos;re associated with will appear here
            </div>
          </div>
        ) : (
          associatedOrgs.map(org => (
            <OrgItem key={org.id} org={org} onClick={() => setSelectedOrgId(org.id)} />
          ))
        )}
      </div>
    </div>
  );
}
