import React from 'react';
import { Poll } from '@/types/entities';

interface PollCardProps {
  poll: Poll;
  onVote?: (optionId: string) => void;
  votedOptionId?: string | null;
  isLoading?: boolean;
  question?: string | null;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, onVote, votedOptionId, isLoading, question }) => {
  if (!poll) return null;

  return (
    <div className="w-full flex flex-col justify-start items-start gap-4 font-poppins">
      <div className="self-stretch flex flex-col justify-start items-start gap-3 w-full">
        {question && (
          <div className="w-full text-left text-black dark:text-white text-[15px] font-normal leading-[23px] mb-1 whitespace-pre-wrap">
            {question}
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          {poll.options.map((option) => {
            // Calculate percentage safely
            const percentage = poll.total_votes > 0
              ? Math.round((option.vote_count / poll.total_votes) * 100)
              : 0;

            const isSelected = votedOptionId === option.option_id;
            const isVoted = !!votedOptionId;
            const isEnded = !poll.is_active;
            const isDisabled = isLoading || isEnded;

            return (
              <button
                key={option.option_id}
                onClick={() => !isDisabled && onVote?.(option.option_id)}
                disabled={isDisabled}
                className={`w-full h-[52px] px-6 rounded-[24px] border-0 transition-all flex items-center justify-between gap-4 select-none ${isSelected
                  ? 'bg-[#5B7CFF] text-white font-semibold'
                  : 'bg-[#EEF2FF] dark:bg-[#1A2236] text-black dark:text-[#A1A8B3] hover:bg-[#E0E7FF] dark:hover:bg-[#242B3D]'
                  } ${!isDisabled ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}
              >
                <span className="font-poppins font-medium text-[16px] leading-[24px]">
                  {option.option_text}
                </span>

                {(isVoted || isEnded) && (
                  <span className="font-poppins font-semibold text-[16px] leading-[24px]">
                    {percentage}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full flex justify-end items-center gap-1.5 text-[#6B7280] dark:text-[#A1A8B3] font-poppins font-normal text-[12px] leading-[18px]">
        <span>
          {poll.is_active === false ? 'Ended' : `${poll.duration} left`}
        </span>
        <span>•</span>
        <span>
          {poll.total_votes} Votes
        </span>
        {isLoading && (
          <div className="ml-2 flex items-center">
            <svg
              className="animate-spin h-3.5 w-3.5 text-primary"
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
    </div>
  );
};
