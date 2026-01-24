
import React from 'react';
import { Poll } from '@/types/entities';
import { Loader2 } from 'lucide-react';

interface PollCardProps {
  poll: Poll;
  onVote?: (optionId: string) => void;
  votedOptionId?: string | null;
  isLoading?: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, onVote, votedOptionId, isLoading }) => {
  if (!poll) return null;

  return (
    <div className="w-full mt-4 bg-card border border-border rounded-lg p-4">
      <div className="space-y-3">
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
              className={`relative w-full text-left group transition-all ${!isDisabled
                ? 'hover:brightness-95 active:scale-[0.99] cursor-pointer'
                : 'cursor-default opacity-80'
                }`}
            >
              {/* Progress bar background */}
              <div className={`absolute inset-0 rounded-md overflow-hidden ${isSelected ? 'bg-primary/20 border border-primary/30' : 'bg-muted/30'}`}>
                <div
                  className={`h-full transition-all duration-500 ease-out ${isSelected ? 'bg-primary/20' : 'bg-primary/10'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Content */}
              <div className="relative flex justify-between items-center p-3 z-10">
                <div className="flex items-center gap-2">
                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  <span className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {option.option_text}
                  </span>
                </div>

                {(isVoted || isEnded) && (
                  <span className="text-sm text-muted-foreground transition-opacity duration-300">
                    {percentage}% ({option.vote_count})
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-2">
        <span>
          {poll.is_active === false ? (
            <span className="text-red-500 font-medium">Poll Ended</span>
          ) : (
            <span>{poll.duration} days left</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          {poll.total_votes} votes
        </div>
      </div>
    </div>
  );
};
