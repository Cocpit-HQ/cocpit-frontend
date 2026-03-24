"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { NotificationPayload, UserStatusPayload } from '@/types/socket';
import Avatar from '@/components/shared/Avatar';

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
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  isUserOnline: () => false,
  activeConversationId: null,
  setActiveConversationId: () => { }
});

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const { activeProfile } = useActiveProfile();
  const { toast } = useToast();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

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

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log("Socket disconnected. Reason:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      if (err.message.includes("Authentication error") || err.message.includes("Invalid token") || err.message.includes("jwt expired")) {
        console.log("Authentication failed for socket. Forcefully signing out to prevent loop.");
        newSocket.disconnect();
        // Instead of update(), we signOut because the token is clearly invalid and refresh likely failed or will fail
        signOut();
      }
    });

    // Handle incoming events
    const handleNotification = (payload: NotificationPayload) => {
      if (payload.type === 'message') {
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
      } else {
        toast({
          title: "New Notification",
          description: "System Notification",
        });
      }
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

    newSocket.on('notification', handleNotification);
    newSocket.on('userStatusChanged', handleUserStatus);

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
      newSocket.off('userStatusChanged', handleUserStatus);
      newSocket.disconnect();
    };
  }, [session?.user?.accessToken, session?.user?.error, toast, router]);

  const isUserOnlineMemo = React.useCallback((userId: string) => onlineUsers.has(userId), [onlineUsers]);

  const contextValue = React.useMemo(() => ({
    socket,
    isConnected,
    onlineUsers,
    isUserOnline: isUserOnlineMemo,
    activeConversationId,
    setActiveConversationId
  }), [socket, isConnected, onlineUsers, isUserOnlineMemo, activeConversationId]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
