import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Check, X } from 'lucide-react';
import { useChannelInvitees, useInviteSubscribers } from '../hooks/useChannelInvitees';
import { useInView } from 'react-intersection-observer';

interface InviteChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteChannelModal({ isOpen, onClose }: InviteChannelModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { invitees, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useChannelInvitees(search);
  const inviteMutation = useInviteSubscribers();
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
        className="w-full max-w-[444px] sm:max-w-[444px] h-[394px] !p-[16px] flex flex-col items-center justify-start rounded-[24px] sm:rounded-[24px] bg-[#FFFFFF] dark:bg-[#121B2B] !border-0 !shadow-2xl gap-0 overflow-hidden [&>button]:hidden"
      >
        {/* Frame 2608580: Top close button row */}
        <div className="w-full max-w-[412px] h-[24px] flex flex-col items-end justify-center flex-shrink-0">
          <button 
            onClick={handleClose} 
            className="w-[24px] h-[24px] flex items-center justify-center text-[#EF4444] hover:opacity-80 transition-opacity"
            title="Close"
          >
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>

        {/* Frame 2608581: Main content container */}
        <div className="flex flex-col items-center gap-[16px] w-[360px] max-w-[360px] h-[338px] flex-shrink-0 mx-auto">
          
          {/* Frame 2608578: Title and subtitle */}
          <DialogHeader className="flex flex-col items-center justify-center gap-[8px] w-full max-w-[200px] flex-shrink-0 p-0 space-y-0">
            <DialogTitle className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-center text-[#000000] dark:text-[#FFFFFF]">
              Invite people
            </DialogTitle>
            <p className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6B7280] dark:text-[#A1A8B3] m-0">
              Invite people to join your channel
            </p>
          </DialogHeader>

          {/* Search bar */}
          <div className="flex items-center justify-between w-[360px] h-[40px] px-[16px] py-[8px] gap-[10px] rounded-[24px] border border-[#6B7280] dark:border-[#2A2D35] bg-[#FFFFFF] dark:bg-[#0F1115] flex-shrink-0">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full h-full text-[16px] leading-[24px] font-normal font-['Poppins'] text-[#000000] dark:text-[#FFFFFF] placeholder:text-[#6B7280] dark:placeholder:text-[#A1A8B3] bg-transparent outline-none border-none"
            />
            <Search className="w-[24px] h-[24px] text-[#6B7280] dark:text-[#A1A8B3] flex-shrink-0" />
          </div>

          {/* Frame 2609082 / 2608688: User list */}
          <div className="w-[360px] h-[160px] flex flex-col items-start gap-[8px] flex-shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {isLoading && invitees.length === 0 ? (
              <p className="w-full text-center text-[#6B7280] dark:text-[#A1A8B3] text-[14px] py-8 font-['Poppins']">Searching...</p>
            ) : invitees.length === 0 ? (
              <p className="w-full text-center text-[#6B7280] dark:text-[#A1A8B3] text-[14px] py-8 font-['Poppins']">No people found.</p>
            ) : (
              <>
                {invitees.map((user) => {
                  const isSelected = selected.has(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => !user.invited && toggle(user.id)}
                      className={`w-[360px] h-[48px] flex items-center justify-between px-2 rounded-xl transition-colors flex-shrink-0 ${
                        user.invited ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1A2435]'
                      }`}
                    >
                      <div className="flex items-center gap-[9px] min-w-0 h-[32px]">
                        <img src={user.avatarUrl} alt={user.name} className="w-[32px] h-[32px] rounded-full object-cover flex-shrink-0" />
                        <span className="text-[16px] leading-[24px] font-normal font-['Poppins'] text-[#000000] dark:text-[#FFFFFF] truncate max-w-[240px]">
                          {user.name}
                        </span>
                      </div>
                      <div className="w-[48px] h-[48px] flex items-center justify-center flex-shrink-0">
                        {user.invited ? (
                          <span className="text-[11px] text-[#6B7280] dark:text-[#A1A8B3] font-['Poppins'] font-medium pr-1">Invited</span>
                        ) : isSelected ? (
                          <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center transition-colors">
                            <div className="w-[18px] h-[18px] bg-[#1A73E8] rounded-[2px] flex items-center justify-center">
                              <Check className="w-[14px] h-[14px] text-white" strokeWidth={3} />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {hasNextPage && (
                  <div ref={ref} className="w-full flex justify-center py-2 h-[48px] items-center flex-shrink-0">
                    {isFetchingNextPage && <p className="text-[12px] text-[#6B7280] dark:text-[#A1A8B3] font-['Poppins']">Loading more...</p>}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Frame 2608618: Action buttons */}
          <DialogFooter className="w-[360px] h-[40px] flex flex-row items-center justify-between gap-[16px] flex-shrink-0 p-0 m-0">
            <button
              onClick={handleClose}
              className="w-[172px] h-[40px] flex items-center justify-center rounded-[24px] border border-[#1A73E8] dark:border-[#4D9CFF] bg-[#FFFFFF] dark:bg-transparent text-[#1A73E8] dark:text-[#4D9CFF] text-[14px] leading-[20px] font-normal font-['Poppins'] hover:bg-[#EFF4FF] dark:hover:bg-[#1A2435] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={selected.size === 0 || inviteMutation.isPending}
              className="w-[172px] h-[40px] flex items-center justify-center rounded-[24px] bg-[#1A73E8] dark:bg-[#4D9CFF] border border-[#FFFFFF] dark:border-transparent text-[#FFFFFF] dark:text-[#0F1115] text-[14px] leading-[20px] font-normal font-['Poppins'] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {inviteMutation.isPending ? 'Inviting...' : 'Invite'}
            </button>
          </DialogFooter>

        </div>
      </DialogContent>
    </Dialog>
  );
}
