"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { CloseIcon, ProfileEditIcon } from "@/components/icons";
import { FeedPost } from "@/features/feed/components/FeedPost";
import { getPostMenuAccess } from "@/features/feed/utils/postMenuAccess";
import { getUserPosts } from "@/services/api/profile";
import { getPublicProfilePosts } from "@/services/api/public-profile";
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper";
import { mapPublicPostToPost } from "@/lib/mappers/public-profile.mapper";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useFeed } from "@/hooks/use-feed";
import { useMyProfile } from "@/hooks/use-my-profile";
import { useProfile } from "@/features/publicProfile/hooks/usePublicProfile";
import type { Post } from "@/types/entities";
import { cn } from "@/lib/utils";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";

export type PostFilterTab = "all" | "repost" | "article" | "video" | "poll";

interface TabConfig {
  key: PostFilterTab;
  label: string;
  emptyTitle: string;
}

const TABS: TabConfig[] = [
  { key: "all", label: "All posts", emptyTitle: "No posts yet" },
  { key: "repost", label: "Repost", emptyTitle: "No reposts yet" },
  { key: "article", label: "Articles", emptyTitle: "No articles yet" },
  { key: "video", label: "Video", emptyTitle: "No videos yet" },
  { key: "poll", label: "Poll", emptyTitle: "No polls yet" },
];

const TAB_FILTER_MAP: Record<PostFilterTab, 'Repost' | 'Articles' | 'Video' | 'Poll' | undefined> = {
  all: undefined,
  repost: "Repost",
  article: "Articles",
  video: "Video",
  poll: "Poll",
};

export interface ProfileAllPostsScreenProps {
  userId?: string;
  onClose?: () => void;
  initialTab?: PostFilterTab;
}

export function ProfileAllPostsScreen({
  userId,
  onClose,
  initialTab = "all",
}: ProfileAllPostsScreenProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { isCompany, activeProfile, userCompanies } = useActiveProfile();
  const { togglePostVisibility } = useFeed();
  const { data: profileData, isLoading: isProfileLoading } = useMyProfile();
  const { data: targetProfile, isLoading: isTargetProfileLoading } = useProfile(userId || "");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while overlay is mounted
  useEffect(() => {
    if (mounted) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mounted]);

  // Determine if viewing own profile
  const isOwner = useMemo(() => {
    if (!userId) return true;
    const currentUserId = (session?.user as any)?.id || profileData?.user?.id;
    if (!currentUserId) return false;
    return String(userId).toLowerCase() === String(currentUserId).toLowerCase();
  }, [userId, session?.user, profileData?.user?.id]);

  const [activeTab, setActiveTab] = useState<PostFilterTab>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("cocpit_profile_posts_tab") as PostFilterTab | null;
      if (stored && TABS.some((t) => t.key === stored)) return stored;
    }
    return initialTab;
  });
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cocpit_profile_posts_tab", activeTab);
    }
  }, [activeTab]);
  
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<{ cursorCreatedAt: string; cursorPostId: string } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Restore scroll position in container when posts are loaded
  useScrollRestoration(!loading && mounted && posts.length > 0, "profile-all-posts-scroll-container");

  const fetchPosts = useCallback(
    async (reset = false, tabToFetch: PostFilterTab = activeTab) => {
      if (loadingRef.current && !reset) return;

      setLoading(true);
      loadingRef.current = true;
      try {
        let mappedPosts: Post[] = [];
        let newNextCursor = null;

        if (isOwner) {
          const currentCursor = reset ? undefined : nextCursor;
          const backendFilter = TAB_FILTER_MAP[tabToFetch];
          const response = await getUserPosts({
            filter: backendFilter,
            limit: 20,
            cursorCreatedAt: currentCursor?.cursorCreatedAt,
            cursorPostId: currentCursor?.cursorPostId,
          });

          // Guard against stale responses if active tab changed while request was in-flight
          if (activeTabRef.current !== tabToFetch) return;

          mappedPosts = response.posts.map(mapProfilePostToPost);
          newNextCursor = response.nextCursor;
          setHasMore(Boolean(response.nextCursor));
        } else if (userId) {
          const currentCursor = reset ? undefined : nextCursor;
          const backendFilter = TAB_FILTER_MAP[tabToFetch];
          const data = await getPublicProfilePosts(userId, "All", {
            filter: backendFilter,
            limit: 20,
            cursorCreatedAt: currentCursor?.cursorCreatedAt,
            cursorPostId: currentCursor?.cursorPostId,
          });
          if (activeTabRef.current !== tabToFetch) return;
          mappedPosts = data.posts.map(mapPublicPostToPost);
          newNextCursor = data.nextCursor;
          setHasMore(Boolean(data.nextCursor));
        }

        if (reset) {
          setPosts(mappedPosts);
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const uniqueNewPosts = mappedPosts.filter((p) => !existingIds.has(p.id));
            return [...prev, ...uniqueNewPosts];
          });
        }

        setNextCursor(newNextCursor);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        if (activeTabRef.current === tabToFetch) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    },
    [isOwner, userId, nextCursor, activeTab]
  );

  useEffect(() => {
    setPosts([]);
    setNextCursor(null);
    setHasMore(true);
    fetchPosts(true, activeTab);
  }, [isOwner, userId, activeTab]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
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

  const handleDeletePost = (id: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
  };

  useEffect(() => {
    const handlePostUpdated = (e: any) => {
      const updated = e.detail;
      if (updated && updated.id) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === updated.id || post.id?.toString() === updated.id?.toString()
              ? { ...post, ...updated }
              : post
          )
        );
      }
    };
    const handlePostDeleted = (e: any) => {
      const deletedId = e.detail?.id;
      if (deletedId) {
        handleDeletePost(deletedId);
      }
    };

    const handlePostCreated = () => {
      fetchPosts(true, activeTabRef.current);
    };
    window.addEventListener("postCreated", handlePostCreated);
    window.addEventListener("postUpdated", handlePostUpdated);
    window.addEventListener("postDeleted", handlePostDeleted);
    return () => {
      window.removeEventListener("postCreated", handlePostCreated);
      window.removeEventListener("postUpdated", handlePostUpdated);
      window.removeEventListener("postDeleted", handlePostDeleted);
    };
  }, [fetchPosts]);

  const handleToggleVisibility = (id: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? { ...post, visibility: post.visibility === "private" ? "public" : "private" }
          : post
      )
    );
    togglePostVisibility(id);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    const savedPath = typeof window !== "undefined" ? sessionStorage.getItem("cocpit_scroll_path") : null;
    
    // If savedPath exists, we know for sure the user navigated here from within the app,
    // so it is completely safe to use the native back button.
    if (savedPath) {
      router.back();
    } else {
      router.replace(userId && !isOwner ? `/profile/${userId}` : "/profile");
    }
  };

  // Client-side filtering per active sub-tab
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (activeTab === "all") return true;

      if (activeTab === "repost") {
        // Strictly reposted posts: must have a shared/original post attached
        return Boolean(post.shared_post);
      }

      if (activeTab === "article") {
        return (
          !post.shared_post &&
          (post.category === "Article" ||
            (post as any).post_type === "article" ||
            (post as any).category_name === "Article" ||
            Boolean(post.articleBody))
        );
      }

      if (activeTab === "video") {
        const hasVideoMedia =
          (post as any).media &&
          Array.isArray((post as any).media) &&
          (post as any).media.some((m: any) => m.media_type === "video");
        return (
          !post.shared_post &&
          Boolean(post.videoSrc || (post as any).post_type === "video" || hasVideoMedia)
        );
      }

      if (activeTab === "poll") {
        return !post.shared_post && Boolean(post.poll || (post as any).post_type === "poll");
      }

      return true;
    });
  }, [posts, activeTab]);

  const currentTabConfig = useMemo(() => {
    return TABS.find((t) => t.key === activeTab) || TABS[0];
  }, [activeTab]);

  const content = (
    <div
      id="profile-all-posts-scroll-container"
      className="fixed inset-0 z-[50] w-full h-full bg-[var(--ds-bg)] text-[var(--ds-text-primary)] font-['DM_Sans'] overflow-y-auto overflow-x-hidden scrollbar-hide select-text animate-in fade-in-90 duration-200"
    >
      {/* Cancel: Top Right Close Cross Icon (top: 40px, right: 40px, 20x20px) */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close"
        className="fixed top-6 right-5 sm:top-[40px] sm:right-[40px] z-[60] w-[20px] h-[20px] flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-75 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC6229] rounded-sm"
      >
        <CloseIcon size={20} className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
      </button>

      {/* Frame 2609780 Header Bar: Fixed Tabs at top 60px */}
      <header className="sticky top-0 z-40 w-full pt-[60px] pb-[20px] bg-[var(--ds-bg)] flex flex-col items-center shrink-0">
        {/* Frame 2609617: Auto layout row, gap 12px, width 462px, height 36px */}
        <div className="w-[462px] max-w-full px-4 sm:px-0 h-[36px] flex flex-row items-center justify-center gap-[12px] overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="relative h-[36px] py-[6px] px-[12px] flex flex-col items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC6229] shrink-0"
              >
                <span
                  className={cn(
                    "font-['DM_Sans'] font-medium text-[16px] leading-[24px] whitespace-nowrap transition-colors",
                    isActive ? "text-[var(--ds-text-primary)]" : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                  )}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#EC6229] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Box: width 462px, scrollable from anywhere on page */}
      <main className="w-full flex flex-col items-center pb-[60px]">
        <div className="w-[462px] max-w-full px-4 sm:px-0 flex flex-col items-center">
          {/* Loading State */}
          {loading && posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[120px] text-center w-full">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--ds-accent)]" />
            </div>
          ) : filteredPosts.length > 0 ? (
            /* Post List: replica of feed, vertical list with 20px gap */
            <div className="w-full flex flex-col gap-[20px] items-center">
              {filteredPosts.map((post) => (
                <div key={post.id} className="w-full max-w-[462px] [&>div]:border-b-0 [&>div]:pt-0 [&>div]:pb-0">
                  <FeedPost
                    {...post}
                    sessionId="profile-all-posts"
                    initialComments={post.commentData}
                    menuAccess={getPostMenuAccess({
                      isCompanyPost: post.isCompanyPost,
                      companyId: (post as any).author_org_id || post.authorId,
                      createdByUserId: (post as any).createdByUserId,
                      currentUserId: (session?.user as any)?.id,
                      userCompanies,
                      activeProfile,
                    })}
                    isOwnPost={isOwner && !isCompany}
                    onDelete={isOwner ? handleDeletePost : undefined}
                    onToggleVisibility={isOwner ? handleToggleVisibility : undefined}
                    priority={false}
                    menuZIndex={60}
                    onRepostWithThoughts={(postToQuote) => {
                      useUIStore.getState().setSharedPostData(postToQuote);
                      if (typeof window !== 'undefined' && window.innerWidth < 768) {
                        useUIStore.getState().setActiveModal('create-post');
                      } else {
                        router.push('/feed');
                      }
                    }}
                  />
                </div>
              ))}

              {/* Loading Sentinel for infinite scroll */}
              {hasMore && (
                <div ref={observerTarget} className="flex justify-center py-6 w-full">
                  {loading && <Loader2 className="w-6 h-6 animate-spin text-[var(--ds-accent)]" />}
                </div>
              )}
            </div>
          ) : (
            /* Empty State: Circular Icon + Title + Subtitle */
            <div className="flex flex-col items-center justify-center py-[120px] text-center w-full select-none animate-in fade-in-50 duration-200">
              {/* Circular badge 56x56 */}
              <div className="w-[56px] h-[56px] rounded-full bg-[var(--ds-surface-1)] border border-[var(--ds-border)]/60 flex items-center justify-center mb-[16px]">
                <ProfileEditIcon size={24} className="w-[24px] h-[24px] text-[var(--ds-text-secondary)]" />
              </div>
              {/* Title */}
              <h3 className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] mb-[4px]">
                {currentTabConfig.emptyTitle}
              </h3>
              {/* Subtitle */}
              <p className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] max-w-[320px]">
                Share something to start building your profile
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );

  if (mounted && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
}

export default ProfileAllPostsScreen;
