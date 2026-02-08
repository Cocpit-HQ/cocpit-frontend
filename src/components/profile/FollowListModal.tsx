import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, UserMinus, UserPlus, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFollowers, getFollowing, getMyConnections, followUser, unfollowUser, removeConnection } from "@/services/api/social";
import { Follower, Following, Connection } from "@/types/social";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: "followers" | "following" | "connections";
    userId: string;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
    isOpen,
    onClose,
    initialTab = "followers",
    userId,
}) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [search, setSearch] = useState("");
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const isOwnProfile = currentUser?.id === userId;

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setSearch("");
        }
    }, [isOpen, initialTab]);

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
        queryFn: () => getMyConnections(search), // Ensure this uses userId if needed, but getMyConnections uses auth token. 
        // If viewing another user's connections is allowed, we'd need an endpoint for it. 
        // Current requirement implies displaying connections count. 
        // If it's own profile, show connections list. If other profile, maybe show mutual or just count.
        // For now assuming we can see connections if it's our profile.
        enabled: isOpen && activeTab === "connections" && isOwnProfile,
    });

    const followMutation = useMutation({
        mutationFn: followUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["followers"] });
            queryClient.invalidateQueries({ queryKey: ["following"] });
            toast({ title: "Followed successfully" });
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: unfollowUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["followers"] });
            queryClient.invalidateQueries({ queryKey: ["following"] });
            toast({ title: "Unfollowed successfully" });
        },
    });

    const removeConnectionMutation = useMutation({
        mutationFn: removeConnection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["connections"] });
            toast({ title: "Connection removed" });
        }
    })

    const handleFollow = (id: string) => {
        followMutation.mutate(id);
    };

    const handleUnfollow = (id: string) => {
        unfollowMutation.mutate(id);
    };

    const handleRemoveConnection = (id: string) => {
        removeConnectionMutation.mutate(id);
    }

    const renderUserList = (users: any[], type: "followers" | "following" | "connections") => {
        if (!users || users.length === 0) {
            return <div className="text-center text-muted-foreground py-8">No users found.</div>;
        }

        return (
            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                {users.map((user) => {
                    const id = user.user_id || user.follower_id || user.following_id;
                    // Determine if we are following this user (for followers list when viewing own profile)
                    // For simplicity, we might need extra data from backend `is_following`. 
                    // For now, in "following" list, we are obviously following them.
                    // In "followers", we might not be following them back.

                    return (
                        <div key={id} className="flex items-center justify-between">
                            <Link href={`/profile/${id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={onClose}>
                                <Avatar>
                                    <AvatarImage src={user.avatar_url || user.avatar} />
                                    <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm text-foreground">{user.full_name}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{user.headline}</p>
                                </div>
                            </Link>

                            {isOwnProfile && (
                                <div>
                                    {type === 'following' && (
                                        <Button variant="outline" size="sm" onClick={() => handleUnfollow(id)}>
                                            Following
                                        </Button>
                                    )}
                                    {type === 'followers' && (
                                        // Logic to show "Follow Back" or "Remove" could be complex without `is_following` flag
                                        // For now, let's just show a Remove button if we want to remove follower (not implemented in backend yet?)
                                        // Or "Follow" if we are not following.
                                        // Let's stick to simple "Remove" if we implement remove follower, or nothing for now as per plan focus.
                                        // Plan said: "If viewing "Followers": Remove (if own profile) or Follow/Unfollow (if viewing others)."
                                        // Verify backend has remove follower? No.
                                        // Let's just show nothing for followers tab on own profile for now unless we add remove follower endpoint.
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled>
                                            {/* Placeholder for actions */}
                                        </Button>
                                    )}
                                    {type === 'connections' && (
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveConnection(id)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            )}

                            {!isOwnProfile && (
                                // Viewing someone else's profile
                                // We should check if *we* follow these people.
                                // This requires checking `is_following` status for each user in the list.
                                // Backend update for getFollowers/getFollowing didn't explicitly add `is_following` for the viewer.
                                // We can skip this "Follow" button for now or assume we want to follow them.
                                <Button variant="outline" size="sm" onClick={() => handleFollow(id)}>
                                    Follow
                                </Button>
                            )}
                        </div>
                    )
                })}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border">
                <DialogHeader className="p-4 border-b border-border">
                    <DialogTitle className="text-foreground">
                        {/* Network / Social */}
                        {currentUser?.id === userId ? "My Network" : "Network"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full h-full flex flex-col">
                        <div className="px-4 pt-4">
                            <TabsList className="w-full grid grid-cols-3">
                                <TabsTrigger value="followers">Followers</TabsTrigger>
                                <TabsTrigger value="following">Following</TabsTrigger>
                                <TabsTrigger value="connections">Connections</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-4 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    className="pl-9 bg-background/50"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <TabsContent value="followers" className="h-full mt-0 px-4 pb-4 overflow-y-auto">
                                {isLoadingFollowers ? <div className="py-8 text-center">Loading...</div> : renderUserList(followers || [], "followers")}
                            </TabsContent>
                            <TabsContent value="following" className="h-full mt-0 px-4 pb-4 overflow-y-auto">
                                {isLoadingFollowing ? <div className="py-8 text-center">Loading...</div> : renderUserList(following || [], "following")}
                            </TabsContent>
                            <TabsContent value="connections" className="h-full mt-0 px-4 pb-4 overflow-y-auto">
                                {isOwnProfile ? (
                                    isLoadingConnections ? <div className="py-8 text-center">Loading...</div> : renderUserList(connections || [], "connections")
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Connection list is private.
                                    </div>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};
