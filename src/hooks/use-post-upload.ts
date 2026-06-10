import { useUIStore } from '@/store/ui.store';
import { CreatePostRequest } from '@/services/api/feed';
import { useFeed } from '@/hooks/use-feed';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { postApi } from '@/features/create-post/api/post.api';
import { AxiosError } from 'axios';

type PendingUploadPost = {
    id: string;
    content: CreatePostRequest;
    mediaFiles: File[];
    progress: number;
    status: 'uploading' | 'processing' | 'success' | 'error';
    error?: string;
    type: 'post';
};

export const usePostUpload = () => {
    const { pendingPosts, setPendingPosts } = useUIStore();
    const { addPost } = useFeed();

    const startUpload = useCallback(async (content: CreatePostRequest, mediaFiles: File[], tagUserIds?: string[]) => {
        const id = Math.random().toString(36).substring(7);
        const newPendingPost: PendingUploadPost = {
            id,
            content,
            mediaFiles,
            progress: 0,
            status: 'uploading' as const,
            type: 'post' as const,
        };

        setPendingPosts(prev => [...prev, newPendingPost]);

        try {
            // 1. Progress simulation for UI feedback
            const progressInterval = setInterval(() => {
                setPendingPosts(prev => prev.map(p =>
                    p.id === id ? { ...p, progress: Math.min(p.progress + 10, 90) } : p
                ));
            }, 800);

            try {
                // 2. Use the centralized postApi for creation (handles media + post + fetch)
                const { mappedPost } = await postApi.create(content, mediaFiles, tagUserIds);
                addPost(mappedPost);
                window.dispatchEvent(new CustomEvent('postCreated', { detail: mappedPost }));

                // 3. Update Store to success
                setPendingPosts(prev => prev.map(p =>
                    p.id === id ? { ...p, status: 'success', progress: 100 } : p
                ));

                toast.success("Post published successfully!");
            } finally {
                clearInterval(progressInterval);
            }

            // Auto-clear after 3 seconds
            setTimeout(() => {
                setPendingPosts(prev => prev.filter(p => p.id !== id));
            }, 3000);

        } catch (error) {
            const message = error instanceof AxiosError
                ? ((error.response?.data as { message?: string; error?: string } | undefined)?.message ||
                    (error.response?.data as { message?: string; error?: string } | undefined)?.error ||
                    error.message)
                : 'Failed to upload';

            const errObj = error as any;
            const errMsg = errObj?.response?.data?.message || errObj?.message || "Unknown error";
            console.error("Upload failed specifically because:", errMsg);
            setPendingPosts(prev => prev.map(p =>
                p.id === id ? { ...p, status: 'error', error: message } : p
            ));
            toast.error(message || "Failed to publish post");
        }
    }, [addPost, setPendingPosts]);

    return {
        pendingPosts,
        startUpload,
        retryUpload: (id: string) => {
            const post = pendingPosts.find(p => p.id === id);
            if (post) startUpload(post.content, post.mediaFiles);
        },
        cancelUpload: (id: string) => setPendingPosts(prev => prev.filter(p => p.id !== id)),
        clearCompleted: () => setPendingPosts(prev => prev.filter(p => p.status !== 'success')),
    };
};
