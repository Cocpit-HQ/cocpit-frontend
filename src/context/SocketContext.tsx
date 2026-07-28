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
  const { activeProfile, refreshProfile } = useActiveProfile();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
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
      console.log("Socket connected:", newSocket.id);
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
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: ['messages', conversationId],
          refetchType: 'none',
        });
      }
    };

    const handleNotification = (payload: NotificationPayload) => {
      if (payload.type === 'message') {
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
      } else if (['company_job', 'company_event', 'company_post'].includes(payload.type)) {
        // Company notification from followed companies
        const companyPayload = payload as CompanyUpdateNotification;
        const companyName = companyPayload.actor_name || 'A company';
        const companyAvatar = companyPayload.actor_avatar;
        const notifText = companyPayload.text || 'New company update';
        const referenceId = companyPayload.reference_id;
        let navigateTo = '/notifications';
        if (payload.type === 'company_job' && referenceId) navigateTo = `/jobs/${referenceId}`;
        else if (payload.type === 'company_event' && referenceId) navigateTo = `/events/${referenceId}`;
        else if (payload.type === 'company_post' && referenceId) navigateTo = `/post/${referenceId}`;

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
      } else if (payload.type === 'post_tag') {
        const taggedBy = payload.senderName || payload.actor_name || 'Someone';
        const senderAvatar = payload.senderAvatar || payload.actor_avatar;
        const notifText = payload.text || `${taggedBy} tagged you in a post`;
        const postId = payload.referenceId || payload.reference_id || payload.metadata?.post_id;

        toast({
          title: "Tagged in a post",
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
                  name={taggedBy}
                  url={senderAvatar}
                  size="sm"
                />
              )}
              <span className="text-sm">{notifText}</span>
            </div>
          ),
          duration: 5000,
        });
      } else {
        toast({
          title: "New Notification",
          description: "System Notification",
        });
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
      if (payload.conversationId && payload.senderId !== session?.user?.id) {
        setTypingConversations(prev => ({
          ...prev,
          [payload.conversationId]: payload.username || "Someone"
        }));
      }
    };

    const handleStopTyping = (payload: TypingPayload) => {
      if (payload.conversationId) {
        setTypingConversations(prev => {
          const next = { ...prev };
          delete next[payload.conversationId];
          return next;
        });
      }
    };

    const handleBlock = (payload: any) => {
      if (!payload) return;
      const conversationId = payload.conversation_id || payload.conversationId;
      if (!conversationId) return;

      const isMeBlocker = String(payload.blocked_by_user_id) === String(session?.user?.id);
      const currentProfile = activeProfileRef.current;

      const queryKey = [
        "conversations",
        currentProfile?.type ?? "USER",
        currentProfile?.id ?? "me",
      ];

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

      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    };

    const handleUnblock = (payload: any) => {
      if (!payload) return;
      const conversationId = payload.conversation_id || payload.conversationId;
      if (!conversationId) return;

      const isMeUnblocker = String(payload.unblocked_by_user_id) === String(session?.user?.id);
      const currentProfile = activeProfileRef.current;

      const queryKey = [
        "conversations",
        currentProfile?.type ?? "USER",
        currentProfile?.id ?? "me",
      ];

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

      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
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

    newSocket.on('notification', handleNotification);
    newSocket.on('new_message', handleNewMessage);
    newSocket.on('conversation_updated', handleConversationUpdated);
    newSocket.on('conversation-updated', handleConversationUpdated);
    newSocket.on('userStatusChanged', handleUserStatus);
    newSocket.on('isTyping', handleTyping);
    newSocket.on('stoppedTyping', handleStopTyping);
    newSocket.on('member_sync', handleMemberSync);
    newSocket.on('user_blocked', handleBlock);
    newSocket.on('block_confirmed', handleBlock);
    newSocket.on('user_unblocked', handleUnblock);
    newSocket.on('unblock_confirmed', handleUnblock);

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
      newSocket.off('member_sync', handleMemberSync);
      newSocket.disconnect();
      setTypingConversations({});
    };
  }, [session?.user?.accessToken, session?.user?.error, toast, router, queryClient, refreshProfile]);

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
