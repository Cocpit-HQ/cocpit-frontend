"use client";

import React, { useState, useCallback, memo } from 'react';
import { Loader2, ChevronLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { BlockIcon, UserIcon, BusinessBuildingIcon } from '@/components/icons';
import { useBlockedUsers, BlockedUser } from '../hooks/useBlockedUsers';
import { ActionConfirmModal } from '@/shared/commonComponents/ActionConfirmModal';
import { MobileSettingsHeader } from '../components/MobileSettingsView';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOrgBlockPermissions } from '@/hooks/useOrgBlockPermissions';

interface BlockedUserRowProps {
  user: BlockedUser;
  onUnblock: (user: BlockedUser) => void;
  canManageBlock?: boolean;
  noBlockMessage?: string;
}

const BlockedUserRow = memo(({ user, onUnblock, canManageBlock = true, noBlockMessage }: BlockedUserRowProps) => {
  const router = useRouter();
  const roundedClass = user.isCompany ? 'rounded-[8px]' : 'rounded-full';

  const handleNavigate = () => {
    const target = user.slug || user.account_name || user.id;
    if (!target) return;
    if (user.isCompany) {
      router.push(`/organization/${target}`);
    } else {
      router.push(`/profile/${target}`);
    }
  };

  return (
    <div className="self-stretch p-3 sm:p-4 inline-flex justify-between items-center rounded-xl gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNavigate();
          }
        }}
        className="flex justify-start items-center gap-2 min-w-0 flex-1 mr-2 cursor-pointer hover:opacity-80 transition-opacity ds-focus-ring rounded-lg"
      >
        <div className={`w-8 h-8 ${roundedClass} bg-ds-surface-1 border border-ds-border flex items-center justify-center shrink-0`}>
          {user.isCompany ? (
            <BusinessBuildingIcon className="w-5 h-5 text-ds-text-secondary" />
          ) : (
            <UserIcon className="w-5 h-5 text-ds-text-secondary" />
          )}
        </div>
        <div className="inline-flex flex-col justify-center items-start min-w-0">
          <div className="justify-center ds-text-body-2 text-ds-text-primary truncate">
            {user.name}
          </div>
          <div className="justify-center ds-text-small text-ds-text-secondary truncate">
            {user.date || 'Blocked recently'}
          </div>
        </div>
      </div>

      {!canManageBlock ? (
        <TooltipProvider>
          <Tooltip delayDuration={100} enableTouch>
            <TooltipTrigger asChild>
              <span className="inline-block cursor-not-allowed">
                <button
                  type="button"
                  disabled
                  className="h-[36px] px-3 py-1.5 bg-ds-surface-1 rounded-[100px] outline outline-1 outline-offset-[-0.50px] outline-ds-accent inline-flex justify-center items-center opacity-50 pointer-events-none shrink-0"
                >
                  <span className="ds-text-body-1 text-ds-text-primary">Unblock</span>
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs font-['DM_Sans'] z-50">
              {noBlockMessage || "You don't have access to block/unblock on the behalf of company"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <button
          type="button"
          onClick={() => onUnblock(user)}
          aria-label={`Unblock ${user.name}`}
          className="h-[36px] px-3 py-1.5 bg-ds-surface-1 rounded-[100px] outline outline-1 outline-offset-[-0.50px] outline-ds-accent inline-flex justify-center items-center cursor-pointer hover:bg-ds-surface-2 transition-colors ds-focus-ring shrink-0"
        >
          <span className="ds-text-body-1 text-ds-text-primary">Unblock</span>
        </button>
      )}
    </div>
  );
});

BlockedUserRow.displayName = 'BlockedUserRow';

export function BlockedSettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '/settings/blocked';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const { blockedUsers, isLoading, unblockUser, isUnblocking } = useBlockedUsers();
  const { canManageBlock, message: noBlockMessage } = useOrgBlockPermissions();
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);

  const handleSelectUser = useCallback((user: BlockedUser) => {
    setSelectedUser(user);
  }, []);

  const handleConfirmUnblock = useCallback(() => {
    if (!selectedUser) return;
    unblockUser(selectedUser.id);
    setSelectedUser(null);
  }, [selectedUser, unblockUser]);

  const count = blockedUsers?.length || 0;

  return (
    <div className="w-full max-w-[712px] p-0 md:px-4 md:py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-0 md:gap-3">
      {/* Mobile Header: < Blocked accounts */}
      <MobileSettingsHeader 
        title="Blocked accounts" 
        rightElement={<span className="text-ds-text-secondary text-[13px] font-['DM_Sans']">Block - {count}</span>} 
      />

      {/* Desktop Header */}
      <div className="hidden md:inline-flex sticky top-0 self-stretch justify-start items-center gap-3 shrink-0 py-2 px-0 bg-ds-bg z-30">
        <div className="text-center justify-center ds-text-small text-ds-text-secondary">
          Block - {count}
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full px-4 md:px-0 flex flex-col gap-3">
        {isLoading ? (
          <div className="self-stretch h-48 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-ds-accent mb-3" />
            <p className="ds-text-small text-ds-text-secondary">Loading blocked accounts...</p>
          </div>
        ) : count === 0 ? (
          /* Empty State */
          <div className="self-stretch h-48 flex flex-col justify-center items-center">
            <div className="w-10 h-10 relative overflow-hidden flex items-center justify-center mb-2">
              <BlockIcon className="w-8 h-8 text-ds-text-primary" size={32} />
            </div>
            <div className="self-stretch h-12 px-5 py-2.5 flex flex-col justify-center items-center gap-1">
              <div className="text-center justify-start ds-text-body text-ds-text-primary">
                Blocked Accounts
              </div>
              <div className="justify-center ds-text-secondary text-ds-text-secondary text-center">
                Manage restricted users and community safety settings.
              </div>
            </div>
          </div>
        ) : (
          /* List of Blocked Users */
          <div className="self-stretch flex flex-col justify-center items-start">
            {blockedUsers!.map((user: BlockedUser) => (
              <BlockedUserRow
                key={user.id}
                user={user}
                onUnblock={handleSelectUser}
                canManageBlock={canManageBlock}
                noBlockMessage={noBlockMessage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Unblock Confirmation Modal */}
      <ActionConfirmModal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        onConfirm={handleConfirmUnblock}
        title={`Unblock this ${selectedUser?.name} ?`}
        description={`${selectedUser?.name} will be able to message or find you.They won't be notified that you unblocked them.`}
        confirmText="Unblock"
        cancelText="Cancel"
        isLoading={isUnblocking}
        modalClassName="w-80 p-3"
        buttonWidthClass="w-20"
      />
    </div>
  );
}

export default BlockedSettingsPage;
