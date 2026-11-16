'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  followSuggestedUser,
} from '@/services/api/connections';
import { companyService } from '@/services/organization.service';
import { useSocial } from '@/context/SocialContext';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { updateGlobalSearchEntityStatus } from '../../utils/search-cache.utils';

export interface SearchActionButtonProps {
  entityType: 'person' | 'company' | 'institute';
  targetId: string;
  targetName: string;
  isFollowing?: boolean;
  connectionStatus?: 'connected' | 'pending_sent' | 'pending_received' | 'none';
  connectionsCount?: number;
  pendingRequestId?: string | null;
  messagePermission?: 'everyone' | 'followers_only' | 'no_one';
  messagesEnabled?: boolean;
  isSelf?: boolean;
  className?: string;
}

export const SearchActionButton: React.FC<SearchActionButtonProps> = ({
  entityType,
  targetId,
  targetName,
  isFollowing = false,
  connectionStatus = 'none',
  connectionsCount = 0,
  pendingRequestId = null,
  messagePermission = 'everyone',
  messagesEnabled = true,
  isSelf = false,
  className = '',
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const { isCompany, activeProfile } = useActiveProfile();
  const { isFollowing: isSocialFollowing, isFollowingInitialized, syncFollowStatus, notifyFollowEvent, followUser } = useSocial();

  const [localIsFollowing, setLocalIsFollowing] = useState(isFollowing);
  const [localConnectionStatus, setLocalConnectionStatus] = useState(connectionStatus);
  const [localRequestId, setLocalRequestId] = useState(pendingRequestId);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    setLocalIsFollowing(isFollowing);
  }, [isFollowing]);

  useEffect(() => {
    setLocalConnectionStatus(connectionStatus);
  }, [connectionStatus]);

  useEffect(() => {
    setLocalRequestId(pendingRequestId);
  }, [pendingRequestId]);

  // Reactive sync with SocialContext
  useEffect(() => {
    if (isFollowingInitialized && targetId) {
      const socialFollowing = isSocialFollowing(targetId);
      if (socialFollowing !== localIsFollowing) {
        setLocalIsFollowing(socialFollowing);
      }
    }
  }, [isFollowingInitialized, targetId, isSocialFollowing]);

  // Listen for cross-component follow events (e.g. from profile page or drawers)
  useEffect(() => {
    if (typeof window === 'undefined' || !targetId) return;
    const handleFollowChanged = (e: any) => {
      const detail = e.detail || {};
      if (detail.targetId && String(detail.targetId).toLowerCase().trim() === String(targetId).toLowerCase().trim()) {
        setLocalIsFollowing(Boolean(detail.isFollowing));
      }
    };
    window.addEventListener('cocpit:follow_status_changed', handleFollowChanged);
    return () => {
      window.removeEventListener('cocpit:follow_status_changed', handleFollowChanged);
    };
  }, [targetId]);

  const currentUserId = (session?.user as any)?.id || (session?.user as any)?.sub;
  const isActualSelf =
    isSelf ||
    (!isCompany && currentUserId && targetId === currentUserId) ||
    (isCompany && activeProfile?.id === targetId);

  if (isActualSelf) return null;

  // Resolve current visual state
  let buttonState: 'connect' | 'follow' | 'pending' | 'accept' | 'message' | 'message_disabled';

  if (isCompany) {
    // When the viewer is an ORGANIZATION / COMPANY:
    // Organizations CANNOT create personal connections with users.
    // They can ONLY follow users (or message if already following).
    if (entityType === 'person') {
      if (localIsFollowing) {
        buttonState = 'message';
      } else {
        buttonState = 'follow';
      }
    } else {
      // Organization viewing Company / Institute
      if (!localIsFollowing) {
        buttonState = 'follow';
      } else {
        const canMessage = messagePermission !== 'no_one' && messagesEnabled !== false;
        buttonState = canMessage ? 'message' : 'message_disabled';
      }
    }
  } else {
    // When the viewer is a normal USER account:
    if (entityType === 'person') {
      if (localConnectionStatus === 'connected' || localIsFollowing) {
        buttonState = 'message';
      } else if (localConnectionStatus === 'pending_sent') {
        buttonState = 'pending';
      } else if (localConnectionStatus === 'pending_received') {
        buttonState = 'accept';
      } else {
        // Target connection threshold rule: < 500 => Connect, >= 500 => Follow
        buttonState = connectionsCount >= 500 ? 'follow' : 'connect';
      }
    } else {
      // User viewing organization
      if (!localIsFollowing) {
        buttonState = 'follow';
      } else {
        const canMessage = messagePermission !== 'no_one' && messagesEnabled !== false;
        buttonState = canMessage ? 'message' : 'message_disabled';
      }
    }
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isMutating) return;

    if (status !== 'authenticated') {
      toast.error('Please sign in to continue');
      const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
      router.push(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (buttonState === 'message') {
      const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
      if (entityType === 'person') {
        const queryParams = new URLSearchParams({ userId: targetId });
        if (isCompany && activeProfile?.id) {
          queryParams.set('companyId', activeProfile.id);
        }
        if (currentUrl) {
          queryParams.set('returnTo', currentUrl);
        }
        router.push(`/messaging?${queryParams.toString()}`);
      } else {
        const queryParams = new URLSearchParams({ companyId: targetId });
        if (currentUrl) {
          queryParams.set('returnTo', currentUrl);
        }
        router.push(`/messaging?${queryParams.toString()}`);
      }
      return;
    }

    if (buttonState === 'message_disabled') {
      toast.info('This organization does not accept direct messages');
      return;
    }

    if (buttonState === 'pending') {
      return;
    }

    if (buttonState === 'connect') {
      setIsMutating(true);
      setLocalConnectionStatus('pending_sent');
      try {
        const res: any = await sendConnectionRequest(targetId);
        const reqId = res?.data?.requestId || res?.requestId || res?.data?.request_id || null;
        if (reqId) setLocalRequestId(reqId);
        updateGlobalSearchEntityStatus(queryClient, targetId, {
          connection_status: 'pending_sent',
          pending_request_id: reqId,
        });
        toast.success(`Connection request sent to ${targetName}`);
      } catch (err: any) {
        setLocalConnectionStatus('none');
        updateGlobalSearchEntityStatus(queryClient, targetId, {
          connection_status: 'none',
          pending_request_id: null,
        });
        toast.error(err?.response?.data?.message || 'Unable to send connection request');
      } finally {
        setIsMutating(false);
      }
      return;
    }

    if (buttonState === 'accept') {
      if (!localRequestId) return;
      setIsMutating(true);
      setLocalConnectionStatus('connected');
      try {
        await acceptConnectionRequest(localRequestId);
        updateGlobalSearchEntityStatus(queryClient, targetId, {
          connection_status: 'connected',
          is_connected: true,
        });
        toast.success(`Connected with ${targetName}`);
      } catch {
        setLocalConnectionStatus('pending_received');
        updateGlobalSearchEntityStatus(queryClient, targetId, {
          connection_status: 'pending_received',
          pending_request_id: localRequestId,
        });
        toast.error('Unable to accept connection request');
      } finally {
        setIsMutating(false);
      }
      return;
    }

    if (buttonState === 'follow') {
      setIsMutating(true);
      setLocalIsFollowing(true);
      try {
        if (entityType === 'person') {
          // followUser in SocialContext automatically checks isCompany & activeProfile:
          // If isCompany: POST /organizations/:orgId/following/users/:userId
          // Else: POST /users/:userId/follow
          await followUser(targetId, undefined, targetName);
        } else {
          await companyService.followCompany(targetId);
          syncFollowStatus(targetId, true);
          notifyFollowEvent(targetId, true);
          updateGlobalSearchEntityStatus(queryClient, targetId, {
            is_following: true,
          });
          toast.success(`Followed ${targetName}`);
        }
      } catch (err: any) {
        setLocalIsFollowing(false);
        syncFollowStatus(targetId, false);
        notifyFollowEvent(targetId, false);
        updateGlobalSearchEntityStatus(queryClient, targetId, {
          is_following: false,
        });
        toast.error(err?.response?.data?.message || 'Unable to follow');
      } finally {
        setIsMutating(false);
      }
      return;
    }
  };

  // Determine styling and labels
  let label = '';
  let styleClasses = '';
  let title = '';

  switch (buttonState) {
    case 'connect':
      label = 'Connect';
      styleClasses = 'bg-ds-accent text-ds-text-primary hover:bg-ds-accent-hover shadow-sm active:scale-95 cursor-pointer';
      break;
    case 'follow':
      label = 'Follow';
      styleClasses = 'bg-ds-accent text-ds-text-primary hover:bg-ds-accent-hover shadow-sm active:scale-95 cursor-pointer';
      break;
    case 'accept':
      label = 'Accept';
      styleClasses = 'bg-ds-accent text-ds-text-primary hover:bg-ds-accent-hover shadow-sm active:scale-95 cursor-pointer';
      break;
    case 'pending':
      label = 'Pending';
      styleClasses = 'bg-[#1F242F] text-ds-text-muted border border-white/5 cursor-default select-none';
      title = '';
      break;
    case 'message':
      label = 'Message';
      styleClasses = 'bg-black text-white border border-[#2D3139] hover:bg-[#15181E] hover:border-[#3D424B] active:scale-95 cursor-pointer';
      break;
    case 'message_disabled':
      label = 'Message';
      styleClasses = 'bg-[#1F242F] text-[#555B66] border border-white/5 opacity-50 cursor-not-allowed';
      title = 'This organization does not accept direct messages';
      break;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isMutating || buttonState === 'message_disabled' || buttonState === 'pending'}
      title={title}
      className={`flex items-center justify-center w-[89px] h-[36px] px-[12px] py-[6px] rounded-full text-[16px] leading-[24px] font-medium font-dm-sans transition-all select-none shrink-0 ${styleClasses} ${
        isMutating ? 'opacity-60 cursor-wait' : ''
      } ${className}`}
    >
      <span>{isMutating ? '...' : label}</span>
    </button>
  );
};

export default SearchActionButton;

