"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import FeedPost from "@/components/home/FeedPost";
import { AppShell } from "@/components/layout/AppShell";
import type { Page } from "@/types/common";
import { getUserPosts } from "@/services/api/profile";
import { deletePost as apiDeletePost } from "@/services/api/posts";
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper";
import { Post } from "@/types/entities";

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
};

type TabType = 'All' | 'Professional' | 'Personal';

export default function ProfilePostsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<{ cursorCreatedAt: string; cursorPostId: string } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed");
  };

  const fetchPosts = useCallback(async (reset = false) => {
    if (loadingRef.current) return; // Prevent duplicate fetches using ref

    setLoading(true);
    loadingRef.current = true;
    try {
      // If resetting, we start fresh. Otherwise use current cursor.
      const currentCursor = reset ? undefined : nextCursor;

      const response = await getUserPosts({
        category: activeTab,
        limit: 10,
        cursorCreatedAt: currentCursor?.cursorCreatedAt,
        cursorPostId: currentCursor?.cursorPostId
      });

      const mappedPosts = response.posts.map(mapProfilePostToPost);

      if (reset) {
        setPosts(mappedPosts);
      } else {
        setPosts(prev => [...prev, ...mappedPosts]);
      }

      setNextCursor(response.nextCursor);
      setHasMore(!!response.nextCursor);
    } catch (error) {
      console.error("Failed to fetch profile posts", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [activeTab, nextCursor]);

  // Handle Category Change
  useEffect(() => {
    // Reset state immediately
    setPosts([]);
    setNextCursor(null);
    setHasMore(true);

    // We need to fetch immediately when tab changes
    const loadFirstPage = async () => {
        if (loadingRef.current) return;

        setLoading(true);
        loadingRef.current = true;
        try {
            const response = await getUserPosts({
                category: activeTab,
                limit: 10
            });
            setPosts(response.posts.map(mapProfilePostToPost));
            setNextCursor(response.nextCursor);
            setHasMore(!!response.nextCursor);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    };
    loadFirstPage();

  }, [activeTab]);

  const handleDeletePost = async (id: string) => {
    // Optimistic update
    const previousPosts = [...posts];
    setPosts((prev) => prev.filter((post) => post.id !== id));

    try {
      await apiDeletePost(id);
    } catch (error) {
      console.error("Failed to delete post", error);
      // Revert if failed
      setPosts(previousPosts);
    }
  };

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
            fetchPosts(false);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, fetchPosts]);

  const tabs: TabType[] = ['All', 'Professional', 'Personal'];

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="profile" navigateTo={navigateTo}>
        <div className="max-w-3xl mx-auto py-6 md:py-8 pb-20 md:pb-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">All Posts</h1>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                        activeTab === tab
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                    }`}
                >
                    {tab}
                </button>
            ))}
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {posts.length > 0 ? (
                posts.map(post => (
                    <div key={post.id} id={`post-${post.id}`}>
                      <FeedPost
                        {...post}
                        initialComments={post.commentData}
                        isOwnPost={true}
                        onDelete={handleDeletePost}
                      />
                    </div>
                ))
            ) : (
                !loading && (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                        <p className="text-muted-foreground">No posts found in this category.</p>
                    </div>
                )
            )}

            {/* Loading Sentinel */}
            {hasMore && (
                <div ref={observerTarget} className="flex justify-center py-4">
                    {loading && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
                </div>
            )}
          </div>
        </div>
      </AppShell>
    </div>
  );
}
