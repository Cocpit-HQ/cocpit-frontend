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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm font-poppins">
      <div className="relative flex flex-col items-center bg-white rounded-[24px] p-4 w-[450px] min-h-[420px] max-w-full shadow-lg">
        
        {/* Close Button Area */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-[#FF6B6B] hover:opacity-80 transition-opacity"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Wrapper */}
        <div className="flex flex-col items-center w-[360px] mt-2 h-full">
          
          {/* Header */}
          <div className="flex flex-col items-center gap-1 mb-4 w-[328px] text-center">
            <h2 className="text-black text-lg font-medium font-['Poppins'] leading-6 text-center m-0">Transfer company ownership</h2>
            <p className="text-gray-500 text-xs font-normal font-['Poppins'] leading-4 text-center m-0">
              Select a new owner for {companyName}.
            </p>
            <p className="text-gray-400 text-[11px] font-normal font-['Poppins'] leading-4 text-center m-0">
              Note: Only team members can receive ownership
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full h-[40px] mb-4">
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-full rounded-[24px] border border-[#9CA3AF] pl-4 pr-10 text-[14px] text-[#111827] font-poppins focus:outline-none focus:border-[#1A73E8]"
            />
            <Search className="absolute right-4 top-[11px] w-[18px] h-[18px] text-[#9CA3AF]" />
          </div>

          {/* Error Message banner */}
          {errorMessage && (
            <div className="w-full p-2 mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg text-center">
              {errorMessage}
            </div>
          )}

          {/* Members List with Infinite Scroll */}
          <div 
            ref={listRef}
            onScroll={handleScroll}
            className="flex flex-col w-full gap-2 mb-4 h-[180px] overflow-y-auto pr-1"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading members...
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <p className="text-[13px] font-normal text-[#6B7280]">
                  {search 
                    ? "No matching members found."
                    : "No other active members available in this organization to transfer ownership to."}
                </p>
              </div>
            ) : (
              <>
                {members.map(user => (
                  <div 
                    key={user.user_id} 
                    onClick={() => setSelectedUserId(user.user_id)}
                    className="flex items-center justify-between w-full h-[48px] px-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-[9px] overflow-hidden">
                      <div className="w-[32px] h-[32px] rounded-full bg-gray-200 overflow-hidden relative flex-shrink-0">
                        {user.avatar ? (
                          <Image src={user.avatar} alt={user.full_name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-semibold text-xs">
                            {user.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-[14px] font-medium text-black truncate">{user.full_name}</span>
                        {user.role_name && <span className="text-[11px] text-gray-500">{user.role_name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-center p-1 cursor-pointer">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedUserId === user.user_id ? 'border-[#1A73E8]' : 'border-[#9CA3AF]'
                      }`}>
                        {selectedUserId === user.user_id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#1A73E8]" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator for pagination */}
                {loadingMore && (
                  <div className="flex items-center justify-center py-2 text-xs text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin mr-1" /> Loading more...
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="inline-flex justify-center items-center gap-4 w-full mt-auto pt-2 mb-2">
            <button 
              onClick={() => onBack ? onBack() : onClose()} 
              disabled={submitting}
              className="w-36 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-blue-600 flex justify-center items-center gap-2.5 cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <span className="text-center text-blue-600 text-sm font-normal leading-5">Cancel</span>
            </button>
            
            <button 
              onClick={handleTransfer}
              disabled={!selectedUserId || submitting}
              className="w-36 h-10 px-4 py-2 bg-[#1A73E8] rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 text-white animate-spin mr-1" />
              ) : null}
              <span className="text-center text-white text-sm font-normal leading-5">
                {submitting ? 'Transferring...' : 'Transfer'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
