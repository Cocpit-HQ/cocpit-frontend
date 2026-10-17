"use client";

import React from 'react';
import { usePostUpload } from '@/context/PostUploadContext';
import { Loader2, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export const GlobalUploadProgress = () => {
    const { pendingPosts, retryUpload, cancelUpload, clearCompleted } = usePostUpload();

    if (pendingPosts.length === 0) return null;

    return (
        <div className="hidden md:flex fixed bottom-4 right-4 z-[100] flex-col gap-2 pointer-events-none">
            {pendingPosts.map(post => (
                <div
                    key={post.id}
                    className="bg-card border border-border rounded-lg shadow-lg p-3 w-80 pointer-events-auto transition-all animate-in slide-in-from-bottom-5"
                >
                    <div className="flex items-start justify-between gap-3">

                        {/* Icon Status */}
                        <div className="mt-1">
                            {post.status === 'uploading' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                            {post.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                            {post.status === 'error' && <AlertCircle className="w-5 h-5 text-destructive" />}
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-hidden">
                            <h4 className="text-sm font-semibold truncate">
                                {post.status === 'uploading' ? 'Publishing post...' :
                                    post.status === 'success' ? 'Post published' : 'Failed to publish'}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">
                                {post.content.content || "Media upload"}
                            </p>

                            {/* Progress Bar */}
                            {post.status === 'uploading' && (
                                <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                                    <div
                                        className="bg-primary h-full transition-all duration-500 ease-out"
                                        style={{ width: `${post.progress}%` }}
                                    />
                                </div>
                            )}

                            {/* Error Actions */}
                            {post.status === 'error' && (
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => retryUpload(post.id)}
                                        className="text-xs text-primary hover:underline font-medium"
                                    >
                                        Retry
                                    </button>
                                    <button
                                        onClick={() => cancelUpload(post.id)}
                                        className="text-xs text-muted-foreground hover:underline"
                                    >
                                        Discard
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => cancelUpload(post.id)} // Or clear if success
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
