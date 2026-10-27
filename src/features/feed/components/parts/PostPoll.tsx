'use client';

import React, { useState } from 'react';
import { VotersListModal } from '../modals/VotersListModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  disabled?: boolean;
}

export const PostPoll: React.FC<PostPollProps> = ({
  pollData,
  handleVote,
  isVoting = false,
  title,
  postId,
  isOwner = false,
  disabled = false,
}) => {
  const [showResult, setShowResult] = useState(false);
  const [isVotersModalOpen, setIsVotersModalOpen] = useState(false);

  if (!pollData || !pollData.options) return null;

  const isVoted = !!pollData.user_vote;
  const isEnded = pollData.is_active === false;
  // Automatically shows results if voted or ended, or toggled via Show result
  const displayResults = isVoted || showResult || isEnded;

  const durationText = pollData.duration
    ? (pollData.duration.toLowerCase().includes('left') ? pollData.duration : `${pollData.duration} left`)
    : '1 week left';

  const totalVotes = pollData.total_votes || 0;
  const voteCountLabel = `${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'}`;

  return (
    <div
      className="w-full max-w-[442px] p-[8px_12px] flex flex-col items-start gap-[12px] rounded-[8px] box-border select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Poll Title / Question */}
      {title && (
        <div className="self-stretch justify-start text-[14px] font-medium font-dmsans leading-[20px] text-left text-ds-text-primary whitespace-pre-wrap break-words">
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
          const isDisabled = isVoting || isEnded || disabled;

          // ── Option with Results / Voted / Ended State (bars & %) ───────────
          if (displayResults) {
            const canVoteFromResults = !isVoted && !isEnded && !isVoting && !disabled;
            const isVoteRestricted = !isVoted && !isEnded && disabled;

            const pillContent = (
              <div
                onClick={() => canVoteFromResults && handleVote(option.option_id)}
                className={`relative flex-1 px-3 py-1.5 rounded-[100px] border border-ds-border overflow-hidden flex justify-start items-center gap-2.5 min-w-0 transition-colors ${
                  isSelected
                    ? 'border-ds-border bg-ds-surface-1/40'
                    : canVoteFromResults
                    ? 'cursor-pointer hover:border-ds-border/80'
                    : isVoteRestricted
                    ? 'cursor-not-allowed'
                    : 'cursor-default'
                }`}
              >
                {/* Background Progress Fill Bar */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-300 ease-out rounded-[100px] ${
                    isSelected ? 'bg-ds-surface-2' : 'bg-ds-surface-1'
                  }`}
                  style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                />

                {/* Option Label */}
                <div className="relative z-10 justify-start text-[12px] font-normal font-dmsans leading-[16px] text-ds-text-primary truncate flex items-center gap-1.5">
                  <span className="truncate">{option.option_text}</span>
                  {isSelected && (
                    <span className="text-[10px] text-ds-text-secondary font-medium shrink-0">
                      (You)
                    </span>
                  )}
                </div>
              </div>
            );

            return (
              <div
                key={option.option_id}
                className="self-stretch inline-flex justify-start items-center gap-2 w-full"
              >
                {isVoteRestricted ? (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip enableTouch>
                      <TooltipTrigger asChild>
                        <div className="flex-1 flex min-w-0 cursor-not-allowed">
                          {pillContent}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs font-['DM_Sans']">
                        You don't have access
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  pillContent
                )}

                {/* Percentage Area */}
                <div className="w-10 flex justify-end items-center gap-0.5 shrink-0 select-none">
                  <span className="justify-start text-[12px] font-medium font-dmsans leading-[16px] text-ds-text-primary">
                    {percentage}
                  </span>
                  <span className="justify-start text-[12px] font-medium font-dmsans leading-[16px] text-ds-text-primary">
                    %
                  </span>
                </div>
              </div>
            );
          }

          // ── Unvoted State (Capsule Buttons) ──────────────────────────────────
          if (disabled && !isEnded) {
            return (
              <TooltipProvider key={option.option_id} delayDuration={100}>
                <Tooltip enableTouch>
                  <TooltipTrigger asChild>
                    <span className="self-stretch w-full block cursor-not-allowed">
                      <button
                        type="button"
                        disabled
                        className="w-full px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent flex justify-start items-center gap-2.5 outline-none text-left select-none pointer-events-none"
                      >
                        <div className="justify-start text-[12px] font-normal font-dmsans leading-[16px] text-ds-text-primary truncate">
                          {option.option_text}
                        </div>
                      </button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs font-['DM_Sans']">
                    You don't have access
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return (
            <button
              key={option.option_id}
              type="button"
              onClick={() => !isDisabled && handleVote(option.option_id)}
              disabled={isDisabled}
              className={`self-stretch px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent flex justify-start items-center gap-2.5 transition-colors outline-none text-left select-none ${
                !isDisabled
                  ? 'cursor-pointer hover:bg-ds-surface-2 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ds-accent'
                  : 'cursor-not-allowed'
              }`}
            >
              <div className="justify-start text-[12px] font-normal font-dmsans leading-[16px] text-ds-text-primary truncate">
                {option.option_text}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Footer Info: Vote Count • Status / Duration • Action */}
      <div className="inline-flex justify-center items-center gap-2">
        {/* Vote Count: Self taps to view Voters List; Others is plain text */}
        {isOwner && postId ? (
          <button
            type="button"
            onClick={() => setIsVotersModalOpen(true)}
            className="justify-start text-[12px] font-normal font-dmsans leading-[16px] text-ds-text-primary hover:underline hover:opacity-90 cursor-pointer outline-none transition-all line-clamp-2"
            aria-label="View poll voters"
          >
            {voteCountLabel}
          </button>
        ) : (
          <div className="justify-start text-[12px] font-normal font-dmsans leading-[16px] text-ds-text-primary line-clamp-2 select-none">
            {voteCountLabel}
          </div>
        )}

        {/* Separator Dot */}
        <div className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />

        {/* Status: "Poll closed" if ended/inactive, otherwise duration text */}
        <div className="justify-start text-[12px] font-normal font-dmsans leading-[16px] text-ds-text-secondary line-clamp-2 select-none">
          {isEnded ? 'Poll closed' : durationText}
        </div>

        {/* Actions: Undo / Show result / Hide result */}
        {isEnded ? (
          // Poll Closed / Inactive: Voting & "Undo" are disabled
          isVoted ? (
            <>
              <div className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />
              <button
                type="button"
                disabled
                className="justify-start text-ds-text-muted text-[12px] font-medium font-dmsans leading-[16px] cursor-not-allowed opacity-50 outline-none select-none line-clamp-2"
                aria-label="Undo disabled (poll closed)"
              >
                Undo
              </button>
            </>
          ) : null
        ) : isVoted ? (
          // Active & Voted: Can tap "Undo" to cancel/change vote
          <>
            <div className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />
            {disabled ? (
              <TooltipProvider delayDuration={100}>
                <Tooltip enableTouch>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-not-allowed">
                      <button
                        type="button"
                        disabled
                        className="justify-start text-[var(--ds-accent)] text-[12px] font-medium font-dmsans leading-[16px] outline-none line-clamp-2 pointer-events-none select-none"
                        aria-label="Undo vote"
                      >
                        Undo
                      </button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs font-['DM_Sans']">
                    You don't have access
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <button
                type="button"
                onClick={() => !isVoting && pollData.user_vote && handleVote(pollData.user_vote)}
                disabled={isVoting}
                className="justify-start text-[var(--ds-accent)] text-[12px] font-medium font-dmsans leading-[16px] outline-none transition-opacity line-clamp-2 hover:opacity-80 cursor-pointer disabled:opacity-50"
                aria-label="Undo vote"
              >
                Undo
              </button>
            )}
          </>
        ) : (
          // Active & Unvoted: Can toggle "Show result" / "Hide result"
          <>
            <div className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />
            {disabled ? (
              <TooltipProvider delayDuration={100}>
                <Tooltip enableTouch>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-not-allowed">
                      <button
                        type="button"
                        disabled
                        className="justify-start text-[var(--ds-accent)] text-[12px] font-medium font-dmsans leading-[16px] outline-none line-clamp-2 pointer-events-none select-none"
                        aria-label="Show poll results"
                      >
                        {showResult ? 'Hide result' : 'Show result'}
                      </button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs font-['DM_Sans']">
                    You don't have access
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <button
                type="button"
                onClick={() => !isVoting && setShowResult((prev) => !prev)}
                disabled={isVoting}
                className="justify-start text-[var(--ds-accent)] text-[12px] font-medium font-dmsans leading-[16px] outline-none transition-opacity line-clamp-2 hover:opacity-80 cursor-pointer disabled:opacity-50"
                aria-label={showResult ? 'Hide poll results' : 'Show poll results'}
              >
                {showResult ? 'Hide result' : 'Show result'}
              </button>
            )}
          </>
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
