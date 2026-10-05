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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex flex-col items-center bg-ds-surface-2 border border-ds-border rounded-2xl p-6 w-[460px] max-w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button Area */}
        <button 
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-surface-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Wrapper */}
        <div className="flex flex-col items-center w-full mt-1">
          
          {/* Header */}
          <div className="flex flex-col items-center gap-1.5 mb-5 text-center">
            <h2 className="ds-text-body-2 text-ds-text-primary">Transfer company ownership</h2>
            <p className="ds-text-small text-ds-text-secondary">
              Select a new owner for <span className="font-semibold text-ds-text-primary">{companyName}</span>
            </p>
            <p className="ds-text-meta text-ds-text-muted">
              Note: Only team members can receive ownership
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full mb-4">
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ds-input w-full bg-ds-surface-1 border border-ds-border rounded-lg pl-3 pr-9 text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none focus:border-ds-accent focus:ring-1 focus:ring-ds-accent ds-text-small"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ds-text-muted pointer-events-none" />
          </div>

          {/* Error Message banner */}
          {errorMessage && (
            <div className="w-full p-2.5 mb-3 ds-text-small text-ds-error bg-ds-error/10 border border-ds-error/20 rounded-lg text-center">
              {errorMessage}
            </div>
          )}

          {/* Members List with Infinite Scroll */}
          <div 
            ref={listRef}
            onScroll={handleScroll}
            className="flex flex-col w-full gap-2 mb-4 h-[200px] overflow-y-auto pr-1"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full ds-text-small text-ds-text-muted">
                <Loader2 className="w-5 h-5 animate-spin mr-2 text-ds-accent" /> Loading members...
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <p className="ds-text-small text-ds-text-secondary">
                  {search 
                    ? "No matching members found."
                    : "No other active members available in this organization to transfer ownership to."}
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
                      className={`flex items-center justify-between w-full h-[52px] px-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-ds-accent bg-ds-surface-1' 
                          : 'border-transparent hover:bg-ds-surface-1'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-ds-surface-1 border border-ds-border overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                          {user.avatar ? (
                            <Image src={user.avatar} alt={user.full_name} fill className="object-cover" />
                          ) : (
                            <span className="ds-text-small-2 text-ds-text-primary">
                              {user.full_name?.charAt(0) || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="ds-text-small-2 text-ds-text-primary truncate">{user.full_name}</span>
                          {user.role_name && <span className="ds-text-meta text-ds-text-muted">{user.role_name}</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center pl-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? 'border-ds-accent' : 'border-ds-border'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-ds-accent" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator for pagination */}
                {loadingMore && (
                  <div className="flex items-center justify-center py-2 ds-text-meta text-ds-accent">
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Loading more...
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end w-full gap-3 pt-3 border-t border-ds-border/40">
            <button 
              onClick={() => onBack ? onBack() : onClose()} 
              disabled={submitting}
              className="ds-btn ds-btn-secondary ds-text-body-1 h-9 px-5 border border-ds-border hover:bg-ds-surface-1 transition-colors text-ds-text-secondary hover:text-ds-text-primary"
            >
              Cancel
            </button>
            
            <button 
              onClick={handleTransfer}
              disabled={!selectedUserId || submitting}
              className="ds-btn ds-text-body-1 h-9 px-5 rounded-lg bg-ds-accent text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-white animate-spin" /> Transferring...
                </span>
              ) : (
                "Transfer"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
