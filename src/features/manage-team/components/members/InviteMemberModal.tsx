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

  useEffect(() => {
    if (!isOpen || !activeProfile?.id) return;
    setLoading(true);
    teamService
      .getInviteCandidates(activeProfile.id, search)
      .then(setCandidates)
      .finally(() => setLoading(false));
  }, [isOpen, search, activeProfile?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-[380px] bg-white dark:bg-[#1A1D24] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white font-['Poppins']">
            Invite member
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F1115]">
            <Icon icon="lucide:search" className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-['Poppins'] outline-none bg-transparent placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Candidates */}
        <div className="flex-1 max-h-[300px] overflow-y-auto px-5 pb-5">
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
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/pngegg.png';
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 font-['Poppins']">
                        {c.name}
                      </span>
                      {c.headline && (
                        <span className="text-xs text-gray-400 font-['Poppins']">
                          {c.headline}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onInvite(c.id)}
                    disabled={c.alreadyMember}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold font-['Poppins'] transition-all ${
                      c.alreadyMember
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        : 'bg-[#1A73E8] dark:bg-[#4D9CFF] text-white hover:opacity-90 active:scale-95'
                    }`}
                  >
                    {c.alreadyMember ? 'Member' : 'Invite'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
