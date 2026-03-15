import { useUIStore } from '@/store/ui.store';
import { createPost, CreatePostRequest } from '@/services/api/feed';
import { uploadMedia } from '@/services/api/media';
import { useFeed } from '@/hooks/use-feed';
import { useCallback } from 'react';
import { toast } from 'sonner';

export const usePostUpload = () => {
    const { pendingPosts, setPendingPosts } = useUIStore();
    const { addPost } = useFeed();

    const startUpload = useCallback(async (content: CreatePostRequest, mediaFiles: File[]) => {
        const id = Math.random().toString(36).substring(7);
        const newPendingPost: any = {
            id,
            content,
            mediaFiles,
            progress: 0,
            status: 'uploading' as const,
            type: 'post' as const,
        };

        setPendingPosts(prev => [...prev, newPendingPost]);

        try {
            let mediaUrls: string[] = [];
            
            // 1. Upload Media
            if (mediaFiles && mediaFiles.length > 0) {
                const progressInterval = setInterval(() => {
                    setPendingPosts(prev => prev.map(p => 
                        p.id === id ? { ...p, progress: Math.min(p.progress + 10, 90) } : p
                    ));
                }, 500);

                try {
                    const uploadResults = await uploadMedia(mediaFiles);
                    mediaUrls = uploadResults.map(res => res.url);
                } finally {
                    clearInterval(progressInterval);
                }
            }

            // 2. Create Post
            const finalContent = {
                ...content,
                media: mediaUrls.length > 0 ? mediaUrls.map((url, index) => ({ 
                    url, 
                    media_type: mediaFiles[index].type.startsWith('video') ? 'video' : 'image' 
                })) : []
            };

            const response = await createPost(finalContent);
            
            // 3. Update Store
            setPendingPosts(prev => prev.map(p => 
                p.id === id ? { ...p, status: 'success', progress: 100 } : p
            ));
            
            toast.success("Post published successfully!");

            // Auto-clear after 3 seconds
            setTimeout(() => {
                setPendingPosts(prev => prev.filter(p => p.id !== id));
            }, 3000);

        } catch (error) {
            console.error("Upload failed", error);
            setPendingPosts(prev => prev.map(p => 
                p.id === id ? { ...p, status: 'error', error: 'Failed to upload' } : p
            ));
            toast.error("Failed to publish post");
        }
    }, [setPendingPosts]);

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
