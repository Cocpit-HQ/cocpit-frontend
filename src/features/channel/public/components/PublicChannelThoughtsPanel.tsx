'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { usePublicChannelThoughts } from '../hooks/usePublicChannelThoughts';

interface PublicChannelThoughtsPanelProps {
  articleId: string;
}

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function PublicChannelThoughtsPanel({ articleId }: PublicChannelThoughtsPanelProps) {
  const { thoughts, addThought, deleteThought } = usePublicChannelThoughts(articleId);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');

  const handleSubmit = () => {
    if (!draft.trim()) return;
    addThought(draft.trim(), 'You', '/assets/pngegg.png');
    setDraft('');
  };

  const filteredThoughts = thoughts.filter((t) =>
    t.text.toLowerCase().includes(search.toLowerCase()) ||
    t.authorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0F1115]">
      <div className="px-4 pt-6 pb-4">
        <h3 className="text-black dark:text-[#FFFFFF] text-[16px] font-semibold font-['Poppins'] flex items-center gap-2">
          Thoughts <span className="text-[#9CA3AF] text-[14px] font-normal">({thoughts.length})</span>
        </h3>
      </div>

      <div className="px-4 flex flex-col gap-3 pb-6 border-b border-transparent">
        <div className="relative w-full h-[56px] flex items-center">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Write your thoughts"
            className="w-full h-[56px] pl-[16px] pr-[64px] rounded-[24px] border border-[#E0E0E7] dark:border-[#2A2D35] bg-white dark:bg-[#121B2B] text-[12px] font-['Poppins'] text-black dark:text-[#FFFFFF] outline-none focus:border-[#1A73E8] placeholder:text-[#6B7280]"
          />
          <button
            onClick={handleSubmit}
            disabled={!draft.trim()}
            className="absolute right-[8px] top-1/2 -translate-y-1/2 w-[56px] h-[40px] flex items-center justify-center text-[#000000] disabled:cursor-not-allowed"
          >
            <Icon icon="lucide:send" className="w-[24px] h-[24px]" style={{ strokeWidth: '1.5px' }} />
          </button>
        </div>

        <div className="relative w-full h-[40px] flex items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search thoughts"
            className="w-full h-[40px] pl-[16px] pr-[32px] rounded-[24px] border border-[#E0E0E7] dark:border-[#2A2D35] bg-white dark:bg-[#121B2B] text-[12px] font-['Poppins'] text-black dark:text-[#FFFFFF] outline-none focus:border-[#1A73E8] placeholder:text-[#6B7280]"
          />
          <div className="absolute right-[16px] top-1/2 -translate-y-1/2 flex items-center justify-center text-[#000000] dark:text-[#A1A8B3] pointer-events-none">
            <Icon icon="lucide:search" className="w-[24px] h-[24px]" style={{ strokeWidth: '1.5px' }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 scrollbar-hide">
        {filteredThoughts.length === 0 ? (
          <p className="text-center text-gray-400 text-sm font-['Poppins'] py-8">
            {search ? 'No thoughts found.' : 'No thoughts yet. Be the first to share one!'}
          </p>
        ) : (
          filteredThoughts.map((thought) => (
            <div key={thought.id} className="flex items-start gap-3">
              <img
                src={thought.authorAvatarUrl}
                alt={thought.authorName}
                className="w-[36px] h-[36px] rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[#000000] dark:text-[#FFFFFF] text-[14px] font-medium leading-[20px] font-['Poppins']">
                    {thought.authorName}
                  </span>
                  <span className="text-[#6B7280] dark:text-[#A1A8B3] text-[12px] font-normal leading-[18px] font-['Poppins']">
                    {timeAgo(thought.createdAt)}
                  </span>
                </div>
                <p className="text-[#6B7280] dark:text-[#A1A8B3] text-[14px] font-normal font-['Poppins'] mt-1 leading-[21px]">
                  {thought.text}
                </p>
                <div className="flex items-center justify-between w-full mt-3">
                  <button className="flex items-center gap-1.5 text-[13px] text-[#3B82F6] hover:opacity-80 font-medium font-['Poppins']">
                    <Icon icon="ion:arrow-undo-outline" className="w-4 h-4" />
                    Reply
                  </button>
                  <button
                    onClick={() => deleteThought(thought.id)}
                    className="flex items-center gap-1.5 text-[13px] text-[#EF4444] hover:opacity-80 font-medium font-['Poppins']"
                  >
                    <Icon icon="fluent:delete-16-regular" className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
