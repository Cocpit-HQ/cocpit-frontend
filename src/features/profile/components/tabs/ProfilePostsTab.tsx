"use client";

import React from "react";
import ProfilePostCard from "./ProfilePostCard";
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
  if (isError) {
    return <ProfilePostsErrorState onRetry={onRetry} />;
  }

  if (!posts || posts.length === 0) {
    return <ProfilePostsEmptyState isOwnProfile={isOwnProfile} userName={userName} />;
  }

  // Show up to 2 posts in a single row with 24px gap (gap-6)
  const displayedPosts = posts.slice(0, 2);

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
        {displayedPosts.map((post) => (
          <ProfilePostCard
            key={post.id}
            post={post}
            isOwnPost={isOwnProfile}
            onDelete={onDeletePost}
            onToggleVisibility={onToggleVisibility}
            onUpdate={onUpdatePost}
          />
        ))}
      </div>

      {posts.length > 2 && (
        <button
          type="button"
          onClick={onSeeAll}
          className="text-[var(--ds-accent)] text-xs font-medium font-['DM_Sans'] leading-4 hover:underline cursor-pointer transition-opacity"
        >
          See all
        </button>
      )}
    </div>
  );
};

export default ProfilePostsTab;
