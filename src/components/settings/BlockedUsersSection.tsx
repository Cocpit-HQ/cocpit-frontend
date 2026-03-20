'use client';

import { useState, useEffect } from 'react';
import { useSocial } from '@/context/SocialContext';
import api from '@/lib/axios';
import { UserX, Unlock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface BlockedUser {
    user_id: string;
    full_name: string;
    avatar_url: string;
    headline: string;
    account_name: string;
}

export function BlockedUsersSection() {
    const { unblockUser } = useSocial();
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const fetchBlockedUsers = async () => {
        try {
            const res = await api.get('/users/me/blocks');
            setBlockedUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch blocked users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (userId: string) => {
        try {
            await unblockUser(userId);
            setBlockedUsers(prev => prev.filter(u => u.user_id !== userId));
        } catch (error) {
            console.error("Failed to unblock user", error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Blocked Users</h1>

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : blockedUsers.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border border-border">
                    <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No blocked users</h3>
                    <p className="text-muted-foreground mt-2">
                        When you block someone, they will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {blockedUsers.map(user => (
                        <div key={user.user_id} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{user.full_name}</h3>
                                    <p className="text-sm text-muted-foreground">@{user.account_name}</p>
                                    {user.headline && (
                                        <p className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">
                                            {user.headline}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleUnblock(user.user_id)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            >
                                <Unlock className="w-4 h-4" />
                                Unblock
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
