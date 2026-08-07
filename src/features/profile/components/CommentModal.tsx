"use client";

import React, { useState, useEffect } from "react";
import { X, Send, User, MessageSquare } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { getComments, addComment } from "@/services/api/posts";
import { BackendComment } from "@/lib/mappers/feed.mapper";
import { toast } from "sonner";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import CommentListSkeleton from "@/features/feed/components/comments/CommentSkeleton";

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    onCommentAdded?: () => void;
}

export function CommentModal({ isOpen, onClose, postId, onCommentAdded }: CommentModalProps) {
    const { activeProfile } = useActiveProfile();
    const [comments, setComments] = useState<BackendComment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const data = await getComments(postId);
            // Backend usually returns an array of comments
            setComments(data || []);
        } catch (err) {
            console.error("Failed to fetch comments", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchComments();
        }
    }, [isOpen, postId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            const res = await addComment(postId, newComment);
            // Backend returns { message, comment }
            const createdComment: BackendComment = res.comment || {
                comment_id: Math.random().toString(),
                content: newComment,
                created_at: new Date().toISOString(),
                user_id: activeProfile?.id || "",
                full_name: activeProfile?.name || "Me",
                avatar_url: activeProfile?.avatar_url || null
            };

            setComments(prev => [createdComment, ...prev]);
            setNewComment("");
            onCommentAdded?.();
            toast.success("Comment added");
        } catch (err) {
            toast.error("Failed to add comment");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 overflow-hidden sm:rounded-[24px]">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[#6366F1]" />
                        Comments
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4">
                    {loading ? (
                        <CommentListSkeleton />
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                            <MessageSquare className="w-12 h-12 mb-2" />
                            <p>No comments yet. Be the first to join the conversation!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {comments.map((comment) => (
                                <div key={comment.comment_id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                        <AvatarImage src={comment.avatar_url || ""} />
                                        <AvatarFallback>
                                            <User className="w-4 h-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {comment.full_name}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded-2xl rounded-tl-none">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t bg-white">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="rounded-full bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-[#6366F1]"
                            disabled={submitting}
                        />
                        <Button 
                            type="submit" 
                            size="icon" 
                            disabled={!newComment.trim() || submitting}
                            className="rounded-full bg-[#6366F1] hover:bg-[#4F46E5] flex-shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
