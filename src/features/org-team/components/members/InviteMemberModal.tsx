'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [candidates, setCandidates] = useState<InviteCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  if (!isOpen) return null;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleInvite = () => {
    selectedIds.forEach((id) => onInvite(id));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="flex flex-col items-center p-3 gap-3 w-[442px] h-[338px] bg-ds-bg border border-ds-border rounded-[16px] relative box-border z-10 overflow-hidden">
        
        {/* Invite members */}
        <h2 className="ds-text-body-1 text-ds-text-primary text-center m-0">
          Invite members
        </h2>

        {/* Search */}
        <div
          className="flex flex-row justify-between items-center py-1.5 px-3 w-[418px] h-[40px] border-b border-ds-text-primary box-border shrink-0 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="flex-1 w-full ds-text-body text-ds-text-primary outline-none bg-transparent placeholder:text-ds-text-muted font-['DM_Sans'] text-[16px] leading-[24px]"
          />
          {search ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearch('');
                inputRef.current?.focus();
              }}
              className="text-ds-text-muted hover:text-ds-text-primary transition-colors p-0.5"
            >
              <Icon name="close" className="w-[16px] h-[16px]" />
            </button>
          ) : (
            <Icon name="search" className="w-[20px] h-[20px] text-ds-text-primary shrink-0" />
          )}
        </div>

        {/* List */}
        <div className="flex flex-col items-start gap-3 w-[418px] flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                className="flex flex-row justify-between items-center w-full min-h-[36px] py-1 cursor-pointer gap-3"
                onClick={() => toggleSelection(c.id)}
              >
                <div className="flex flex-row items-center gap-2 min-w-0 flex-1">
                  <Avatar
                    url={c.avatarUrl}
                    name={c.name}
                    size="sm"
                  />
                  <div className="flex flex-col justify-center items-start min-w-0 flex-1">
                    <span className="ds-text-secondary text-ds-text-primary truncate w-full">
                      {c.name}
                    </span>
                    <span
                      className="ds-text-small text-ds-text-secondary truncate max-w-[50%] min-h-[16px] block"
                      title={c.headline || undefined}
                    >
                      {c.headline || '\u00A0'}
                    </span>
                  </div>
                </div>
                
                {/* Checkbox */}
                <div className={`shrink-0 flex items-center justify-center w-[24px] h-[24px] rounded-[4px] box-border transition-colors ${
                  selectedIds.includes(c.id)
                    ? 'bg-[var(--ds-accent)]'
                    : 'bg-ds-surface-1 border border-ds-border'
                }`}>
                  {selectedIds.includes(c.id) && (
                    <Icon name="check" className="w-[16px] h-[13px] text-[var(--ds-bg)]" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-row justify-center items-start gap-2 w-[162px] h-[36px] shrink-0">
          <button
            onClick={handleInvite}
            disabled={selectedIds.length === 0}
            className="flex flex-row justify-center items-center py-[6px] px-[12px] gap-[10px] w-[77px] h-[36px] bg-[var(--ds-accent)] rounded-[100px] ds-text-body-1 text-ds-text-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Invite
          </button>
          <button
            onClick={onClose}
            className="flex flex-row justify-center items-center py-[6px] px-[12px] gap-[10px] w-[77px] h-[36px] bg-transparent border border-ds-border rounded-[100px] ds-text-body-1 text-ds-text-primary hover:bg-ds-surface-1 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


