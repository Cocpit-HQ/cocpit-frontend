"use client";

import React, { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useUIStore } from "@/store/ui.store";
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

  // Rules of Hooks: All hooks must be called unconditionally before any early returns
  const displayedPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];

    // Always show the 2 most recent posts (backend already orders by created_at DESC).
    // If only 1 of the top 2 is a media post, prefer swapping in the earliest media
    // post from the remaining list — but never push the most recent post below position 0.
    const top2 = posts.slice(0, 2);
    if (top2.length < 2) return top2;

    const [first, second] = top2;
    // If neither of the top 2 is media, try to substitute the second slot with the
    // earliest media post from the rest of the list (position 2+), preserving the
    // first (most recent) post in slot 0.
    if (!isMediaPost(first) && !isMediaPost(second)) {
      const nextMediaPost = posts.slice(2).find(isMediaPost);
      if (nextMediaPost) return [first, nextMediaPost];
    }
    return top2;
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
