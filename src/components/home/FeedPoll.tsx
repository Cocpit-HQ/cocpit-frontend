import React from 'react';
import { Poll } from '@/types/entities';
import { cn } from '@/lib/utils'; // Assuming this utility exists, otherwise standard class string

interface FeedPollProps {
  poll: Poll;
}

export default function FeedPoll({ poll }: FeedPollProps) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-lg mt-3">
      {poll.options.map((option) => (
        <div key={option.id} className="relative w-full">
          {/* Progress Bar Background */}
          <div className="absolute inset-0 bg-secondary/30 rounded-md overflow-hidden h-full">
            <div
              className="h-full bg-primary/20 transition-all duration-500 ease-out"
              style={{ width: `${option.percentage}%` }}
            />
          </div>

          {/* Content Overlay */}
          <div className="relative flex justify-between items-center px-4 py-3 z-10 cursor-default">
            <span className="text-sm font-medium text-foreground">{option.text}</span>
            <span className="text-sm text-muted-foreground">{option.percentage}%</span>
          </div>
        </div>
      ))}
      <div className="text-xs text-muted-foreground mt-1 px-1">
        {poll.totalVotes} votes
      </div>
    </div>
  );
}
