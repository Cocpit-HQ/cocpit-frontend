'use client';

import React, { useState } from 'react';
import { VotersListModal } from '../modals/VotersListModal';

export interface PollOptionItem {
  option_id: string;
  option_text: string;
  vote_count: number;
}

export interface PostPollData {
  poll_id?: string;
  total_votes: number;
  user_vote?: string | null;
  duration?: string;
  is_active?: boolean;
  options: PollOptionItem[];
}

interface PostPollProps {
  pollData: PostPollData;
  handleVote: (optionId: string) => void;
  isVoting?: boolean;
  title?: string | null;
  postId?: string | number;
  isOwner?: boolean;
}

export const PostPoll: React.FC<PostPollProps> = ({
  pollData,
  handleVote,
  isVoting = false,
  title,
  postId,
  isOwner = false,
}) => {
  const [showResult, setShowResult] = useState(false);
  const [isVotersModalOpen, setIsVotersModalOpen] = useState(false);

  if (!pollData || !pollData.options) return null;

  const isVoted = !!pollData.user_vote;
  const isEnded = pollData.is_active === false;
  const displayResults = isVoted || showResult || isEnded;

  const durationText = pollData.duration
    ? (pollData.duration.toLowerCase().includes('left') ? pollData.duration : `${pollData.duration} left`)
    : '1 week left';

  return (
    <div className="w-full flex flex-col justify-start items-start gap-3 select-none" onClick={(e) => e.stopPropagation()}>
      {/* Poll Title / Question */}
      {title && (
        <div className="w-full text-left text-ds-text-primary text-[15px] font-semibold leading-[22px] whitespace-pre-wrap">
          {title}
        </div>
      )}

      {/* Poll Options */}
      <div className="w-full flex flex-col gap-2.5">
        {pollData.options.map((option) => {
          const percentage =
            pollData.total_votes > 0
              ? Math.round((option.vote_count / pollData.total_votes) * 100)
              : 0;

          const isSelected = pollData.user_vote === option.option_id;
          const isDisabled = isVoting || isEnded;

          // ── Option with Results / Voted State ─────────────────────────────
          if (displayResults) {
            return (
              <button
                key={option.option_id}
                type="button"
                onClick={() => !isDisabled && handleVote(option.option_id)}
                disabled={isDisabled}
                className={`relative w-full h-[46px] rounded-full overflow-hidden border border-zinc-700/60 bg-transparent flex items-center justify-between px-5 select-none transition-all duration-300 outline-none ${
                  !isDisabled
                    ? 'cursor-pointer hover:border-zinc-500 active:scale-[0.99]'
                    : 'cursor-default'
                }`}
              >
                {/* Background Progress Fill Bar */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-full ${
                    isSelected ? 'bg-[#1E2330]' : 'bg-[#181C26]'
                  }`}
                  style={{ width: `${Math.max(percentage, 0)}%` }}
                />

                {/* Option Label */}
                <span className="relative z-10 text-[14px] font-medium text-white truncate max-w-[80%]">
                  {option.option_text}
                </span>

                {/* Percentage */}
                <span className="relative z-10 text-[14px] font-medium text-zinc-300 shrink-0">
                  {percentage} %
                </span>
              </button>
            );
          }

          // ── Unvoted State (Sleek Outline Capsule) ─────────────────────────
          return (
            <button
              key={option.option_id}
              type="button"
              onClick={() => !isDisabled && handleVote(option.option_id)}
              disabled={isDisabled}
              className={`w-full h-[46px] px-5 rounded-full border border-zinc-700/80 bg-transparent hover:bg-zinc-800/40 text-left text-[14px] text-white font-medium transition-all duration-150 flex items-center justify-start select-none outline-none ${
                !isDisabled
                  ? 'cursor-pointer active:scale-[0.99]'
                  : 'cursor-default opacity-60'
              }`}
            >
              <span className="truncate">{option.option_text}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Info: Vote Count • Duration • Show result / Undo */}
      <div className="w-full flex items-center justify-start gap-1.5 text-ds-text-muted text-[13px] leading-[18px] pt-0.5">
        {isOwner && postId ? (
          <button
            type="button"
            onClick={() => setIsVotersModalOpen(true)}
            className="text-[#F95B14] no-underline hover:no-underline hover:opacity-80 cursor-pointer font-normal outline-none transition-opacity"
          >
            {isEnded ? 'Ended' : `${pollData.total_votes || 0} votes`}
          </button>
        ) : (
          <span>
            {isEnded ? 'Ended' : `${pollData.total_votes || 0} votes`}
          </span>
        )}
        <span>•</span>
        <span>{durationText}</span>
        <span>•</span>

        {isVoted ? (
          <button
            type="button"
            onClick={() => !isVoting && pollData.user_vote && handleVote(pollData.user_vote)}
            disabled={isVoting}
            className="text-[#F95B14] no-underline hover:no-underline hover:opacity-80 cursor-pointer font-normal outline-none transition-opacity"
          >
            Undo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowResult((prev) => !prev)}
            className="text-[#F95B14] no-underline hover:no-underline hover:opacity-80 cursor-pointer font-normal outline-none transition-opacity"
          >
            {showResult ? 'Hide result' : 'Show result'}
          </button>
        )}

        {isVoting && (
          <div className="ml-2 flex items-center">
            <svg
              className="animate-spin h-3.5 w-3.5 text-[#F95B14]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Voters List Modal */}
      {postId && (
        <VotersListModal
          isOpen={isVotersModalOpen}
          onClose={() => setIsVotersModalOpen(false)}
          postId={postId}
          options={pollData.options}
        />
      )}
    </div>
  );
};

export default PostPoll;
