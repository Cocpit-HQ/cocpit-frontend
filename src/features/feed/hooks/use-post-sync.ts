import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';

export function usePostSync(
    postId: string | number | undefined,
    callbacks: {
        onLikeUpdated?: (data: { postId: string; liked: boolean; likeCount: number; liker: any }) => void;
        onCommentAdded?: (data: { postId: string; comment: any }) => void;
        onCommentLikeUpdated?: (data: { postId: string; commentId: string; liked: boolean; likeCount: number }) => void;
    },
    manageRoom: boolean = false
) {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket || !postId) return;

        const roomId = postId.toString();

        if (manageRoom) {
            socket.emit('joinPost', { postId: roomId });
        }

        const handleLikeUpdated = (data: { postId: string; liked: boolean; likeCount: number; liker: any }) => {
            if (data.postId === roomId && callbacks.onLikeUpdated) {
                callbacks.onLikeUpdated(data);
            }
        };

        const handleCommentAdded = (data: { postId: string; comment: any }) => {
            if (data.postId === roomId && callbacks.onCommentAdded) {
                callbacks.onCommentAdded(data);
            }
        };

        const handleCommentLikeUpdated = (data: { postId: string; commentId: string; liked: boolean; likeCount: number }) => {
            if (data.postId === roomId && callbacks.onCommentLikeUpdated) {
                callbacks.onCommentLikeUpdated(data);
            }
        };

        socket.on('post_like_updated', handleLikeUpdated);
        socket.on('post_comment_added', handleCommentAdded);
        socket.on('post_comment_like_updated', handleCommentLikeUpdated);

        return () => {
            socket.off('post_like_updated', handleLikeUpdated);
            socket.off('post_comment_added', handleCommentAdded);
            socket.off('post_comment_like_updated', handleCommentLikeUpdated);

            if (manageRoom) {
                socket.emit('leavePost', { postId: roomId });
            }
        };
    }, [socket, postId, callbacks, manageRoom]);
}
