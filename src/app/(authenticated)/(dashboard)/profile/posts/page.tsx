"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Search, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { FeedPost } from "@/features/feed/components/FeedPost";
import { getUserPosts } from "@/services/api/profile";
import { getSavedPosts } from "@/services/api/savedPost";
import { deletePost as apiDeletePost } from "@/services/api/posts";
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper";
import { Post } from "@/types/entities";
import { useFeed } from "@/hooks/use-feed";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FilterType = 'Post' | 'Repost' | 'Comments' | 'Private post' | 'Save';

export default function ProfilePostsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterType>('Post');
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<{ cursorCreatedAt: string; cursorPostId: string } | null>(null);
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
      let mappedPosts: Post[] = [];
      let newNextCursor = null;

      if (activeTab === 'Save') {
        const response = await getSavedPosts(null, reset ? 1 : currentPage + 1, 10);
        mappedPosts = (response as any).posts?.map(mapProfilePostToPost) || []; 
        setHasMore((response as any).hasMore || false);
        setCurrentPage(prev => reset ? 1 : prev + 1);
      } else {
        const currentCursor = reset ? undefined : nextCursor;
        const response = await getUserPosts({
          filter: activeTab,
          limit: 10,
          cursorCreatedAt: currentCursor?.cursorCreatedAt,
          cursorPostId: currentCursor?.cursorPostId
        });

        mappedPosts = response.posts.map(mapProfilePostToPost);
        newNextCursor = response.nextCursor;
        setHasMore(!!response.nextCursor);
      }

      if (reset) {
        setPosts(mappedPosts);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = mappedPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
      }

      setNextCursor(newNextCursor);
    } catch (error) {
      console.error("Failed to fetch profile posts", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [activeTab, nextCursor, currentPage]);

  useEffect(() => {
    setPosts([]);
    setNextCursor(null);
    setHasMore(true);
    setCurrentPage(1);
    fetchPosts(true);
  }, [activeTab]);

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

  const filters: FilterType[] = ['Post', 'Repost', 'Comments', 'Private post', 'Save'];

  const filteredPosts = posts.filter(post => 
    post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[592px] mx-auto px-4 py-10">
        {/* Navigation Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white transition-colors text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-poppins)]">All Posts</h1>
        </div>

        <div className="flex flex-col gap-[24px]">
          {/* Main Content Area */}
          <div className="space-y-[24px]">
            {/* Search & Filter Bar (Frame 2608731) */}
            <div className="flex flex-col gap-[16px] w-full max-w-[560px]">
              {/* Search Bar (Frame 2608500) */}
              <div className="flex flex-row justify-between items-center px-[16px] py-[8px] gap-[10px] w-full h-[40px] bg-white border border-[#6B7280] rounded-[24px]">
                <div className="flex items-center flex-1">
                  <Input
                    type="text"
                    placeholder="Search"
                    className="h-full bg-transparent border-none p-0 text-[16px] leading-[24px] font-[family-name:var(--font-poppins)] text-[#6B7280] placeholder:text-[#6B7280] focus-visible:ring-0 text-center"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Search className="w-[24px] h-[24px] text-[#6B7280]" />
              </div>

              {/* Chips (Frame 2608634) */}
              <div className="flex flex-row items-center gap-[12px] w-full h-[40px] overflow-x-auto scrollbar-hide">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveTab(filter)}
                    className={cn(
                      "flex flex-row justify-center items-center px-[16px] py-[6px] gap-[8px] h-[40px] rounded-[24px] transition-all duration-200 border box-border whitespace-nowrap",
                      activeTab === filter
                        ? "bg-[#EEF2FF] border-transparent text-[#6366F1]"
                        : "bg-white border-[#818CF8] text-[#818CF8] hover:bg-[#EEF2FF] hover:border-transparent hover:text-[#6366F1]"
                    )}
                  >
                    <span className="text-[14px] leading-[20px] font-medium font-[family-name:var(--font-roboto)] tracking-[0.1px]">
                      {filter}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Posts List */}
            <div className="flex flex-col gap-[16px] w-full max-w-[560px]">
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
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
                    <p className="text-muted-foreground font-[family-name:var(--font-poppins)]">No posts found matching your criteria.</p>
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
