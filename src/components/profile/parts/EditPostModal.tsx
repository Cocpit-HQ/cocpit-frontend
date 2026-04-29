"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Eye, EyeOff } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updatePost } from "@/services/api/posts";
import { toast } from "sonner";

interface EditPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: any;
    onSuccess: (updatedPost: any) => void;
}

export function EditPostModal({ isOpen, onClose, post, onSuccess }: EditPostModalProps) {
    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && post) {
            setContent(post.content || "");
            setVisibility(post.visibility || 'public');
        }
    }, [isOpen, post]);

    const handleSave = async () => {
        if (!content.trim()) {
            toast.error("Content cannot be empty");
            return;
        }

        try {
            setLoading(true);
            const res = await updatePost(post.id || post.post_id, {
                content,
                visibility
            });
            toast.success("Post updated successfully");
            onSuccess(res);
            onClose();
        } catch (err) {
            toast.error("Failed to update post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Post</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="post-content">Post Content</Label>
                        <Textarea
                            id="post-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's on your mind?"
                            rows={6}
                            className="resize-none rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Visibility</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={visibility === 'public' ? 'default' : 'outline'}
                                onClick={() => setVisibility('public')}
                                className="flex-1 rounded-xl gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                Public
                            </Button>
                            <Button
                                type="button"
                                variant={visibility === 'private' ? 'default' : 'outline'}
                                onClick={() => setVisibility('private')}
                                className="flex-1 rounded-xl gap-2"
                            >
                                <EyeOff className="w-4 h-4" />
                                Private
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-full px-6">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || !content.trim()}
                        className="bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full px-6 gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
