"use client";

import React from 'react';
import { Ban, Loader2 } from 'lucide-react';
import { useBlockedUsers } from '../../hooks/useBlockedUsers';
import { useSettingsStore } from '@/store/settings.store';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useOrgBlockPermissions } from '@/hooks/useOrgBlockPermissions';

export function BlockedSettingsPage() {
  const { isCompany } = useActiveProfile();
  const { canManageBlock } = useOrgBlockPermissions();
  // Server state (the list + the unblock mutation) is now owned by
  // TanStack Query via useBlockedUsers, instead of a manual
  // useEffect + useState + try/catch fetch.
  const { blockedUsers, isLoading, unblockUser, isUnblocking } = useBlockedUsers();

  // UI-only state (which user the "confirm unblock" modal targets) still
  // lives in the shared settings store — only the id is kept there, per
  // settings.store.ts's rule of never duplicating server-fetched objects
  // in Zustand. The full row is looked up from `blockedUsers` below.
  const userToUnblockId = useSettingsStore((state) => state.blocked.userToUnblockId);
  const setUserToUnblockId = useSettingsStore((state) => state.setBlockedUserToUnblock);
  const userToUnblock = blockedUsers.find((u) => u.id === userToUnblockId) || null;

  const handleUnblockConfirm = () => {
    if (userToUnblock) {
      unblockUser(userToUnblock.id);
      setUserToUnblockId(null);
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20 relative">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-4 max-w-[698px]">
        {/* Header section */}
        <div className="flex flex-col items-start justify-center mb-2">
          <h1 className="text-[24px] font-semibold text-black dark:text-foreground leading-[32px]">Blocked accounts</h1>
          <p className="text-[16px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[24px] mt-1">Manage restricted users and community safety settings.</p>
        </div>

        <div className="flex flex-row items-center gap-4 w-full">
          <span className="text-[12px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[16px] text-center">
            Block - {blockedUsers.length}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col w-full">
          {isLoading ? (
            <div className="flex justify-center items-center pt-24">
              <Loader2 className={`w-8 h-8 animate-spin ${isCompany ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#6366F1] dark:text-primary'}`} />
            </div>
          ) : blockedUsers.length > 0 ? (
            blockedUsers.map(user => (
              <div key={user.id} className="flex flex-row justify-between items-center py-4 px-4 w-full h-[74px]">
                <div className="flex flex-row items-center gap-4">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-[42px] h-[42px] rounded-full object-cover" />
                  ) : (
                    <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center bg-[#EEF2FF]">
                      <span className={`text-[18px] font-medium ${isCompany ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#6366F1] dark:text-primary'}`}>
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-[18px] font-medium text-black dark:text-foreground leading-[26px]">{user.name}</h3>
                    <p className="text-[12px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[16px]">{user.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => canManageBlock && setUserToUnblockId(user.id)}
                  disabled={!canManageBlock}
                  title={!canManageBlock ? "Only organization owners or administrators can unblock accounts" : undefined}
                  className={`flex flex-row justify-center items-center py-2 px-4 w-[140px] h-[40px] border rounded-[24px] transition-colors ${!canManageBlock
                      ? 'border-gray-300 bg-gray-100 text-gray-400 opacity-50 cursor-default dark:border-muted dark:bg-muted dark:text-muted-foreground'
                      : isCompany
                        ? 'border-[#1A73E8] hover:bg-blue-50 dark:hover:bg-primary-tint text-[#1A73E8] dark:text-company-primary cursor-pointer'
                        : 'border-[#6366F1] hover:bg-indigo-50 dark:hover:bg-primary-tint text-[#6366F1] dark:text-primary cursor-pointer'
                    }`}
                >
                  <span className="text-[14px] font-normal leading-[20px] text-center">Unblock</span>
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center pt-24 gap-4">
              <Ban className="w-12 h-12 text-black dark:text-foreground" strokeWidth={1.5} />
              <div className="flex flex-col items-center gap-1">
                <h3 className="text-[16px] font-medium text-black dark:text-foreground">Blocked Accounts</h3>
                <p className="text-[14px] text-[#6B7280] dark:text-muted-foreground text-center">Manage restricted users and community safety settings.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unblock Modal */}
      {userToUnblock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-poppins">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUserToUnblockId(null)} />
          <div className="relative bg-white dark:bg-card rounded-[24px] p-8 max-w-[400px] w-full mx-4 shadow-xl flex flex-col items-center text-center gap-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-[18px] font-medium text-black dark:text-foreground leading-[26px]">
                Unblock this {userToUnblock.name} ?
              </h2>
              <p className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">
                {userToUnblock.name} will be able to message or find you.They won't be notified that you unblocked them.
              </p>
            </div>

            <div className="flex flex-row gap-4 w-full">
              <button
                onClick={() => setUserToUnblockId(null)}
                className={`flex-1 py-3 px-6 rounded-full border ${isCompany ? 'border-[#1A73E8] text-[#1A73E8] hover:bg-blue-50 dark:hover:bg-primary-tint' : 'border-[#6366F1] text-[#6366F1] hover:bg-indigo-50 dark:hover:bg-primary-tint'} font-medium text-[16px] transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleUnblockConfirm}
                disabled={isUnblocking}
                className={`flex-1 py-3 px-6 rounded-full ${isCompany ? 'bg-[#1A73E8] hover:bg-[#1557B0]' : 'bg-[#6366F1] hover:bg-[#4F46E5]'} text-white font-medium text-[16px] transition-colors disabled:opacity-50`}
              >
                Unblock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
