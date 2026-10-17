import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';

export function useStorySync(
    storyId: string | number | undefined,
    callbacks: {
        onCommentAdded?: (comment: any) => void;
        onReactionUpdated?: (data: { storyId: string; likeCount: number }) => void;
    }
) {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket || !storyId) return;

        const roomId = storyId.toString();

        // Join the story room
        socket.emit('joinStory', { storyId: roomId });

        // Define listeners
        const handleCommentAdded = (data: { storyId: string; comment: any }) => {
            if (data.storyId === roomId && callbacks.onCommentAdded) {
                callbacks.onCommentAdded(data.comment);
            }
        };

        const handleReactionUpdated = (data: { storyId: string; likeCount: number }) => {
            if (data.storyId === roomId && callbacks.onReactionUpdated) {
                callbacks.onReactionUpdated(data);
            }
        };

        // Attach listeners
        socket.on('story_comment_added', handleCommentAdded);
        socket.on('story_reaction_updated', handleReactionUpdated);

        return () => {
            // Detach listeners
            socket.off('story_comment_added', handleCommentAdded);
            socket.off('story_reaction_updated', handleReactionUpdated);

            // Leave the story room
            socket.emit('leaveStory', { storyId: roomId });
        };
    }, [socket, storyId, callbacks]); // We expect callbacks to be memoized or omitted if not needed
}
