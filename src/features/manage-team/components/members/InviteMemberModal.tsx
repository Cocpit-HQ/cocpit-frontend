'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { InviteCandidate } from '../../types/team.types';
import * as teamService from '../../services/team.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

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
  const [search, setSearch] = useState('');
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
      .getInviteCandidates(activeProfile.id, search)
      .then(setCandidates)
      .finally(() => setLoading(false));
  }, [isOpen, search, activeProfile?.id]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-[420px] bg-white dark:bg-[#1A1D24] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center justify-center p-6 pb-4 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-[#F15156] hover:opacity-80 transition-opacity"
          >
            <Icon icon="lucide:x" strokeWidth={1.5} className="w-5 h-5" />
          </button>
          <h2 className="text-[18px] font-semibold text-[#000000] dark:text-white font-['Poppins']">
            Invite member
          </h2>
          <p className="text-[12px] text-[#707EAE] mt-1 font-['Poppins']">
            Invite a team member to join your company
          </p>
        </div>

        {/* Search */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between px-4 py-2 rounded-full border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-[#0F1115]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="flex-1 text-[14px] text-gray-800 dark:text-gray-200 font-['Poppins'] outline-none bg-transparent placeholder:text-[#A3AED0]"
            />
            <Icon icon="lucide:search" className="w-4 h-4 text-[#A3AED0]" />
          </div>
        </div>

        {/* Candidates */}
        <div className="flex-1 max-h-[260px] overflow-y-auto px-6 pb-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Icon
                icon="lucide:loader-2"
                className="w-5 h-5 animate-spin text-[#1A73E8]"
              />
            </div>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6 font-['Poppins']">
              No results found.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-3 cursor-pointer select-none"
                  onClick={() => toggleSelection(c.id)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatarUrl || '/assets/pngegg.png'}
                      alt={c.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/pngegg.png';
                      }}
                    />
                    <span className="text-[14px] font-medium text-[#000000] dark:text-gray-200 font-['Poppins']">
                      {c.name}
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors ${
                    selectedIds.includes(c.id) 
                      ? 'bg-[#1A73E8] border-[#1A73E8]' 
                      : 'border-[#E2E8F0] dark:border-gray-600'
                  }`}>
                    {selectedIds.includes(c.id) && (
                      <Icon icon="lucide:check" className="w-3.5 h-3.5 text-white stroke-[3]" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-[#1A73E8] text-[#1A73E8] text-[14px] font-medium font-['Poppins'] hover:bg-[#F2F7FF] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={selectedIds.length === 0}
            className={`flex-1 py-2.5 rounded-full text-white text-[14px] font-medium font-['Poppins'] transition-opacity ${
              selectedIds.length === 0 ? 'bg-[#1A73E8]/50 cursor-not-allowed' : 'bg-[#1A73E8] hover:opacity-90'
            }`}
          >
            Invite
          </button>
        </div>
      </div>
    </div>
  );
}
