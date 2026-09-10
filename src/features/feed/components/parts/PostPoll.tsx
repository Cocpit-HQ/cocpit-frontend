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
    <div
      className="w-full max-w-[442px] p-[8px_12px] flex flex-col items-start gap-[12px] rounded-[8px] box-border select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Poll Title / Question */}
      {title && (
        <div className="self-stretch justify-start text-[14px] font-medium font-dmsans leading-[20px] line-clamp-2 text-left text-ds-text-primary">
          {title}
        </div>
      )}

      {/* 2. Poll Options */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2">
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
              <div
                key={option.option_id}
                className="self-stretch inline-flex justify-start items-center gap-2"
              >
                {/* Option Pill */}
                <div
                  className={`flex-1 px-3 py-1.5 rounded-[100px] flex justify-start items-center gap-2.5 min-w-0 ${
                    isSelected ? 'bg-ds-surface-2' : ''
                  }`}
                >
                  <div className="justify-start text-[12px] font-normal font-dmsans leading-[16px] text-ds-text-primary truncate">
                    {option.option_text}
                  </div>
                </div>

                {/* Percentage Area */}
                <div className="w-10 flex justify-end items-center gap-1 shrink-0">
                  <div className="justify-start text-[12px] font-medium font-dmsans leading-[16px] text-ds-text-primary">
                    {percentage}
                  </div>
                  <div className="justify-start text-[12px] font-medium font-dmsans leading-[16px] text-ds-text-primary">
                    %
                  </div>
                </div>
              </div>
            );
          }

          // ── Unvoted State (Capsule) ───────────────────────────────────────
          return (
            <button
              key={option.option_id}
              type="button"
              onClick={() => !isDisabled && handleVote(option.option_id)}
              disabled={isDisabled}
              className={`self-stretch px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent flex justify-start items-center gap-2.5 transition-colors outline-none text-left select-none ${
                !isDisabled
                  ? 'cursor-pointer hover:bg-ds-surface-2 active:scale-[0.99]'
                  : 'cursor-default opacity-60'
              }`}
            >
              <div className="justify-start text-[12px] font-normal font-dmsans leading-[16px] text-ds-text-primary truncate">
                {option.option_text}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Footer Info: Vote Count • Duration • Show result / Undo */}
      <div className="inline-flex justify-center items-center gap-2">
        {isOwner && postId ? (
          <button
            type="button"
            onClick={() => setIsVotersModalOpen(true)}
            className="justify-start text-[12px] font-normal font-dmsans leading-[16px] text-ds-text-primary hover:opacity-80 cursor-pointer outline-none transition-opacity line-clamp-2"
            aria-label="View poll voters"
          >
            {isEnded ? 'Ended' : `${pollData.total_votes || 0} votes`}
          </button>
        ) : (
          <div className="justify-start text-[12px] font-normal font-dmsans leading-[16px] text-ds-text-primary line-clamp-2">
            {isEnded ? 'Ended' : `${pollData.total_votes || 0} votes`}
          </div>
        )}

        {/* Separator Dot */}
        <div className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />

        {/* Duration */}
        <div className="justify-start text-[12px] font-normal font-dmsans leading-[16px] text-ds-text-secondary line-clamp-2">
          {durationText}
        </div>

        {/* Separator Dot */}
        <div className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />

        {/* Show result / Undo */}
        {isVoted ? (
          <button
            type="button"
            onClick={() => !isVoting && pollData.user_vote && handleVote(pollData.user_vote)}
            disabled={isVoting}
            className="justify-start text-[var(--ds-accent)] text-[12px] font-medium font-dmsans leading-[16px] hover:opacity-80 cursor-pointer outline-none transition-opacity line-clamp-2"
            aria-label="Undo vote"
          >
            Undo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowResult((prev) => !prev)}
            className="justify-start text-[var(--ds-accent)] text-[12px] font-medium font-dmsans leading-[16px] hover:opacity-80 cursor-pointer outline-none transition-opacity line-clamp-2"
            aria-label={showResult ? 'Hide poll results' : 'Show poll results'}
          >
            {showResult ? 'Hide result' : 'Show result'}
          </button>
        )}

        {isVoting && (
          <div className="ml-1 flex items-center">
            <svg
              className="animate-spin h-3.5 w-3.5 text-[var(--ds-accent)]"
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
