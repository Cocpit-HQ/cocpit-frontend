'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import { Icon } from '@/components/icons';
import { InviteCandidate } from '../../types/team.types';
import * as teamService from '../../services/team.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useDebounce } from '@/hooks/use-debounce';
import Avatar from '@/components/shared/Avatar';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (userId: string) => void;
}

export default function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
}: InviteMemberModalProps) {
  const { activeProfile } = useActiveProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [candidates, setCandidates] = useState<InviteCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedIds([]);
      return;
    }
    if (!activeProfile?.id) return;
    setLoading(true);
    teamService
      .getInviteCandidates(activeProfile.id, debouncedSearch.trim())
      .then(setCandidates)
      .catch((err) => {
        console.error('Failed to load invite candidates:', err);
      })
      .finally(() => setLoading(false));
  }, [isOpen, debouncedSearch, activeProfile?.id]);

  const filteredCandidates = useMemo(() => {
    if (!search.trim()) return candidates;
    const q = search.toLowerCase().trim();
    return candidates.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.headline && c.headline.toLowerCase().includes(q))
    );
  }, [candidates, search]);

  if (!isOpen || !mounted) return null;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleInvite = () => {
    selectedIds.forEach((id) => onInvite(id));
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-[2px] md:px-4 overscroll-none">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div
        className="w-full md:w-[442px] max-h-[85vh] md:max-h-none md:h-[338px] bg-ds-bg border-t md:border border-ds-border rounded-t-[8px] md:rounded-[16px] pt-2 md:pt-3 px-3 pb-[max(24px,env(safe-area-inset-bottom,24px))] md:pb-3 flex flex-col items-center gap-3 relative box-border z-10 overflow-hidden overscroll-contain animate-in slide-in-from-bottom duration-200 md:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div
          className="w-full flex justify-center pt-1 pb-1 md:hidden cursor-pointer"
          onClick={onClose}
        >
          <div className="w-[45px] h-[2px] rounded-full bg-ds-text-muted" />
        </div>

        {/* Invite members title */}
        <h2 className="text-[18px] md:text-[16px] leading-[26px] md:leading-[24px] font-medium font-['Poppins',sans-serif] md:font-['DM_Sans',sans-serif] text-ds-text-primary text-center m-0">
          Invite members
        </h2>

        {/* Search */}
        <div
          className="flex flex-row justify-between items-center py-1.5 px-3 w-full md:w-[418px] h-[40px] border-b border-ds-text-primary box-border shrink-0 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="flex-1 w-full text-ds-text-primary outline-none bg-transparent placeholder:text-ds-text-muted font-['DM_Sans',sans-serif] text-[16px] leading-[24px]"
          />
          {search ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearch('');
                inputRef.current?.focus();
              }}
              className="text-ds-text-muted hover:text-ds-text-primary transition-colors p-0.5 cursor-pointer"
            >
              <Icon name="close" className="w-[16px] h-[16px]" />
            </button>
          ) : (
            <Icon name="search" className="w-[20px] h-[20px] text-ds-text-primary shrink-0" />
          )}
        </div>

        {/* List */}
        <div className="flex flex-col items-start gap-3 w-full md:w-[418px] h-[176px] md:h-auto md:flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {loading && candidates.length === 0 ? (
            <div className="flex items-center justify-center py-6 w-full">
              <Icon
                name="spinner"
                className="w-5 h-5 animate-spin text-[var(--ds-accent)]"
              />
            </div>
          ) : filteredCandidates.length === 0 ? (
            <p className="ds-text-secondary text-ds-text-muted text-center py-6 w-full">
              No results found.
            </p>
          ) : (
            filteredCandidates.map((c) => (
              <div
                key={c.id}
                className="flex flex-row justify-between items-center w-full min-h-[36px] py-0 cursor-pointer gap-2"
                onClick={() => toggleSelection(c.id)}
              >
                <div className="flex flex-row items-center gap-2 min-w-0 flex-1">
                  <Avatar
                    url={c.avatarUrl}
                    name={c.name}
                    size="sm"
                  />
                  <div className="flex flex-col justify-center items-start min-w-0 flex-1">
                    <span className="text-[14px] leading-[20px] font-normal font-['DM_Sans',sans-serif] text-ds-text-primary truncate w-full">
                      {c.name}
                    </span>
                    {c.headline && (
                      <span
                        className="text-[12px] leading-[16px] font-normal font-['DM_Sans',sans-serif] text-ds-text-secondary truncate max-w-full block"
                        title={c.headline}
                      >
                        {c.headline}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Checkbox */}
                <div
                  className={`shrink-0 flex items-center justify-center w-[24px] h-[24px] rounded-[4px] box-border transition-colors ${
                    selectedIds.includes(c.id)
                      ? 'bg-ds-accent'
                      : 'bg-ds-surface-1 border border-ds-border'
                  }`}
                >
                  {selectedIds.includes(c.id) && (
                    <Icon name="checkbox-check" className="w-[16px] h-[13px] text-ds-bg shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-row justify-center items-center gap-2 w-full md:w-[162px] h-[36px] shrink-0 pt-1 md:pt-0">
          <button
            type="button"
            onClick={handleInvite}
            disabled={selectedIds.length === 0}
            className={`flex flex-row justify-center items-center py-[6px] px-[12px] w-[77px] h-[36px] rounded-[100px] text-[16px] leading-[24px] font-medium font-['DM_Sans',sans-serif] transition-all ${
              selectedIds.length === 0
                ? 'bg-ds-surface-1 text-ds-text-muted cursor-not-allowed'
                : 'bg-ds-accent text-ds-text-primary hover:opacity-90 cursor-pointer'
            }`}
          >
            Invite
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex flex-row justify-center items-center py-[6px] px-[12px] w-[77px] h-[36px] bg-transparent border border-ds-border rounded-[100px] text-[16px] leading-[24px] font-medium text-ds-text-primary font-['DM_Sans',sans-serif] hover:bg-ds-surface-1 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


