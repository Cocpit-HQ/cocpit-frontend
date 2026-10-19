"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { companyService } from '@/services/organization.service';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface MemberInfo {
  user_id: string;
  full_name: string;
  avatar?: string;
  headline?: string;
  email?: string;
  role_name?: string;
}

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onTransferSuccess?: () => void;
  companyId: string;
  companyName?: string;
}

const PAGE_LIMIT = 10;

export function TransferOwnershipModal({
  isOpen,
  onClose,
  onBack,
  onTransferSuccess,
  companyId,
  companyName = 'Organization'
}: TransferOwnershipModalProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const listRef = useRef<HTMLDivElement>(null);

  // Fetch Page 1 whenever search query or companyId changes
  useEffect(() => {
    if (!isOpen || !companyId) return;

    const timer = setTimeout(() => {
      setPage(1);
      fetchMembers(1, search, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, companyId, search]);

  const fetchMembers = async (targetPage: number, searchQuery: string, isReset = false) => {
    if (isReset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setErrorMessage('');

    try {
      const res = await companyService.getMembers(companyId, {
        page: targetPage,
        limit: PAGE_LIMIT,
        exclude_owner: true,
        exclude_self: true,
        status: 'ACTIVE',
        search: searchQuery.trim()
      });

      // Client-side safety: also filter out the logged-in user
      const rawMembers: MemberInfo[] = res.data || [];
      const newMembers = currentUserId
        ? rawMembers.filter((m) => m.user_id !== currentUserId)
        : rawMembers;

      const totalPages = res.meta?.total_pages || 1;

      if (isReset) {
        setMembers(newMembers);
      } else {
        setMembers(prev => [...prev, ...newMembers]);
      }

      setHasMore(targetPage < totalPages);
      setPage(targetPage);
    } catch (err: any) {
      console.error("Failed to fetch organization members:", err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to load organization members';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 25 && hasMore && !loadingMore && !loading) {
      fetchMembers(page + 1, search, false);
    }
  }, [hasMore, loadingMore, loading, page, search]);

  const handleTransfer = async () => {
    if (!selectedUserId || !companyId) return;

    setSubmitting(true);
    setErrorMessage('');
    try {
      await companyService.transferOwnership(companyId, selectedUserId);
      toast.success('Ownership transferred successfully');
      if (onTransferSuccess) onTransferSuccess();
      onClose();
    } catch (err: any) {
      console.error("Transfer ownership error:", err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to transfer ownership';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none"
      onClick={onClose}
    >
      <div
        className={`relative flex flex-col items-center justify-between bg-ds-bg border border-ds-border rounded-[16px] p-[12px] gap-[12px] w-[442px] max-w-[calc(100vw-32px)] ${errorMessage ? 'min-h-[288px] h-auto' : 'h-[288px]'} shadow-2xl animate-in fade-in zoom-in-95 duration-200 box-border`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center w-full">
          <h2 className="w-[219px] h-[24px] text-ds-text-primary ds-text-body-1 text-center m-0 p-0 font-medium">
            Transfer company ownership
          </h2>
        </div>

        {/* Underline Search Bar (Frame 3: 418px x 40px) */}
        <div className="relative w-full h-[40px] border-b border-ds-border focus-within:border-ds-accent transition-colors flex items-center justify-between pb-1">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-full bg-transparent border-none outline-none text-ds-text-primary placeholder:text-ds-text-muted ds-text-body pr-8"
          />
          <Search className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 text-ds-text-muted pointer-events-none" />
        </div>

        {/* Error Message banner */}
        {errorMessage && (
          <div className="w-full p-2 ds-text-small text-ds-error bg-ds-error/10 border border-ds-error/20 rounded-lg text-center">
            {errorMessage}
          </div>
        )}

        {/* Members List */}
        <div 
          ref={listRef}
          onScroll={handleScroll}
          className="flex flex-col w-full gap-[12px] flex-1 overflow-y-auto scrollbar-hide no-scrollbar [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-6 ds-text-small text-ds-text-muted">
              <Loader2 className="w-4 h-4 animate-spin mr-1.5 text-ds-accent" /> Loading...
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center px-2">
              <p className="ds-text-small text-ds-text-secondary">
                {search 
                  ? "No matching members found"
                  : "No other active members available"}
              </p>
            </div>
          ) : (
            <>
              {members.map(user => {
                const isSelected = selectedUserId === user.user_id;
                return (
                  <div 
                    key={user.user_id} 
                    onClick={() => setSelectedUserId(user.user_id)}
                    className="flex items-center justify-between w-full h-[36px] transition-all cursor-pointer hover:bg-ds-surface-1/30 rounded-lg px-0.5"
                  >
                    <div className="flex items-center gap-[10px] overflow-hidden">
                      <div className="w-[32px] h-[32px] rounded-[100px] bg-ds-surface-1 overflow-hidden relative shrink-0 flex items-center justify-center">
                        {user.avatar ? (
                          <Image src={user.avatar} alt={user.full_name} fill className="object-cover" />
                        ) : (
                          <span className="ds-text-small text-ds-text-primary font-medium">
                            {user.full_name?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <span className="ds-text-secondary text-ds-text-primary truncate font-normal">
                        {user.full_name}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center pl-2">
                      <div className={`w-[24px] h-[24px] rounded-full border-[1.5px] flex items-center justify-center transition-all ${
                        isSelected ? 'border-ds-accent' : 'border-ds-border'
                      }`}>
                        {isSelected && (
                          <div className="w-[8px] h-[8px] rounded-full bg-ds-accent" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading indicator for pagination */}
              {loadingMore && (
                <div className="flex items-center justify-center py-1.5 ds-text-small text-ds-accent">
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Loading more...
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons Frame 2608476 (180px x 36px, gap 8px) */}
        <div className="flex flex-row items-center justify-center gap-[8px] w-[180px] h-[36px] mx-auto shrink-0">
          <button 
            type="button"
            onClick={handleTransfer}
            disabled={!selectedUserId || submitting}
            className={`w-[86px] h-[36px] px-[12px] py-[6px] rounded-[100px] flex items-center justify-center ds-text-body-1 transition-all ${
              !selectedUserId || submitting
                ? 'bg-ds-surface-1 text-ds-text-muted cursor-not-allowed'
                : 'bg-ds-accent text-ds-text-primary hover:opacity-90 active:scale-95 cursor-pointer'
            }`}
          >
            {submitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 text-ds-text-primary animate-spin" /> ...
              </span>
            ) : (
              "Transfer"
            )}
          </button>

          <button 
            type="button"
            onClick={() => onBack ? onBack() : onClose()} 
            disabled={submitting}
            className="w-[86px] h-[36px] px-[12px] py-[6px] rounded-[100px] border border-ds-border bg-transparent hover:bg-ds-surface-1 text-ds-text-primary flex items-center justify-center ds-text-body-1 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
