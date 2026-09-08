import { useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';

export function usePostSync(
    postId: string | number | undefined,
    callbacks: {
        onLikeUpdated?: (data: { postId: string; liked: boolean; likeCount: number; liker: any }) => void;
        onCommentAdded?: (data: { postId: string; comment: any }) => void;
        onCommentLikeUpdated?: (data: { postId: string; commentId: string; liked: boolean; likeCount: number }) => void;
        onShareUpdated?: (data: { postId: string; externalShareCount: number }) => void;
    },
    manageRoom: boolean = false
) {
    const { socket } = useSocket();

    // Callers commonly pass an inline callbacks object, which is a new
    // reference every render. Route through a ref instead of putting
    // `callbacks` in the effect's dependency array, so room join/leave and
    // listener (de)registration only happen when the room itself actually
    // needs to change, not on every parent re-render.
    const callbacksRef = useRef(callbacks);
    useEffect(() => {
        callbacksRef.current = callbacks;
    });

    useEffect(() => {
        if (!socket || !postId) return;

        const roomId = postId.toString();

        if (manageRoom) {
            socket.emit('joinPost', { postId: roomId });
        }

        const handleLikeUpdated = (data: { postId: string; liked: boolean; likeCount: number; liker: any }) => {
            if (data.postId === roomId) {
                callbacksRef.current.onLikeUpdated?.(data);
            }
        };

        const handleCommentAdded = (data: { postId: string; comment: any }) => {
            if (data.postId === roomId) {
                callbacksRef.current.onCommentAdded?.(data);
            }
        };

        const handleCommentLikeUpdated = (data: { postId: string; commentId: string; liked: boolean; likeCount: number }) => {
            if (data.postId === roomId) {
                callbacksRef.current.onCommentLikeUpdated?.(data);
            }
        };

        const handleShareUpdated = (data: { postId: string; externalShareCount: number }) => {
            if (data.postId === roomId) {
                callbacksRef.current.onShareUpdated?.(data);
            }
        };

        socket.on('post_like_updated', handleLikeUpdated);
        socket.on('post_comment_added', handleCommentAdded);
        socket.on('post_comment_like_updated', handleCommentLikeUpdated);
        socket.on('post_share_updated', handleShareUpdated);

        return () => {
            socket.off('post_like_updated', handleLikeUpdated);
            socket.off('post_comment_added', handleCommentAdded);
            socket.off('post_comment_like_updated', handleCommentLikeUpdated);
            socket.off('post_share_updated', handleShareUpdated);

            if (manageRoom) {
                socket.emit('leavePost', { postId: roomId });
            }
        };
    }, [socket, postId, manageRoom]);
}
