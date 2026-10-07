"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useUIStore } from "@/store/ui.store";
import { FeedPost } from "@/features/feed/components/FeedPost";
import { getPostMenuAccess } from "@/features/feed/utils/postMenuAccess";
import type { Post } from "@/types/entities";
import { ProfilePostsEmptyState, ProfilePostsErrorState } from "../ProfileEmptyStates";
import { useShallow } from "zustand/react/shallow";

interface ProfilePostsTabProps {
  posts: Post[];
  isOwnProfile?: boolean;
  userName?: string;
  isError?: boolean;
  onRetry?: () => void;
  onDeletePost?: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  onUpdatePost?: (post: Post) => void;
  onCreatePost?: () => void;
  onSeeAll?: () => void;
}

const isVideoPost = (post: Post): boolean => {
  // Do NOT exclude reposts — check the shared post's media too

  const hasVideoMedia =
    (post as any).media &&
    Array.isArray((post as any).media) &&
    (post as any).media.some(
      (m: any) =>
        m.media_type === "video" ||
        (m as any).type === "video" ||
        m.url?.toLowerCase()?.match(/\.(mp4|webm|mov|m4v)(\?|#|$)/)
    );

  const hasVideoUrl = Boolean(
    post.videoSrc &&
    typeof post.videoSrc === "string" &&
    post.videoSrc.trim() !== ""
  );

  const isVideoType =
    post.post_type === "video" ||
    (post as any).category_name === "Video" ||
    (post as any).category === "Video";

  return Boolean(isVideoType || hasVideoUrl || hasVideoMedia);
};

const isImagePost = (post: Post): boolean => {
  // Do NOT exclude reposts — check the shared post's media too
  if (isVideoPost(post)) return false;
  if (post.post_type === "article" || post.category === "Article" || Boolean((post as any).articleBody)) return false;
  if (post.post_type === "poll" || Boolean(post.poll)) return false;

  const hasImageMedia =
    (post as any).media &&
    Array.isArray((post as any).media) &&
    (post as any).media.some(
      (m: any) =>
        m.media_type === "image" ||
        (m as any).type === "image" ||
        m.url?.toLowerCase()?.match(/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?|#|$)/)
    );

  const hasImageSrc = Boolean(post.imageSrc && typeof post.imageSrc === "string" && post.imageSrc.trim() !== "");
  const hasImagesArray = Boolean(Array.isArray(post.images) && post.images.length > 0);
  const isImageType = post.post_type === "image" || post.post_type === "photo";

  return Boolean(isImageType || hasImageSrc || hasImagesArray || hasImageMedia);
};

const isMediaPost = (post: Post): boolean => isVideoPost(post) || isImagePost(post);

export const ProfilePostsTab: React.FC<ProfilePostsTabProps> = ({
  posts,
  isOwnProfile = true,
  userName,
  isError,
  onRetry,
  onDeletePost,
  onToggleVisibility,
  onUpdatePost,
  onCreatePost,
  onSeeAll,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { isCompany, activeProfile, userCompanies } = useActiveProfile();
  const hiddenPostIds = useUIStore(useShallow((s) => s.hiddenPostIds));
  const reportedPostIds = useUIStore(useShallow((s) => s.reportedPostIds));

  // Detect mobile viewport to limit visible posts (mobile: 1, desktop: 2)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Rules of Hooks: All hooks must be called unconditionally before any early returns
  const displayedPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];

    const limit = isMobile ? 1 : 2;

    // Filter out posts that have been reported/hidden in this session so the
    // remaining posts immediately shift up without needing a page refresh.
    const visiblePosts = posts.filter(
      (p) =>
        !hiddenPostIds.includes(p.id?.toString())
    );

    const mediaPosts = visiblePosts.filter(isMediaPost);
    
    // If we have at least 2 media posts, show the top 2
    if (mediaPosts.length >= 2) {
      return mediaPosts.slice(0, 2);
    }
    
    // If we have 1 media post, fill the second slot with the next available non-media post
    if (mediaPosts.length === 1) {
      const otherPosts = visiblePosts.filter((p) => !isMediaPost(p));
      if (otherPosts.length > 0) {
        return [mediaPosts[0], otherPosts[0]];
      }
      return [mediaPosts[0]];
    }

    // Fallback: If no media posts are available, show the top 2 available posts of any type
    return visiblePosts.slice(0, 2);
  }, [posts, hiddenPostIds, reportedPostIds]);

  if (isError) {
    return <ProfilePostsErrorState onRetry={onRetry} />;
  }

  if (!posts || posts.length === 0 || displayedPosts.length === 0) {
    return <ProfilePostsEmptyState isOwnProfile={isOwnProfile} userName={userName} />;
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* 2-column post grid: height dynamically accommodates the max height card */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
        {displayedPosts.map((post) => (
          <div key={post.id} className="w-full">
            <FeedPost
              {...post}
              isProfileView={true}
              sessionId="profile-tab"
              initialComments={post.commentData}
              menuAccess={getPostMenuAccess({
                isCompanyPost: post.isCompanyPost,
                companyId: (post as any).author_org_id || post.authorId,
                createdByUserId: (post as any).createdByUserId,
                currentUserId: (session?.user as any)?.id,
                userCompanies,
                activeProfile,
              })}
              isOwnPost={isOwnProfile && !isCompany}
              onDelete={isOwnProfile ? onDeletePost : undefined}
              onToggleVisibility={isOwnProfile ? onToggleVisibility : undefined}
              priority={false}
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
      </div>

      {/* 20px below the max card height: See all */}
      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          className="w-[37px] h-[16px] mt-[20px] text-[var(--ds-accent)] text-xs font-medium font-['DM_Sans'] leading-4 flex-none order-2 grow-0 cursor-pointer transition-opacity flex items-center justify-center p-0 outline-none hover:no-underline"
        >
          See all
        </button>
      )}
    </div>
  );
};

export default ProfilePostsTab;
