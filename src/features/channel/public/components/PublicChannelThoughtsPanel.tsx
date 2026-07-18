'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { usePublicChannelThoughts } from '../hooks/usePublicChannelThoughts';
import { ChannelThought } from '../../types/channel.types';

import { useActiveProfile } from '@/context/ActiveProfileContext';

interface PublicChannelThoughtsPanelProps {
  articleId: string;
  isSubscribed: boolean;
  isOwner?: boolean;
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

export default function PublicChannelThoughtsPanel({ articleId, isSubscribed, isOwner }: PublicChannelThoughtsPanelProps) {
  const { activeProfile } = useActiveProfile();
  const { thoughts, addThought, deleteThought, error } = usePublicChannelThoughts(articleId, isSubscribed);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

  const isSubscriptionError = !isSubscribed || (error as any)?.response?.status === 403 || 
    error?.message?.includes('403') || 
    (error as any)?.response?.data?.message?.toLowerCase().includes('subscribe');

  const handleSubmit = () => {
    if (!draft.trim()) return;
    addThought(draft.trim(), 'You', '/assets/pngegg.png', replyingTo?.id);
    setDraft('');
    setReplyingTo(null);
  };

  const { rootThoughts, replyMap } = useMemo(() => {
    const roots: ChannelThought[] = [];
    const replies = new Map<string, ChannelThought[]>();
 
    thoughts.forEach((t) => {
      if (!t.parentId) {
        roots.push(t);
      } else {
        if (!replies.has(t.parentId)) {
          replies.set(t.parentId, []);
        }
        replies.get(t.parentId)!.push(t);
      }
    });
 
    return { rootThoughts: roots, replyMap: replies };
  }, [thoughts]);

  const filteredRoots = useMemo(() => {
    const matchesSearch = (text: string) => text.toLowerCase().includes(search.toLowerCase());
    return rootThoughts.filter((root) => {
      const rootMatches = matchesSearch(root.text) || matchesSearch(root.authorName);
      if (rootMatches) return true;
 
      const children = replyMap.get(root.id) || [];
      return children.some((child) => matchesSearch(child.text) || matchesSearch(child.authorName));
    });
  }, [rootThoughts, replyMap, search]);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0F1115]">
      <div className="px-4 pt-6 pb-4">
        <h3 className="text-black dark:text-[#FFFFFF] text-[16px] font-semibold font-['Poppins'] flex items-center gap-2">
          Thoughts <span className="text-[#9CA3AF] text-[14px] font-normal">({isSubscriptionError ? 0 : thoughts.length})</span>
        </h3>
      </div>

      <div className="px-4 flex flex-col gap-3 pb-6 border-b border-transparent">
        <div className="relative w-full flex flex-col">
          {replyingTo && (
            <div className="flex items-center justify-between bg-gray-50 dark:bg-[#121B2B] px-4 py-1.5 rounded-t-[24px] border border-b-0 border-[#E0E0E7] dark:border-[#2A2D35] text-[11px] font-['Poppins'] text-gray-500">
              <span>Replying to <span className="font-semibold text-[#1A73E8]">@{replyingTo.name}</span></span>
              <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <Icon icon="lucide:x" className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="relative w-full h-[56px] flex items-center">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={isSubscriptionError ? "Subscribe to share your thoughts" : replyingTo ? `Reply to @${replyingTo.name}...` : "Write your thoughts"}
              disabled={isSubscriptionError}
              className={`w-full h-[56px] pl-[16px] pr-[64px] border border-[#E0E0E7] dark:border-[#2A2D35] bg-white dark:bg-[#121B2B] text-[12px] font-['Poppins'] text-black dark:text-[#FFFFFF] outline-none focus:border-[#1A73E8] placeholder:text-[#6B7280] disabled:opacity-60 disabled:cursor-not-allowed ${replyingTo ? 'rounded-b-[24px] rounded-t-none' : 'rounded-[24px]'}`}
            />
            <button
              onClick={handleSubmit}
              disabled={!draft.trim() || isSubscriptionError}
              className="absolute right-[8px] top-1/2 -translate-y-1/2 w-[56px] h-[40px] flex items-center justify-center text-[#000000] dark:text-[#FFFFFF] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon icon="lucide:send" className="w-[24px] h-[24px]" style={{ strokeWidth: '1.5px' }} />
            </button>
          </div>
        </div>

        <div className="relative w-full h-[40px] flex items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search thoughts"
            disabled={isSubscriptionError}
            className="w-full h-[40px] pl-[16px] pr-[48px] rounded-[24px] border border-[#E0E0E7] dark:border-[#2A2D35] bg-white dark:bg-[#121B2B] text-[12px] font-['Poppins'] text-black dark:text-[#FFFFFF] outline-none focus:border-[#1A73E8] placeholder:text-[#6B7280] disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <div className="absolute right-[16px] top-1/2 -translate-y-1/2 flex items-center justify-center text-[#000000] dark:text-[#A1A8B3] pointer-events-none">
            <Icon icon="lucide:search" className="w-[24px] h-[24px]" style={{ strokeWidth: '1.5px' }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 scrollbar-hide">
        {isSubscriptionError ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-[#121B2B] flex items-center justify-center">
              <Icon icon="solar:lock-linear" className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-gray-500 dark:text-[#A1A8B3] text-sm font-semibold font-['Poppins']">
              Subscribe to see thoughts
            </p>
            <p className="text-gray-400 text-xs font-['Poppins'] max-w-[280px]">
              Only active subscribers and organization members can read and post thoughts on this channel.
            </p>
          </div>
        ) : filteredRoots.length === 0 ? (
          <p className="text-center text-gray-400 text-sm font-['Poppins'] py-8">
            {search ? 'No thoughts found.' : 'No thoughts yet. Be the first to share one!'}
          </p>
        ) : (
          filteredRoots.map((thought) => (
            <div key={thought.id} className="flex flex-col gap-2">
              <div className="flex items-start gap-3">
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
                    <button
                      onClick={() => setReplyingTo({ id: thought.id, name: thought.authorName })}
                      className="flex items-center gap-1.5 text-[13px] text-[#3B82F6] hover:opacity-80 font-medium font-['Poppins']"
                    >
                      <Icon icon="ion:arrow-undo-outline" className="w-4 h-4" />
                      Reply
                    </button>
                    {isOwner || thought.authorId === activeProfile?.id ? (
                      <button
                        onClick={() => deleteThought(thought.id)}
                        className="flex items-center gap-1.5 text-[13px] text-[#EF4444] hover:opacity-80 font-medium font-['Poppins']"
                      >
                        <Icon icon="fluent:delete-16-regular" className="w-4 h-4" />
                        Delete
                      </button>
                    ) : (
                      <button
                        className="flex items-center gap-1.5 text-[13px] text-[#6B7280] dark:text-[#A1A8B3] hover:opacity-80 font-medium font-['Poppins']"
                      >
                        <Icon icon="fluent:info-16-regular" className="w-4 h-4" />
                        Report
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {replyMap.has(thought.id) && (
                <div className="ml-10 mt-1 pl-3 border-l-2 border-gray-100 dark:border-[#2A2D35] flex flex-col gap-4">
                  {replyMap.get(thought.id)!.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3">
                      <img
                        src={reply.authorAvatarUrl}
                        alt={reply.authorName}
                        className="w-[28px] h-[28px] rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="text-[#000000] dark:text-[#FFFFFF] text-[13px] font-medium leading-[18px] font-['Poppins']">
                            {reply.authorName}
                          </span>
                          <span className="text-[#6B7280] dark:text-[#A1A8B3] text-[11px] font-normal leading-[16px] font-['Poppins']">
                            {timeAgo(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-[#6B7280] dark:text-[#A1A8B3] text-[13px] font-normal font-['Poppins'] mt-0.5 leading-[19px]">
                          {reply.text}
                        </p>
                        <div className="flex items-center justify-between w-full mt-2">
                          <button
                            onClick={() => setReplyingTo({ id: thought.id, name: reply.authorName })}
                            className="flex items-center gap-1 text-[12px] text-[#3B82F6] hover:opacity-80 font-medium font-['Poppins']"
                          >
                            <Icon icon="ion:arrow-undo-outline" className="w-3.5 h-3.5" />
                            Reply
                          </button>
                          {isOwner || reply.authorId === activeProfile?.id ? (
                            <button
                              onClick={() => deleteThought(reply.id)}
                              className="flex items-center gap-1 text-[12px] text-[#EF4444] hover:opacity-80 font-medium font-['Poppins']"
                            >
                              <Icon icon="fluent:delete-16-regular" className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          ) : (
                            <button
                              className="flex items-center gap-1 text-[12px] text-[#6B7280] dark:text-[#A1A8B3] hover:opacity-80 font-medium font-['Poppins']"
                            >
                              <Icon icon="fluent:info-16-regular" className="w-3.5 h-3.5" />
                              Report
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
