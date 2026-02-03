import React, { useState, useEffect } from 'react';
import { Comment as CommentType } from '@/types/entities';
import Comment from './Comment';
import { useSearchParams } from 'next/navigation';

interface ReplyGroupProps {
    replies: CommentType[];
    onReply?: (authorName: string, commentId: string | number, accountName?: string) => void;
    onDelete?: (commentId: string | number) => void;
    currentUserId?: string;
    isDark?: boolean;
    isPostOwner?: boolean;
    postId?: string | number;
}

export default function ReplyGroup({ replies, onReply, onDelete, currentUserId, isDark, isPostOwner, postId }: ReplyGroupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const searchParams = useSearchParams();
    const targetCommentId = searchParams.get('commentId');

    useEffect(() => {
        if (targetCommentId && replies.some(r => r.id.toString() === targetCommentId)) {
            setIsOpen(true);
        }
    }, [targetCommentId, replies]);

    if (!replies || replies.length === 0) return null;

    return (
        <div className="mt-1 ml-2 md:ml-2">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2 py-1 ml-8 md:ml-10"
                >
                    <div className="w-8 h-[1px] bg-border/60"></div>
                    View {replies.length} replies
                </button>
            ) : (
                <div className="ml-8 md:ml-10 border-l-2 border-border/30 pl-3 md:pl-4 space-y-3 mt-2">
                    {replies.map((reply) => (
                        <Comment
                            key={reply.id}
                            comment={reply}
                            variant="reply"
                            onReply={onReply}
                            onDelete={onDelete}
                            currentUserId={currentUserId}
                            isPostOwner={isPostOwner}
                            postId={postId}
                        />
                    ))}

                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground mt-2"
                    >
                        Hide replies
                    </button>
                </div>
            )}
        </div>
    );
}
