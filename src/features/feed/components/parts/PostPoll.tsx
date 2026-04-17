import React from 'react';
import { PollCard } from '@/components/home/PollCard';

interface PostPollProps {
  pollData: any;
  handleVote: (optionId: string) => void;
  isVoting: boolean;
}

export const PostPoll = ({ pollData, handleVote, isVoting }: PostPollProps) => {
  if (!pollData) return null;

  return (
    <div className="mb-4 px-4" onClick={(e) => e.stopPropagation()}>
      <PollCard 
        poll={pollData} 
        onVote={handleVote} 
        isLoading={isVoting} 
        votedOptionId={pollData.user_vote} 
      />
    </div>
  );
};
