"use client";

import React, { useState, useCallback, memo } from 'react';
import { Loader2, ChevronLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { BlockIcon } from '@/components/icons';
import { useBlockedUsers, BlockedUser } from '../hooks/useBlockedUsers';
import { ActionConfirmModal } from '@/shared/commonComponents/ActionConfirmModal';

interface BlockedUserRowProps {
  user: BlockedUser;
  onUnblock: (user: BlockedUser) => void;
}

const BlockedUserRow = memo(({ user, onUnblock }: BlockedUserRowProps) => {
  const [imageError, setImageError] = useState(false);

  // Removed hover classes from the row since it is not interactive
  return (
    <div className="self-stretch p-3 sm:p-4 inline-flex justify-between items-center rounded-xl gap-2">
      <div className="flex justify-start items-center gap-2 min-w-0 flex-1 mr-2">
        {user.avatar && !imageError ? (
          <img
            className="w-8 h-8 rounded-full object-cover shrink-0"
            src={user.avatar}
            alt={user.name}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-ds-surface-1 border border-ds-border flex items-center justify-center ds-text-small text-ds-text-primary font-medium shrink-0">
            {user.name?.charAt(0) || 'U'}
          </div>
        )}
        <div className="inline-flex flex-col justify-center items-start min-w-0">
          <div className="justify-center ds-text-body-2 text-ds-text-primary truncate">
            {user.name}
          </div>
          <div className="justify-center ds-text-small text-ds-text-secondary truncate">
            {user.date || 'Blocked recently'}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onUnblock(user)}
        aria-label={`Unblock ${user.name}`}
        className="h-[36px] px-3 py-1.5 bg-ds-surface-1 rounded-[100px] outline outline-1 outline-offset-[-0.50px] outline-ds-accent inline-flex justify-center items-center cursor-pointer hover:bg-ds-surface-2 transition-colors ds-focus-ring shrink-0"
      >
        <span className="ds-text-body-1 text-ds-text-primary">Unblock</span>
      </button>
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
    <div className="w-full max-w-[712px] px-2 sm:px-4 py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-3">
      {/* Count Label & Mobile Back - Fixed Header */}
      <div className="sticky top-0 self-stretch inline-flex justify-start items-center gap-3 shrink-0 py-2 px-0 sm:px-4 bg-ds-bg z-30">
        <button
          type="button"
          onClick={() => router.push(basePath)}
          aria-label="Back to settings menu"
          className="flex md:hidden items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
        </button>
        <div className="text-center justify-center ds-text-small text-ds-text-secondary">
          Block - {count}
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full px-0 sm:px-4 flex flex-col gap-3">
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
