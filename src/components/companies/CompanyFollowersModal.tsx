"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company.service";
import { toast } from "sonner";
import Link from "next/link";

interface CompanyFollowersModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
    companyName: string;
    canManage?: boolean;
}

export function CompanyFollowersModal({
    isOpen,
    onClose,
    companyId,
    companyName,
    canManage = false,
}: CompanyFollowersModalProps) {
    const [search, setSearch] = useState("");
    const [removingId, setRemovingId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (isOpen) setSearch("");
    }, [isOpen]);

    const { data: followers, isLoading } = useQuery({
        queryKey: ["company_followers", companyId, search],
        queryFn: () => companyService.getCompanyFollowers(companyId, search || undefined),
        enabled: isOpen && !!companyId,
    });

    const handleRemoveFollower = async (followerId: string) => {
        setRemovingId(followerId);
        try {
            await companyService.removeCompanyFollower(companyId, followerId);
            // Invalidate both the followers list and the relationship (follower count)
            queryClient.invalidateQueries({ queryKey: ["company_followers", companyId] });
            queryClient.invalidateQueries({ queryKey: ["company_relationship", companyId] });
            toast.success("Follower removed");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to remove follower";
            toast.error(msg);
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border">
                <DialogHeader className="p-4 border-b border-border">
                    <DialogTitle className="text-foreground">
                        {companyName} — Followers
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search followers..."
                                className="pl-9 bg-background/50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-4">
                        {isLoading ? (
                            <div className="py-8 text-center text-muted-foreground">Loading...</div>
                        ) : !followers || followers.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                {search ? "No followers match your search." : "No followers yet."}
                            </div>
                        ) : (
                            <div className="space-y-4 mt-4">
                                {followers.map((user) => (
                                    <div key={user.user_id} className="flex items-center justify-between">
                                        <Link
                                            href={`/profile/${user.user_id}`}
                                            className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1"
                                            onClick={onClose}
                                        >
                                            <Avatar>
                                                <AvatarImage src={user.avatar_url || undefined} />
                                                <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-foreground truncate">{user.full_name}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{user.headline}</p>
                                            </div>
                                        </Link>

                                        {canManage && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0 ml-2"
                                                onClick={() => handleRemoveFollower(user.user_id)}
                                                disabled={removingId === user.user_id}
                                            >
                                                {removingId === user.user_id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <X className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
