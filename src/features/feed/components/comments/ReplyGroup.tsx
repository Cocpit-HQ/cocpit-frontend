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
    onReport?: (commentId: string | number) => void;
    onEdit?: (commentId: string | number, currentText: string) => void;
    onHide?: (commentId: string | number) => void;
}

export default function ReplyGroup({ replies, onReply, onDelete, onEdit, currentUserId, isDark, isPostOwner, postId, onReport, onHide }: ReplyGroupProps) {
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
        <div className="mt-1 ml-2 md:ml-2 font-poppins">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2 py-1 pl-9"
                >
                    View replies
                </button>
            ) : (
                <div className="ml-8 md:ml-10  pl-3 md:pl-4 space-y-3 mt-2">
                    {replies.map((reply) => (
                        <Comment
                            key={reply.id}
                            comment={reply}
                            variant="reply"
                            onReply={onReply}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            currentUserId={currentUserId}
                            isPostOwner={isPostOwner}
                            postId={postId}
                            onReport={onReport}
                            onHide={onHide}
                        />
                    ))}

                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground mt-2 pl-11"
                    >
                        Hide replies
                    </button>
                </div>
            )}
        </div>
    );
}
