import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { feedApi } from '../api/feed.api';
import { FeedPostProps } from '../types';
import { Poll } from '@/types/entities';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const usePostInteractions = (props: FeedPostProps) => {
  const { 
    id, 
    likes = 0, 
    isLiked: initialIsLiked = false, 
    is_saved, 
    is_commented: initialIsCommented = false,
    poll,
    onSaveChange 
  } = props;

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isCommented, setIsCommented] = useState(initialIsCommented);
  const [isSaved, setIsSaved] = useState(is_saved);
  const [likeCount, setLikeCount] = useState(typeof likes === 'string' ? parseInt(likes) : likes);
  const [commentCount, setCommentCount] = useState(typeof props.comments === 'string' ? parseInt(props.comments || '0') : (props.comments || 0));
  const [shareCount, setShareCount] = useState(typeof props.shares === 'string' ? parseInt(props.shares || '0') : (props.shares || 0));
  
  const { data: session } = useSession();
  const { isCompany, activeProfile } = useActiveProfile();
  
  // Poll State
  const [pollData, setPollData] = useState(poll);
  const [isVoting, setIsVoting] = useState(false);

  // Dirty flag: true when commentCount has been mutated locally.
  // Prevents the props-sync effect from overwriting an optimistic update.
  const hasLocalCountChange = useRef(false);

  // Sync non-count state with props (safe — these are not locally mutated)
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setIsCommented(initialIsCommented);
    setIsSaved(is_saved);
    setPollData(poll);
    setShareCount(typeof props.shares === 'string' ? parseInt(props.shares || '0') : (props.shares || 0));
  }, [initialIsLiked, initialIsCommented, is_saved, poll, props.shares]);

  // Sync commentCount only when not locally modified.
  // Prevents optimistic increments from being overwritten by stale prop values.
  useEffect(() => {
    if (!hasLocalCountChange.current) {
      setCommentCount(typeof props.comments === 'string' ? parseInt(props.comments || '0') : (props.comments || 0));
    }
  }, [props.comments]);

  // Reset dirty flag when the post ID changes (component recycled for a new post)
  useEffect(() => {
    hasLocalCountChange.current = false;
  }, [id]);

  const handleLike = async (isCompany: boolean, activeProfileId?: string) => {
    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    if (props.onLike) props.onLike();

    try {
      const companyId = isCompany ? activeProfileId : undefined;
      const result = await feedApi.toggleLike(id, companyId);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleVote = async (optionId: string, isCompany: boolean, activeProfileId?: string) => {
    if (!pollData || isVoting) return;

    setIsVoting(true);
    const previousPollData = { ...pollData };

    // Optimistic update
    setPollData(prev => {
      if (!prev) return null;
      const previousVoteId = prev.user_vote;
      const isRemoving = previousVoteId === optionId;
      const isSwitching = !!previousVoteId && !isRemoving;

      return {
        ...prev,
        total_votes: isRemoving ? prev.total_votes - 1 : (isSwitching ? prev.total_votes : prev.total_votes + 1),
        options: prev.options.map((opt: any) => {
          if (opt.option_id === optionId && !isRemoving) return { ...opt, vote_count: opt.vote_count + 1 };
          if (opt.option_id === previousVoteId) return { ...opt, vote_count: Math.max(0, opt.vote_count - 1) };
          return opt;
        }),
        user_vote: isRemoving ? null : optionId
      };
    });

    try {
      const companyId = isCompany ? activeProfileId : undefined;
      if (pollData.user_vote === optionId) {
        await feedApi.removeVote(id, companyId);
      } else {
        await feedApi.voteInPoll(id, optionId, companyId);
      }
    } catch (error) {
      console.error("Vote failed", error);
      toast.error("Failed to record vote");
      setPollData(previousPollData);
    } finally {
      setIsVoting(false);
    }
  };

  const incrementCommentCount = () => {
    hasLocalCountChange.current = true;
    setCommentCount(prev => prev + 1);
    setIsCommented(true);
  };

  const decrementCommentCount = () => {
    hasLocalCountChange.current = true;
    setCommentCount(prev => Math.max(0, prev - 1));
  };

  const incrementShareCount = () => {
    setShareCount(prev => prev + 1);
  };

  return {
    isLiked,
    isCommented,
    isSaved,
    likeCount,
    commentCount,
    shareCount,
    pollData,
    isVoting,
    setPollData,
    setIsCommented,
    setIsSaved,
    handleLike,
    handleVote,
    incrementCommentCount,
    decrementCommentCount,
    incrementShareCount
  };
};
