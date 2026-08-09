import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Building2, User, X, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { companyProfileService } from "../../services/companyprofile.service";
import { FollowListItemSkeleton } from "@/features/profile/components/skeletons/FollowListItemSkeleton";
import { Icon } from "@iconify/react";

interface OrganizationStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: "followers" | "following" | "subscribers";
    orgId: string;
    isOwnProfile: boolean;
    showFollowersList?: boolean;
    showFollowingList?: boolean;
}

export const OrganizationStatsModal: React.FC<OrganizationStatsModalProps> = ({
    isOpen,
    onClose,
    initialTab = "followers",
    orgId,
    isOwnProfile,
    showFollowersList = true,
    showFollowingList = true,
}) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [search, setSearch] = useState("");
    const [confirmAction, setConfirmAction] = useState<{ type: "unfollow" | "remove_follower" | "remove_subscriber", id: string, name: string, entityType?: string } | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user: currentUser } = useAuth();

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setSearch("");
        }
    }, [isOpen, initialTab]);

    const { data: followers, isLoading: isLoadingFollowers } = useQuery({
        queryKey: ["org_followers", orgId, search],
        queryFn: () => companyProfileService.getOrganizationFollowers(orgId, { search }),
        enabled: isOpen,
    });

    const { data: following, isLoading: isLoadingFollowing } = useQuery({
        queryKey: ["org_following", orgId, search],
        queryFn: () => companyProfileService.getOrganizationFollowing(orgId, { search }),
        enabled: isOpen,
    });

    const { data: subscribers, isLoading: isLoadingSubscribers } = useQuery({
        queryKey: ["org_subscribers", orgId, search],
        queryFn: () => companyProfileService.getOrganizationSubscribers(orgId, { search }),
        enabled: isOpen,
    });

    const unfollowMutation = useMutation({
        mutationFn: (data: { type: string; targetId: string }) =>
            data.type === "company"
                ? companyProfileService.organizationUnfollowOrganization(orgId, data.targetId)
                : companyProfileService.organizationUnfollowUser(orgId, data.targetId),
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ["org_following", orgId] });
            const previousFollowing = queryClient.getQueryData(["org_following", orgId, search]);
            queryClient.setQueryData(["org_following", orgId, search], (old: any[]) => {
                if (!old) return old;
                return old.filter(item => (item.id || item.user_id) !== data.targetId);
            });
            return { previousFollowing };
        },
        onError: (err, data, context) => {
            if (context?.previousFollowing) {
                queryClient.setQueryData(["org_following", orgId, search], context.previousFollowing);
            }
            toast({ title: "Failed to unfollow", variant: "destructive" });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["org_following", orgId] });
        },
        onSuccess: () => {
            toast({ title: "Unfollowed successfully" });
        },
    });

    const followMutation = useMutation({
        mutationFn: (data: { type: string; targetId: string }) =>
            data.type === "company"
                ? companyProfileService.organizationFollowOrganization(orgId, data.targetId)
                : companyProfileService.organizationFollowUser(orgId, data.targetId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["org_followers", orgId] });
            queryClient.invalidateQueries({ queryKey: ["org_following", orgId] });
            toast({ title: "Followed successfully" });
        },
        onError: () => toast({ title: "Failed to follow", variant: "destructive" }),
    });

    const removeFollowerMutation = useMutation({
        mutationFn: (targetId: string) => companyProfileService.removeCompanyFollower(orgId, targetId),
        onMutate: async (targetId) => {
            await queryClient.cancelQueries({ queryKey: ["org_followers", orgId] });
            const previousFollowers = queryClient.getQueryData(["org_followers", orgId, search]);
            queryClient.setQueryData(["org_followers", orgId, search], (old: any[]) => {
                if (!old) return old;
                return old.filter(item => (item.id || item.user_id) !== targetId);
            });
            return { previousFollowers };
        },
        onError: (err, targetId, context) => {
            if (context?.previousFollowers) {
                queryClient.setQueryData(["org_followers", orgId, search], context.previousFollowers);
            }
            toast({ title: "Failed to remove follower", variant: "destructive" });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["org_followers", orgId] });
        },
        onSuccess: () => {
            toast({ title: "Follower removed" });
        },
    });

    const removeSubscriberMutation = useMutation({
        mutationFn: (targetId: string) => companyProfileService.removeCommunitySubscriber(orgId, targetId),
        onMutate: async (targetId) => {
            await queryClient.cancelQueries({ queryKey: ["org_subscribers", orgId] });
            const previousSubscribers = queryClient.getQueryData(["org_subscribers", orgId, search]);
            queryClient.setQueryData(["org_subscribers", orgId, search], (old: any[]) => {
                if (!old) return old;
                return old.filter(item => (item.id || item.user_id) !== targetId);
            });
            return { previousSubscribers };
        },
        onError: (err, targetId, context) => {
            if (context?.previousSubscribers) {
                queryClient.setQueryData(["org_subscribers", orgId, search], context.previousSubscribers);
            }
            toast({ title: "Failed to remove subscriber", variant: "destructive" });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["org_subscribers", orgId] });
        },
        onSuccess: () => {
            toast({ title: "Subscriber removed" });
        },
    });

    const handleAction = async () => {
        if (!confirmAction) return;

        try {
            if (confirmAction.type === "unfollow") {
                await unfollowMutation.mutateAsync({ type: confirmAction.entityType || "user", targetId: confirmAction.id });
            } else if (confirmAction.type === "remove_follower") {
                await removeFollowerMutation.mutateAsync(confirmAction.id);
            } else if (confirmAction.type === "remove_subscriber") {
                await removeSubscriberMutation.mutateAsync(confirmAction.id);
            }
        } finally {
            setConfirmAction(null);
        }
    };

    const isPending = unfollowMutation.isPending || removeFollowerMutation.isPending || removeSubscriberMutation.isPending;

    const renderList = (data: any[], isLoading: boolean, emptyMessage: string, type: "followers" | "following" | "subscribers") => {
        const isRestricted = !isOwnProfile && (
            (type === "followers" && (showFollowersList === false || (data as any)?.is_restricted)) ||
            (type === "following" && (showFollowingList === false || (data as any)?.is_restricted))
        );

        if (isRestricted) {
            return (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <p className="text-[14px] text-zinc-500 font-normal leading-[20px]">
                        {type === "followers"
                            ? "The business page owner has restricted access to their followers."
                            : "The business page owner has restricted access to their following."}
                    </p>
                </div>
            );
        }

        if (isLoading) {
            return (
                <div className="space-y-4 mt-4">
                    {[1, 2, 3].map((i) => <FollowListItemSkeleton key={i} />)}
                </div>
            );
        }

        if (!data || data.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-zinc-500">{emptyMessage}</p>
                </div>
            );
        }

        return (
            <div className="space-y-1 mt-2 max-h-[50vh] overflow-y-auto pr-2 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {data.map((item) => {
                    const id = item.id || item.user_id;
                    return (
                        <div key={id} className="flex items-center justify-between py-2.5">
                            <Link
                                href={item.type === "company" ? `/organization/${id}` : `/profile/${id}`}
                                className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                                onClick={onClose}
                            >
                                <Avatar className="w-10 h-10 border border-border">
                                    <AvatarImage src={item.avatarUrl || item.avatar} alt={item.name} />
                                    <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-semibold text-sm">
                                        {(item.name || "O").charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="font-semibold text-[14px] text-zinc-900 truncate">
                                        {item.name}
                                    </span>
                                </div>
                            </Link>

                            {isOwnProfile && (
                                <div className="ml-4 flex items-center gap-2">
                                    {type === "following" && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setConfirmAction({ type: "unfollow", id, name: item.name, entityType: item.type });
                                            }}
                                            className="text-[13px] font-medium text-[#1A73E8] hover:text-blue-700 transition-colors px-2 outline-none focus:outline-none focus-visible:outline-none"
                                        >
                                            Unfollow
                                        </button>
                                    )}
                                    {type === "followers" && (
                                        <>
                                            {!item.isFollowedBack ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        followMutation.mutateAsync({ type: item.type || "user", targetId: id });
                                                    }}
                                                    className="bg-[#1A73E8] text-white rounded-[24px] px-5 py-[8px] text-[13px] font-medium hover:bg-blue-600 transition-colors outline-none focus:outline-none focus-visible:outline-none disabled:opacity-50"
                                                    disabled={followMutation.isPending}
                                                >
                                                    Follow back
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setConfirmAction({ type: "remove_follower", id, name: item.name, entityType: item.type });
                                                    }}
                                                    className="text-[13px] font-medium text-[#1A73E8] hover:text-blue-700 transition-colors px-2 outline-none focus:outline-none focus-visible:outline-none"
                                                >
                                                    Remove follower
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {type === "subscribers" && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setConfirmAction({ type: "remove_subscriber", id, name: item.name, entityType: item.type });
                                            }}
                                            className="text-[13px] font-medium text-[#1A73E8] hover:text-blue-700 transition-colors px-2 outline-none focus:outline-none focus-visible:outline-none"
                                        >
                                            Remove subscriber
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
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[500px] sm:rounded-[24px] p-6 [&>button]:hidden border-none shadow-xl">
                    <DialogHeader className="relative flex flex-col items-center justify-center mb-6 space-y-1">
                        <button
                            onClick={onClose}
                            className="absolute right-0 top-0 text-[#FF4C4C] hover:opacity-80 transition-opacity"
                        >
                            <X className="h-5 w-5" strokeWidth={2} />
                        </button>
                        <DialogTitle className="text-lg font-semibold text-zinc-900 tracking-tight">People</DialogTitle>
                        <p className="text-[12px] text-zinc-500 font-normal">Manage your followers, following, and subscribers</p>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
                        <TabsList className="flex w-full justify-between items-center bg-transparent p-0 mb-6 h-auto gap-2">
                            <TabsTrigger 
                                value="following" 
                                className="flex-1 rounded-full px-4 py-2 text-[13px] font-medium transition-colors data-[state=active]:bg-[#F4F8FE] data-[state=active]:text-zinc-900 bg-transparent flex justify-between shadow-none data-[state=active]:shadow-none border border-transparent text-zinc-600"
                            >
                                <span>Following</span>
                                <span className="text-[#1A73E8] font-medium">{following?.length || 0}</span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="followers" 
                                className="flex-1 rounded-full px-4 py-2 text-[13px] font-medium transition-colors data-[state=active]:bg-[#F4F8FE] data-[state=active]:text-zinc-900 bg-transparent flex justify-between shadow-none data-[state=active]:shadow-none border border-transparent text-zinc-600"
                            >
                                <span>Followers</span>
                                <span className="text-[#1A73E8] font-medium">{followers?.length || 0}</span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="subscribers" 
                                className="flex-1 rounded-full px-4 py-2 text-[13px] font-medium transition-colors data-[state=active]:bg-[#F4F8FE] data-[state=active]:text-zinc-900 bg-transparent flex justify-between shadow-none data-[state=active]:shadow-none border border-transparent text-zinc-600"
                            >
                                <span>Subscribers</span>
                                <span className="text-[#1A73E8] font-medium">{subscribers?.length || 0}</span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="relative mb-2">
                            <Input
                                placeholder="Search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-4 pr-10 h-[42px] rounded-full border-zinc-200 text-sm focus-visible:ring-1 focus-visible:ring-zinc-300 shadow-sm"
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-zinc-400" strokeWidth={1.5} />
                        </div>

                        <TabsContent value="followers" className="mt-0">
                            {renderList(followers || [], isLoadingFollowers, "No followers found.", "followers")}
                        </TabsContent>
                        <TabsContent value="following" className="mt-0">
                            {renderList(following || [], isLoadingFollowing, "Not following anyone.", "following")}
                        </TabsContent>
                        <TabsContent value="subscribers" className="mt-0">
                            {renderList(subscribers || [], isLoadingSubscribers, "No subscribers found.", "subscribers")}
                        </TabsContent>
                    </Tabs>

                    {/* Confirmation Overlay */}
                    {confirmAction && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 rounded-[24px]">
                            <div className="bg-white w-full max-w-[400px] p-8 rounded-[24px] shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                                <DialogTitle className="text-[18px] font-semibold text-zinc-900 mb-2 leading-[24px] text-center">
                                    {confirmAction.type === 'unfollow' ? "Unfollow this account?" :
                                        confirmAction.type === 'remove_follower' ? "Remove follower?" :
                                            "Remove subscriber?"}
                                </DialogTitle>
                                <p className="text-[14px] text-zinc-500 font-normal leading-[20px] mb-8 text-center px-4 max-w-[280px] mx-auto">
                                    {confirmAction.type === 'unfollow' ? "You will stop seeing their posts in your feed." :
                                        confirmAction.type === 'remove_follower' ? "This person will no longer follow you or see your updates in their feed." :
                                            "This subscriber will no longer receive updates from your channel."}
                                </p>
                                <div className="flex gap-4 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-[44px] rounded-full border-[#1A73E8] text-[#1A73E8] bg-transparent hover:bg-blue-50 hover:text-[#1A73E8] font-medium text-[14px] shadow-none"
                                        onClick={() => setConfirmAction(null)}
                                        disabled={isPending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 h-[44px] rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white font-medium text-[14px] border-none shadow-sm"
                                        onClick={handleAction}
                                        disabled={isPending}
                                    >
                                        {confirmAction.type === 'unfollow' ? 'Unfollow' : 'Remove'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
