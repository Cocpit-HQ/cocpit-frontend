import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Icon } from '@iconify/react';
import { Search, Check, X } from 'lucide-react';
import { useChannelInvitees, useInviteSubscribers } from '../hooks/useChannelInvitees';

interface InviteChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteChannelModal({ isOpen, onClose }: InviteChannelModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { invitees, isLoading } = useChannelInvitees(search);
  const inviteMutation = useInviteSubscribers();

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleClose = () => {
    setSearch('');
    setSelected(new Set());
    onClose();
  };

  const handleInvite = () => {
    inviteMutation.mutate(Array.from(selected), {
      onSuccess: () => handleClose(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-[444px] w-full rounded-[24px] p-4 flex flex-col h-[394px] border-none [&>button]:hidden"
        style={{ padding: '16px' }}
      >
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={handleClose} 
            className="text-[#EF4444] hover:opacity-80 transition-opacity"
          >
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 w-full h-full max-w-[412px] mx-auto pt-2">
          <DialogHeader className="flex flex-col items-center gap-2 space-y-0 w-full p-0">
            <DialogTitle className="font-['Poppins'] text-[18px] leading-[26px] font-medium text-center text-black dark:text-white">
              Invite people
            </DialogTitle>
            <p className="text-[12px] leading-[16px] text-[#6B7280] font-['Poppins'] text-center">
              Invite people to join your channel
            </p>
          </DialogHeader>

          <div className="relative w-full max-w-[360px] h-[40px] flex-shrink-0">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full h-full pl-4 pr-10 rounded-full border border-[#6B7280] bg-white dark:bg-[#0B0F19] text-[16px] font-['Poppins'] text-black dark:text-[#F9FAFB] outline-none focus:border-[#1A73E8] placeholder:text-[#6B7280]"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#6B7280]" />
          </div>

          <div className="w-full max-w-[360px] h-[160px] overflow-y-auto flex flex-col gap-2 flex-shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {isLoading ? (
              <p className="text-center text-[#6B7280] text-sm py-8 font-['Poppins']">Searching...</p>
            ) : invitees.length === 0 ? (
              <p className="text-center text-[#6B7280] text-sm py-8 font-['Poppins']">No people found.</p>
            ) : (
              invitees.map((user) => {
                const isSelected = selected.has(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => !user.invited && toggle(user.id)}
                    className={`flex items-center justify-between h-[48px] rounded-xl transition-colors ${
                      user.invited ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1C2340]'
                    }`}
                  >
                    <div className="flex items-center gap-[9px] min-w-0 h-[32px]">
                      <img src={user.avatarUrl} alt={user.name} className="w-[32px] h-[32px] rounded-full object-cover flex-shrink-0" />
                      <p className="text-[16px] leading-[24px] font-normal font-['Poppins'] text-black dark:text-white truncate">
                        {user.name}
                      </p>
                    </div>
                    {user.invited ? (
                      <span className="text-[10px] text-[#6B7280] font-['Poppins'] pr-1">Invited</span>
                    ) : isSelected ? (
                      <div className="w-[18px] h-[18px] mr-1 flex items-center justify-center bg-[#1A73E8] rounded-[2px] flex-shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-[18px] h-[18px] mr-1 flex-shrink-0"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="w-full max-w-[360px] flex flex-row items-center gap-[16px] sm:justify-between h-[40px] p-0 mt-auto">
            <button
              onClick={handleClose}
              className="flex-1 h-full rounded-full border border-[#1A73E8] text-[#1A73E8] text-[14px] leading-[20px] font-normal font-['Poppins'] hover:bg-[#EFF4FF] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={selected.size === 0 || inviteMutation.isPending}
              className="flex-1 h-full rounded-full bg-[#1A73E8] border border-[#1A73E8] text-white text-[14px] leading-[20px] font-normal font-['Poppins'] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {inviteMutation.isPending ? 'Inviting...' : 'Invite'}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
