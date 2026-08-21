"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { NotificationPayload, UserStatusPayload, TypingPayload } from '@/types/socket';
import Avatar from '@/components/shared/Avatar';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationSettings, NOTIFICATION_SETTINGS_QUERY_KEY } from '@/features/settings/hooks/useNotificationSettings';
import type { NotificationPreferences } from '@/services/api/settings';

type TargetedMessageNotification = NotificationPayload & {
  targetProfileType?: 'USER' | 'COMPANY';
  targetCompanyId?: string;
};

type CompanyUpdateNotification = NotificationPayload & {
  actor_name?: string;
  actor_avatar?: string;
  text?: string;
  reference_id?: string | number;
};

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  typingConversations: Record<string, string | null>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  isUserOnline: () => false,
  activeConversationId: null,
  setActiveConversationId: () => { },
  typingConversations: {}
});

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
const SOCKET_TRANSPORT_MODE = process.env.NEXT_PUBLIC_SOCKET_TRANSPORT_MODE || "auto";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const { activeProfile, refreshProfile, switchProfile } = useActiveProfile();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  useNotificationSettings(); // Eagerly fetch preferences so the cache is always populated
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [typingConversations, setTypingConversations] = useState<Record<string, string | null>>({});

  // Ref to track the current token to prevent checking equality against a changing dependency causing loops
  const tokenRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  // Ref for active conversation to access in event handler without dependency issues
  const activeConversationRef = useRef<string | null>(null);
  // Ref for active profile to access in notification handler without stale closures
  const activeProfileRef = useRef<{ type: string; id: string } | null>(null);

  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    activeProfileRef.current = activeProfile
      ? { type: activeProfile.type, id: activeProfile.id }
      : null;
  }, [activeProfile]);

  useEffect(() => {
    // Check for auth error in session
    if (session?.user?.error === "RefreshAccessTokenError") {
      console.log("Session refresh failed, signing out...");
      signOut();
      return;
    }

    const token = session?.user?.accessToken;

    if (!token) {
      // If we have a socket but lost the token, disconnect
      if (socketRef.current) {
        console.log("Token lost, disconnecting socket");
        socketRef.current.disconnect();
        socketRef.current = null;
        queueMicrotask(() => {
          setSocket(null);
          setIsConnected(false);
          setOnlineUsers(new Set());
        });
      }
      return;
    }

    // Check if token changed or socket is missing
    if (socketRef.current && tokenRef.current === token) {
      if (!socketRef.current.connected) {
        console.log("Socket exists but disconnected, reconnecting...");
        socketRef.current.connect();
      }
      return; // Token is the same, do nothing
    }

    console.log("Initializing Socket with token:", token.substring(0, 10) + "...", "Old Token:", tokenRef.current ? "Present" : "None");
    tokenRef.current = token;

    // Cleanup old if exists (should be handled by cleanup func, but explicit here for safety before overwrite)
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.removeAllListeners();
    }

    const usePollingOnly = SOCKET_TRANSPORT_MODE === "polling";
    const selectedTransports: ("websocket" | "polling")[] = usePollingOnly
      ? ["polling"]
      : ["websocket", "polling"];

    const actorType = activeProfile?.type === 'COMPANY' ? 'ORGANIZATION' : 'USER';
    const actorId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;

    const newSocket = io(SOCKET_URL, {
      auth: { token, actorType, actorId },
      path: "/socket.io",
      transports: selectedTransports,
      upgrade: !usePollingOnly,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);

      const actorType = activeProfile?.type === 'COMPANY' ? 'ORGANIZATION' : 'USER';
      const actorId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
      newSocket.emit('setActorContext', { actorType, actorId });

      // Re-join active conversation room on reconnect
      const activeConvId = activeConversationRef.current;
      if (activeConvId) {
        console.log("Re-joining conversation room on reconnect:", activeConvId);
        newSocket.emit('joinConversation', { conversationId: activeConvId.toString() });
      }

      // Re-fetch conversation list and invitations, and refresh current messages
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      if (activeConvId) {
        queryClient.invalidateQueries({ queryKey: ['messages', activeConvId] });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log("Socket disconnected. Reason:", reason);
      setIsConnected(false);
      setOnlineUsers(new Set());
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", {
        message: err.message,
        description: (err as Error & { description?: unknown }).description,
        context: (err as Error & { context?: unknown }).context,
        type: (err as Error & { type?: unknown }).type,
        socketUrl: SOCKET_URL,
        socketPath: "/socket.io",
        transportMode: SOCKET_TRANSPORT_MODE,
        transports: selectedTransports,
      });
      if (err.message.includes("Authentication error") || err.message.includes("Invalid token") || err.message.includes("jwt expired")) {
        console.log("Authentication failed for socket. Forcefully signing out to prevent loop.");
        newSocket.disconnect();
        // Instead of update(), we signOut because the token is clearly invalid and refresh likely failed or will fail
        signOut();
      }
    });

    // Handle incoming events
    const refreshMessagingCaches = (conversationId?: string | null) => {
      if (conversationId) {
        queryClient.setQueryData(
          ["conversations", activeProfileRef.current?.type ?? "USER", activeProfileRef.current?.id ?? "me", "all"],
          (oldData: any[]) => {
            if (!oldData) return oldData;
            let found = false;
            const newData = oldData.map(c => {
              if (String(c.id) === String(conversationId)) {
                found = true;
                return { ...c, unread: (c.unread || 0) + 1 };
              }
              return c;
            });
            if (!found) {
              newData.unshift({ id: conversationId, unread: 1 });
            }
            return newData;
          }
        );
      }

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

        if (conversationId) {
          queryClient.invalidateQueries({
            queryKey: ['messages', conversationId],
            refetchType: 'none',
          });
        }
      }, 500);
    };

    const handleNotification = (payload: NotificationPayload) => {
      // Always refresh notification badge & dropdown first — regardless of preferences.
      // Preferences ONLY control the toast popup, never the notification component.
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });

      // Bug 1 Fix: Read prefs from the correct query key.
      const currentProfile = activeProfileRef.current;
      const isOrgProfile = currentProfile?.type === 'COMPANY';
      const prefsQueryKey = isOrgProfile
        ? ["companyNotificationSettings", currentProfile?.id]
        : NOTIFICATION_SETTINGS_QUERY_KEY;
      const prefs = queryClient.getQueryData<NotificationPreferences>(prefsQueryKey);

      const type = payload.type;
      const isMessage = type === 'message' || type.includes('message');
      const isJobMessage = isMessage && payload.isJobChat;
      const isRegularMessage = isMessage && !isJobMessage;
      const isPost = ['like', 'comment', 'reply', 'repost', 'post_tag', 'mention'].includes(type) || type.includes('post');
      const isJob = type.includes('job') || type.includes('application'); // Catch all job-related events

      // Toast suppression: only controls the popup — DB notification is already saved
      if (prefs) {
        // Master toggles
        if (isMessage && prefs.messages === false) return;
        // Sub-toggles for messages
        if (isRegularMessage && prefs.messageChats === false) return;
        if (isJobMessage && prefs.messageJobs === false) return;
        
        if (isPost && prefs.posts === false) return;
        // Exclude job messages from being incorrectly suppressed by the "Job Alerts" toggle
        if (isJob && !isJobMessage && prefs.jobs === false) return;
      }

      if (isMessage) {
        refreshMessagingCaches(payload.conversationId);

        // Suppress notification if user is currently viewing this conversation
        if (payload.conversationId && payload.conversationId === activeConversationRef.current) {
          return;
        }

        // Suppress cross-profile notifications: don't show user-targeted
        // notifications when on company profile and vice versa
        const currentProfile = activeProfileRef.current;
        const currentProfileType = currentProfile?.type || 'USER';
        const currentProfileId = currentProfile?.id;
        const targetedPayload = payload as TargetedMessageNotification;
        if (targetedPayload.targetProfileType) {
          const targetType = targetedPayload.targetProfileType;
          if (targetType === 'COMPANY' && (currentProfileType !== 'COMPANY' || currentProfileId !== targetedPayload.targetCompanyId)) {
            return; // Company-targeted notification, but not viewing that company
          }
          if (targetType === 'USER' && currentProfileType !== 'USER') {
            return; // User-targeted notification, but viewing as company
          }
        }

        toast({
          title: "New Message",
          description: (
            <div
              className="flex items-center gap-3 mt-1 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                if (payload.conversationId) {
                  router.push(`/messaging?conversationId=${payload.conversationId}`);
                }
              }}
            >
              {payload.senderName && (
                <Avatar
                  name={payload.senderName}
                  url={payload.senderAvatar}
                  size="sm"
                />
              )}
              <span>
                You have a message from <span className="font-semibold">{payload.senderName || "someone"}</span>
              </span>
            </div>
          ),
          duration: 5000,
        });
      } else if (isPost || ['like', 'comment', 'reply', 'repost', 'post_tag', 'mention', 'company_post'].includes(payload.type)) {
        const senderName = payload.senderName || (payload as any).actor_name || 'Someone';
        const senderAvatar = payload.senderAvatar || (payload as any).actor_avatar;
        const notifText = payload.text || `${senderName} interacted with your post`;
        const postId = payload.referenceId || (payload as any).reference_id || payload.metadata?.post_id;

        toast({
          title: senderName,
          description: (
            <div
              className="flex items-center gap-3 mt-1 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                if (postId) {
                  router.push(`/post/${postId}`);
                } else {
                  router.push('/notifications');
                }
              }}
            >
              {senderAvatar && (
                <Avatar
                  name={senderName}
                  url={senderAvatar}
                  size="sm"
                />
              )}
              <span className="text-sm">{notifText}</span>
            </div>
          ),
          duration: 5000,
        });
      } else if (['job', 'company_job', 'company_event'].includes(payload.type) || isJob) {
        console.log("[SOCKET] EXECUTING JOB TOAST BLOCK with payload:", payload);
        // Company or User Job notification
        const companyPayload = payload as CompanyUpdateNotification;
        const companyName = companyPayload.actor_name || payload.senderName || 'Someone';
        const companyAvatar = companyPayload.actor_avatar || payload.senderAvatar;
        const notifText = companyPayload.text || 'New job alert';
        const referenceId = companyPayload.reference_id || payload.referenceId;
        let navigateTo = '/notifications';
        if ((payload.type === 'job' || payload.type === 'company_job' || payload.type === 'application_shortlisted' || payload.type === 'job_offer') && referenceId) navigateTo = `/jobs/${referenceId}`;
        else if (payload.type === 'company_event' && referenceId) navigateTo = `/events/${referenceId}`;

        console.log("[SOCKET] Toast title:", companyName, "Text:", notifText);

        toast({
          title: companyName,
          description: (
            <div
              className="flex items-center gap-3 mt-1 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push(navigateTo)}
            >
              {companyAvatar && (
                <Avatar
                  name={companyName}
                  url={companyAvatar}
                  size="sm"
                />
              )}
              <span className="text-sm">{notifText}</span>
            </div>
          ),
          duration: 5000,
        });
      } else {
        if (payload.text) {
          toast({
            title: payload.senderName || "Notification",
            description: payload.text,
            duration: 5000,
          });
        }
      }
    };

    const handleNewMessage = (payload: { conversation_id?: string; conversationId?: string }) => {
      refreshMessagingCaches(payload.conversation_id || payload.conversationId);
    };

    const handleConversationUpdated = (payload: { conversation_id?: string; conversationId?: string }) => {
      refreshMessagingCaches(payload.conversation_id || payload.conversationId);
    };

    const handleUserStatus = (payload: UserStatusPayload) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (payload.status === 'online') {
          next.add(payload.userId);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });
    };

    const handleTyping = (payload: TypingPayload) => {
      if (
        payload.conversationId &&
        String(payload.senderId) !== String(session?.user?.id) &&
        String(payload.senderId) !== String(activeProfileRef.current?.id)
      ) {
        const convId = String(payload.conversationId);
        setTypingConversations(prev => ({
          ...prev,
          [convId]: payload.username || "Someone"
        }));
      }
    };

    const handleStopTyping = (payload: TypingPayload) => {
      if (payload.conversationId) {
        const convId = String(payload.conversationId);
        setTypingConversations(prev => {
          const next = { ...prev };
          delete next[convId];
          return next;
        });
      }
    };

    const handleBlock = (payload: any) => {
      if (!payload) return;
      const conversationId = payload.conversation_id || payload.conversationId;

      const myId = session?.user?.id || activeProfileRef.current?.id;
      const isMeBlocker =
        String(payload.blocked_by_user_id) === String(session?.user?.id) ||
        String(payload.blocked_by_user_id) === String(activeProfileRef.current?.id) ||
        String(payload.blocker_id) === String(session?.user?.id) ||
        String(payload.blocker_id) === String(activeProfileRef.current?.id);
      const currentProfile = activeProfileRef.current;

      const otherPartyId = isMeBlocker
        ? String(payload.target_id || payload.user_id || payload.userId)
        : String(payload.blocker_id || payload.blocked_by_user_id || payload.target_id || payload.userId || payload.user_id);

      if (typeof window !== "undefined" && otherPartyId && otherPartyId !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("cocpit:block_status_changed", {
            detail: { targetId: otherPartyId, isBlocked: true },
          }),
        );
        try {
          localStorage.setItem(
            "cocpit_block_event",
            JSON.stringify({ targetId: otherPartyId, isBlocked: true, timestamp: Date.now() }),
          );
        } catch (_) {}
      }

      const queryKey = [
        "conversations",
        currentProfile?.type ?? "USER",
        currentProfile?.id ?? "me",
      ];

      if (conversationId) {
        queryClient.setQueryData(
          queryKey,
          (oldData: any[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map((c) => {
              if (String(c.id) === String(conversationId)) {
                return {
                  ...c,
                  isBlockedByMe: isMeBlocker ? true : c.isBlockedByMe,
                  isBlockedByOther: !isMeBlocker ? true : c.isBlockedByOther,
                };
              }
              return c;
            });
          }
        );
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }

      queryClient.resetQueries({ queryKey: ['sharedPost'], exact: false });
      queryClient.resetQueries({ queryKey: ['profilePreview'], exact: false });
      queryClient.resetQueries({ queryKey: ['entityPreview'], exact: false });
      queryClient.resetQueries({ queryKey: ['jobContext'], exact: false });
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
      queryClient.invalidateQueries({ queryKey: ['publicProfile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['organization-jobs'] });
      queryClient.refetchQueries({ queryKey: ['sharedPost'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['profilePreview'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['entityPreview'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['jobContext'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['messages'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['conversations'], type: 'all' });
    };

    const handleUnblock = (payload: any) => {
      if (!payload) return;
      const conversationId = payload.conversation_id || payload.conversationId;

      const myId = session?.user?.id || activeProfileRef.current?.id;
      const isMeUnblocker =
        String(payload.unblocked_by_user_id) === String(session?.user?.id) ||
        String(payload.unblocked_by_user_id) === String(activeProfileRef.current?.id) ||
        String(payload.blocker_id) === String(session?.user?.id) ||
        String(payload.blocker_id) === String(activeProfileRef.current?.id) ||
        payload.is_blocked === false;
      const currentProfile = activeProfileRef.current;

      const otherPartyId = isMeUnblocker
        ? String(payload.target_id || payload.user_id || payload.userId)
        : String(payload.blocker_id || payload.unblocked_by_user_id || payload.target_id || payload.userId || payload.user_id);

      if (typeof window !== "undefined" && otherPartyId && otherPartyId !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("cocpit:block_status_changed", {
            detail: { targetId: otherPartyId, isBlocked: false },
          }),
        );
        try {
          localStorage.setItem(
            "cocpit_block_event",
            JSON.stringify({ targetId: otherPartyId, isBlocked: false, timestamp: Date.now() }),
          );
        } catch (_) {}
      }

      const queryKey = [
        "conversations",
        currentProfile?.type ?? "USER",
        currentProfile?.id ?? "me",
      ];

      if (conversationId) {
        queryClient.setQueryData(
          queryKey,
          (oldData: any[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map((c) => {
              if (String(c.id) === String(conversationId)) {
                return {
                  ...c,
                  isBlockedByMe: isMeUnblocker ? false : c.isBlockedByMe,
                  isBlockedByOther: !isMeUnblocker ? false : c.isBlockedByOther,
                };
              }
              return c;
            });
          }
        );
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }

      queryClient.resetQueries({ queryKey: ['sharedPost'], exact: false });
      queryClient.resetQueries({ queryKey: ['profilePreview'], exact: false });
      queryClient.resetQueries({ queryKey: ['entityPreview'], exact: false });
      queryClient.resetQueries({ queryKey: ['jobContext'], exact: false });
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
      queryClient.invalidateQueries({ queryKey: ['publicProfile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['organization-jobs'] });
      queryClient.refetchQueries({ queryKey: ['sharedPost'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['profilePreview'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['entityPreview'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['jobContext'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['messages'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['conversations'], type: 'all' });
    };

    const handleOrgBlockUpdated = (payload: any) => {
      if (payload?.is_blocked === false || payload?.status === 'none') {
        handleUnblock(payload);
      } else {
        handleBlock(payload);
      }
    };

    const handleRelationshipUpdated = (payload: any) => {
      if (payload?.is_blocked === false || payload?.status === 'none') {
        handleUnblock(payload);
      } else if (payload?.is_blocked === true || payload?.status === 'blocked') {
        handleBlock(payload);
      }
    };

    // Fired by acceptTeamsInvite / declineTeamsInvite / removeMember whenever
    // membership changes — broadcast to the org room (every active member's
    // socket is auto-joined to it on connect). Lets an admin's open Team page
    // pick up the change live instead of needing a manual refresh. Also covers
    // the Activity Log tab: every action this event fires for (invite accepted/
    // declined, member removed) is exactly what shows up there, so there's no
    // need for a separate audit-log-wide socket event just for that tab.
    const handleMemberSync = (payload: any) => {
      console.log("[Socket] member_sync event received:", payload);
      if (refreshProfile) {
        refreshProfile();
      }
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['user-companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    };

    const handlePrivacyUpdated = (payload: { userId?: string }) => {
      console.log("[Socket] USER_PRIVACY_UPDATED received:", payload);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    };

    // Bug 5 Fix: Listen for user notification preference changes so all open tabs
    // refresh their cached prefs in real time — toast suppression stays consistent.
    const handleUserNotificationsUpdated = () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_SETTINGS_QUERY_KEY });
    };

    const handleOrganizationDeactivated = (payload: { orgId: string }) => {
      console.log("[Socket] ORGANIZATION_DEACTIVATED received:", payload);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['jobContext'] });
      queryClient.invalidateQueries({ queryKey: ['sharedPost'] });
      queryClient.invalidateQueries({ queryKey: ['profilePreview'] });
      queryClient.invalidateQueries({ queryKey: ['entityPreview'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      queryClient.refetchQueries({ queryKey: ['conversations'] });
      queryClient.refetchQueries({ queryKey: ['messages'] });
      queryClient.refetchQueries({ queryKey: ['jobContext'] });
      queryClient.refetchQueries({ queryKey: ['sharedPost'] });

      const currentProfile = activeProfileRef.current;
      if (currentProfile?.type === 'COMPANY' && currentProfile.id === payload.orgId) {
        if (session?.user) {
          toast({
            title: "Organization Deactivated",
            description: "The organization you were acting as has been deactivated.",
            variant: "destructive",
          });
          switchProfile('USER', (session.user as any).id || "user");
        }
      }
    };

    const handleOrgStatusChanged = (payload: any) => {
      console.log("[Socket] org_status_changed event received:", payload);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['jobContext'] });
      queryClient.invalidateQueries({ queryKey: ['sharedPost'] });
      queryClient.invalidateQueries({ queryKey: ['profilePreview'] });
      queryClient.invalidateQueries({ queryKey: ['entityPreview'] });
      queryClient.refetchQueries({ queryKey: ['conversations'] });
      queryClient.refetchQueries({ queryKey: ['messages'] });
      queryClient.refetchQueries({ queryKey: ['jobContext'] });
      queryClient.refetchQueries({ queryKey: ['sharedPost'] });

      const targetOrgId = payload?.orgId || payload?.companyId;
      const currentProfile = activeProfileRef.current;

      // If current active actor is this company and it's being deleted or deactivated, auto-switch back to USER context
      if (
        currentProfile &&
        currentProfile.type === 'COMPANY' &&
        targetOrgId &&
        String(currentProfile.id) === String(targetOrgId) &&
        (payload.status === 'deleted' || payload.status === 'deactivated' || payload.action === 'deleted')
      ) {
        if (switchProfile && session?.user?.id) {
          switchProfile('USER', session.user.id);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cocpit:refresh-actor-context'));
      }
      if (refreshProfile) {
        refreshProfile();
      }
      queryClient.invalidateQueries({ queryKey: ['user-companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    };

    const handleSavedUpdated = () => {
      console.log("[Socket] saved_updated event received");
      queryClient.invalidateQueries({ queryKey: ['saved-folders'] });
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
      queryClient.invalidateQueries({ queryKey: ['savedPostStatus'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cocpit:saved-updated'));
      }
    };

    const handleActivityUpdated = (payload: any) => {
      console.log("[Socket] activity_updated event received:", payload);
      queryClient.invalidateQueries({ queryKey: ['activityLog'] });
    };

    const handleAccountStateChanged = (payload: any) => {
      console.log("[Socket] account state changed event received:", payload);
      queryClient.resetQueries({ queryKey: ['sharedPost'], exact: false });
      queryClient.resetQueries({ queryKey: ['profilePreview'], exact: false });
      queryClient.resetQueries({ queryKey: ['entityPreview'], exact: false });
      queryClient.resetQueries({ queryKey: ['jobContext'], exact: false });
      queryClient.resetQueries({ queryKey: ['messages'], exact: false });
      queryClient.resetQueries({ queryKey: ['conversations'], exact: false });
      queryClient.resetQueries({ queryKey: ['group-details'], exact: false });
      queryClient.resetQueries({ queryKey: ['groupDetails'], exact: false });
      queryClient.refetchQueries({ queryKey: ['sharedPost'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['profilePreview'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['entityPreview'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['jobContext'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['messages'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['conversations'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['group-details'], type: 'all' });
      queryClient.refetchQueries({ queryKey: ['groupDetails'], type: 'all' });
    };

    newSocket.on('notification', handleNotification);
    newSocket.on('new_message', handleNewMessage);
    newSocket.on('conversation_updated', handleConversationUpdated);
    newSocket.on('conversation-updated', handleConversationUpdated);
    newSocket.on('userStatusChanged', handleUserStatus);
    newSocket.on('isTyping', handleTyping);
    newSocket.on('stoppedTyping', handleStopTyping);
    newSocket.on('member_sync', handleMemberSync);
    newSocket.on('org_status_changed', handleOrgStatusChanged);
    newSocket.on('org_deleted', handleOrgStatusChanged);
    newSocket.on('user_blocked', handleBlock);
    newSocket.on('block_confirmed', handleBlock);
    newSocket.on('user_unblocked', handleUnblock);
    newSocket.on('unblock_confirmed', handleUnblock);
    newSocket.on('ORGANIZATION_USER_BLOCKED', handleBlock);
    newSocket.on('ORGANIZATION_USER_UNBLOCKED', handleUnblock);
    newSocket.on('ORGANIZATION_BLOCK_UPDATED', handleOrgBlockUpdated);
    newSocket.on('relationshipUpdated', handleRelationshipUpdated);
    newSocket.on('USER_PRIVACY_UPDATED', handlePrivacyUpdated);
    newSocket.on('USER_NOTIFICATIONS_UPDATED', handleUserNotificationsUpdated);
    newSocket.on('ORGANIZATION_DEACTIVATED', handleOrganizationDeactivated);
    newSocket.on('organization_deactivated', handleOrganizationDeactivated);
    newSocket.on('ORGANIZATION_REACTIVATED', handleAccountStateChanged);
    newSocket.on('organization_reactivated', handleAccountStateChanged);
    newSocket.on('user_deactivated', handleAccountStateChanged);
    newSocket.on('USER_DEACTIVATED', handleAccountStateChanged);
    newSocket.on('user_reactivated', handleAccountStateChanged);
    newSocket.on('USER_REACTIVATED', handleAccountStateChanged);
    newSocket.on('account_deactivated', handleAccountStateChanged);
    newSocket.on('ACCOUNT_DEACTIVATED', handleAccountStateChanged);
    newSocket.on('saved_folders_updated', handleSavedUpdated);
    newSocket.on('saved_posts_updated', handleSavedUpdated);
    newSocket.on('activity_updated', handleActivityUpdated);
    socketRef.current = newSocket;


    queueMicrotask(() => {
      setSocket(newSocket);
    });

    return () => {
      // Cleanup function
      // If the component unmounts, we disconnect.
      // If the token changes, this runs, then the effect body runs.

      // We rely on the effect body to handle the 'token change' replacement.
      // But we must clean up listeners.

      // Note: In strict mode, verify if this disconnects prematurely.
      console.log("Socket cleanup triggered for token:", token.substring(0, 10) + "...");
      newSocket.off('notification', handleNotification);
      newSocket.off('new_message', handleNewMessage);
      newSocket.off('conversation_updated', handleConversationUpdated);
      newSocket.off('conversation-updated', handleConversationUpdated);
      newSocket.off('userStatusChanged', handleUserStatus);
      newSocket.off('isTyping', handleTyping);
      newSocket.off('stoppedTyping', handleStopTyping);
      newSocket.off('member_sync', handleMemberSync);
      newSocket.off('user_blocked', handleBlock);
      newSocket.off('block_confirmed', handleBlock);
      newSocket.off('user_unblocked', handleUnblock);
      newSocket.off('unblock_confirmed', handleUnblock);
      newSocket.off('ORGANIZATION_USER_BLOCKED', handleBlock);
      newSocket.off('ORGANIZATION_USER_UNBLOCKED', handleUnblock);
      newSocket.off('ORGANIZATION_BLOCK_UPDATED', handleOrgBlockUpdated);
      newSocket.off('relationshipUpdated', handleRelationshipUpdated);
      newSocket.off('USER_PRIVACY_UPDATED', handlePrivacyUpdated);
      newSocket.off('USER_NOTIFICATIONS_UPDATED', handleUserNotificationsUpdated);
      newSocket.off('ORGANIZATION_DEACTIVATED', handleOrganizationDeactivated);
      newSocket.off('organization_deactivated', handleOrganizationDeactivated);
      newSocket.off('ORGANIZATION_REACTIVATED', handleAccountStateChanged);
      newSocket.off('organization_reactivated', handleAccountStateChanged);
      newSocket.off('user_deactivated', handleAccountStateChanged);
      newSocket.off('USER_DEACTIVATED', handleAccountStateChanged);
      newSocket.off('user_reactivated', handleAccountStateChanged);
      newSocket.off('USER_REACTIVATED', handleAccountStateChanged);
      newSocket.off('account_deactivated', handleAccountStateChanged);
      newSocket.off('ACCOUNT_DEACTIVATED', handleAccountStateChanged);
      newSocket.off('member_sync', handleMemberSync);
      newSocket.off('saved_folders_updated', handleSavedUpdated);
      newSocket.off('saved_posts_updated', handleSavedUpdated);
      newSocket.off('activity_updated', handleActivityUpdated);
      newSocket.disconnect();
      setTypingConversations({});
    };
  }, [session?.user?.accessToken, session?.user?.error, session?.user?.id, toast, router, queryClient, refreshProfile, switchProfile]);

  useEffect(() => {
    if (!socketRef.current) return;

    const actorType = activeProfile?.type === 'COMPANY' ? 'ORGANIZATION' : 'USER';
    const actorId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;

    socketRef.current.emit('setActorContext', { actorType, actorId });
  }, [activeProfile?.id, activeProfile?.type]);

  const isUserOnlineMemo = React.useCallback((userId: string) => onlineUsers.has(userId), [onlineUsers]);

  const contextValue = React.useMemo(() => ({
    socket,
    isConnected,
    onlineUsers,
    isUserOnline: isUserOnlineMemo,
    activeConversationId,
    setActiveConversationId,
    typingConversations
  }), [socket, isConnected, onlineUsers, isUserOnlineMemo, activeConversationId, typingConversations]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
