"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Post } from '@/types/entities';
import { CreatePostRequest, createPost } from '@/services/api/feed';
import { uploadMedia } from '@/services/api/media';
import { toast } from 'sonner';
import { useFeed } from './FeedContext';

// Define the structure of a post involved in a background upload
export interface PendingPost {
    id: string; // Temporary ID for tracking
    content: CreatePostRequest;
    mediaFiles: File[];
    progress: number;
    status: 'uploading' | 'processing' | 'success' | 'error';
    error?: string;
    type: 'post'; // Extensible for 'story' later
}

interface PostUploadContextType {
    pendingPosts: PendingPost[];
    startUpload: (content: CreatePostRequest, mediaFiles: File[]) => void;
    retryUpload: (id: string) => void;
    cancelUpload: (id: string) => void;
    clearCompleted: () => void;
}

const PostUploadContext = createContext<PostUploadContextType | undefined>(undefined);

export const usePostUpload = () => {
    const context = useContext(PostUploadContext);
    if (!context) {
        throw new Error('usePostUpload must be used within a PostUploadProvider');
    }
    return context;
};

export const PostUploadProvider = ({ children }: { children: ReactNode }) => {
    const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
    const { addPost, currentUser } = useFeed(); // To optimistically add or add on success

    const updatePostStatus = (id: string, updates: Partial<PendingPost>) => {
        setPendingPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const processUpload = async (post: PendingPost) => {
        try {
            updatePostStatus(post.id, { status: 'uploading', progress: 0 });

            // 1. Upload Media
            let mediaUrls: string[] = [];
            if (post.mediaFiles.length > 0) {
                // Simulate progress for UX (since axios progress is per-file and we parallelize)
                // We could use axios onUploadProgress but for multiple parallel uploads it's complex logic
                updatePostStatus(post.id, { progress: 30 }); // Started

                const uploaded = await uploadMedia(post.mediaFiles);
                mediaUrls = uploaded.map(m => m.url);

                updatePostStatus(post.id, { progress: 80 }); // Media Done
            } else {
                // If no media, check if there are existing URLs (re-post/edit flow, though this context is mainly for NEW posts)
                if (post.content.media_urls) mediaUrls = post.content.media_urls;
                updatePostStatus(post.id, { progress: 50 });
            }

            // 2. Create Post
            const payload = { ...post.content, media_urls: mediaUrls };

            const response = await createPost(payload);

            updatePostStatus(post.id, { progress: 100, status: 'success' });
            toast.success("Post published successfully!");

            // 3. Add to Feed (Client-side mapping similar to CreatePostModal)
            const newPost: Post = {
                id: response.postId,
                authorId: currentUser?.id.toString() || 'current-user',
                author: currentUser?.name || 'Authorized User',
                authorAvatar: currentUser?.image || undefined,
                title: response.title || (response.category || 'Post'),
                timeAgo: 'Just now',
                content: response.content,
                imageSrc: response.media_urls && response.media_type === 'image' && response.media_urls.length > 0 ? response.media_urls[0] : undefined,
                images: response.media_urls && response.media_type === 'image' ? response.media_urls : undefined,
                videoSrc: response.media_urls && response.media_type === 'video' && response.media_urls.length > 0 ? response.media_urls[0] : undefined,
                likes: 0,
                comments: '0',
                shares: '0',
                commentData: [],
                category: response.category as any,
                visibility: response.visibility as any,
                poll: response.poll ? response.poll as any : undefined, // Type casting for simplicity, mapper handles real logic
            };

            addPost(newPost);

            // Auto-remove success after delay
            setTimeout(() => {
                setPendingPosts(prev => prev.filter(p => p.id !== post.id));
            }, 5000);

        } catch (error: any) {
            console.error("Background upload failed:", error);
            updatePostStatus(post.id, { status: 'error', error: error.message || "Failed to publish" });
            toast.error("Failed to publish post.");
        }
    };

    const startUpload = useCallback((content: CreatePostRequest, mediaFiles: File[]) => {
        const tempId = `temp-${Date.now()}`;
        const newPending: PendingPost = {
            id: tempId,
            content,
            mediaFiles,
            progress: 0,
            status: 'uploading',
            type: 'post'
        };

        setPendingPosts(prev => [...prev, newPending]);

        // Async execution
        processUpload(newPending);
    }, [addPost, currentUser]); // Dependencies for processUpload logic

    const retryUpload = useCallback((id: string) => {
        const post = pendingPosts.find(p => p.id === id);
        if (post) {
            processUpload(post);
        }
    }, [pendingPosts]);

    const cancelUpload = useCallback((id: string) => {
        setPendingPosts(prev => prev.filter(p => p.id !== id));
        // Note: Can't easily cancel in-flight requests without AbortController, considering out of scope for MVP
    }, []);

    const clearCompleted = useCallback(() => {
        setPendingPosts(prev => prev.filter(p => p.status !== 'success'));
    }, []);

    return (
        <PostUploadContext.Provider value={{ pendingPosts, startUpload, retryUpload, cancelUpload, clearCompleted }}>
            {children}
        </PostUploadContext.Provider>
    );
};
