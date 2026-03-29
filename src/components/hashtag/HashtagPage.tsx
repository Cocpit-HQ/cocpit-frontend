"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHashtagFeed } from '@/hooks/use-hashtag-feed';
import FeedPost from '@/components/home/FeedPost';
import PostSkeleton from '@/components/home/PostSkeleton';
import { useInView } from '@/hooks/use-in-view';
import { useEffect } from 'react';
import { ArrowLeft, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HashtagPage() {
  const params = useParams();
  const router = useRouter();
  const tag = params.tag as string;
  
  const { posts, loadMorePosts, hasMore, loading } = useHashtagFeed(tag);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMorePosts();
    }
  }, [inView, hasMore, loading, loadMorePosts]);

  return (
    <div className="max-w-[600px] mx-auto w-full min-h-screen bg-background border-x border-border">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-1">
            <Hash className="w-5 h-5 text-primary" />
            {tag}
          </h1>
          <p className="text-xs text-muted-foreground">
            Discovery Feed
          </p>
        </div>
      </div>

      {/* Feed Content */}
      <div className="py-2 px-0 md:px-2 space-y-2">
        {posts.map((post, index) => (
          <FeedPost 
            key={post.id} 
            {...post} 
            priority={index < 3}
          />
        ))}

        {/* Loading Skeletons */}
        {loading && posts.length === 0 && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Hash className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No posts yet</h3>
              <p className="text-muted-foreground">Be the first to post with #{tag}!</p>
            </div>
          </div>
        )}

        {/* Infinite Scroll Sentinel */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}
