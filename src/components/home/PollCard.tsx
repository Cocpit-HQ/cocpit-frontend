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
    <div className="w-full py-4 bg-white dark:bg-transparent rounded-3xl border border-indigo-50 dark:border-[#232F45] flex flex-col justify-start items-start gap-4">
      <div className="self-stretch flex flex-col justify-start items-start gap-4 w-full">
        <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full">
          {question && (
            <div className="self-stretch px-4 flex flex-col justify-center items-center gap-2.5 w-full">
              <div className="w-full justify-start text-black dark:text-foreground text-base font-normal font-['Poppins'] leading-6 break-words">
                {question}
              </div>
            </div>
          )}
        </div>
        {poll.options.map((option) => {
          // Calculate percentage safely
          const percentage = poll.total_votes > 0
            ? Math.round((option.vote_count / poll.total_votes) * 100)
            : 0;

          const isSelected = votedOptionId === option.option_id;
          const isVoted = !!votedOptionId;
          const isEnded = !poll.is_active;
          // Allow switching votes AND unvoting: Only disable if loading or ended
          const isDisabled = isLoading || isEnded;

          return (
            <div key={option.option_id} className="self-stretch px-4 flex flex-col justify-center items-center gap-2.5 w-full">
              <button
                onClick={() => !isDisabled && onVote?.(option.option_id)}
                disabled={isDisabled}
                className={`group relative w-full overflow-hidden rounded-3xl border-0 text-left transition-all p-4 inline-flex justify-center items-center gap-2.5 ${isSelected
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-50 text-black dark:bg-muted dark:text-white'
                  } ${!isDisabled
                    ? 'cursor-pointer hover:brightness-95 active:scale-[0.99]'
                    : 'cursor-default opacity-90'
                  }`}
              >
              <div className="relative z-10 flex w-full items-center justify-between gap-[10px]">
                <div className="flex-1 justify-start font-normal font-['Poppins'] text-xs leading-4 line-clamp-3">
                  {option.option_text}
                </div>

                {(isVoted || isEnded) && (
                  <div className="justify-start font-medium font-['Poppins'] text-xs leading-4 line-clamp-3">
                    {percentage}%
                  </div>
                )}
              </div>
            </button>
            </div>
          );
        })}
      </div>

      <div className="self-stretch px-4 inline-flex justify-end items-center gap-2.5 w-full">
        <span className="sr-only">
          {poll.is_active === false ? 'Poll ended' : `${poll.duration} left`}
        </span>
        <div aria-hidden="true" className="justify-start text-gray-500 text-[10px] font-normal font-['Poppins'] leading-4 line-clamp-6">
          {poll.is_active === false ? 'Ended' : `${poll.duration} left`}
        </div>
        <div className="size-1.5 bg-gray-500 rounded-full" />
        <div className="justify-start text-gray-500 text-[10px] font-medium font-['Poppins'] leading-4 line-clamp-6">
          {poll.total_votes} Votes
        </div>
        <div className="flex items-center">
          {isLoading && (
            <svg 
              className="animate-spin h-3 w-3 text-primary" 
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
          )}
        </div>
      </div>
    </div>
  );
};
