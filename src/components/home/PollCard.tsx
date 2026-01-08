import React from 'react';
import { Poll } from '@/types/entities';

interface PollCardProps {
  poll: Poll;
}

export const PollCard: React.FC<PollCardProps> = ({ poll }) => {
  if (!poll) return null;

  return (
    <div className="w-full mt-4 bg-card border border-border rounded-lg p-4">
      <div className="space-y-3">
        {poll.options.map((option) => {
          // Calculate percentage safely
          const percentage = poll.total_votes > 0
            ? Math.round((option.vote_count / poll.total_votes) * 100)
            : 0;

          return (
            <div key={option.option_id} className="relative">
              {/* Progress bar background */}
              <div className="absolute inset-0 bg-muted/30 rounded-md overflow-hidden">
                 <div
                   className="h-full bg-primary/10 transition-all duration-500 ease-out"
                   style={{ width: `${percentage}%` }}
                 />
              </div>

              {/* Content */}
              <div className="relative flex justify-between items-center p-3 z-10">
                <span className="font-medium text-sm text-foreground">{option.option_text}</span>
                <span className="text-sm text-muted-foreground">{percentage}% ({option.vote_count})</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-muted-foreground text-right border-t border-border pt-2">
        {poll.total_votes} votes
      </div>
    </div>
  );
};
