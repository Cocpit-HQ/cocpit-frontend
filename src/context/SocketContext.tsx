"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { NotificationPayload, UserStatusPayload } from '@/types/socket';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: NotificationPayload) => {
      toast({
        title: "New Notification",
        description: payload.type === 'message' ? "You have a new message" : "System Notification",
      });
    };

    const handleUserStatus = (payload: UserStatusPayload) => {
      console.log("User status changed:", payload);
    };

    socket.on('notification', handleNotification);
    socket.on('userStatusChanged', handleUserStatus);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('userStatusChanged', handleUserStatus);
    };
  }, [socket, toast]);

  useEffect(() => {
    const token = session?.user?.accessToken;

    if (!token) {
      return;
    }

    // If socket already exists and token hasn't changed (re-renders), we might not want to reconnect unless token changed.
    // However, the token dependency handles that.

    // Note: session.user.accessToken comes from NextAuth.
    // If it rotates, this effect runs again, creating a new socket.

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
        console.log("Socket connected");
        setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
        console.log("Socket disconnected");
        setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
        // Handle token expiration or auth error if needed
    });

    setTimeout(() => {
      setSocket(newSocket);
    }, 0);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [session?.user?.accessToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
