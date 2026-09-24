import { useState, useEffect, useRef } from 'react';
import { feedToast as toast } from '../utils/feed-toast';
import { feedApi } from '../api/feed.api';
import { createRepost } from '@/services/api/posts';
import { FeedPostProps } from '../types';
import { Poll } from '@/types/entities';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { usePostSync } from './use-post-sync';
import { useCallback, useId } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const usePostInteractions = (props: FeedPostProps, manageRoom: boolean = false) => {
  const instanceId = useId();
  const {
    id,
    likes = 0,
    isLiked: initialIsLiked = false,
    is_saved,
    is_commented: initialIsCommented = false,
    poll,
    onSaveChange,
    isReposted: initialIsReposted = false,
    isRepostedWithThoughts: initialIsRepostedWithThoughts = false
  } = props;

  const queryClient = useQueryClient();

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isReposted, setIsReposted] = useState(initialIsReposted);
  const [isRepostedWithThoughts, setIsRepostedWithThoughts] = useState(initialIsRepostedWithThoughts);
  const [repostId, setRepostId] = useState<string | null>(props.repostId || null);
  const [isCommented, setIsCommented] = useState(initialIsCommented);
  const [isSaved, setIsSaved] = useState(is_saved);
  const [likeCount, setLikeCount] = useState(typeof likes === 'string' ? parseInt(likes) : likes);
  const [commentCount, setCommentCount] = useState(typeof props.comments === 'string' ? parseInt(props.comments || '0') : (props.comments || 0));
  const [shareCount, setShareCount] = useState(typeof props.shares === 'string' ? parseInt(props.shares || '0') : (props.shares || 0));
  const [externalShareCount, setExternalShareCount] = useState(typeof props.externalShares === 'string' ? parseInt(props.externalShares || '0') : (props.externalShares || 0));

  const { data: session } = useSession();
  const { isCompany, activeProfile } = useActiveProfile();

  // Poll State
  const [pollData, setPollData] = useState(poll);
  const [isVoting, setIsVoting] = useState(false);

  // Dirty flag: true when commentCount has been mutated locally.
  // Prevents the props-sync effect from overwriting an optimistic update.
  const hasLocalCountChange = useRef(false);
  const hasLocalLikeChange = useRef(false);
  const hasLocalShareChange = useRef(false);
  const hasLocalExternalShareChange = useRef(false);

  // Sync non-count state with props (safe — these are not locally mutated)
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setIsCommented(initialIsCommented);
    setIsSaved(is_saved);
    setIsReposted(initialIsReposted);
    setIsRepostedWithThoughts(initialIsRepostedWithThoughts);
    setRepostId(props.repostId || null);
    setPollData(poll);
  }, [initialIsLiked, initialIsCommented, is_saved, initialIsReposted, initialIsRepostedWithThoughts, poll, props.repostId]);

  // Sync likeCount from props when no local optimistic like is in flight.
  useEffect(() => {
    if (!hasLocalLikeChange.current) {
      setLikeCount(typeof likes === 'string' ? parseInt(likes) : likes);
    }
  }, [likes]);

  // Sync commentCount only when not locally modified.
  // Prevents optimistic increments from being overwritten by stale prop values.
  useEffect(() => {
    if (!hasLocalCountChange.current) {
      setCommentCount(typeof props.comments === 'string' ? parseInt(props.comments || '0') : (props.comments || 0));
    }
  }, [props.comments]);

  // Sync shareCount only when not locally modified.
  useEffect(() => {
    if (!hasLocalShareChange.current) {
      setShareCount(typeof props.shares === 'string' ? parseInt(props.shares || '0') : (props.shares || 0));
    }
  }, [props.shares]);

  // Sync externalShareCount only when not locally modified.
  useEffect(() => {
    if (!hasLocalExternalShareChange.current) {
      setExternalShareCount(typeof props.externalShares === 'string' ? parseInt(props.externalShares || '0') : (props.externalShares || 0));
    }
  }, [props.externalShares]);

  // Reset dirty flags when the post ID changes (component recycled for a new post)
  useEffect(() => {
    hasLocalCountChange.current = false;
    hasLocalLikeChange.current = false;
    hasLocalShareChange.current = false;
    hasLocalExternalShareChange.current = false;
  }, [id]);

  useEffect(() => {
    const handleRepostDeleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { originalPostId, instanceId: eventInstanceId } = customEvent.detail;
      
      // Ignore events emitted by this specific component instance
      if (eventInstanceId === instanceId) return;

      // If THIS post is the original post, set isReposted to false
      if (id.toString() === originalPostId?.toString() && isReposted) {
        setIsReposted(false);
        setIsRepostedWithThoughts(false);
        setRepostId(null);
        setShareCount(prev => Math.max(0, prev - 1));
      }
    };
    
    window.addEventListener('repostDeleted', handleRepostDeleted);
    return () => window.removeEventListener('repostDeleted', handleRepostDeleted);
  }, [id, isReposted]);

  const handleLike = async (isCompany: boolean, activeProfileId?: string) => {
    const prevLiked = isLiked;
    const prevCount = likeCount;

    hasLocalLikeChange.current = true;
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    if (props.onLike) props.onLike();

    try {
      const companyId = isCompany ? activeProfileId : undefined;
      const result = await feedApi.toggleLike(id, companyId);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
      queryClient.invalidateQueries({ queryKey: ["activityLogs"] });
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      hasLocalLikeChange.current = false;
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
    hasLocalShareChange.current = true;
    setShareCount(prev => prev + 1);
  };

  const incrementExternalShareCount = (count: number = 1) => {
    hasLocalExternalShareChange.current = true;
    setExternalShareCount(prev => prev + count);
  };

  const handleRepostToggle = async (isCompany: boolean, activeProfileId?: string) => {
    const prevReposted = isReposted;
    const prevCount = shareCount;
    const prevRepostId = repostId;

    hasLocalShareChange.current = true;
    setIsReposted(!isReposted);
    setShareCount(prev => isReposted ? Math.max(0, prev - 1) : prev + 1);

    try {
      const result = await createRepost(id.toString()) as any;
      if (result && result.reposted === false) {
        setIsReposted(false);
        setIsRepostedWithThoughts(false);
        setRepostId(null);
        
        window.dispatchEvent(new CustomEvent('repostDeleted', { 
           detail: { originalPostId: id.toString(), repostId: prevRepostId, instanceId } 
        }));
      } else {
        setIsReposted(true);
        // Purpose of Bug Fix: Extract repost ID safely from API response (postId, post_id, or id) to update repost state
        const createdPostId = result?.postId || result?.post_id || result?.id;
        if (createdPostId) {
          setRepostId(createdPostId);
        }
      }
      return result;
    } catch (error) {
      console.error("Failed to toggle repost:", error);
      setIsReposted(prevReposted);
      setShareCount(prevCount);
      setRepostId(prevRepostId);
      throw error;
    }
  };

  // Memoize callbacks to prevent infinite re-renders in usePostSync
  const onLikeUpdated = useCallback((data: { postId: string; liked: boolean; likeCount: number; liker: any }) => {
    // Only update if it's from another user (not us) to avoid double counting local optimistic updates
    if (data.liker && data.liker.userId !== (isCompany ? activeProfile?.id : session?.user?.id)) {
      setLikeCount(data.likeCount);
    }
  }, [isCompany, activeProfile?.id, session?.user?.id]);

  const onCommentAdded = useCallback((data: { postId: string; comment: any }) => {
    // Only update if it's from another user
    if (data.comment && data.comment.author_id !== (isCompany ? activeProfile?.id : session?.user?.id)) {
      hasLocalCountChange.current = true;
      setCommentCount(prev => prev + 1);
    }
  }, [isCompany, activeProfile?.id, session?.user?.id]);

  const onShareUpdated = useCallback((data: { postId: string; externalShareCount: number }) => {
    setExternalShareCount(data.externalShareCount);
  }, []);

  usePostSync(
    id,
    {
      onLikeUpdated,
      onCommentAdded,
      onShareUpdated,
    },
    manageRoom,
    manageRoom
  );

  return {
    isLiked,
    isCommented,
    isSaved,
    isReposted,
    isRepostedWithThoughts,
    likeCount,
    commentCount,
    shareCount,
    externalShareCount,
    pollData,
    isVoting,
    setPollData,
    setIsCommented,
    setIsSaved,
    setIsReposted,
    setIsRepostedWithThoughts,
    setShareCount,
    repostId,
    setRepostId,
    handleLike,
    handleVote,
    handleRepostToggle,
    incrementCommentCount,
    decrementCommentCount,
    incrementShareCount,
    incrementExternalShareCount
  };
};
