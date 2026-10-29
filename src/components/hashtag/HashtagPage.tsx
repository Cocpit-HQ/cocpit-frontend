"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useHashtagFeed } from '@/hooks/use-hashtag-feed';
import { FeedPost } from '@/features/feed/components/FeedPost';
import { FeedPostCardSkeleton } from '@/features/feed/components/skeletons/FeedPostCardSkeleton';
import { useInView } from '@/hooks/use-in-view';
import { ChevronLeft, Hash, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { getPostMenuAccess } from '@/features/feed/utils/postMenuAccess';

export default function HashtagPage() {
  const params = useParams();
  const router = useRouter();
  const tag = (params.tag as string) || "";
  const { data: session } = useSession();
  const { userCompanies, activeProfile } = useActiveProfile();

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

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/feed");
    }
  };

  return (
    <div className="min-h-screen bg-ds-bg text-ds-text-primary flex flex-col items-center pb-16 font-dm-sans relative select-none">
      {/* Top Navigation: Back button in corner matching other platform pages */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="fixed top-4 sm:top-10 left-4 sm:left-10 flex items-center gap-2 h-6 rounded-[6px] text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent z-30 group"
      >
        <ChevronLeft className="w-5 h-5 text-ds-text-primary group-hover:text-ds-text-secondary transition-colors shrink-0" />
        <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px]">Back</span>
      </button>

      {/* Main Hashtag Content (Centered 442px column, matching post/[id]) */}
      <div className="w-full max-w-[442px] px-4 sm:px-0 mx-auto pt-[60px] sm:pt-[60px] flex flex-col items-center">
        {/* Hashtag Header */}
        <div className="w-full flex flex-col items-start mb-6 select-text">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 text-ds-text-primary">
            <div className="p-1.5 rounded-lg bg-ds-accent/10 text-ds-accent">
              <Hash className="w-5 h-5" />
            </div>
            <span>{tag}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] font-semibold text-ds-text-secondary bg-ds-surface-1 px-2.5 py-0.5 rounded-full">
              Discovery Feed
            </span>
            {hashtagMetadata && (
              <span className="text-[11px] font-medium text-ds-text-muted flex items-center gap-1">
                • {hashtagMetadata.usage_count.toLocaleString()} posts
              </span>
            )}
          </div>
        </div>

        {/* Feed Content */}
        <div className="space-y-4 w-full">
          {posts.map((post, index) => (
            <div key={post.id} className="w-full">
              <FeedPost
                {...post}
                menuAccess={getPostMenuAccess({
                  isCompanyPost: post.isCompanyPost,
                  companyId: (post as any).author_org_id || post.authorId,
                  createdByUserId: (post as any).createdByUserId,
                  currentUserId: session?.user?.id,
                  userCompanies,
                  activeProfile,
                })}
                priority={index < 2}
              />
            </div>
          ))}

          {/* Loading Skeletons */}
          {loading && posts.length === 0 && (
            <div className="space-y-4 w-full">
              {[1, 2, 3].map((i) => (
                <FeedPostCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && posts.length === 0 && (
            <div className="py-28 px-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500 w-full">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 bg-ds-accent/10 rounded-2xl rotate-6"></div>
                <div className="absolute inset-0 bg-ds-surface-1 border border-ds-border rounded-2xl flex items-center justify-center">
                  <Hash className="w-9 h-9 text-ds-accent" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-ds-text-primary">Quiet in #{tag}</h3>
                <p className="text-ds-text-muted max-w-[280px] mx-auto text-sm leading-relaxed">
                  No posts found with this hashtag yet. Be the one to start the conversation!
                </p>
              </div>
              <Button 
                onClick={() => router.push('/feed')}
                className="rounded-full px-8 bg-ds-accent hover:bg-ds-accent-hover text-white font-medium transition-all"
              >
                Back to Feed
              </Button>
            </div>
          )}

          {/* Infinite Scroll Sentinel */}
          {hasMore && (
            <div ref={loadMoreRef} className="py-8 flex justify-center w-full">
              <Loader2 className="w-6 h-6 animate-spin text-ds-accent" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
