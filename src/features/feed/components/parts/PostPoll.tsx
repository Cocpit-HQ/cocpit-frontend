import React from 'react';
import { PollCard } from '@/components/home/PollCard';

interface PostPollProps {
  pollData: any;
  handleVote: (optionId: string) => void;
  isVoting: boolean;
  title?: string | null;
}

export const PostPoll = ({ pollData, handleVote, isVoting, title }: PostPollProps) => {
  if (!pollData) return null;

  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      <PollCard 
        poll={pollData} 
        onVote={handleVote} 
        isLoading={isVoting} 
        votedOptionId={pollData.user_vote} 
        question={title}
      />
    </div>
  );
};
