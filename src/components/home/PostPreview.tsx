import React from 'react';
import FeedPost from './FeedPost';
import { Post } from '@/types/entities';

interface PostPreviewProps {
  content: string;
  mediaUrls: string[];
  postType: 'image' | 'video';
  currentUser: { name: string; avatar?: string } | null;
  aspectRatio: number;
}

export function PostPreview({
  content,
  mediaUrls,
  postType,
  currentUser,
  aspectRatio
}: PostPreviewProps) {

  // Construct a partial Post object for the preview
  // Note: We don't have a real ID or timestamp, so we mock them for display
  const previewPost: Post = {
    id: 'preview-id',
    author: currentUser?.name || 'Anonymous',
    authorAvatar: currentUser?.avatar || '/assets/pngegg.png',
    title: null, // CreatePostModal doesn't seem to set title for photo/video posts usually, or it uses category
    timeAgo: 'Just now',
    content: content,
    imageSrc: postType === 'image' && mediaUrls.length > 0 ? mediaUrls[0] : undefined,
    images: postType === 'image' ? mediaUrls : undefined,
    videoSrc: postType === 'video' && mediaUrls.length > 0 ? mediaUrls[0] : undefined,
    likes: '0',
    comments: '0',
    shares: '0',
    commentData: [],
    category: 'Professional', // Default display
    visibility: 'public',
    aspectRatio: postType === 'image' ? aspectRatio.toString() : undefined // Videos adapt naturally
  };

  return (
    <div className="w-full max-w-xl mx-auto pointer-events-none select-none opacity-90 hover:opacity-100 transition-opacity">
        {/* We wrap in a div that disables interaction to enforce read-only nature */}
        <FeedPost
            {...previewPost}
            initialComments={[]}
            isOwnPost={false} // Hide edit options
        />
    </div>
  );
}
