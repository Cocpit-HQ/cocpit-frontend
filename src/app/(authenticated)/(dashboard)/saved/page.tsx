"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { FeedPost } from "@/features/feed/components/FeedPost";
import { getSavedPosts } from "@/features/settings/api/savedPost";
import { deletePost as apiDeletePost } from "@/services/api/posts";
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper";
import { Post } from "@/types/entities";
import { useFeed } from "@/hooks/use-feed";
import { useActiveProfile } from "@/context/ActiveProfileContext";

export default function SavedPostsGeneralPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const { togglePostVisibility } = useFeed();
  const { isCompany } = useActiveProfile();

  const fetchPosts = useCallback(async (reset = false) => {
    if (loadingRef.current && !reset) return;

    setLoading(true);
    loadingRef.current = true;
    try {
      const response = await getSavedPosts(null, reset ? 1 : currentPage + (reset ? 0 : 1), 10);
      const mappedPosts = (response as any).posts?.map(mapProfilePostToPost) || []; 
      setHasMore((response as any).hasMore || false);
      setCurrentPage(prev => reset ? 1 : prev + 1);

      if (reset) {
        setPosts(mappedPosts);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = mappedPosts.filter((p: Post) => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
      }
    } catch (error) {
      console.error("Failed to fetch saved posts", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage]);

  useEffect(() => {
    fetchPosts(true);
  }, []);

  const handleDeletePost = async (id: string) => {
    const previousPosts = [...posts];
    setPosts((prev) => prev.filter((post) => post.id !== id));
    try {
      await apiDeletePost(id);
    } catch (error) {
      console.error("Failed to delete post", error);
      setPosts(previousPosts);
    }
  };

  const handleToggleVisibility = (id: string) => {
    setPosts(prev => prev.map(post =>
      post.id === id
        ? { ...post, visibility: post.visibility === 'private' ? 'public' : 'private' }
        : post
    ));
    togglePostVisibility(id);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          fetchPosts(false);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [hasMore, fetchPosts]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[592px] mx-auto px-4 py-10">
        {/* Navigation Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-poppins)]">General</h1>
            <p className="text-sm text-gray-500">Saved Posts</p>
          </div>
        </div>

        <div className="flex flex-col gap-[24px]">
          {/* Main Content Area */}
          <div className="space-y-[24px]">
            {/* Posts List */}
            <div className="flex flex-col gap-[16px] w-full max-w-[560px]">
              {posts.length > 0 ? (
                posts.map(post => (
                  <FeedPost
                    key={post.id}
                    {...post}
                    initialComments={post.commentData}
                    isOwnPost={!isCompany}
                    onDelete={handleDeletePost}
                    onToggleVisibility={handleToggleVisibility}
                    isFullContent={true}
                  />
                ))
              ) : (
                !loading && (
                  <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-border/60 w-full">
                    <p className="text-muted-foreground font-[family-name:var(--font-poppins)]">No saved posts in this folder.</p>
                  </div>
                )
              )}

              {/* Loading Sentinel */}
              {hasMore && (
                <div ref={observerTarget} className="flex justify-center py-8">
                  {loading && <Loader2 className="w-8 h-8 animate-spin text-primary" />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
