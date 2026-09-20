"use client";

import React, { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { FeedPost } from "@/features/feed/components/FeedPost";
import { getPostMenuAccess } from "@/features/feed/utils/postMenuAccess";
import type { Post } from "@/types/entities";
import { ProfilePostsEmptyState, ProfilePostsErrorState } from "../ProfileEmptyStates";

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
  if (post.shared_post || post.repostId) return false;

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
  if (post.shared_post || post.repostId) return false;
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
  const { data: session } = useSession();
  const { isCompany, activeProfile, userCompanies } = useActiveProfile();

  // Rules of Hooks: All hooks must be called unconditionally before any early returns
  const displayedPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];

    const mediaPosts = posts.filter(isMediaPost);

    if (mediaPosts.length >= 2) {
      // If 2+ media posts exist (2 images, 1 image + 1 video, or 2 videos), show the 2 latest media posts
      return mediaPosts.slice(0, 2);
    }

    if (mediaPosts.length === 1) {
      // If 1 media post exists, show that media post and the latest remaining post of any other type
      const otherPosts = posts.filter((p) => p.id !== mediaPosts[0].id);
      return [mediaPosts[0], otherPosts[0]].filter(Boolean);
    }

    // If no media posts exist, show the 2 latest posts
    return posts.slice(0, 2);
  }, [posts]);

  if (isError) {
    return <ProfilePostsErrorState onRetry={onRetry} />;
  }

  if (!posts || posts.length === 0) {
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
            />
          </div>
        ))}
      </div>

      {/* 20px below the max card height: See all */}
      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          className="w-[37px] h-[16px] mt-[20px] text-[var(--ds-accent)] text-xs font-medium font-['DM_Sans'] leading-4 flex-none order-2 grow-0 hover:underline cursor-pointer transition-opacity flex items-center justify-center p-0 outline-none"
        >
          See all
        </button>
      )}
    </div>
  );
};

export default ProfilePostsTab;
