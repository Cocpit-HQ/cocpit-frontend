import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
    UserPlus,
    UserCheck,
    UserX,
    Clock,
    Check,
    X,
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
import { companyService } from '@/services/organization.service';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';
import { useConnectionCounts } from '@/features/connection/hooks/useConnectionCounts';
import { useConnectionStore } from '@/store/connection.store';
import { FeatureDisabledTooltip } from '@/components/feature-flags';
import { useActiveProfile } from '@/context/ActiveProfileContext';

interface ConnectionButtonProps {
    userId: string;
    username?: string;
    className?: string;
    isFollowing?: boolean;
    isFollowedBy?: boolean;
    connectionRequestStatus?: 'connected' | 'pending' | 'rejected' | 'blocked' | null;
    connectionRequestId?: string | null;
    connectionRequestSender?: 'me' | 'them' | null;
    asMenuItem?: boolean;
}

type RelationshipState = 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'cooldown' | 'blocked' | 'me';

export const ConnectionButton: React.FC<ConnectionButtonProps> = ({
    userId,
    username,
    className,
    asMenuItem,
    connectionRequestStatus,
    connectionRequestId,
    connectionRequestSender,
}) => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const { activeProfile, isCompany } = useActiveProfile();

    // ─── Core state ───
    const determineInitialRelationship = (): RelationshipState => {
        if (connectionRequestStatus === 'connected') return 'connected';
        if (connectionRequestStatus === 'blocked') return 'blocked';
        if (connectionRequestStatus === 'pending') {
            return connectionRequestSender === 'me' ? 'pending_sent' : 'pending_received';
        }
        if (connectionRequestStatus === null) return 'none';
        return 'none'; // fallback
    };

    const hasInitialData = connectionRequestStatus !== undefined;
    
    const [relationship, setRelationship] = useState<RelationshipState>(hasInitialData ? determineInitialRelationship() : 'none');
    const [requestId, setRequestId] = useState<string | null>(connectionRequestId || null);
    const [loading, setLoading] = useState(!hasInitialData);
    const [actionLoading, setActionLoading] = useState(false);

    // ─── Fetch relationship on mount ───
    const fetchRelationship = useCallback(async () => {
        if (hasInitialData) {
            setLoading(false);
            return;
        }
        try {
            if (isCompany && activeProfile) {
                const data = await companyService.getConnectionStatus(activeProfile.id, userId);
                setRelationship(data.status as RelationshipState);
                setRequestId('COMPANY_REQ'); // Placeholder to satisfy checks
            } else {
                const data = await getRelationshipStatus(userId);
                setRelationship(data.status as RelationshipState);
                setRequestId(data.request_id || null);
            }
        } catch (err) {
            console.error('Failed to fetch relationship:', err);
            setRelationship('none');
        } finally {
            setLoading(false);
        }
    }, [userId, isCompany, activeProfile, hasInitialData]);

    useEffect(() => {
        fetchRelationship();
    }, [fetchRelationship]);

    // ─── Socket listener for real-time updates ───
    useEffect(() => {
        if (!socket) return;

        const handleUpdate = (payload: { userId: string; status: string; type?: string }) => {
            const isMatch = isCompany
                ? (payload.userId === userId && (payload.type === 'company' || payload.type === 'company_connection'))
                : (payload.userId === userId && !payload.type);

            if (isMatch) {
                setRelationship(payload.status as RelationshipState);
                invalidateCounts();
            }
        };

        socket.on('relationshipUpdated', handleUpdate);
        return () => { socket.off('relationshipUpdated', handleUpdate); };
    }, [socket, userId, isCompany]);

    // ─── Invalidate count caches ───
    const invalidateCounts = () => {
        queryClient.invalidateQueries({ queryKey: ['profileStats', userId] });
        queryClient.invalidateQueries({ queryKey: ['connectionCount', userId] });
        queryClient.invalidateQueries({ queryKey: ['followersCount', userId] });
        queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        queryClient.invalidateQueries({ queryKey: ['myProfile'] });
        if (username) {
            queryClient.invalidateQueries({ queryKey: ['profileStats', username] });
            queryClient.invalidateQueries({ queryKey: ['profile', username] });
            queryClient.invalidateQueries({ queryKey: ['connectionCount', username] });
            queryClient.invalidateQueries({ queryKey: ['followersCount', username] });
        }
        if (activeProfile?.id) {
            queryClient.invalidateQueries({ queryKey: ['company-connection-status', activeProfile.id, userId] });
            queryClient.invalidateQueries({ queryKey: ['company-relationship', activeProfile.id] });
        }
    };

    // ─── Actions ───

    const handleConnect = async () => {
        if (isCompany && activeProfile?.id === userId) return;

        setActionLoading(true);
        setRelationship('pending_sent');

        try {
            if (isCompany && activeProfile) {
                const res = await companyService.sendConnectionRequest(activeProfile.id, userId);
                if (res.status) setRelationship(res.status as RelationshipState);
                toast.success(res.message || 'Connection request sent');
            } else {
                const res = await sendConnectionRequest(userId);
                if (res.relationship) setRelationship(res.relationship as RelationshipState);
                if (res.connected) setRelationship('connected');
                toast.success(res.message || 'Connection request sent');
            }
            invalidateCounts();
        } catch (err: any) {
            setRelationship('none');
            const msg = err?.response?.data?.message || 'Failed to send request';
            toast.error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        setActionLoading(true);
        setRelationship('none');

        try {
            if (isCompany && activeProfile) {
                await companyService.cancelConnectionRequest(activeProfile.id, userId);
            } else {
                const idToCancel = requestId || userId;
                if (!idToCancel) return;
                await cancelConnectionRequest(idToCancel);
            }
            setRequestId(null);
            toast.success('Request cancelled');
            invalidateCounts();
        } catch (err) {
            await fetchRelationship();
            toast.error('Failed to cancel request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptOrReject = async (action: 'connected' | 'rejected') => {
        setActionLoading(true);
        setRelationship(action === 'connected' ? 'connected' : 'none');

        try {
            if (isCompany && activeProfile) {
                await companyService.handleConnectionRequest(activeProfile.id, action === 'connected' ? 'accepted' : 'rejected');
            } else {
                if (!requestId) return;
                await handleConnectionRequest(requestId, action);
            }
            toast.success(action === 'connected' ? 'Connected!' : 'Request rejected');
            invalidateCounts();
        } catch (err) {
            await fetchRelationship();
            toast.error('Failed to process request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = async () => {
        setActionLoading(true);
        setRelationship('none');

        try {
            if (isCompany && activeProfile) {
                await companyService.removeConnection(activeProfile.id, userId);
            } else {
                await removeConnection(userId);
            }
            setRequestId(null);
            toast.success('Connection removed');
            invalidateCounts();
        } catch (err) {
            await fetchRelationship();
            toast.error('Failed to remove connection');
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Render ───

    if (loading) {
        if (asMenuItem) {
            return (
                <DropdownMenuItem disabled className="gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                </DropdownMenuItem>
            );
        }
        return (
            <Button variant="ghost" disabled size="icon" className={className}>
                <Loader2 className="w-4 h-4 animate-spin" />
            </Button>
        );
    }

    if (relationship === 'me' || (isCompany && activeProfile?.id === userId)) return null;

    if (relationship === 'connected') {
        if (asMenuItem) {
            return (
                <FeatureDisabledTooltip featureKey="enableConnectionManagement">
                <DropdownMenuItem
                    className="flex items-center justify-between px-3 py-1.5 cursor-pointer focus:bg-red-50 dark:focus:bg-[#4A1C1C] focus:text-[#F87171] text-destructive dark:text-[#F87171] rounded-xl outline-none group transition-colors"
                    onClick={handleRemove}
                    disabled={actionLoading}
                >
                    <span className="text-sm font-medium group-focus:text-[#F87171]">Remove Connection</span>
                    <UserX className="w-4 h-4 group-focus:text-[#F87171] transition-colors" />
                </DropdownMenuItem>
                </FeatureDisabledTooltip>
            );
        }
        return (
            <div className={className}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2" disabled={actionLoading}>
                            <UserCheck className="w-4 h-4" />
                            Connected
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[var(--ds-bg)] border border-[var(--ds-border)]">
                        <FeatureDisabledTooltip featureKey="enableConnectionManagement">
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={handleRemove}
                        >
                            <UserX className="w-4 h-4 mr-2" />
                            Remove Connection
                        </DropdownMenuItem>
                        </FeatureDisabledTooltip>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    if (relationship === 'pending_sent') {
        if (asMenuItem) {
            return (
                <FeatureDisabledTooltip featureKey="enableConnectionManagement">
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleCancel}
                    disabled={actionLoading}
                >
                    <Clock className="w-4 h-4 mr-2" />
                    Cancel Request
                </DropdownMenuItem>
                </FeatureDisabledTooltip>
            );
        }
        return (
            <FeatureDisabledTooltip featureKey="enableConnectionManagement">
            <Button
                variant="secondary"
                className={`gap-2 ${className}`}
                onClick={handleCancel}
                disabled={actionLoading}
            >
                <Clock className="w-4 h-4" />
                Pending
            </Button>
            </FeatureDisabledTooltip>
        );
    }

    if (relationship === 'pending_received') {
        if (asMenuItem) {
            return (
                <>
                    <FeatureDisabledTooltip featureKey="enableConnectionManagement">
                    <DropdownMenuItem
                        className="text-blue-600 focus:text-blue-600 cursor-pointer"
                        onClick={() => handleAcceptOrReject('connected')}
                        disabled={actionLoading}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Accept Request
                    </DropdownMenuItem>
                    </FeatureDisabledTooltip>
                    <FeatureDisabledTooltip featureKey="enableConnectionManagement">
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                        onClick={() => handleAcceptOrReject('rejected')}
                        disabled={actionLoading}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Reject Request
                    </DropdownMenuItem>
                    </FeatureDisabledTooltip>
                </>
            );
        }
        return (
            <div className={`flex gap-2 ${className}`}>
                <FeatureDisabledTooltip featureKey="enableConnectionManagement">
                <Button
                    variant="default"
                    className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleAcceptOrReject('connected')}
                    disabled={actionLoading}
                >
                    <Check className="w-4 h-4" />
                    Accept
                </Button>
                </FeatureDisabledTooltip>
                <FeatureDisabledTooltip featureKey="enableConnectionManagement">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAcceptOrReject('rejected')}
                    disabled={actionLoading}
                >
                    <X className="w-4 h-4" />
                </Button>
                </FeatureDisabledTooltip>
            </div>
        );
    }

    if (relationship === 'cooldown') {
        return (
            <Button variant="secondary" disabled className={`gap-2 ${className}`}>
                <Clock className="w-4 h-4" />
                Cooldown
            </Button>
        );
    }

    if (asMenuItem) {
        return (
            <FeatureDisabledTooltip featureKey="enableConnectionManagement">
            <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleConnect}
                disabled={actionLoading}
            >
                <UserPlus className="w-4 h-4 mr-2" />
                Connect
            </DropdownMenuItem>
            </FeatureDisabledTooltip>
        );
    }

    return (
        <FeatureDisabledTooltip featureKey="enableConnectionManagement">
        <Button
            variant="default"
            className={`gap-2 ${className}`}
            onClick={handleConnect}
            disabled={actionLoading}
        >
            <UserPlus className="w-4 h-4" />
            Connect
        </Button>
        </FeatureDisabledTooltip>
    );
};
