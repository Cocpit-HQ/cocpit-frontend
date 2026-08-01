"use client";

import React, { useState, useEffect } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import { getBlockedUsers, unblockUser } from '@/features/settings/api/blocked';
import { toast } from 'sonner';

interface BlockedUser {
  id: number | string;
  name: string;
  date: string;
  avatar: string;
}

export function BlockedSettingsPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToUnblock, setUserToUnblock] = useState<BlockedUser | null>(null);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const users = await getBlockedUsers();
        // Assuming the backend returns an array of objects mapping to the UI
        // We'll map the backend response to the BlockedUser interface
        setBlockedUsers(users.map((u: any) => ({
          id: u.id || u.user_id,
          name: u.name || u.full_name || u.username || 'Unknown User',
          date: u.date || (u.created_at ? `Blocked ${new Date(u.created_at).toLocaleDateString()}` : 'Blocked recently'),
          avatar: u.avatar || u.avatar_url || ''
        })));
      } catch (err) {
        toast.error("Failed to load blocked accounts");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlockedUsers();
  }, []);

  const handleUnblockConfirm = async () => {
    if (userToUnblock) {
      try {
        await unblockUser(userToUnblock.id);
        setBlockedUsers(prev => prev.filter(u => u.id !== userToUnblock.id));
        toast.success("User unblocked successfully");
      } catch (err) {
        toast.error("Failed to unblock user");
      } finally {
        setUserToUnblock(null);
      }
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20 relative">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-4 max-w-[698px]">
        {/* Header section */}
        <div className="flex flex-col items-start justify-center mb-2">
          <h1 className="text-[24px] font-semibold text-black leading-[32px]">Blocked accounts</h1>
          <p className="text-[16px] font-normal text-[#6B7280] leading-[24px] mt-1">Manage restricted users and community safety settings.</p>
        </div>

        <div className="flex flex-row items-center gap-4 w-full">
          <span className="text-[12px] font-normal text-[#6B7280] leading-[16px] text-center">
            Block - {blockedUsers.length}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col w-full">
          {isLoading ? (
            <div className="flex justify-center items-center pt-24">
              <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
            </div>
          ) : blockedUsers.length > 0 ? (
            blockedUsers.map(user => (
              <div key={user.id} className="flex flex-row justify-between items-center py-4 px-4 w-full h-[74px]">
                <div className="flex flex-row items-center gap-4">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-[42px] h-[42px] rounded-full object-cover" />
                  ) : (
                    <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center bg-[#EEF2FF]">
                      <span className="text-[18px] font-medium text-[#6366F1]">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <h3 className="text-[18px] font-medium text-black leading-[26px]">{user.name}</h3>
                    <p className="text-[12px] font-normal text-[#6B7280] leading-[16px]">{user.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setUserToUnblock(user)}
                  className="flex flex-row justify-center items-center py-2 px-4 w-[140px] h-[40px] border border-[#6366F1] rounded-[24px] hover:bg-indigo-50 transition-colors"
                >
                  <span className="text-[14px] font-normal text-[#6366F1] leading-[20px] text-center">Unblock</span>
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center pt-24 gap-4">
              <Ban className="w-12 h-12 text-black" strokeWidth={1.5} />
              <div className="flex flex-col items-center gap-1">
                <h3 className="text-[16px] font-medium text-black">Blocked Accounts</h3>
                <p className="text-[14px] text-[#6B7280] text-center">Manage restricted users and community safety settings.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unblock Modal */}
      {userToUnblock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-poppins">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUserToUnblock(null)} />
          <div className="relative bg-white rounded-[24px] p-8 max-w-[400px] w-full mx-4 shadow-xl flex flex-col items-center text-center gap-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-[18px] font-medium text-black leading-[26px]">
                Unblock this {userToUnblock.name} ?
              </h2>
              <p className="text-[14px] font-normal text-[#6B7280] leading-[20px]">
                {userToUnblock.name} will be able to message or find you.They won't be notified that you unblocked them.
              </p>
            </div>
            
            <div className="flex flex-row gap-4 w-full">
              <button 
                onClick={() => setUserToUnblock(null)}
                className="flex-1 py-3 px-6 rounded-full border border-[#6366F1] text-[#6366F1] font-medium text-[16px] hover:bg-indigo-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUnblockConfirm}
                className="flex-1 py-3 px-6 rounded-full bg-[#6366F1] text-white font-medium text-[16px] hover:bg-[#4F46E5] transition-colors"
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
