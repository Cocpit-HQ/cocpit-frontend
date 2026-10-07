"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SavedPostCard } from "./components/SavedPostCard";
import { getSavedPosts } from "@/features/settings/api/savedPost";
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

    const handleRefresh = () => {
      fetchPosts(true);
    };
    window.addEventListener("cocpit:saved-updated", handleRefresh);
    return () => window.removeEventListener("cocpit:saved-updated", handleRefresh);
  }, []);

  const handleDeletePost = (id: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
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
    <div className="flex-1 w-full p-6 md:p-8 bg-white rounded-r-[24px]">
      <div className="w-full max-w-[666px]">
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
            <div className="flex flex-col gap-[12px] p-[8px] rounded-[24px] w-full max-w-[648px]">
              {posts.length > 0 ? (
                posts.map(post => (
                  <div
                    key={post.id}
                    className="self-stretch pb-[12px] border-b border-[#2C2C33] last:border-b-0 last:pb-0 flex flex-col justify-start items-start gap-[12px] w-full"
                  >
                    <SavedPostCard
                      post={post}
                      onUnsave={handleDeletePost}
                    />
                  </div>
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
