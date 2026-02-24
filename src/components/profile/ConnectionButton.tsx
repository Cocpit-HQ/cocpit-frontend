import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
    UserPlus,
    UserCheck,
    UserX,
    Clock,
    Check,
    X,
    MoreHorizontal,
    Loader2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    sendConnectionRequest,
    cancelConnectionRequest,
    handleConnectionRequest,
    removeConnection,
    getRelationshipStatus
} from '@/services/api/social';
import { toast } from 'sonner';
import { RelationshipStatus } from '@/types/social';

import { useSocket } from '@/context/SocketContext';

interface ConnectionButtonProps {
    userId: string;
    className?: string;
    // Initial data props
    isFollowing?: boolean;
    isFollowedBy?: boolean;
    connectionRequestStatus?: 'connected' | 'pending' | 'rejected' | 'blocked' | null;
    connectionRequestId?: string | null;
    connectionRequestSender?: 'me' | 'them' | null;
}

export const ConnectionButton: React.FC<ConnectionButtonProps> = ({
    userId,
    className,
    isFollowing,
    isFollowedBy,
    connectionRequestStatus,
}) => {
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    // Fetch detailed relationship status
    const { data: relationship, isLoading: isQueryLoading } = useQuery({
        queryKey: ['relationship', userId],
        queryFn: () => getRelationshipStatus(userId),
        staleTime: 1000 * 60, // 1 minute
    });

    const [isMutating, setIsMutating] = useState(false);

    // Derived state from query (prioritized) or props (fallback)
    const status = relationship?.status ?? connectionRequestStatus;
    const requestId = relationship?.request_id;
    // If query is loaded, use query data for connection status. Fallback to props.
    // Note: relationship.status 'connected' implies following/followed_by check in backend.

    // However, if we don't have relationship data yet, we rely on props?
    // But getRelationshipStatus returns all we need.
    // Let's use relationship data if available, otherwise check props.

    // Strict priority: Relationship Query > Props

    // Determine effective status
    let effectiveStatus = status;
    if (isQueryLoading && connectionRequestStatus) {
        effectiveStatus = connectionRequestStatus;
    }

    // If query says 'none' but props say 'pending', rely on query (it's fresher).
    // Unless query is loading.

    const invalidateQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['relationship', userId] });
        queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        queryClient.invalidateQueries({ queryKey: ['followers', userId] });
        queryClient.invalidateQueries({ queryKey: ['following', userId] });
        queryClient.invalidateQueries({ queryKey: ['connections', userId] });
    };

    // Socket Listener for Real-time Updates
    useEffect(() => {
        if (!socket) return;

        const handleRelationshipUpdate = (payload: { userId: string, status: string }) => {
            // payload.userId is the OTHER person. 
            // If I am viewing Alice (userId prop), and I get update { userId: Alice.id }, refresh.
            if (payload.userId === userId) {
                invalidateQueries();
            }
        };

        socket.on('relationshipUpdated', handleRelationshipUpdate);

        return () => {
            socket.off('relationshipUpdated', handleRelationshipUpdate);
        };
    }, [socket, userId, queryClient]);


    // --- Mutations ---

    const sendRequestMutation = useMutation({
        mutationFn: () => sendConnectionRequest(userId),
        onMutate: async () => {
            setIsMutating(true);
            await queryClient.cancelQueries({ queryKey: ['relationship', userId] });
            const previoushelper = queryClient.getQueryData(['relationship', userId]);
            // Optimistic update
            queryClient.setQueryData(['relationship', userId], (old: RelationshipStatus | undefined) => ({
                ...old,
                status: 'pending_sent',
                request_id: 'temp-id'
            }));
            return { previoushelper };
        },
        onSuccess: () => {
            toast.success("Connection request sent");
            invalidateQueries();
        },
        onError: (error: any, _, context) => {
            const errorMessage = error.response?.data?.message || "Failed to send request";
            toast.error(errorMessage);
            if (context?.previoushelper) {
                queryClient.setQueryData(['relationship', userId], context.previoushelper);
            }
            invalidateQueries();
        },
        onSettled: () => setIsMutating(false),
    });

    const cancelRequestMutation = useMutation({
        mutationFn: () => cancelConnectionRequest(requestId!),
        onMutate: async () => {
            setIsMutating(true);
            await queryClient.cancelQueries({ queryKey: ['relationship', userId] });
            const previous = queryClient.getQueryData(['relationship', userId]);
            queryClient.setQueryData(['relationship', userId], (old: RelationshipStatus | undefined) => ({
                ...old,
                status: 'none',
                request_id: null
            }));
            return { previous };
        },
        onSuccess: () => {
            toast.success("Request cancelled");
            invalidateQueries();
        },
        onError: (err, _, context) => {
            toast.error("Failed to cancel request");
            if (context?.previous) {
                queryClient.setQueryData(['relationship', userId], context.previous);
            }
        },
        onSettled: () => setIsMutating(false),
    });

    const handleRequestMutation = useMutation({
        mutationFn: ({ action }: { action: 'connected' | 'rejected' }) =>
            handleConnectionRequest(requestId!, action),
        onMutate: async ({ action }) => {
            setIsMutating(true);
            await queryClient.cancelQueries({ queryKey: ['relationship', userId] });
            const previous = queryClient.getQueryData(['relationship', userId]);

            if (action === 'connected') {
                queryClient.setQueryData(['relationship', userId], (old: RelationshipStatus | undefined) => ({
                    ...old,
                    status: 'connected',
                    is_following: true,
                    is_followed_by: true
                }));
            } else {
                queryClient.setQueryData(['relationship', userId], (old: RelationshipStatus | undefined) => ({
                    ...old,
                    status: 'none',
                    request_id: null
                }));
            }
            return { previous };
        },
        onSuccess: (_, variables) => {
            toast.success(variables.action === 'connected' ? "Connected!" : "Request rejected");
            invalidateQueries();
        },
        onError: (err, _, context) => {
            toast.error("Failed to update request");
            if (context?.previous) {
                queryClient.setQueryData(['relationship', userId], context.previous);
            }
        },
        onSettled: () => setIsMutating(false),
    });

    const removeConnectionMutation = useMutation({
        mutationFn: () => removeConnection(userId),
        onMutate: async () => {
            setIsMutating(true);
            await queryClient.cancelQueries({ queryKey: ['relationship', userId] });
            const previous = queryClient.getQueryData(['relationship', userId]);
            queryClient.setQueryData(['relationship', userId], (old: RelationshipStatus | undefined) => ({
                ...old,
                status: 'none',
                is_following: false,
                is_followed_by: false
            }));
            return { previous };
        },
        onSuccess: () => {
            toast.success("Connection removed");
            invalidateQueries();
        },
        onError: (err, _, context) => {
            toast.error("Failed to remove connection");
            if (context?.previous) {
                queryClient.setQueryData(['relationship', userId], context.previous);
            }
        },
        onSettled: () => setIsMutating(false),
    });

    if (isQueryLoading && !effectiveStatus && !isFollowing) {
        return (
            <Button variant="ghost" disabled size="icon" className={className}>
                <Loader2 className="w-4 h-4 animate-spin" />
            </Button>
        );
    }

    // Safety check for self
    if (effectiveStatus === 'me') return null;

    // --- CONNECTED ---
    if (effectiveStatus === 'connected' || (isQueryLoading && isFollowing && isFollowedBy)) {
        return (
            <div className={className}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2" disabled={isMutating}>
                            <UserCheck className="w-4 h-4" />
                            Connected
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={() => removeConnectionMutation.mutate()}
                        >
                            <UserX className="w-4 h-4 mr-2" />
                            Remove Connection
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    // --- PENDING SENT (I sent it) ---
    if (effectiveStatus === 'pending_sent') {
        return (
            <Button
                variant="secondary"
                className={`gap-2 ${className}`}
                onClick={() => cancelRequestMutation.mutate()}
                disabled={isMutating}
            >
                <Clock className="w-4 h-4" />
                Pending
                <span className="sr-only">Cancel Request</span>
            </Button>
        );
    }

    // --- PENDING RECEIVED (They sent it) ---
    if (effectiveStatus === 'pending_received') {
        return (
            <div className={`flex gap-2 ${className}`}>
                <Button
                    variant="default"
                    className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleRequestMutation.mutate({ action: 'connected' })}
                    disabled={isMutating}
                >
                    <Check className="w-4 h-4" />
                    Accept
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRequestMutation.mutate({ action: 'rejected' })}
                    disabled={isMutating}
                >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Reject</span>
                </Button>
            </div>
        );
    }

    // --- COOLDOWN ---
    if (effectiveStatus === 'cooldown') {
        return (
            <Button variant="secondary" disabled className={`gap-2 ${className}`}>
                <Clock className="w-4 h-4" />
                Cooldown
            </Button>
        );
    }

    // --- BLOCKED ---
    if (effectiveStatus === 'blocked') {
        return (
            <Button variant="secondary" disabled className={`gap-2 ${className}`}>
                <UserX className="w-4 h-4" />
                Blocked
            </Button>
        );
    }

    // --- NONE (Default: Connect) ---
    return (
        <Button
            variant="default"
            className={`gap-2 ${className}`}
            onClick={() => sendRequestMutation.mutate()}
            disabled={isMutating}
        >
            <UserPlus className="w-4 h-4" />
            Connect
        </Button>
    );
};
