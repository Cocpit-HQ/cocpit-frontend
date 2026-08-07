import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Building2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getFollowers,
    getFollowing,
    getMyConnections,
    followUser,
    unfollowUser,
    removeFollower,
    removeConnection,
    getProfileStats
} from "../services/profile.service";
import { companyService } from "@/services/organization.service";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useSocial } from "@/context/SocialContext";
import { Icon } from "@iconify/react";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { FollowListItemSkeleton } from "./skeletons/FollowListItemSkeleton";

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: "followers" | "following" | "connections";
    userId: string;
}

interface ConfirmAction {
    type: "unfollow" | "remove_follower" | "remove_connection";
    userId: string;
    userName: string;
    userType?: string;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
    isOpen,
    onClose,
    initialTab = "followers",
    userId,
}) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [search, setSearch] = useState("");
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const { syncFollowStatus } = useSocial();
    const { activeProfile } = useActiveProfile();
    const isOwnProfile = activeProfile?.type === 'USER' && currentUser?.id === userId;

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setSearch("");
        }
    }, [isOpen, initialTab]);

    const { data: stats } = useQuery({
        queryKey: ["profileStats", userId],
        queryFn: () => getProfileStats(userId),
        enabled: isOpen,
    });

    const { data: followers, isLoading: isLoadingFollowers } = useQuery({
        queryKey: ["followers", userId, search],
        queryFn: () => getFollowers(userId, search),
        enabled: isOpen && activeTab === "followers",
    });

    const { data: following, isLoading: isLoadingFollowing } = useQuery({
        queryKey: ["following", userId, search],
        queryFn: () => getFollowing(userId, search),
        enabled: isOpen && activeTab === "following",
    });

    const { data: connections, isLoading: isLoadingConnections } = useQuery({
        queryKey: ["connections", userId, search],
        queryFn: () => getMyConnections(search),
        enabled: isOpen && activeTab === "connections" && isOwnProfile,
    });

    const followMutation = useMutation({
        mutationFn: followUser,
        onMutate: async (newUserId) => {
            await queryClient.cancelQueries({ queryKey: ["profileStats", userId] });
            await queryClient.cancelQueries({ queryKey: ["followers", userId] });
            await queryClient.cancelQueries({ queryKey: ["following", userId] });

            const previousStats = queryClient.getQueryData(["profileStats", userId]);
            const previousFollowing = queryClient.getQueryData(["following", userId, search]);
            const previousFollowers = queryClient.getQueryData(["followers", userId, search]);

            // Optimistically update stats
            queryClient.setQueryData(["profileStats", userId], (old: any) => ({
                ...old,
                following_count: (old?.following_count || 0) + 1
            }));

            // Optimistically update followers list if we are in followers tab
            if (activeTab === "followers") {
                queryClient.setQueryData(["followers", userId, search], (old: any[]) =>
                    old?.map(u => (u.user_id === newUserId || u.follower_id === newUserId) ? { ...u, is_following_back: true } : u)
                );
            }

            return { previousStats, previousFollowing, previousFollowers };
        },
        onError: (err, newUserId, context: any) => {
            queryClient.setQueryData(["profileStats", userId], context.previousStats);
            queryClient.setQueryData(["following", userId, search], context.previousFollowing);
            queryClient.setQueryData(["followers", userId, search], context.previousFollowers);
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["following", userId] });
            queryClient.invalidateQueries({ queryKey: ["profileStats", userId] });
            queryClient.invalidateQueries({ queryKey: ["followers", userId] });
            if (variables) {
                queryClient.invalidateQueries({ queryKey: ["profileStats", variables] });
                queryClient.invalidateQueries({ queryKey: ["profile", variables] });
                queryClient.invalidateQueries({ queryKey: ["followers", variables] });
                queryClient.invalidateQueries({ queryKey: ["following", variables] });
            }
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: unfollowUser,
        onMutate: async (targetId) => {
            await queryClient.cancelQueries({ queryKey: ["profileStats", userId] });
            await queryClient.cancelQueries({ queryKey: ["following", userId] });
            await queryClient.cancelQueries({ queryKey: ["followers", userId] });

            const previousStats = queryClient.getQueryData(["profileStats", userId]);
            const previousFollowing = queryClient.getQueryData(["following", userId, search]);
            const previousFollowers = queryClient.getQueryData(["followers", userId, search]);

            // Optimistically update stats
            queryClient.setQueryData(["profileStats", userId], (old: any) => ({
                ...old,
                following_count: Math.max(0, (old?.following_count || 0) - 1)
            }));

            // Optimistically update lists
            if (activeTab === "following") {
                queryClient.setQueryData(["following", userId, search], (old: any[]) =>
                    old?.filter(u => (u.user_id || u.following_id) !== targetId)
                );
            }
            if (activeTab === "followers") {
                queryClient.setQueryData(["followers", userId, search], (old: any[]) =>
                    old?.map(u => (u.user_id === targetId || u.follower_id === targetId) ? { ...u, is_following_back: false } : u)
                );
            }

            return { previousStats, previousFollowing, previousFollowers };
        },
        onError: (err, targetId, context: any) => {
            queryClient.setQueryData(["profileStats", userId], context.previousStats);
            queryClient.setQueryData(["following", userId, search], context.previousFollowing);
            queryClient.setQueryData(["followers", userId, search], context.previousFollowers);
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["following", userId] });
            queryClient.invalidateQueries({ queryKey: ["profileStats", userId] });
            queryClient.invalidateQueries({ queryKey: ["followers", userId] });
            if (variables) {
                queryClient.invalidateQueries({ queryKey: ["profileStats", variables] });
                queryClient.invalidateQueries({ queryKey: ["profile", variables] });
                queryClient.invalidateQueries({ queryKey: ["followers", variables] });
                queryClient.invalidateQueries({ queryKey: ["following", variables] });
            }
        },
    });

    const unfollowCompanyMutation = useMutation({
        mutationFn: (companyId: string) => companyService.unfollowCompany(companyId),
        onMutate: async (companyId) => {
            await queryClient.cancelQueries({ queryKey: ["profileStats", userId] });
            await queryClient.cancelQueries({ queryKey: ["following", userId] });

            const previousStats = queryClient.getQueryData(["profileStats", userId]);
            const previousFollowing = queryClient.getQueryData(["following", userId, search]);

            queryClient.setQueryData(["profileStats", userId], (old: any) => ({
                ...old,
                following_count: Math.max(0, (old?.following_count || 0) - 1)
            }));

            if (activeTab === "following") {
                queryClient.setQueryData(["following", userId, search], (old: any[]) =>
                    old?.filter(u => u.user_id !== companyId)
                );
            }

            syncFollowStatus(companyId, false);

            return { previousStats, previousFollowing };
        },
        onError: (err, companyId, context: any) => {
            queryClient.setQueryData(["profileStats", userId], context.previousStats);
            queryClient.setQueryData(["following", userId, search], context.previousFollowing);
            syncFollowStatus(companyId, true); // revert sync
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["following", userId] });
            queryClient.invalidateQueries({ queryKey: ["company_relationship"] });
            queryClient.invalidateQueries({ queryKey: ["company_followers"] });
            queryClient.invalidateQueries({ queryKey: ["company"] });
            queryClient.invalidateQueries({ queryKey: ["profileStats", userId] });
        },
    });

    const removeConnectionMutation = useMutation({
        mutationFn: (data: { id: string, type?: string }) => {
            if (data.type === 'company') {
                return companyService.removeConnection(data.id, userId);
            }
            return removeConnection(data.id);
        },
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ["profileStats", userId] });
            await queryClient.cancelQueries({ queryKey: ["connections", userId] });

            const previousStats = queryClient.getQueryData(["profileStats", userId]);
            const previousConnections = queryClient.getQueryData(["connections", userId, search]);

            // Optimistically update stats
            queryClient.setQueryData(["profileStats", userId], (old: any) => ({
                ...old,
                connections_count: Math.max(0, (old?.connections_count || 0) - 1)
            }));

            // Optimistically update connections list
            queryClient.setQueryData(["connections", userId, search], (old: any[]) =>
                old?.filter(u => (u.user_id || u.follower_id || u.following_id) !== data.id)
            );

            return { previousStats, previousConnections };
        },
        onError: (err, data, context: any) => {
            queryClient.setQueryData(["profileStats", userId], context.previousStats);
            queryClient.setQueryData(["connections", userId, search], context.previousConnections);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["connections", userId] });
            queryClient.invalidateQueries({ queryKey: ["following", userId] });
            queryClient.invalidateQueries({ queryKey: ["profileStats", userId] });
        }
    });

    const removeFollowerMutation = useMutation({
        mutationFn: removeFollower,
        onMutate: async (targetId) => {
            await queryClient.cancelQueries({ queryKey: ["profileStats", userId] });
            await queryClient.cancelQueries({ queryKey: ["followers", userId] });

            const previousStats = queryClient.getQueryData(["profileStats", userId]);
            const previousFollowers = queryClient.getQueryData(["followers", userId, search]);

            // Optimistically update stats
            queryClient.setQueryData(["profileStats", userId], (old: any) => ({
                ...old,
                followers_count: Math.max(0, (old?.followers_count || 0) - 1)
            }));

            // Optimistically remove from followers list
            queryClient.setQueryData(["followers", userId, search], (old: any[]) =>
                old?.filter(u => (u.user_id || u.follower_id) !== targetId)
            );

            return { previousStats, previousFollowers };
        },
        onError: (err, targetId, context: any) => {
            queryClient.setQueryData(["profileStats", userId], context.previousStats);
            queryClient.setQueryData(["followers", userId, search], context.previousFollowers);
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["followers", userId] });
            queryClient.invalidateQueries({ queryKey: ["profileStats", userId] });
            queryClient.invalidateQueries({ queryKey: ["connections", userId] });
            if (variables) {
                queryClient.invalidateQueries({ queryKey: ["profileStats", variables] });
                queryClient.invalidateQueries({ queryKey: ["profile", variables] });
                queryClient.invalidateQueries({ queryKey: ["followers", variables] });
                queryClient.invalidateQueries({ queryKey: ["following", variables] });
            }
        }
    });

    const handleFollow = (id: string) => {
        followMutation.mutate(id);
    };

    const handleUnfollow = (id: string, name: string, type?: string) => {
        setConfirmAction({
            type: "unfollow",
            userId: id,
            userName: name,
            userType: type
        });
    };

    const handleRemoveFollower = (id: string, name: string) => {
        setConfirmAction({
            type: "remove_follower",
            userId: id,
            userName: name
        });
    };

    const handleRemoveConnection = (id: string, name: string, type?: string) => {
        setConfirmAction({
            type: "remove_connection",
            userId: id,
            userName: name,
            userType: type
        });
    };

    const executeConfirmedAction = () => {
        if (!confirmAction) return;

        const { type, userId: targetId, userType } = confirmAction;

        if (type === "unfollow") {
            if (userType === 'company') {
                unfollowCompanyMutation.mutate(targetId);
            } else {
                unfollowMutation.mutate(targetId);
            }
        } else if (type === "remove_follower") {
            removeFollowerMutation.mutate(targetId);
        } else if (type === "remove_connection") {
            removeConnectionMutation.mutate({ id: targetId, type: userType });
        }

        setConfirmAction(null);
    };

    const renderUserList = (users: any[], type: "followers" | "following" | "connections") => {
        if (!users || users.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                        <Icon icon="solar:users-group-two-rounded-linear" className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-[14px] font-medium text-foreground font-[family-name:var(--font-poppins)]">No one here yet</p>
                    <p className="text-[12px] text-muted-foreground font-[family-name:var(--font-poppins)] mt-1">
                        {type === 'followers' ? "You don't have any followers yet." :
                            type === 'following' ? "You aren't following anyone yet." :
                                "You don't have any professional connections yet."}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-1 mt-4 px-0 pb-6 h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {users.map((user) => {
                    const id = user.user_id || user.follower_id || user.following_id;
                    const isCompany = user.type === 'company';
                    const linkHref = isCompany ? `/organization/${user.slug}` : `/profile/${user.account_name || id}`;

                    return (
                        <div key={`${user.type || 'user'}-${id}`} className="flex items-center justify-between py-4 group">
                            <Link href={linkHref} className="flex items-center gap-5 hover:opacity-80 transition-opacity min-w-0 flex-1" onClick={onClose}>
                                <div className="relative flex-shrink-0">
                                    <Avatar className="h-11 w-11 border border-border">
                                        <AvatarImage src={user.avatar_url || user.avatar} />
                                        <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-semibold">{user.full_name?.[0]?.toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    {isCompany && (
                                        <div className="absolute -bottom-0.5 -right-0.5 bg-[#6366F1] text-white rounded-full p-1 border-2 border-white">
                                            <Building2 className="h-2.5 w-2.5" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex flex-col justify-center">
                                    <p className="font-medium text-[16px] text-foreground font-[family-name:var(--font-poppins)] truncate leading-[24px]">
                                        {user.full_name}
                                    </p>
                                    <p className="text-[12px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)] line-clamp-1 leading-[16px]">
                                        {user.headline || "Connection"}
                                    </p>
                                </div>
                            </Link>

                            {isOwnProfile && (
                                <div className="flex-shrink-0 ml-4">
                                    {type === 'following' && (
                                        <button
                                            className="h-[36px] px-4 rounded-[24px] bg-primary-tint text-[14px] font-normal text-primary-tint-foreground font-[family-name:var(--font-poppins)] hover:opacity-80 transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleUnfollow(id, user.full_name, user.type);
                                            }}
                                        >
                                            Unfollow
                                        </button>
                                    )}
                                    {type === 'followers' && (
                                        <div className="flex items-center gap-2">
                                            {!user.is_following_back ? (
                                                <button
                                                    className="h-[36px] px-5 bg-[#6366F1] text-white text-[13px] font-medium rounded-full hover:opacity-90 transition-all shadow-sm font-[family-name:var(--font-poppins)]"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleFollow(id);
                                                    }}
                                                >
                                                    Follow back
                                                </button>
                                            ) : (
                                                <button
                                                    className="text-[#818CF8] text-[14px] font-normal hover:opacity-80 transition-colors font-[family-name:var(--font-poppins)] whitespace-nowrap"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleRemoveFollower(id, user.full_name);
                                                    }}
                                                >
                                                    Remove follower
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {type === 'connections' && (
                                        <button
                                            className="h-[36px] px-4 rounded-[24px] bg-primary-tint text-[14px] font-normal text-primary-tint-foreground font-[family-name:var(--font-poppins)] hover:opacity-80 transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRemoveConnection(id, user.full_name, user.type);
                                            }}
                                        >
                                            Remove connection
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-none sm:max-w-[600px] w-full h-[100dvh] sm:h-[498px] flex flex-col p-4 sm:p-4 gap-0 overflow-hidden bg-card rounded-none sm:rounded-[24px] shadow-none data-[state=open]:duration-300 data-[state=open]:sm:animate-in data-[state=open]:sm:fade-in-90 data-[state=open]:sm:zoom-in-95 data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:data-[state=open]:slide-in-from-bottom-0">
                {/* Mobile Header */}
                <div className="sm:hidden flex items-center justify-between sticky top-0 bg-card z-50 px-4 py-4 border-b border-border">
                    <button onClick={onClose} className="p-2 -ml-2 text-foreground hover:bg-secondary rounded-full transition-colors">
                        <Icon icon="hugeicons:arrow-left-01" className="w-6 h-6" />
                    </button>
                    <span className="text-[16px] font-medium font-[family-name:var(--font-poppins)] text-foreground">
                        People
                    </span>
                    <div className="w-10"></div> {/* Spacer for centering */}
                </div>

                <DialogHeader className="hidden sm:flex p-0 pt-4 text-center relative flex-col items-center gap-2">
                    <DialogTitle className="text-[18px] font-medium text-foreground font-[family-name:var(--font-poppins)] text-center w-full leading-[26px]">
                        People
                    </DialogTitle>
                    <p className="text-[12px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)] leading-[16px]">
                        Manage your followers, following, and professional connections
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col mt-4 sm:mt-0">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full h-full flex flex-col">
                        <div className="px-4 sm:px-0 mt-4">
                            <TabsList className="w-full h-[48px] bg-transparent p-0 rounded-none grid grid-cols-3 gap-4">
                                <TabsTrigger
                                    value="following"
                                    className="h-[48px] rounded-[24px] px-4 data-[state=active]:bg-primary-tint data-[state=inactive]:bg-muted/50 data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground shadow-[0px_0px_4px_rgba(99,102,241,0.05)] transition-all flex items-center justify-between border-none"
                                >
                                    <span className="text-[14px] font-normal font-[family-name:var(--font-poppins)]">Following</span>
                                    <span className="text-[14px] font-normal text-primary-tint-foreground font-[family-name:var(--font-poppins)]">{stats?.following_count || 0}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="followers"
                                    className="h-[48px] rounded-[24px] px-4 data-[state=active]:bg-primary-tint data-[state=inactive]:bg-muted/50 data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground shadow-[0px_0px_4px_rgba(99,102,241,0.05)] transition-all flex items-center justify-between border-none"
                                >
                                    <span className="text-[14px] font-normal font-[family-name:var(--font-poppins)]">Followers</span>
                                    <span className="text-[14px] font-normal text-primary-tint-foreground font-[family-name:var(--font-poppins)]">{stats?.followers_count || 0}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="connections"
                                    className="h-[48px] rounded-[24px] px-4 data-[state=active]:bg-primary-tint data-[state=inactive]:bg-muted/50 data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground shadow-[0px_0px_4px_rgba(99,102,241,0.05)] transition-all flex items-center justify-between border-none"
                                >
                                    <span className="text-[14px] font-normal font-[family-name:var(--font-poppins)]">Connection</span>
                                    <span className="text-[14px] font-normal text-primary-tint-foreground font-[family-name:var(--font-poppins)]">{stats?.connections_count || 0}</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-4 sm:p-0 mt-4">
                            <div className="relative">
                                <Input
                                    placeholder="Search"
                                    className="h-[40px] rounded-[24px] border-border pl-6 pr-12 text-[16px] font-medium font-[family-name:var(--font-poppins)] placeholder:text-muted-foreground bg-muted/30 focus-visible:ring-0"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <TabsContent value="followers" className="h-full mt-0 px-4 pb-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {isLoadingFollowers ? (
                                    <div className="space-y-1 mt-4">
                                        {[1, 2, 3, 4].map((i) => (
                                            <FollowListItemSkeleton key={i} />
                                        ))}
                                    </div>
                                ) : renderUserList(followers || [], "followers")}
                            </TabsContent>
                            <TabsContent value="following" className="h-full mt-0 px-4 pb-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {isLoadingFollowing ? (
                                    <div className="space-y-1 mt-4">
                                        {[1, 2, 3, 4].map((i) => (
                                            <FollowListItemSkeleton key={i} />
                                        ))}
                                    </div>
                                ) : renderUserList(following || [], "following")}
                            </TabsContent>
                            <TabsContent value="connections" className="h-full mt-0 px-4 pb-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {isOwnProfile ? (
                                    isLoadingConnections ? (
                                        <div className="space-y-1 mt-4">
                                            {[1, 2, 3, 4].map((i) => (
                                                <FollowListItemSkeleton key={i} />
                                            ))}
                                        </div>
                                    ) : renderUserList(connections || [], "connections")
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Connection list is private.
                                    </div>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Confirmation Overlay */}
                {confirmAction && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-card w-full max-w-[400px] p-8 rounded-[24px] shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                            <DialogTitle className="text-[14px] font-normal text-foreground font-[family-name:var(--font-poppins)] mb-2 leading-[20px] text-center">
                                {confirmAction.type === 'unfollow' ? "Unfollow this account?" :
                                    confirmAction.type === 'remove_follower' ? "Remove follower?" :
                                        "Remove connection?"}
                            </DialogTitle>
                            <p className="text-[12px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)] leading-[16px] mb-8 text-center px-4 max-w-[268px] mx-auto">
                                {confirmAction.type === 'unfollow' ? "You will stop seeing their posts in your feed." :
                                    confirmAction.type === 'remove_follower' ? "This person will no longer follow you or see your updates in their feed." :
                                        "You will no longer be connected with this person. They won't be notified."}
                            </p>
                            <div className="flex gap-4 w-full">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-[48px] rounded-full border-[#6366F1] text-[#6366F1] bg-transparent hover:bg-transparent hover:text-[#6366F1] font-semibold text-[15px] font-[family-name:var(--font-poppins)] shadow-none"
                                    onClick={() => setConfirmAction(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 h-[48px] rounded-full bg-[#FF6B6B] hover:opacity-90 text-white font-semibold text-[15px] font-[family-name:var(--font-poppins)] border-none shadow-sm"
                                    onClick={executeConfirmedAction}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
