import React, { useState, useEffect } from 'react';
import { Comment as CommentType } from '@/types/entities';
import Comment from './Comment';
import CommentInput from './CommentInput';
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
    onUndo?: (commentId: string | number) => void;
    replyingTo?: { name: string; id: string | number; account_name?: string } | null;
    onCancelReply?: () => void;
    onAddComment?: (text: string, replyToId?: string | number) => void;
    currentUserAvatar?: string;
    hideCancelButton?: boolean;
}

// ORIGINAL: export default function ReplyGroup({ replies, onReply, onDelete, onEdit, currentUserId, isDark, isPostOwner, postId, onReport, onHide }: ReplyGroupProps) {
export default function ReplyGroup({ 
    replies, 
    onReply, 
    onDelete, 
    onEdit, 
    currentUserId, 
    isDark, 
    isPostOwner, 
    postId, 
    onReport, 
    onHide,
    onUndo,
    replyingTo,
    onCancelReply,
    onAddComment,
    currentUserAvatar,
    hideCancelButton
}: ReplyGroupProps) {
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
        <div className="mt-1 font-dmsans pl-[32px]">
            {!isOpen ? (
                /* ORIGINAL VIEW REPLIES BUTTON: <button onClick={() => setIsOpen(true)} className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2 py-1 pl-9">View replies</button> */
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex flex-row items-center gap-1 hover:opacity-80 transition-opacity"
                >
                    <div className="w-[30px] border-t border-[#EC6229]" style={{ borderColor: 'var(--ds-accent, #EC6229)' }} />
                    <span className="ds-text-small-1 text-ds-accent">View {replies.length} more {replies.length === 1 ? 'reply' : 'replies'}</span>
                </button>
            ) : (
                <div className="space-y-3 mt-2">
                    {replies.map((reply) => (
                        /* ORIGINAL: <Comment key={reply.id} comment={reply} variant="reply" onReply={onReply} onDelete={onDelete} onEdit={onEdit} currentUserId={currentUserId} isPostOwner={isPostOwner} postId={postId} onReport={onReport} onHide={onHide} /> */
                        <React.Fragment key={reply.id}>
                            <Comment
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
                                onUndo={onUndo}
                            />
                            {replyingTo?.id === reply.id && (
                                <div className="w-full">
                                    <CommentInput
                                        variant="reply"
                                        onAddComment={(text) => onAddComment?.(text, reply.id)}
                                        replyingTo={replyingTo}
                                        onCancelReply={onCancelReply}
                                        currentUserAvatar={currentUserAvatar}
                                        autoFocus={true}
                                        hideCancelButton={hideCancelButton}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    ))}

                    {/* ORIGINAL HIDE REPLIES BUTTON: <button onClick={() => setIsOpen(false)} className="text-xs font-semibold text-muted-foreground hover:text-foreground mt-2 pl-11">Hide replies</button> */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="flex flex-row items-center gap-1 hover:opacity-80 transition-opacity mt-2"
                    >
                        <div className="w-[30px] border-t border-[#EC6229]" style={{ borderColor: 'var(--ds-accent, #EC6229)' }} />
                        <span className="ds-text-small-1 text-ds-accent">Hide replies</span>
                    </button>
                </div>
            )}
        </div>
    );
}
