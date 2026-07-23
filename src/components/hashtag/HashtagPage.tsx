"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHashtagFeed } from '@/hooks/use-hashtag-feed';
import { FeedPost } from '@/features/feed/components/FeedPost';
import PostSkeleton from '@/components/home/PostSkeleton';
import { useInView } from '@/hooks/use-in-view';
import { useEffect } from 'react';
import { ArrowLeft, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HashtagPage() {
  const params = useParams();
  const router = useRouter();
  const tag = (params.tag as string) || "";
  
  const { posts, hashtagMetadata, loadMorePosts, hasMore, loading } = useHashtagFeed(tag);
  
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
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-0 md:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Discovery Feed */}
          <div className="lg:col-span-8 min-h-screen border-x border-border/50 relative bg-background">
            {/* Premium Sticky Header */}
            <div className="sticky top-0 z-30 w-full bg-background/60 backdrop-blur-xl border-b border-border/40 px-4 py-4 flex items-center justify-between transition-all duration-300">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => router.back()}
                  className="rounded-full hover:bg-muted/50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex flex-col">
                  <h1 className="text-xl font-black tracking-tight flex items-center gap-1.5 group">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Hash className="w-4 h-4" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                      {tag}
                    </span>
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded">
                      Discovery Feed
                    </span>
                    {hashtagMetadata && (
                      <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        • {hashtagMetadata.usage_count.toLocaleString()} posts
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Content */}
            <div className="py-4 space-y-4 px-2 md:px-3">
              {posts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <FeedPost 
                    {...post} 
                    priority={index < 2}
                  />
                </div>
              ))}

              {/* Loading Skeletons */}
              {loading && posts.length === 0 && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <PostSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Premium Empty State */}
              {!loading && posts.length === 0 && (
                <div className="py-32 px-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 bg-primary/10 rounded-3xl rotate-12 animate-pulse"></div>
                    <div className="absolute inset-0 bg-background border-2 border-border/50 rounded-3xl flex items-center justify-center">
                      <Hash className="w-10 h-10 text-primary/40" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight">Quiet in #{tag}</h3>
                    <p className="text-muted-foreground max-w-[280px] mx-auto text-sm leading-relaxed">
                      No posts found with this hashtag yet. Be the one to start the conversation!
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push('/feed')}
                    variant="outline"
                    className="rounded-full px-8 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    Back to Feed
                  </Button>
                </div>
              )}

              {/* Infinite Scroll Sentinel */}
              {hasMore && (
                <div ref={loadMoreRef} className="py-12 flex justify-center">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sideboards */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6 pt-6">
            <div className="sticky top-24 space-y-6">
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <h4 className="text-sm font-bold mb-2">About Discovery</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hashtags help Cocpit organize content. Posts with #{tag} are shown here in chronological order.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
