import React from 'react';
import { Poll } from '@/types/entities';

interface PollCardProps {
  poll: Poll;
  onVote?: (optionId: string) => void;
  votedOptionId?: string | null;
  isLoading?: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, onVote, votedOptionId, isLoading }) => {
  if (!poll) return null;

  return (
    <div className="w-full">
      <div className="space-y-[12px]">
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
            <button
              key={option.option_id}
              onClick={() => !isDisabled && onVote?.(option.option_id)}
              disabled={isDisabled}
              className={`group relative w-full overflow-hidden rounded-[24px] border-0 text-left transition-all ${isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-[var(--feed-ultra-light)] text-foreground dark:bg-muted'
                } ${!isDisabled
                  ? 'cursor-pointer hover:brightness-95 active:scale-[0.99]'
                  : 'cursor-default opacity-85'
                }`}
            >
              {(isVoted || isEnded) && (
                <div
                  className={`absolute inset-y-0 left-0 rounded-[24px] transition-all duration-500 ease-out ${isSelected ? 'bg-primary' : 'bg-primary/10'}`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative z-10 flex h-[48px] items-center justify-between gap-[10px] px-[16px] py-[16px]">
                <div className="flex min-w-0 items-center gap-2">
                  {!isVoted && !isEnded && (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-muted-foreground/40 bg-background" />
                  )}
                  <span className={`truncate text-[12px] leading-[16px] font-[family-name:var(--font-poppins)] ${isSelected ? 'font-medium text-primary-foreground' : 'font-normal text-foreground'}`}>
                    {option.option_text}
                  </span>
                </div>

                {isSelected && (isVoted || isEnded) && (
                  <span className="shrink-0 text-[12px] leading-[16px] font-medium font-[family-name:var(--font-poppins)] text-primary-foreground">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-[8px] flex h-[16px] items-center justify-end gap-2 text-[10px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
        <span>{poll.total_votes} Votes</span>
        <span className="sr-only">
          {poll.is_active === false ? 'Poll ended' : `${poll.duration} days left`}
        </span>
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
